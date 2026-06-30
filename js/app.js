const BACKEND_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.'))
    ? `http://${window.location.hostname}:3001`
    : '';

// ==========================================
// PRODUCT DATABASE & CONFIGURATION
// Configured dynamically from Printify API.
// ==========================================
let PRODUCTS = {};

// ==========================================
// STATE MANAGEMENT
// ==========================================
let state = {
    activeProductId: "",
    activeWash: "",
    activeSize: "M",
    activeQty: 1,
    cart: [],
    testimonialIndex: 0
};

// Load cart from localStorage on init
try {
    const savedCart = localStorage.getItem("nakhonik_cart");
    if (savedCart) {
        state.cart = JSON.parse(savedCart);
    }
} catch (e) {
    console.error("Could not load cart from localStorage", e);
}

// ==========================================
// DOM ELEMENTS
// ==========================================
const mainHeader = document.getElementById("mainHeader");
const themeToggleBtn = document.getElementById("themeToggleBtn");

// Spotlight Selectors
const spotlightMainImg = document.getElementById("spotlightMainImg");
const spotlightCategory = document.getElementById("spotlightCategory");
const spotlightName = document.getElementById("spotlightName");
const spotlightPrice = document.getElementById("spotlightPrice");
const spotlightDesc = document.getElementById("spotlightDesc");
const spotlightStory = document.querySelector("#spotlightStory p");
const colorLabel = document.getElementById("colorLabel");
const colorSelector = document.getElementById("colorSelector");
const sizeLabel = document.getElementById("sizeLabel");
const sizeSelector = document.getElementById("sizeSelector");
const qtyValue = document.getElementById("qtyValue");
const qtyMinus = document.getElementById("qtyMinus");
const qtyPlus = document.getElementById("qtyPlus");
const addToCartBtn = document.getElementById("addToCartBtn");

// Cart Selectors
const cartOverlay = document.getElementById("cartOverlay");
const cartDrawer = document.getElementById("cartDrawer");
const cartToggleBtn = document.getElementById("cartToggleBtn");
const cartCloseBtn = document.getElementById("cartCloseBtn");
const cartBadgeCount = document.getElementById("cartBadgeCount");
const cartHeaderCount = document.getElementById("cartHeaderCount");
const cartItemsList = document.getElementById("cartItemsList");
const cartEmptyMessage = document.getElementById("cartEmptyMessage");
const cartSubtotalVal = document.getElementById("cartSubtotalVal");
const checkoutBtn = document.getElementById("checkoutBtn");

// Size Finder Selectors
const heightSlider = document.getElementById("heightSlider");
const heightVal = document.getElementById("heightVal");
const weightSlider = document.getElementById("weightSlider");
const weightVal = document.getElementById("weightVal");
const fitBtns = document.querySelectorAll(".fit-btn");
const recommendedSize = document.getElementById("recommendedSize");
const recommendationExplanation = document.getElementById("recommendationExplanation");

// Testimonials Selectors
const testimonialTrack = document.getElementById("testimonialTrack");
const prevSlideBtn = document.getElementById("prevSlide");
const nextSlideBtn = document.getElementById("nextSlide");

// Checkout Modal Selectors
const checkoutModalOverlay = document.getElementById("checkoutModalOverlay");
const checkoutModal = document.getElementById("checkoutModal");
const checkoutModalCloseBtn = document.getElementById("checkoutModalCloseBtn");

// ==========================================
// CONTROLLERS & RENDERERS
// ==========================================

// Header Scroll Effect
window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
        mainHeader.classList.add("scrolled");
    } else {
        mainHeader.classList.remove("scrolled");
    }
});

// Dynamic Price and Image Mockup Updater
function updatePriceAndImage() {
    const product = PRODUCTS[state.activeProductId];
    if (!product || !product.raw) return;

    const colorOption = product.raw.options.find(o => o.type === 'color' || o.name.toLowerCase() === 'colors');
    const colorValue = colorOption ? colorOption.values.find(v => v.title === state.activeWash) : null;
    const colorValId = colorValue ? colorValue.id : null;

    const sizeOption = product.raw.options.find(o => o.type === 'size' || o.name.toLowerCase() === 'sizes');
    const sizeValue = sizeOption ? sizeOption.values.find(v => v.title === state.activeSize) : null;
    const sizeValId = sizeValue ? sizeValue.id : null;

    const matchedVariant = product.raw.variants.find(v => {
        const hasColor = colorValId ? v.options.includes(colorValId) : true;
        const hasSize = sizeValId ? v.options.includes(sizeValId) : true;
        return hasColor && hasSize;
    });

    if (matchedVariant) {
        const price = matchedVariant.price / 100;
        spotlightPrice.innerHTML = `<span>$${price.toFixed(2)}</span>`;

        // Also update spotlight main image if variant image exists
        const matchedImage = product.raw.images.find(img => img.variant_ids.includes(matchedVariant.id));
        if (matchedImage) {
            spotlightMainImg.style.opacity = 0;
            setTimeout(() => {
                spotlightMainImg.src = matchedImage.src;
                spotlightMainImg.style.opacity = 1;
            }, 100);
        }
    }
}

