// ============================================
// NAKHONIK — Printify Backend Server
// ============================================
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const stripe = require('stripe');
require('dotenv').config();

const app = express();
const stripeClient = stripe(process.env.STRIPE_SECRET_KEY);

// Allow local dev origins dynamically to prevent CORS blocking issues during testing
const allowedOriginPattern = /^(https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?|null)$/;

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, or server-to-server)
        if (!origin) return callback(null, true);
        
        const frontendUrl = process.env.FRONTEND_URL;
        const isAllowed = 
            origin === frontendUrl || 
            allowedOriginPattern.test(origin) ||
            origin.endsWith('nakhonik.com') ||
            origin.endsWith('vercel.app');

        if (isAllowed) {
            return callback(null, true);
        }
        
        callback(new Error('Not allowed by CORS'));
    }
}));
app.use(express.json());

const PRINTIFY_BASE = 'https://api.printify.com/v1';
const HEADERS = {
    'Authorization': `Bearer ${process.env.PRINTIFY_API_KEY}`,
    'Content-Type': 'application/json'
};

// ============================================
// HEALTH CHECK
// ============================================
app.get('/', (req, res) => {
    res.json({ message: '✅ Nakhonik backend is running!' });
});

// ============================================
// TEST PRINTIFY CONNECTION
// ============================================
app.get('/api/test', async (req, res) => {
    try {
        const response = await axios.get(`${PRINTIFY_BASE}/shops.json`, { headers: HEADERS });
        res.json({ success: true, shops: response.data });
    } catch (err) {
        res.status(500).json({ error: 'Printify connection failed', details: err.response?.data || err.message });
    }
});

// ============================================
// GET ALL PRODUCTS FROM YOUR PRINTIFY SHOP
// ============================================
app.get('/api/products', async (req, res) => {
    try {
        const response = await axios.get(
            `${PRINTIFY_BASE}/shops/${process.env.PRINTIFY_SHOP_ID}/products.json`,
            { headers: HEADERS }
        );
        res.json(response.data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch products', details: err.response?.data || err.message });
    }
});

// ============================================
// GET SINGLE PRODUCT WITH VARIANTS (sizes, colors)
// ============================================
app.get('/api/products/:productId', async (req, res) => {
    try {
        const response = await axios.get(
            `${PRINTIFY_BASE}/shops/${process.env.PRINTIFY_SHOP_ID}/products/${req.params.productId}.json`,
            { headers: HEADERS }
        );
        res.json(response.data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch product', details: err.response?.data || err.message });
    }
});

// ============================================
// CREATE STRIPE PAYMENT INTENT
// ============================================
app.post('/api/create-payment-intent', async (req, res) => {
    const { amount, currency = 'usd', cartItems } = req.body;

    try {
        const paymentIntent = await stripeClient.paymentIntents.create({
            amount: Math.round(amount * 100), // convert to cents
            currency,
            metadata: {
                store: 'Nakhonik',
                items: JSON.stringify(cartItems.map(i => i.title))
            }
        });

        res.json({ clientSecret: paymentIntent.client_secret });
    } catch (err) {
        res.status(500).json({ error: 'Payment setup failed', details: err.message });
    }
});

// ============================================
// CREATE ORDER IN PRINTIFY (called after payment)
// ============================================
app.post('/api/orders', async (req, res) => {
    const { customerInfo, cartItems } = req.body;

    // Map cart items to Printify format
    const lineItems = cartItems.map(item => ({
        product_id: item.printifyProductId,
        variant_id: item.variantId,
        quantity: item.quantity
    }));

    const orderPayload = {
        label: `NAKHONIK-${Date.now()}`,
        line_items: lineItems,
        shipping_method: 1, // 1 = Standard
        send_shipping_notification: true,
        address_to: {
            first_name: customerInfo.firstName,
            last_name: customerInfo.lastName,
            email: customerInfo.email,
            phone: customerInfo.phone || '',
            country: customerInfo.country,   // e.g. "TH" for Thailand
            region: customerInfo.state || '',
            address1: customerInfo.address,
            city: customerInfo.city,
            zip: customerInfo.zip
        }
    };

    try {
        const response = await axios.post(
            `${PRINTIFY_BASE}/shops/${process.env.PRINTIFY_SHOP_ID}/orders.json`,
            orderPayload,
            { headers: HEADERS }
        );

        const orderId = response.data.id;

        // Automatically send to production
        await axios.post(
            `${PRINTIFY_BASE}/shops/${process.env.PRINTIFY_SHOP_ID}/orders/${orderId}/send_to_production.json`,
            {},
            { headers: HEADERS }
        );

        res.json({ success: true, orderId, message: 'Order placed and sent to production!' });
    } catch (err) {
        res.status(500).json({ error: 'Order creation failed', details: err.response?.data || err.message });
    }
});

// ============================================
// GET ORDER STATUS
// ============================================
app.get('/api/orders/:orderId', async (req, res) => {
    try {
        const response = await axios.get(
            `${PRINTIFY_BASE}/shops/${process.env.PRINTIFY_SHOP_ID}/orders/${req.params.orderId}.json`,
            { headers: HEADERS }
        );
        res.json(response.data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to get order', details: err.response?.data || err.message });
    }
});

// ============================================
// STRIPE WEBHOOK — Confirm payment & place order
// ============================================
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];

    let event;
    try {
        event = stripeClient.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        return res.status(400).json({ error: `Webhook error: ${err.message}` });
    }

    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        console.log(`✅ Payment confirmed: ${paymentIntent.id}`);
        // Here you would trigger order creation if not already done
    }

    res.sendStatus(200);
});

// ============================================
// PRINTIFY WEBHOOK — Shipping notifications
// ============================================
app.post('/api/webhooks/printify', (req, res) => {
    const event = req.body;
    console.log(`📦 Printify event: ${event.type}`, event.data);

    if (event.type === 'order:shipment:sent') {
        console.log(`🚚 Order shipped! Order ID: ${event.data.order_id}`);
        // TODO: Send shipping email to customer
    }

    res.sendStatus(200);
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 3001;
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`\n🥊 Nakhonik backend running on http://localhost:${PORT}`);
        console.log(`📋 Test your Printify connection: http://localhost:${PORT}/api/test\n`);
    });
}

module.exports = app;
