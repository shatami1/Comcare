// ============================================
// COMFORTCARE - JAVASCRIPT FUNCTIONALITY
// Medical Equipment Rental Website
// ============================================

function getStoredCart() {
    try {
        const stored = JSON.parse(localStorage.getItem('pricingCartItems'));
        return Array.isArray(stored) ? stored : [];
    } catch (error) {
        return [];
    }
}

function getCartSummary(cartItems = getStoredCart()) {
    return cartItems.reduce(
        (acc, item) => {
            const quantity = Number(item.quantity || 0);
            const unitPrice = Number(item.unitPrice || 0);
            acc.count += quantity;
            acc.total += unitPrice * quantity;
            return acc;
        },
        { count: 0, total: 0 }
    );
}

function saveCheckoutSnapshot(cartItems = getStoredCart()) {
    const summary = getCartSummary(cartItems);
    localStorage.setItem('pricingCartTotal', summary.total.toFixed(2));
    localStorage.setItem('pricingCartCount', String(summary.count));
}

function getStoredCheckoutTotal() {
    const urlTotal = Number(new URLSearchParams(window.location.search).get('total'));
    if (Number.isFinite(urlTotal) && urlTotal > 0) {
        return urlTotal;
    }

    const savedTotal = Number(localStorage.getItem('pricingCartTotal'));
    if (Number.isFinite(savedTotal) && savedTotal > 0) {
        return savedTotal;
    }

    return 0;
}

function getCheckoutSessionEndpoint() {
    if (window.location.protocol === 'file:') {
        return 'http://localhost:3000/create-checkout-session';
    }

    // Use Vercel API for production
    return 'https://comcare-nine.vercel.app/create-checkout-session';
}

function getCheckoutHealthEndpoint() {
    if (window.location.protocol === 'file:') {
        return 'http://localhost:3000/checkout-health';
    }

    // Use Vercel API for production
    return 'https://comcare-nine.vercel.app/checkout-health';
}

function setCheckoutStatusBadge(message, state) {
    const badge = document.getElementById('checkoutStatusBadge');
    if (!badge) {
        return;
    }

    badge.textContent = message;
    badge.classList.remove('checkout-status-info', 'checkout-status-success', 'checkout-status-error');

    if (state === 'success') {
        badge.classList.add('checkout-status-success');
        return;
    }

    if (state === 'error') {
        badge.classList.add('checkout-status-error');
        return;
    }

    badge.classList.add('checkout-status-info');
}

function setCheckoutStatusRetryState(isBusy) {
    const retryBtn = document.getElementById('checkoutStatusRetry');
    if (!retryBtn) {
        return;
    }

    retryBtn.disabled = isBusy;
    retryBtn.textContent = isBusy ? 'Checking...' : 'Retry';
}

function bindCheckoutStatusRetry() {
    const retryBtn = document.getElementById('checkoutStatusRetry');
    if (!retryBtn || retryBtn.dataset.bound === 'true') {
        return;
    }

    retryBtn.dataset.bound = 'true';
    retryBtn.addEventListener('click', function() {
        updateCheckoutStatusBadge();
    });
}

async function updateCheckoutStatusBadge() {
    const badge = document.getElementById('checkoutStatusBadge');
    if (!badge) {
        return;
    }

    setCheckoutStatusRetryState(true);
    setCheckoutStatusBadge('Checking checkout connection...', 'info');

    try {
        const response = await fetch(getCheckoutHealthEndpoint(), {
            method: 'GET',
            headers: {
                'Cache-Control': 'no-cache'
            }
        });

        if (!response.ok) {
            throw new Error('Checkout server not reachable.');
        }

        const payload = await response.json();
        if (payload?.status === 'ok') {
            setCheckoutStatusBadge('Checkout connected: server and Stripe key are valid.', 'success');
            setCheckoutStatusRetryState(false);
            return;
        }

        const reason = payload?.message || 'Stripe configuration issue.';
        setCheckoutStatusBadge(`Checkout issue: ${reason}`, 'error');
        setCheckoutStatusRetryState(false);
    } catch (error) {
        setCheckoutStatusBadge('Checkout offline: start the local server to enable payment.', 'error');
        setCheckoutStatusRetryState(false);
    }
}

function buildStripeItemsFromCart(cart) {
    return cart
        .map(item => ({
            name: item.name,
            model: item.model,
            rate: item.rateType,
            price: Number(item.unitPrice),
            quantity: Number(item.quantity)
        }))
        .filter(item => item.name && item.price > 0 && item.quantity > 0);
}