// 1. PRODUCT SPOTLIGHT SWITCHING (Printify API Adapted)
function renderSpotlight() {
    const product = PRODUCTS[state.activeProductId];
    if (!product) return;

    // Apply quick transition effect
    spotlightMainImg.style.opacity = 0;
    setTimeout(() => {
        spotlightMainImg.src = product.image;
        spotlightMainImg.alt = product.name;
        spotlightMainImg.style.opacity = 1;
    }, 150);

    spotlightCategory.textContent = product.category;
    spotlightName.textContent = product.name;

    // Base Price
    spotlightPrice.innerHTML = `<span>$${product.price.toFixed(2)}</span><span class="price-original">$${product.originalPrice.toFixed(2)}</span>`;

    spotlightDesc.textContent = product.desc;
    spotlightStory.textContent = `"${product.lore}"`;

    // Render colors dynamically from Printify options
    colorSelector.innerHTML = "";
    product.washes.forEach((wash, idx) => {
        const btn = document.createElement("button");
        btn.className = `color-dot ${wash.name === state.activeWash ? "active" : ""}`;
        btn.setAttribute("data-color", wash.name);
        btn.setAttribute("aria-label", wash.name);

        const span = document.createElement("span");
        span.style.backgroundColor = wash.hex;
        btn.appendChild(span);

        btn.addEventListener("click", () => {
            colorSelector.querySelectorAll(".color-dot").forEach(d => d.classList.remove("active"));
            btn.classList.add("active");
            state.activeWash = wash.name;
            colorLabel.textContent = wash.name;
            updatePriceAndImage();
        });

        colorSelector.appendChild(btn);
    });

    // Render sizes dynamically from Printify options
    sizeSelector.innerHTML = "";
    const sizeOption = product.raw.options.find(o => o.type === 'size' || o.name.toLowerCase() === 'sizes');
    if (sizeOption) {
        sizeOption.values.forEach((sizeVal, idx) => {
            const btn = document.createElement("button");
            btn.className = `size-btn ${sizeVal.title === state.activeSize ? "active" : ""}`;
            btn.setAttribute("data-size", sizeVal.title);
            btn.textContent = sizeVal.title;

            btn.addEventListener("click", () => {
                sizeSelector.querySelectorAll(".size-btn").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                state.activeSize = sizeVal.title;
                sizeLabel.textContent = sizeVal.title;
                updatePriceAndImage();
            });

            sizeSelector.appendChild(btn);
        });
    }

    state.activeQty = 1;
    qtyValue.value = 1;
    updatePriceAndImage();
}

// Spotlight quantity controllers
qtyMinus.addEventListener("click", () => {
    if (state.activeQty > 1) {
        state.activeQty--;
        qtyValue.value = state.activeQty;
    }
});
qtyPlus.addEventListener("click", () => {
    if (state.activeQty < 10) {
        state.activeQty++;
        qtyValue.value = state.activeQty;
    }
});

// 2. SHOPPING CART ENGINE
function saveCart() {
    try {
        localStorage.setItem("nakhonik_cart", JSON.stringify(state.cart));
    } catch (e) {
        console.error("Cart save failed", e);
    }
    updateCartUI();
}

