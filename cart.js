// Cart logic for multiple products, quantity, remove, and summary
const productImages = {
    'SPZTJK Juicer Cold-pressed Juicer': 'https://spztjkstore.com/cdn/shop/files/5df4dae1240fcc53526322531b5514fc.jpg?v=1741152723&width=360',
    'SPZTJK 50oz 10-in-1 Automatic Nut Milk Maker': 'https://spztjkstore.com/cdn/shop/files/2-10.jpg?v=1750234733&width=360',
    'SPZTJK 1500W Stainless Steel Electric Deep Fryer': 'https://spztjkstore.com/cdn/shop/files/1-4.jpg?v=1750235337&width=360',
    'Cold Press Juicer, Celiberry Slow Masticating Juicer': 'https://spztjkstore.com/cdn/shop/files/3_d66b428f-0b27-4ddf-9db0-69243267ae58.jpg?v=1750235914&width=360',
    'SPZTJK 28000RPM Pro Blender': 'https://spztjkstore.com/cdn/shop/files/1-3_21ac448a-eb71-4877-aea5-63f365dc0d20.jpg?v=1774942506&width=360',
    '12-Cup Food Processor - 600W - 11 Speeds': 'https://spztjkstore.com/cdn/shop/files/d7b6d8275a978f3960e31ff6496eac72.jpg?v=1775625809&width=360',
    'SPZTJK Food Processors, 5-Speed Electric Food Chopper': 'https://spztjkstore.com/cdn/shop/files/2_63927e40-03a2-46d6-8f7f-8b8e332d0a5d.jpg?v=1775186305&width=360',
    'SPZTJK 2-in-1 Blender': 'https://spztjkstore.com/cdn/shop/files/1-1_f007c56d-92ca-4c8e-86c2-3d25f8c39d9d.jpg?v=1776405976&width=360',
    'SPZK Slushie Machine': 'https://spztjkstore.com/cdn/shop/files/1-1_00ab6601-1214-469a-8a72-b756623f1e1a.jpg?v=1776407044&width=360'
};

function addToCart(name, price, btn) {
    const qtyInput = btn.previousElementSibling;
    const quantity = parseInt(qtyInput.value, 10) || 1;
    let cart = JSON.parse(localStorage.getItem('cartItems')) || [];
    const existing = cart.find(item => item.name === name);
    if (existing) {
        existing.quantity += quantity;
    } else {
        cart.push({ name, price, quantity });
    }
    localStorage.setItem('cartItems', JSON.stringify(cart));
    window.location.href = 'cart.html';
}

function removeFromCart(index) {
    let cart = JSON.parse(localStorage.getItem('cartItems')) || [];
    cart.splice(index, 1);
    localStorage.setItem('cartItems', JSON.stringify(cart));
    renderCart();
}

function updateQuantity(index, value) {
    let cart = JSON.parse(localStorage.getItem('cartItems')) || [];
    cart[index].quantity = Math.max(1, parseInt(value, 10) || 1);
    localStorage.setItem('cartItems', JSON.stringify(cart));
    renderCart();
}

function renderCart() {
    const cart = JSON.parse(localStorage.getItem('cartItems')) || [];
    const cartDiv = document.getElementById('cart-items');
    if (!cartDiv) return;
    if (cart.length === 0) {
        cartDiv.innerHTML = '<p>Your cart is empty.</p>';
        return;
    }
    let total = 0;
    cartDiv.innerHTML = cart.map((item, i) => {
        const itemTotal = (item.price * item.quantity);
        total += itemTotal;
        const img = productImages[item.name] ? `<img src="${productImages[item.name]}" alt="${item.name}" style="max-width:120px;display:block;margin:0 auto 1rem auto;">` : '';
        return `<div class="product-card">
            ${img}
            <h2>${item.name}</h2>
            <span class="price">$${item.price.toFixed(2)}</span>
            <input type="number" min="1" value="${item.quantity}" onchange="updateQuantity(${i}, this.value)" style="width:50px; margin:0 10px;">
            <button onclick="removeFromCart(${i})" style="background:#f66;color:#fff;border:none;padding:0.3rem 1rem;border-radius:4px;">Remove</button>
            <div style="margin-top:0.5rem;font-size:0.95em;">Subtotal: $${itemTotal.toFixed(2)}</div>
        </div>`;
    }).join('') + `<div style="margin-top:2rem;font-size:1.2em;font-weight:bold;">Total: $${total.toFixed(2)}</div>
    <a href="checkout.html" class="btn-primary" style="margin-top:1.5rem;display:inline-block;text-align:center;">Proceed to Checkout</a>`;
}

// Only run on cart.html
if (window.location.pathname.endsWith('cart.html')) {
    renderCart();
    window.removeFromCart = removeFromCart;
    window.updateQuantity = updateQuantity;
}