function bindDynamicStripeCheckout(button) {
    if (!button || button.dataset.checkoutBound === 'true') {
        return;
    }

    button.dataset.checkoutBound = 'true';

    button.addEventListener('click', async function() {
        const cart = getStoredCart();
        const stripeItems = buildStripeItemsFromCart(cart);

        if (stripeItems.length === 0) {
            alert('Your cart is empty. Add items before checkout.');
            return;
        }

        const originalText = button.textContent;
        button.disabled = true;
        button.textContent = 'Processing...';

        try {
            const response = await fetch(getCheckoutSessionEndpoint(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ items: stripeItems })
            });

            if (!response.ok) {
                let serverMessage = 'Checkout server not available.';
                try {
                    const errorPayload = await response.json();
                    if (errorPayload?.error) {
                        serverMessage = errorPayload.error;
                    }
                } catch (parseError) {
                    // Ignore parse failures and keep default message
                }
                throw new Error(serverMessage);
            }

            const data = await response.json();
            if (!data?.url) {
                throw new Error(data?.error || 'No checkout URL returned.');
            }

            window.location.href = data.url;
        } catch (error) {
            console.error('Stripe checkout failed:', error);
            const message = error?.message || 'Unable to start secure checkout.';
            alert(`Unable to start secure checkout: ${message}`);
            button.disabled = false;
            button.textContent = originalText;
        }
    });
}

function updateHeaderCart() {
    const countEl = document.getElementById('headerCartCount');
    const totalEl = document.getElementById('headerCartTotal');
    if (!countEl || !totalEl) {
        return;
    }

    const cart = getStoredCart();
    const summary = getCartSummary(cart);

    countEl.textContent = `${summary.count} ${summary.count === 1 ? 'item' : 'items'}`;
    totalEl.textContent = `$${summary.total.toFixed(2)}`;
    saveCheckoutSnapshot(cart);
}