function updateCartUI() {
    // Totals calculations
    const totalCount = state.cart.reduce((sum, item) => sum + item.qty, 0);
    const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    cartBadgeCount.textContent = totalCount;
    cartHeaderCount.textContent = totalCount;
    cartSubtotalVal.textContent = `$${subtotal.toFixed(2)}`;

    // Toggle badge visibility
    if (totalCount > 0) {
        cartBadgeCount.style.display = "flex";
        checkoutBtn.removeAttribute("disabled");
        checkoutBtn.style.opacity = 1;
        checkoutBtn.style.pointerEvents = "auto";
    } else {
        cartBadgeCount.style.display = "none";
        checkoutBtn.setAttribute("disabled", "true");
        checkoutBtn.style.opacity = 0.5;
        checkoutBtn.style.pointerEvents = "none";
    }

    // Render list
    // Preserve empty message if empty
    if (state.cart.length === 0) {
        cartItemsList.innerHTML = "";
        cartItemsList.appendChild(cartEmptyMessage);
        cartEmptyMessage.style.display = "flex";
    } else {
        cartEmptyMessage.style.display = "none";
        cartItemsList.innerHTML = "";

        state.cart.forEach((item, index) => {
            const itemEl = document.createElement("div");
            itemEl.className = "cart-item";
            itemEl.innerHTML = `
                <img src="${item.image}" alt="${item.name}" class="cart-item-img">
                <div class="cart-item-details">
                    <h4 class="cart-item-name">${item.name}</h4>
                    <span class="cart-item-meta">${item.wash} / Size ${item.size}</span>
                    <div class="cart-item-bottom">
                        <div class="cart-item-qty">
                            <button class="cart-qty-btn decrease-cart-qty" data-index="${index}"><i class="fa-solid fa-minus"></i></button>
                            <span class="cart-qty-val">${item.qty}</span>
                            <button class="cart-qty-btn increase-cart-qty" data-index="${index}"><i class="fa-solid fa-plus"></i></button>
                        </div>
                        <span class="cart-item-price">$${(item.price * item.qty).toFixed(2)}</span>
                    </div>
                    <span class="cart-item-remove" data-index="${index}">Remove</span>
                </div>
            `;
            cartItemsList.appendChild(itemEl);
        });

        // Add event listeners for cart management
        document.querySelectorAll(".decrease-cart-qty").forEach(b => {
            b.addEventListener("click", () => {
                const idx = parseInt(b.getAttribute("data-index"));
                if (state.cart[idx].qty > 1) {
                    state.cart[idx].qty--;
                    saveCart();
                }
            });
        });

        document.querySelectorAll(".increase-cart-qty").forEach(b => {
            b.addEventListener("click", () => {
                const idx = parseInt(b.getAttribute("data-index"));
                if (state.cart[idx].qty < 10) {
                    state.cart[idx].qty++;
                    saveCart();
                }
            });
        });

        document.querySelectorAll(".cart-item-remove").forEach(b => {
            b.addEventListener("click", () => {
                const idx = parseInt(b.getAttribute("data-index"));
                state.cart.splice(idx, 1);
                saveCart();
            });
        });
    }
}

// Add to cart from Spotlight (Printify API Adapted)
addToCartBtn.addEventListener("click", () => {
    const product = PRODUCTS[state.activeProductId];
    if (!product || !product.raw) return;

    // Check if duplicate exists
    const existingIndex = state.cart.findIndex(item =>
        item.id === state.activeProductId &&
        item.wash === state.activeWash &&
        item.size === state.activeSize
    );

    if (existingIndex > -1) {
        state.cart[existingIndex].qty = Math.min(state.cart[existingIndex].qty + state.activeQty, 10);
    } else {
        // Look up Printify variant ID
        const colorOption = product.raw.options.find(o => o.type === 'color' || o.name.toLowerCase() === 'colors');
        const colorValue = colorOption ? colorOption.values.find(v => v.title === state.activeWash) : null;
        const colorValId = colorValue ? colorValue.id : null;

        const sizeOption = product.raw.options.find(o => o.type === 'size' || o.name.toLowerCase() === 'sizes');
        const sizeValue = sizeOption ? sizeOption.values.find(v => v.title === state.activeSize) : null;
        const sizeValId = sizeValue ? sizeValue.id : null;

        const matchedVariant = product.raw.variants.find(v => {
            const hasColor = colorValId ? v.options.includes(colorValId) : true;
            const hasSize = sizeValId ? v.options.includes(sizeValId) : true;
            return hasColor && hasSize;
        });

        const variantId = matchedVariant ? matchedVariant.id : null;
        const price = matchedVariant ? (matchedVariant.price / 100) : product.price;
        const image = product.raw.images.find(img => img.variant_ids.includes(variantId))?.src || product.image;

        state.cart.push({
            id: state.activeProductId,
            name: product.name,
            price: price,
            image: image,
            wash: state.activeWash,
            size: state.activeSize,
            qty: state.activeQty,
            printifyProductId: product.printifyProductId,
            variantId: variantId
        });
    }

    saveCart();

    // Auto-open cart drawer
    cartDrawer.classList.add("open");
    cartOverlay.classList.add("open");
    document.body.classList.add("cart-open");
});

