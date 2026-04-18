// checkout.js: Stripe Checkout integration for Arron Advertising site
// Uses publishable key from ComfortCare reference (replace with your own for production)

const STRIPE_PUBLISHABLE_KEY = "pk_test_51SzHz1S1qX2Bbwlh..."; // TODO: Replace with your real publishable key

function getCartItems() {
    return JSON.parse(localStorage.getItem('cartItems')) || [];
}

function renderCheckoutCart() {
    const cart = getCartItems();
    const cartDiv = document.getElementById('checkout-cart-items');
    const totalDiv = document.getElementById('checkout-total');
    if (!cartDiv || !totalDiv) return;
    if (cart.length === 0) {
        cartDiv.innerHTML = '<p>Your cart is empty.</p>';
        totalDiv.textContent = '';
        document.getElementById('customer-info-form').style.display = 'none';
        return;
    }
    let total = 0;
    cartDiv.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.quantity;
        total += itemTotal;
        return `<div class="product-card">
            <h3>${item.name}</h3>
            <span>Price: $${item.price.toFixed(2)}</span><br>
            <span>Quantity: ${item.quantity}</span><br>
            <span>Subtotal: $${itemTotal.toFixed(2)}</span>
        </div>`;
    }).join('');
    totalDiv.textContent = `Total: $${total.toFixed(2)}`;
}

document.addEventListener('DOMContentLoaded', function() {
    renderCheckoutCart();
    const form = document.getElementById('customer-info-form');
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const name = document.getElementById('customer-name').value;
        const email = document.getElementById('customer-email').value;
        const street = document.getElementById('customer-street').value;
        const city = document.getElementById('customer-city').value;
        const state = document.getElementById('customer-state').value;
        const zip = document.getElementById('customer-zip').value;
        // Combine for display or send as needed
        const address = `${street}, ${city}, ${state} ${zip}`;
        const cart = getCartItems();
        if (cart.length === 0) {
            document.getElementById('stripe-error').textContent = 'Your cart is empty.';
            return;
        }
        // Stripe Checkout session creation (client-only demo)
        // In production, create the session on your server for security
        const stripe = Stripe(STRIPE_PUBLISHABLE_KEY);
        // Demo: redirect to Stripe with static test product
        // TODO: Replace with dynamic session creation via backend
        stripe.redirectToCheckout({
            lineItems: [
                // Example: Only first item, for demo
                { price: 'price_1N...', quantity: cart[0].quantity }
            ],
            mode: 'payment',
            customerEmail: email,
            successUrl: window.location.origin + '/success.html',
            cancelUrl: window.location.origin + '/checkout.html',
        }).then(function(result) {
            if (result.error) {
                document.getElementById('stripe-error').textContent = result.error.message;
            }
        });
    });
});