function updateCartEmailLink() {
    const link = document.getElementById('cartEmailLink');
    if (!link) {
        return;
    }

    const cart = getStoredCart();
    if (cart.length === 0) {
        link.href = 'mailto:accentgv@gmail.com?subject=ComfortCare%20Discount%20Request&body=My%20cart%20is%20currently%20empty.';
        return;
    }

    let total = 0;
    const lines = cart.map((item, index) => {
        const quantity = Number(item.quantity || 0);
        const unitPrice = Number(item.unitPrice || 0);
        const itemTotal = unitPrice * quantity;
        total += itemTotal;
        return `${index + 1}. ${item.name} ${item.model} | ${item.rateType} | Qty ${quantity} | $${itemTotal.toFixed(2)}`;
    });

    const subject = 'ComfortCare Discount Request';
    const body = [
        'Hello ComfortCare,',
        '',
        'Please review my cart for available discounts:',
        ...lines,
        '',
        `Total: $${total.toFixed(2)}`,
        '',
        'Name:',
        'Phone:',
        'Email:'
    ].join('\n');

    link.href = `mailto:accentgv@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

// Mobile Navigation Toggle
document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.querySelector('.nav-menu');
    
    if (hamburger) {
        hamburger.addEventListener('click', function() {
            navMenu.classList.toggle('active');
            hamburger.classList.toggle('active');
        });
    }

    // Close menu when a link is clicked
    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navMenu.classList.remove('active');
            if (hamburger) {
                hamburger.classList.remove('active');
            }
        });
    });

    // Contact form submits directly to FormSubmit.co (no JavaScript handler)

    // Booking form submits directly to FormSubmit.co (no JavaScript handler)

    // Initialize pricing cart (pricing + order pages)
    if (
        document.querySelector('.pricing-item')
        || document.getElementById('cartCheckoutForm')
        || document.getElementById('cartItems')
    ) {
        initPricingCart();
    }

    updateHeaderCart();
    updateCartEmailLink();

    initMobileNavCartTabs();

    window.addEventListener('storage', function(event) {
        if (event.key === 'pricingCartItems') {
            updateHeaderCart();
            updateCartEmailLink();
        }
    });

    // Handle Edit Cart buttons - on mobile, open floating cart instead of navigating
    const editCartButtons = document.querySelectorAll('a[href="order.html"]');
    editCartButtons.forEach(button => {
        if (button.textContent.includes('Edit Cart')) {
            button.addEventListener('click', function(e) {
                // On mobile, show floating cart instead of navigating
                if (window.innerWidth <= 900) {
                    e.preventDefault();
                    const floatingCart = document.getElementById('floatingCart');
                    const showBtn = document.getElementById('showFloatingCart');
                    
                    if (floatingCart) {
                        floatingCart.style.display = 'flex';
                        if (showBtn) showBtn.style.display = 'none';
                    }
                }
                // On desktop, allow normal navigation to order.html
            });
        }
    });

    // Set minimum date to today
    const startDateInput = document.getElementById('startDate');
    const deliveryDateInput = document.getElementById('deliveryDate');
    if (startDateInput || deliveryDateInput) {
        const today = new Date().toISOString().split('T')[0];
        if (startDateInput) startDateInput.setAttribute('min', today);
        if (deliveryDateInput) deliveryDateInput.setAttribute('min', today);
    }

    // Sync rental days when changing dates
    const rentalDaysInput = document.getElementById('rentalDays');
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('deliveryDate');

    if (rentalDaysInput && startDate) {
        rentalDaysInput.addEventListener('change', function() {
            if (startDate.value) {
                const start = new Date(startDate.value);
                const end = new Date(start);
                end.setDate(end.getDate() + parseInt(this.value));
                if (endDate) {
                    endDate.value = end.toISOString().split('T')[0];
                }
            }
        });
    }
});

function initMobileNavCartTabs() {
    const navCart = document.querySelector('.nav-cart');
    if (!navCart || window.innerWidth > 900) return;
    if (navCart.dataset.mobileTabsReady === 'true') return;

    const cartBox = navCart.querySelector('.cart-box');
    const navCartMain = navCart.querySelector('.nav-cart-main');
    const emailLink = navCart.querySelector('#cartEmailLink');
    if (!cartBox || !navCartMain) return;

    const editBtn = navCartMain.querySelector('a.btn-secondary');
    const payBtn = navCartMain.querySelector('a.btn-primary');

    const tabs = document.createElement('div');
    tabs.className = 'nav-cart-tabs';

    const tabCart = document.createElement('button');
    tabCart.type = 'button';
    tabCart.className = 'nav-cart-tab is-active';
    tabCart.textContent = 'Cart Summary';

    const tabPay = document.createElement('button');
    tabPay.type = 'button';
    tabPay.className = 'nav-cart-tab';
    tabPay.textContent = 'Pay Options';

    const panelCart = document.createElement('div');
    panelCart.className = 'nav-cart-panel is-active';

    const panelPay = document.createElement('div');
    panelPay.className = 'nav-cart-panel';

    panelCart.appendChild(cartBox);
    if (editBtn) panelCart.appendChild(editBtn);
    if (payBtn) panelPay.appendChild(payBtn);
    if (emailLink) panelPay.appendChild(emailLink);

    navCartMain.remove();

    tabs.appendChild(tabCart);
    tabs.appendChild(tabPay);

    navCart.prepend(panelPay);
    navCart.prepend(panelCart);
    navCart.prepend(tabs);

    function setActiveTab(active) {
        const isCart = active === 'cart';
        tabCart.classList.toggle('is-active', isCart);
        tabPay.classList.toggle('is-active', !isCart);
        panelCart.classList.toggle('is-active', isCart);
        panelPay.classList.toggle('is-active', !isCart);
    }

    tabCart.addEventListener('click', function() {
        setActiveTab('cart');
    });

    tabPay.addEventListener('click', function() {
        setActiveTab('pay');
    });

    navCart.dataset.mobileTabsReady = 'true';
}

// ============================================
// CONTACT FORM - Submits directly to FormSubmit.co
// No JavaScript handler needed
// ============================================

// ============================================
// BOOKING FORM - Submits directly to FormSubmit.co
// No JavaScript handler needed
// ============================================

// ============================================
// FORM VALIDATION
// ============================================

function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validatePhone(phone) {
    const phoneRegex = /^[\d\s\-\+\(\)]{10,}$/;
    return phoneRegex.test(phone.replace(/\D/g, '').length >= 10 ? phone : '');
}

function validateZipCode(zipCode) {
    const zipRegex = /^\d{5}(-\d{4})?$/;
    return zipRegex.test(zipCode);
}

// ============================================
// PRICING CART + STRIPE CHECKOUT
// ============================================

function initPricingCart() {
    const cartItemsEl = document.getElementById('cartItems');
    const cartTotalEl = document.getElementById('cartTotal');
    const cartForm = document.getElementById('cartCheckoutForm');
    const cartMessageEl = document.getElementById('cartMessage');
    const pricingMessageEl = document.getElementById('cartAddMessage');
    const cart = loadCart();
    const rateLabels = {
        daily: 'Daily',
        weekly: 'Weekly',
        monthly: 'Monthly'
    };
    const stripePaymentLink = 'https://buy.stripe.com/6oU28t7f16xQdW12QP24001';

    const itemRows = document.querySelectorAll('.pricing-item');
    itemRows.forEach(row => {
        const addButton = row.querySelector('.add-to-cart');
        if (!addButton) {
            return;
        }

        addButton.addEventListener('click', () => {
            const rateSelect = row.querySelector('.rate-select');
            const qtyInput = row.querySelector('.qty-input');
            const rateType = rateSelect ? rateSelect.value : 'daily';
            const quantity = Math.max(parseInt(qtyInput?.value, 10) || 1, 1);

            const prices = {
                daily: parseFloat(row.dataset.daily || '0'),
                weekly: parseFloat(row.dataset.weekly || '0'),
                monthly: parseFloat(row.dataset.monthly || '0')
            };

            const unitPrice = prices[rateType] || 0;
            const name = row.dataset.name || 'Item';
            const model = row.dataset.model || '';

            const existing = cart.find(item => item.name === name && item.model === model && item.rateType === rateType);
            if (existing) {
                existing.quantity += quantity;
            } else {
                cart.push({
                    name,
                    model,
                    rateType,
                    unitPrice,
                    quantity
                });
            }

            if (qtyInput) {
                qtyInput.value = '1';
            }

            saveCart(cart);
            renderCart();
            // Update Stripe button if present
            if (typeof updateStripeButton === 'function') {
                updateStripeButton();
            }
            showPricingMessage('Item added to cart. Visit the order page when ready.', 'success');
        });
    });

    if (cartItemsEl && cartTotalEl) {
        renderCart();
    }

    if (!cartForm) {
        return;
    }

    cartForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        if (cart.length === 0) {
            showCartMessage('Add at least one item before checking out.', 'error');
            return;
        }

        const customer = {
            name: document.getElementById('cartName')?.value.trim(),
            email: document.getElementById('cartEmail')?.value.trim(),
            phone: document.getElementById('cartPhone')?.value.trim()
        };

        if (!customer.name || !customer.email || !customer.phone) {
            showCartMessage('Please complete your contact details.', 'error');
            return;
        }

        showCartMessage('Redirecting to secure checkout...', 'success');
        const newTab = window.open(stripePaymentLink, '_blank', 'noopener');
        if (!newTab) {
            window.location.href = stripePaymentLink;
        }
    });

    function renderCart() {
        if (!cartItemsEl || !cartTotalEl) {
            return;
        }

        cartItemsEl.innerHTML = '';

        if (cart.length === 0) {
            const empty = document.createElement('p');
            empty.className = 'cart-empty';
            empty.textContent = 'No items added yet.';
            cartItemsEl.appendChild(empty);
            cartTotalEl.textContent = '$0.00';
            updateHeaderCart();
            updateCartEmailLink();
            return;
        }

        let total = 0;
        cart.forEach((item, index) => {
            const itemTotal = item.unitPrice * item.quantity;
            total += itemTotal;

            const card = document.createElement('div');
            card.className = 'cart-item';

            const header = document.createElement('div');
            header.className = 'cart-item-header';

            const title = document.createElement('div');
            title.className = 'cart-item-name';
            title.textContent = item.name;

            const price = document.createElement('div');
            price.className = 'cart-item-name';
            price.textContent = `$${itemTotal.toFixed(2)}`;

            header.appendChild(title);
            header.appendChild(price);

            const meta = document.createElement('div');
            meta.className = 'cart-item-meta';
            meta.textContent = `${item.model} | ${rateLabels[item.rateType]} | Qty ${item.quantity}`;

            const actions = document.createElement('div');
            actions.className = 'cart-item-actions';

            const unit = document.createElement('span');
            unit.textContent = `$${item.unitPrice.toFixed(2)} each`;

            const remove = document.createElement('button');
            remove.type = 'button';
            remove.className = 'cart-remove';
            remove.textContent = '🗑️ Remove';
            remove.addEventListener('click', () => {
                cart.splice(index, 1);
                saveCart(cart);
                renderCart();
                // Update Stripe button if present
                if (typeof updateStripeButton === 'function') {
                    updateStripeButton();
                }
            });

            actions.appendChild(unit);
            actions.appendChild(remove);

            card.appendChild(header);
            card.appendChild(meta);
            card.appendChild(actions);

            cartItemsEl.appendChild(card);
        });

        cartTotalEl.textContent = `$${total.toFixed(2)}`;
        updateHeaderCart();
        updateCartEmailLink();
    }

    function showCartMessage(message, type) {
        if (!cartMessageEl) {
            return;
        }

        cartMessageEl.textContent = message;
        cartMessageEl.classList.remove('success', 'error');
        if (type) {
            cartMessageEl.classList.add(type);
        }
    }

    function showPricingMessage(message, type) {
        if (!pricingMessageEl) {
            return;
        }

        pricingMessageEl.textContent = message;
        pricingMessageEl.classList.remove('success', 'error');
        if (type) {
            pricingMessageEl.classList.add(type);
        }
    }

    function loadCart() {
        try {
            const stored = JSON.parse(localStorage.getItem('pricingCartItems'));
            return Array.isArray(stored) ? stored : [];
        } catch (error) {
            return [];
        }
    }

    function saveCart(items) {
        localStorage.setItem('pricingCartItems', JSON.stringify(items));
        saveCheckoutSnapshot(items);
    }
}

// ============================================
// MESSAGE DISPLAY FUNCTIONS
// ============================================

function showFormMessage(message, type) {
    const messageDiv = document.getElementById('formMessage');
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.className = `form-message ${type}`;
        messageDiv.style.display = 'block';
        
        // Scroll to message
        messageDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // Hide after 5 seconds if success
        if (type === 'success') {
            setTimeout(() => {
                messageDiv.style.display = 'none';
            }, 5000);
        }
    }
}

function showBookingMessage(message, type) {
    const messageDiv = document.getElementById('formMessage');
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.className = `form-message ${type}`;
        messageDiv.style.display = 'block';
        
        // Scroll to message
        messageDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        
        // Hide after 5 seconds if success
        if (type === 'success') {
            setTimeout(() => {
                messageDiv.style.display = 'none';
            }, 5000);
        }
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
}

// Add active class to current page navigation
document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-menu a');
    
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
});

// ============================================
// ANALYTICS & TRACKING
// ============================================

// Log page views
function logPageView() {
    const pageData = {
        page: window.location.pathname,
        title: document.title,
        timestamp: new Date().toLocaleString(),
        userAgent: navigator.userAgent
    };
    console.log('Page View:', pageData);
    
    // Save to localStorage
    let pageViews = JSON.parse(localStorage.getItem('pageViews')) || [];
    pageViews.push(pageData);
    localStorage.setItem('pageViews', JSON.stringify(pageViews));
}

// Track link clicks
document.addEventListener('click', function(e) {
    const link = e.target.closest('a');
    if (link && (link.href.startsWith('http') || link.href.includes('@'))) {
        const clickData = {
            link: link.href,
            pageTitle: document.title,
            timestamp: new Date().toLocaleString()
        };
        console.log('External Link Click:', clickData);
    }
});

// Log page view on load
logPageView();

// ============================================
// FORM AUTO-FILL FROM PREVIOUS VISIT
// ============================================

function autoFillFormFromLocalStorage() {
    const savedData = localStorage.getItem('userInfo');
    if (savedData) {
        const data = JSON.parse(savedData);
        const nameField = document.getElementById('name') || document.getElementById('fullName');
        const emailField = document.getElementById('email');
        const phoneField = document.getElementById('phone');
        
        if (nameField) nameField.value = data.name || '';
        if (emailField) emailField.value = data.email || '';
        if (phoneField) phoneField.value = data.phone || '';
    }
}

// Save form data on blur (auto-save)
document.addEventListener('blur', function(e) {
    if (e.target.matches('input[type="text"], input[type="email"], input[type="tel"]')) {
        const nameField = document.getElementById('name') || document.getElementById('fullName');
        const emailField = document.getElementById('email');
        const phoneField = document.getElementById('phone');
        
        if (nameField && emailField && phoneField) {
            localStorage.setItem('userInfo', JSON.stringify({
                name: nameField.value,
                email: emailField.value,
                phone: phoneField.value
            }));
        }
    }
}, true);

// Auto-fill on page load
document.addEventListener('DOMContentLoaded', autoFillFormFromLocalStorage);

// ============================================
// EQUIPMENT PRICE CALCULATOR
// ============================================

function calculateRentalPrice() {
    const equipmentSelect = document.getElementById('equipmentType');
    const rentalDaysInput = document.getElementById('rentalDays');
    
    if (!equipmentSelect || !rentalDaysInput) return;
    
    const equipmentPrices = {
        'hospital-bed': 45,
        'wheelchair': 20,
        'walker': 10,
        'oxygen': 40,
        'monitor': 15,
        'bathroom': 20,
        'mobility': 15
    };
    
    equipmentSelect.addEventListener('change', updatePrice);
    rentalDaysInput.addEventListener('change', updatePrice);
    
    function updatePrice() {
        const equipment = equipmentSelect.value;
        const days = parseInt(rentalDaysInput.value) || 0;
        
        if (equipment && days > 0) {
            const basePrice = equipmentPrices[equipment] || 0;
            const estimatedCost = basePrice * days;
            
            console.log(`Estimated cost: ${formatCurrency(estimatedCost)}`);
        }
    }
}

// ============================================
// FLOATING CART FUNCTIONALITY
// ============================================

function initFloatingCart() {
    const floatingCart = document.getElementById('floatingCart');
    const floatingCartItems = document.getElementById('floatingCartItems');
    const floatingCartTotal = document.getElementById('floatingCartTotal');
    const closeBtn = document.getElementById('closeFloatingCart');
    const toggleBtn = document.getElementById('toggleFloatingCart');
    const showBtn = document.getElementById('showFloatingCart');

    if (!floatingCart) return;

    function updateFloatingCart() {
        const cart = getStoredCart();

        if (cart.length === 0) {
            floatingCartItems.innerHTML = '<div class="floating-cart-empty">Your cart is empty</div>';
            if (floatingCartTotal) floatingCartTotal.textContent = '$0.00';
            return;
        }

        let total = 0;
        floatingCartItems.innerHTML = cart.map((item, index) => {
            const quantity = Number(item.quantity || 0);
            const unitPrice = Number(item.unitPrice || 0);
            const itemTotal = unitPrice * quantity;
            total += itemTotal;

            return `
                <div class="floating-cart-item">
                    <div class="floating-cart-item-details">
                        <div class="floating-cart-item-name">${item.name}</div>
                        <div class="floating-cart-item-meta">${item.model}</div>
                        <div class="floating-cart-item-qty">Qty: ${quantity} × $${unitPrice.toFixed(2)}</div>
                    </div>
                    <div class="floating-cart-item-right">
                        <div class="floating-cart-item-price">$${itemTotal.toFixed(2)}</div>
                        <button class="floating-cart-remove" data-index="${index}">×</button>
                    </div>
                </div>
            `;
        }).join('');

        if (floatingCartTotal) floatingCartTotal.textContent = `$${total.toFixed(2)}`;

        // Add remove button listeners
        const removeButtons = floatingCartItems.querySelectorAll('.floating-cart-remove');
        removeButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                cart.splice(index, 1);
                localStorage.setItem('pricingCartItems', JSON.stringify(cart));
                updateFloatingCart();
                updateHeaderCart();
                // Update Stripe button if present
                if (typeof updateStripeButton === 'function') {
                    updateStripeButton();
                }
                // Trigger storage event for other components
                window.dispatchEvent(new Event('storage'));
            });
        });
    }

    // Close button
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            floatingCart.style.display = 'none';
            if (showBtn) showBtn.style.display = 'inline-block';
        });
    }

    // Toggle button
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function() {
            floatingCart.style.display = 'none';
            if (showBtn) showBtn.style.display = 'inline-block';
        });
    }

    // Show button (for mobile when hidden)
    if (showBtn) {
        showBtn.addEventListener('click', function() {
            floatingCart.style.display = 'flex';
            showBtn.style.display = 'none';
        });
    }

    // Initial render
    updateFloatingCart();

    // Hide cart by default on mobile to avoid covering actions
    if (window.innerWidth <= 900) {
        floatingCart.style.display = 'none';
        if (showBtn) showBtn.style.display = 'inline-block';
    }

    // Update when storage changes
    window.addEventListener('storage', function(event) {
        if (event.key === 'pricingCartItems') {
            updateFloatingCart();
        }
    });

    // Make floating cart draggable (desktop only)
    if (window.innerWidth > 900) {
        makeElementDraggable(floatingCart);
    }

    // Close cart on backdrop click (mobile)
    floatingCart.addEventListener('click', function(e) {
        // Only close if clicking the backdrop (the cart itself, not its children)
        if (e.target === floatingCart && window.innerWidth <= 900) {
            floatingCart.style.display = 'none';
            if (showBtn) showBtn.style.display = 'inline-block';
        }
    });

    // Swipe down to close on mobile
    let touchStartY = 0;
    let touchEndY = 0;
    
    const cartHeader = floatingCart.querySelector('.floating-cart-header');
    if (cartHeader) {
        cartHeader.addEventListener('touchstart', function(e) {
            touchStartY = e.touches[0].clientY;
        });

        cartHeader.addEventListener('touchmove', function(e) {
            touchEndY = e.touches[0].clientY;
            const diff = touchEndY - touchStartY;
            
            // Allow dragging down only
            if (diff > 0 && window.innerWidth <= 900) {
                floatingCart.style.transform = `translateY(${diff}px)`;
                floatingCart.style.transition = 'none';
            }
        });

        cartHeader.addEventListener('touchend', function() {
            const diff = touchEndY - touchStartY;
            floatingCart.style.transition = 'transform 0.3s ease-out';
            
            // Close if dragged down more than 100px
            if (diff > 100 && window.innerWidth <= 900) {
                floatingCart.style.transform = 'translateY(100%)';
                setTimeout(() => {
                    floatingCart.style.display = 'none';
                    floatingCart.style.transform = '';
                    if (showBtn) showBtn.style.display = 'inline-block';
                }, 300);
            } else {
                floatingCart.style.transform = '';
            }
            
            touchStartY = 0;
            touchEndY = 0;
        });
    }
}

// Make elements draggable
function makeElementDraggable(element) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    const header = element.querySelector('.floating-cart-header');
    if (header) {
        header.addEventListener('mousedown', dragMouseDown);
    } else {
        element.addEventListener('mousedown', dragMouseDown);
    }

    function dragMouseDown(e) {
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.addEventListener('mouseup', closeDragElement);
        document.addEventListener('mousemove', elementDrag);
    }

    function elementDrag(e) {
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        element.style.top = (element.offsetTop - pos2) + 'px';
        element.style.left = (element.offsetLeft - pos1) + 'px';
    }

    function closeDragElement() {
        document.removeEventListener('mouseup', closeDragElement);
        document.removeEventListener('mousemove', elementDrag);
    }
}

// ============================================
// CHECKOUT PAGE FUNCTIONALITY
// ============================================

function initCheckoutPage() {
    const checkoutCartItems = document.getElementById('checkoutCartItems');
    const checkoutEmptyCart = document.getElementById('checkoutEmptyCart');
    const checkoutSummary = document.getElementById('checkoutSummary');
    const checkoutSubtotal = document.getElementById('checkoutSubtotal');
    const checkoutTotal = document.getElementById('checkoutTotal');
    const proceedToStripe = document.getElementById('proceedToStripe') || document.getElementById('stripeCheckoutBtn');
    const checkoutEmailLink = document.getElementById('checkoutEmailLink');

    if (!checkoutCartItems) return;

    const cart = getStoredCart();
    const storedOnlyTotal = getStoredCheckoutTotal();

    // Show empty state or cart items
    if (cart.length === 0) {
        checkoutEmptyCart.style.display = 'block';
        if (checkoutSummary && storedOnlyTotal > 0) {
            if (checkoutSubtotal) checkoutSubtotal.textContent = `$${storedOnlyTotal.toFixed(2)}`;
            if (checkoutTotal) checkoutTotal.textContent = `$${storedOnlyTotal.toFixed(2)}`;
            checkoutSummary.style.display = 'block';
        } else if (checkoutSummary) {
            checkoutSummary.style.display = 'none';
        }
        if (proceedToStripe) proceedToStripe.style.display = 'none';
        return;
    }

    // Hide empty state
    checkoutEmptyCart.style.display = 'none';

    // Render cart items
    let total = 0;
    checkoutCartItems.innerHTML = cart.map((item, index) => {
        const quantity = Number(item.quantity || 0);
        const unitPrice = Number(item.unitPrice || 0);
        const itemTotal = unitPrice * quantity;
        total += itemTotal;

        return `
            <div class="cart-item">
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <p class="cart-item-meta">${item.model} • ${item.rateType}</p>
                    <p class="cart-item-price">$${unitPrice.toFixed(2)} × ${quantity}</p>
                </div>
                <div class="cart-item-total">
                    <strong>$${itemTotal.toFixed(2)}</strong>
                    <button class="cart-remove" data-index="${index}">🗑️ Remove</button>
                </div>
            </div>
        `;
    }).join('');

    // Add remove button listeners
    const removeButtons = checkoutCartItems.querySelectorAll('.cart-remove');
    removeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const index = parseInt(this.getAttribute('data-index'));
            cart.splice(index, 1);
            localStorage.setItem('pricingCartItems', JSON.stringify(cart));
            initCheckoutPage(); // Re-render
            updateHeaderCart();
            // Update Stripe button if present
            if (typeof updateStripeButton === 'function') {
                updateStripeButton();
            }
        });
    });

    // Update totals
    if (checkoutSubtotal) checkoutSubtotal.textContent = `$${total.toFixed(2)}`;
    if (checkoutTotal) checkoutTotal.textContent = `$${total.toFixed(2)}`;
    if (checkoutSummary) checkoutSummary.style.display = 'block';
    saveCheckoutSnapshot(cart);
    if (proceedToStripe) proceedToStripe.style.display = 'inline-flex';

    // Update email link
    if (checkoutEmailLink) {
        const lines = cart.map((item, index) => {
            const quantity = Number(item.quantity || 0);
            const unitPrice = Number(item.unitPrice || 0);
            const itemTotal = unitPrice * quantity;
            return `${index + 1}. ${item.name} ${item.model} | ${item.rateType} | Qty ${quantity} | $${itemTotal.toFixed(2)}`;
        });

        const subject = 'ComfortCare Discount Request';
        const body = [
            'Hello ComfortCare,',
            '',
            'Please review my cart for available discounts:',
            ...lines,
            '',
            `Total: $${total.toFixed(2)}`,
            '',
            'Name:',
            'Phone:',
            'Email:'
        ].join('\n');

        checkoutEmailLink.href = `mailto:accentgv@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }

    if (proceedToStripe) {
        bindDynamicStripeCheckout(proceedToStripe);
    }
}