// Drawer Toggles
function toggleCart() {
    cartDrawer.classList.toggle("open");
    cartOverlay.classList.toggle("open");
    document.body.classList.toggle("cart-open");
}

cartToggleBtn.addEventListener("click", toggleCart);
cartCloseBtn.addEventListener("click", toggleCart);
cartOverlay.addEventListener("click", toggleCart);

// 3. INTERACTIVE SIZE FINDER CALCULATOR
let sizeFinderState = {
    height: 175,
    weight: 75,
    fit: "regular"
};

function calculateRecommendedSize() {
    const { height, weight, fit } = sizeFinderState;
    let size = "M";

    // 1. Initial size based on weight ranges
    if (weight < 62) {
        size = "S";
    } else if (weight >= 62 && weight < 74) {
        size = "M";
    } else if (weight >= 74 && weight < 86) {
        size = "L";
    } else if (weight >= 86 && weight < 98) {
        size = "XL";
    } else {
        size = "XXL";
    }

    // 2. Adjust for height proportions
    if (height > 185 && (size === "S" || size === "M")) {
        // Tall and lean, size up for length
        size = size === "S" ? "M" : "L";
    } else if (height < 165 && (size === "L" || size === "XL" || size === "XXL")) {
        // Shorter, size down to avoid dress-like length
        size = size === "L" ? "M" : (size === "XL" ? "L" : "XL");
    }

    // 3. Adjust for desired fit silhouette
    const sizesArr = ["S", "M", "L", "XL", "XXL"];
    let currentIdx = sizesArr.indexOf(size);

    if (fit === "athletic") {
        // Slimmer cut: step down if possible
        if (currentIdx > 0) currentIdx--;
    } else if (fit === "oversized") {
        // Boxier, drop shoulder look: step up if possible
        if (currentIdx < sizesArr.length - 1) currentIdx++;
    }

    size = sizesArr[currentIdx];

    // 4. Update UI
    recommendedSize.textContent = size;

    // Generate detail explanations
    let explanationText = "";
    if (fit === "regular") {
        explanationText = `Excellent choice. A classic draping with standard arm-opening width. Perfect structural boxiness without being overly baggier.`;
    } else if (fit === "athletic") {
        explanationText = `Snugger fit across the chest and shoulders to frame the physique. Pre-shrunk cotton ensures it stays form-fitting.`;
    } else {
        explanationText = `Ultra-modern street profile. Lower shoulder seams and wider sleeves. We recommend this size for an authentic slouchy streetwear look.`;
    }

    recommendationExplanation.textContent = explanationText;
}

// Sizer Inputs Bindings
heightSlider.addEventListener("input", (e) => {
    const val = parseInt(e.target.value);
    sizeFinderState.height = val;
    heightVal.textContent = `${val} cm`;
    calculateRecommendedSize();
});

weightSlider.addEventListener("input", (e) => {
    const val = parseInt(e.target.value);
    sizeFinderState.weight = val;
    weightVal.textContent = `${val} kg`;
    calculateRecommendedSize();
});

fitBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        fitBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        sizeFinderState.fit = btn.getAttribute("data-fit");
        calculateRecommendedSize();
    });
});

// 4. TESTIMONIALS SLIDER
function moveTestimonial(direction) {
    const slides = document.querySelectorAll(".testimonial-slide");
    const totalSlides = slides.length;

    if (direction === "next") {
        state.testimonialIndex = (state.testimonialIndex + 1) % totalSlides;
    } else {
        state.testimonialIndex = (state.testimonialIndex - 1 + totalSlides) % totalSlides;
    }

    testimonialTrack.style.transform = `translateX(-${state.testimonialIndex * 100}%)`;
}

prevSlideBtn.addEventListener("click", () => moveTestimonial("prev"));
nextSlideBtn.addEventListener("click", () => moveTestimonial("next"));

// Auto play testimonials every 8 seconds
let testimonialTimer = setInterval(() => moveTestimonial("next"), 8000);
document.querySelector(".testimonials-slider").addEventListener("mouseenter", () => {
    clearInterval(testimonialTimer);
});
document.querySelector(".testimonials-slider").addEventListener("mouseleave", () => {
    testimonialTimer = setInterval(() => moveTestimonial("next"), 8000);
});

