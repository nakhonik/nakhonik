// ==========================================
// PRODUCT DATABASE & CONFIGURATION
// ==========================================
const PRODUCTS = {
    sakyant: {
        name: "Sak Yant Tiger",
        subtitle: "Distressed Golden-Amber Script",
        price: 45.00,
        originalPrice: 55.00,
        category: "HEAVYWEIGHT SERIES",
        image: "assets/sakyant.png",
        desc: "Designed to channel the energy of double tigers, this tee is built with a heavy boxy drape. Hand-silkscreened in Bangkok with thick distressed plastisol ink on an acid-washed charcoal fabric.",
        lore: "The Sak Yant Suea (Tiger) represents ultimate power, authority, and fearlessness. Traditionally tattooed on warriors heading into battle, it grants protection against danger and brings success in combat.",
        washes: [
            { name: "Washed Charcoal Black", class: "color-black" },
            { name: "Vintage Fade Ash", class: "color-washed" }
        ]
    },
    hanuman: {
        name: "Hanuman's Wrath",
        subtitle: "Crimson & Charcoal Battle Art",
        price: 45.00,
        originalPrice: 55.00,
        category: "LEGENDS SERIES",
        image: "assets/hanuman.png",
        desc: "An tribute to the warrior monkey god Hanuman. Printed in rich crimson and charcoal on a vintage cream heavyweight tee, reflecting the ancient stone murals of Bangkok temples.",
        lore: "Hanuman is the Hindu monkey deity representing loyalty, martial prowess, and unmatched strength. In Muay Thai culture, he is the patron spirit of fighters seeking agility, clever tactics, and raw power.",
        washes: [
            { name: "Vintage Cream", class: "color-cream" },
            { name: "Washed Charcoal Black", class: "color-black" }
        ]
    },
    kaad_chuek: {
        name: "Kaad Chuek Fists",
        subtitle: "Ancient Wrapped Hand Design",
        price: 45.00,
        originalPrice: null,
        category: "HERITAGE SERIES",
        image: "assets/kaad_chuek.png",
        desc: "Features a clean distressed drawing of hemp-wrapped hands (Kaad Chuek) used before boxing gloves were introduced. Printed on a soft-washed olive green heavyweight cotton canvas.",
        lore: "In Muay Boran, fighters bound their fists in thick hemp rope ('Kaad Chuek') to protect their knuckles and increase cutting potential. This design honors the raw, unfiltered origins of traditional Thai ring combat.",
        washes: [
            { name: "Washed Olive Green", class: "color-green" },
            { name: "Vintage Fade Ash", class: "color-washed" }
        ]
    },
    golden_era: {
        name: "Golden Era Retro",
        subtitle: "Neon Stadium Tribute",
        price: 45.00,
        originalPrice: 50.00,
        category: "RETRO SERIES",
        image: "assets/golden_era.png",
        desc: "A bold retrowave design paying tribute to the legendary 1980s-90s era of Muay Thai. Printed on a classic black premium heavyweight t-shirt with vibrant neon screen printing.",
        lore: "The Golden Era represents the pinnacle of Muay Thai competition, where legendary champions fought in packed stadiums under neon lights. This design features classic stadium graphics and neon typography.",
        washes: [
            { name: "Classic Black", class: "color-black" },
            { name: "Vintage Fade Ash", class: "color-washed" }
        ]
    }
};

// ==========================================
// STATE MANAGEMENT
// ==========================================
let state = {
    activeProductId: "sakyant",
    activeWash: "Washed Charcoal Black",
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

// 1. PRODUCT SPOTLIGHT SWITCHING
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
    
    // Price rendering with discount checking
    if (product.originalPrice) {
        spotlightPrice.innerHTML = `<span>$${product.price.toFixed(2)}</span><span class="price-original">$${product.originalPrice.toFixed(2)}</span>`;
    } else {
        spotlightPrice.innerHTML = `<span>$${product.price.toFixed(2)}</span>`;
    }

    spotlightDesc.textContent = product.desc;
    spotlightStory.textContent = `"${product.lore}"`;

    // Render colors for specific product
    colorSelector.innerHTML = "";
    product.washes.forEach((wash, idx) => {
        const btn = document.createElement("button");
        btn.className = `color-dot ${wash.class} ${idx === 0 ? "active" : ""}`;
        btn.setAttribute("data-color", wash.name);
        btn.setAttribute("aria-label", wash.name);
        
        btn.addEventListener("click", () => {
            document.querySelectorAll(".color-dot").forEach(d => d.classList.remove("active"));
            btn.classList.add("active");
            state.activeWash = wash.name;
            colorLabel.textContent = wash.name;
        });

        colorSelector.appendChild(btn);
    });

    // Reset spotlight local states
    state.activeWash = product.washes[0].name;
    colorLabel.textContent = product.washes[0].name;

    state.activeQty = 1;
    qtyValue.value = 1;

    // Maintain size selection
    const activeSizeBtn = sizeSelector.querySelector(`.size-btn[data-size="${state.activeSize}"]`);
    if (activeSizeBtn) {
        sizeSelector.querySelectorAll(".size-btn").forEach(b => b.classList.remove("active"));
        activeSizeBtn.classList.add("active");
        sizeLabel.textContent = state.activeSize;
    }
}

// Attach event listeners to collection cards
document.querySelectorAll(".select-product-trigger").forEach(btn => {
    btn.addEventListener("click", (e) => {
        e.preventDefault();
        const pId = btn.getAttribute("data-product");
        state.activeProductId = pId;
        renderSpotlight();
        
        // Scroll smoothly to spotlight section
        document.getElementById("spotlight").scrollIntoView({ behavior: "smooth" });
    });
});

// Spotlight Size click handler
sizeSelector.querySelectorAll(".size-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        sizeSelector.querySelectorAll(".size-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        const size = btn.getAttribute("data-size");
        state.activeSize = size;
        sizeLabel.textContent = size;
    });
});

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

// Add to cart from Spotlight
addToCartBtn.addEventListener("click", () => {
    const product = PRODUCTS[state.activeProductId];
    if (!product) return;

    // Check if duplicate exists
    const existingIndex = state.cart.findIndex(item => 
        item.id === state.activeProductId && 
        item.wash === state.activeWash && 
        item.size === state.activeSize
    );

    if (existingIndex > -1) {
        state.cart[existingIndex].qty = Math.min(state.cart[existingIndex].qty + state.activeQty, 10);
    } else {
        state.cart.push({
            id: state.activeProductId,
            name: product.name,
            price: product.price,
            image: product.image,
            wash: state.activeWash,
            size: state.activeSize,
            qty: state.activeQty
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

// 5. MOCK CHECKOUT ENGINE
checkoutBtn.addEventListener("click", () => {
    if (state.cart.length === 0) return;

    // Toggle checkout success panel
    checkoutModalOverlay.classList.add("open");
    checkoutModal.classList.add("open");
    
    // Clear cart and local storage
    state.cart = [];
    saveCart();
    
    // Close cart drawer
    cartDrawer.classList.remove("open");
    cartOverlay.classList.remove("open");
    document.body.classList.remove("cart-open");
});

function closeCheckoutModal() {
    checkoutModalOverlay.classList.remove("open");
    checkoutModal.classList.remove("open");
}

checkoutModalCloseBtn.addEventListener("click", closeCheckoutModal);
checkoutModalOverlay.addEventListener("click", closeCheckoutModal);


// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    renderSpotlight();
    updateCartUI();
    calculateRecommendedSize();
});