// ============================================
// FLOATING STRIPE PANEL
// ============================================

function initFloatingStripePanel() {
    const stripePanel = document.getElementById('floatingStripePanel');
    const stripeBtn = document.getElementById('stripeCheckoutBtn');
    const closeBtn = document.getElementById('closeStripePanel');
    const stripeIframe = document.getElementById('stripeIframe');

    if (!stripePanel || !stripeBtn) return;

    bindDynamicStripeCheckout(stripeBtn);

    // Close Stripe panel
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            stripePanel.style.display = 'none';
            stripeIframe.src = ''; // Stop loading
        });
    }

    // Make panel draggable
    makeElementDraggable(stripePanel);

    // Close on ESC key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && stripePanel.style.display === 'flex') {
            stripePanel.style.display = 'none';
            stripeIframe.src = '';
        }
    });
}

// ============================================
// STRIPE BUTTON DISPLAY
// ============================================

function updateStripeButton() {
    const stripeBtn = document.getElementById('stripeCheckoutBtn');
    const stripeNotice = document.getElementById('stripeCartNotice');
    
    if (!stripeBtn) return;
    
    const cart = getStoredCart();
    
    if (cart.length === 0) {
        const storedOnlyTotal = getStoredCheckoutTotal();
        if (storedOnlyTotal > 0) {
            stripeBtn.style.display = 'block';
            stripeBtn.textContent = `💳 Proceed to Payment ($${storedOnlyTotal.toFixed(2)})`;
            if (stripeNotice) stripeNotice.style.display = 'none';
            return;
        }
        stripeBtn.style.display = 'none';
        if (stripeNotice) stripeNotice.style.display = 'block';
        return;
    }
    
    let total = 0;
    cart.forEach(item => {
        const quantity = Number(item.quantity || 0);
        const unitPrice = Number(item.unitPrice || 0);
        total += unitPrice * quantity;
    });

    saveCheckoutSnapshot(cart);
    
    stripeBtn.style.display = 'block';
    stripeBtn.textContent = `💳 Proceed to Payment ($${total.toFixed(2)})`;
    if (stripeNotice) stripeNotice.style.display = 'none';
}

// ============================================
// PAYMENT POPUP FUNCTIONALITY
// ============================================
// Removed - Pay buttons now link directly to pricing.html


// Initialize checkout page on load
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('checkoutCartItems')) {
        bindCheckoutStatusRetry();
        initCheckoutPage();
        updateCheckoutStatusBadge();
    }
    if (document.getElementById('floatingCart')) {
        initFloatingCart();
    }
    if (document.getElementById('floatingStripePanel')) {
        initFloatingStripePanel();
    }
    // Update Stripe button based on cart
    if (document.getElementById('stripeCheckoutBtn')) {
        updateStripeButton();
        // Update when cart changes
        window.addEventListener('storage', function(event) {
            if (event.key === 'pricingCartItems') {
                updateStripeButton();
            }
        });
    }
});