// ==========================================
// 5. CHECKOUT ENGINE — Stripe + Printify
// ==========================================

// ── Stripe Setup ─────────────────────────────────────────────────────
// Paste your Stripe PUBLISHABLE key here (safe for frontend):
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51TlQ9yQRwW9oMJJPT1IqzPW2OX05v0dBbNRECokLTXZUuRGvEHiqrNeUdVLMrJvJfbJkN8G9K948cS3BHxQPaNkl00uxl25Fqc';

let stripeInstance = null;
let stripeCardElement = null;

function initStripe() {
    if (typeof Stripe === 'undefined') {
        console.warn('Stripe.js not loaded yet');
        return;
    }
    stripeInstance = Stripe(STRIPE_PUBLISHABLE_KEY);
    const elements = stripeInstance.elements();

    // Style the card element to match Nakhonik's dark theme
    const cardStyle = {
        base: {
            color: '#f8fafc',
            fontFamily: '"Inter", sans-serif',
            fontSize: '15px',
            fontSmoothing: 'antialiased',
            '::placeholder': { color: '#64748b' },
            iconColor: '#ffb800'
        },
        invalid: {
            color: '#f87171',
            iconColor: '#f87171'
        }
    };

    stripeCardElement = elements.create('card', { style: cardStyle, hidePostalCode: false });
    stripeCardElement.mount('#stripeCardElement');

    // Show card validation errors in real time
    stripeCardElement.on('change', (event) => {
        const displayError = document.getElementById('stripeCardErrors');
        displayError.textContent = event.error ? event.error.message : '';
    });
}

// ── Modal DOM references ──────────────────────────────────────────────
const shippingModal = document.getElementById('shippingModal');
const shippingModalOverlay = document.getElementById('shippingModalOverlay');
const shippingForm = document.getElementById('shippingForm');
const shippingCloseBtn = document.getElementById('shippingCloseBtn');
const orderStatusMsg = document.getElementById('orderStatusMsg');

// Open shipping form when customer clicks "Proceed to Checkout"
checkoutBtn.addEventListener('click', () => {
    if (state.cart.length === 0) return;
    // Close cart drawer, open shipping form
    cartDrawer.classList.remove('open');
    cartOverlay.classList.remove('open');
    document.body.classList.remove('cart-open');
    shippingModal.classList.add('open');
    shippingModalOverlay.classList.add('open');
    // Mount Stripe card element when modal opens
    if (!stripeCardElement) initStripe();
});

function closeShippingModal() {
    shippingModal.classList.remove('open');
    shippingModalOverlay.classList.remove('open');
    orderStatusMsg.textContent = '';
    orderStatusMsg.className = 'order-status-msg';
}

shippingCloseBtn.addEventListener('click', closeShippingModal);
shippingModalOverlay.addEventListener('click', closeShippingModal);

// ── Main submit: Stripe payment → Printify order ──────────────────────
shippingForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = shippingForm.querySelector('.shipping-submit-btn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = 'Processing Payment… <i class="fa-solid fa-spinner fa-spin"></i>';
    orderStatusMsg.textContent = '';
    orderStatusMsg.className = 'order-status-msg';

    const customerInfo = {
        firstName: document.getElementById('ck-firstName').value.trim(),
        lastName: document.getElementById('ck-lastName').value.trim(),
        email: document.getElementById('ck-email').value.trim(),
        phone: document.getElementById('ck-phone').value.trim(),
        address: document.getElementById('ck-address').value.trim(),
        city: document.getElementById('ck-city').value.trim(),
        state: document.getElementById('ck-state').value.trim(),
        zip: document.getElementById('ck-zip').value.trim(),
        country: document.getElementById('ck-country').value.trim()
    };

    // Cart total in dollars
    const totalAmount = state.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);

    // Map cart to format for backend
    const cartItems = state.cart.map(item => ({
        printifyProductId: item.printifyProductId,
        variantId: item.variantId,
        quantity: item.qty,
        title: item.name
    }));

    try {
        // ── STEP 1: Create Stripe Payment Intent on backend ──
        const intentRes = await fetch(`${BACKEND_URL}/api/create-payment-intent`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: totalAmount, currency: 'usd', cartItems })
        });
        const intentData = await intentRes.json();

        if (!intentData.clientSecret) {
            throw new Error('Could not initialize payment. Please try again.');
        }

        // ── STEP 2: Confirm payment with Stripe card element ──
        submitBtn.innerHTML = 'Confirming Payment… <i class="fa-solid fa-spinner fa-spin"></i>';

        const { paymentIntent, error: stripeError } = await stripeInstance.confirmCardPayment(
            intentData.clientSecret,
            {
                payment_method: {
                    card: stripeCardElement,
                    billing_details: {
                        name: `${customerInfo.firstName} ${customerInfo.lastName}`,
                        email: customerInfo.email,
                        address: {
                            line1: customerInfo.address,
                            city: customerInfo.city,
                            state: customerInfo.state,
                            postal_code: customerInfo.zip,
                            country: customerInfo.country
                        }
                    }
                }
            }
        );

        if (stripeError) {
            throw new Error(stripeError.message);
        }

        if (paymentIntent.status !== 'succeeded') {
            throw new Error('Payment was not completed. Please try again.');
        }

        // ── STEP 3: Payment confirmed — create Printify order ──
        submitBtn.innerHTML = 'Placing Order… <i class="fa-solid fa-spinner fa-spin"></i>';

        const orderRes = await fetch(`${BACKEND_URL}/api/orders`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customerInfo, cartItems, paymentIntentId: paymentIntent.id })
        });
        const orderData = await orderRes.json();

        if (orderData.success) {
            // ── SUCCESS ──
            orderStatusMsg.textContent = `✅ Payment confirmed! Order #${orderData.orderId} is now being prepared in Bangkok.`;
            orderStatusMsg.classList.add('success');
            state.cart = [];
            saveCart();
            shippingForm.reset();
            submitBtn.innerHTML = '✅ Order Placed!';

            setTimeout(() => {
                closeShippingModal();
                checkoutModalOverlay.classList.add('open');
                checkoutModal.classList.add('open');
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Pay & Place Order <i class="fa-solid fa-lock"></i>';
            }, 3000);
        } else {
            throw new Error(orderData.error || 'Order creation failed after payment. Contact support.');
        }

    } catch (err) {
        console.error('Checkout error:', err);
        orderStatusMsg.textContent = `❌ ${err.message}`;
        orderStatusMsg.classList.add('error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Pay & Place Order <i class="fa-solid fa-lock"></i>';
    }
});

// ── Success modal close ───────────────────────────────────────────────
function closeCheckoutModal() {
    checkoutModalOverlay.classList.remove('open');
    checkoutModal.classList.remove('open');
}

checkoutModalCloseBtn.addEventListener('click', closeCheckoutModal);
checkoutModalOverlay.addEventListener('click', closeCheckoutModal);


// ==========================================
// THEME INTERACTIVE ENGINE
// ==========================================
function initTheme() {
    const savedTheme = localStorage.getItem("theme") || "dark";
    const themeIcon = themeToggleBtn.querySelector("i");

    if (savedTheme === "light") {
        document.documentElement.classList.add("light-theme");
        document.body.classList.add("light-theme");
        if (themeIcon) {
            themeIcon.className = "fa-solid fa-moon";
        }
    } else {
        document.documentElement.classList.remove("light-theme");
        document.body.classList.remove("light-theme");
        if (themeIcon) {
            themeIcon.className = "fa-solid fa-sun";
        }
    }
}

themeToggleBtn.addEventListener("click", () => {
    const isLight = document.documentElement.classList.contains("light-theme");
    const themeIcon = themeToggleBtn.querySelector("i");

    if (isLight) {
        document.documentElement.classList.remove("light-theme");
        document.body.classList.remove("light-theme");
        localStorage.setItem("theme", "dark");
        if (themeIcon) {
            themeIcon.className = "fa-solid fa-sun";
        }
    } else {
        document.documentElement.classList.add("light-theme");
        document.body.classList.add("light-theme");
        localStorage.setItem("theme", "light");
        if (themeIcon) {
            themeIcon.className = "fa-solid fa-moon";
        }
    }
});

// ==========================================
// DYNAMIC PRINTIFY LOADER ENGINE
// ==========================================
async function fetchProducts() {
    try {
        const res = await fetch(`${BACKEND_URL}/api/products`);
        const json = await res.json();
        const data = json.data || [];

        if (data.length === 0) {
            document.getElementById("productGrid").innerHTML = "<p style='grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 4rem 0;'>No products found in store.</p>";
            return;
        }

        PRODUCTS = {};
        data.forEach(p => {
            let name = p.title;
            let subtitle = "THAI HERITAGE. FIGHTER'S SPIRIT.";
            if (p.title.includes("|")) {
                const parts = p.title.split("|");
                name = parts[0].trim();
                subtitle = parts[1].trim();
            }

            const firstVariant = p.variants.find(v => v.is_enabled) || p.variants[0];
            const basePrice = firstVariant ? (firstVariant.price / 100) : 45.00;

            const colorOption = p.options.find(o => o.type === 'color' || o.name.toLowerCase() === 'colors');
            const washes = [];
            if (colorOption) {
                colorOption.values.forEach(val => {
                    washes.push({
                        name: val.title,
                        hex: (val.colors && val.colors.length > 0) ? val.colors[0] : '#18181b'
                    });
                });
            } else {
                washes.push({ name: "Default Wash", hex: "#18181b" });
            }

            PRODUCTS[p.id] = {
                id: p.id,
                name: name,
                subtitle: subtitle,
                price: basePrice,
                originalPrice: basePrice * 1.25,
                category: p.tags.includes("Legends") ? "LEGENDS SERIES" : "HEAVYWEIGHT SERIES",
                image: p.images.find(img => img.is_default)?.src || p.images[0].src,
                printifyProductId: p.id,
                desc: p.description.split("\n")[0] || "Premium combat clothing crafted for nak muays.",
                lore: p.description.includes("🐅") ? p.description.split("🐅")[1] || "Wear the heritage." : "Designed for fighters who value lineage, power, and ultimate durability.",
                washes: washes,
                raw: p
            };
        });

        renderProductGrid();

        // Auto set default active product
        const productIds = Object.keys(PRODUCTS);
        if (productIds.length > 0) {
            state.activeProductId = productIds[0];
            const activeProd = PRODUCTS[state.activeProductId];
            state.activeWash = activeProd.washes[0].name;
            const sizeOption = activeProd.raw.options.find(o => o.type === 'size' || o.name.toLowerCase() === 'sizes');
            state.activeSize = sizeOption ? sizeOption.values[0].title : "M";

            renderSpotlight();

            // Dynamic hero image mapping
            const heroFeaturedImage = document.getElementById("heroFeaturedImage");
            if (heroFeaturedImage) {
                heroFeaturedImage.src = activeProd.image;
                heroFeaturedImage.alt = activeProd.name;
            }
        }

    } catch (err) {
        console.error("Failed to load products:", err);
        document.getElementById("productGrid").innerHTML = "<p style='grid-column: 1/-1; text-align: center; color: var(--accent-red); padding: 4rem 0;'>Connection error. Please try again later.</p>";
    }
}

function renderProductGrid() {
    const grid = document.getElementById("productGrid");
    grid.innerHTML = "";

    Object.values(PRODUCTS).forEach((p, idx) => {
        const card = document.createElement("article");
        card.className = `product-card ${idx === 0 ? "new" : ""}`;
        card.setAttribute("data-id", p.id);

        card.innerHTML = `
            ${idx === 0 ? '<span class="product-badge">NEW RELEASE</span>' : ''}
            <div class="product-img-wrapper">
                <img src="${p.image}" alt="${p.name}">
            </div>
            <div class="product-info">
                <h3 class="product-title">${p.name}</h3>
                <p class="product-subtitle">${p.subtitle}</p>
                <div class="product-bottom">
                    <span class="product-price">$${p.price.toFixed(2)}</span>
                    <button class="product-view-btn select-product-trigger" data-product="${p.id}">
                        View Details <i class="fa-solid fa-chevron-right"></i>
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });

    grid.querySelectorAll(".select-product-trigger").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            const pId = btn.getAttribute("data-product");
            state.activeProductId = pId;

            const product = PRODUCTS[pId];
            if (product) {
                state.activeWash = product.washes[0].name;
                const sizeOption = product.raw.options.find(o => o.type === 'size' || o.name.toLowerCase() === 'sizes');
                state.activeSize = sizeOption ? sizeOption.values[0].title : "M";
            }

            renderSpotlight();
            document.getElementById("spotlight").scrollIntoView({ behavior: "smooth" });
        });
    });
}

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    initTheme();
    fetchProducts();
    updateCartUI();
    calculateRecommendedSize();
});
