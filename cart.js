// GrowthLock Cart Logic
// Handles add to cart, view cart, and send cart to admin

const CART_KEY = 'growthlock_cart';
const ADMIN_EMAIL = 'kenamadeit@gmail.com'; // Change if needed

function getCart() {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
}

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function addToCart(product) {
    const cart = getCart();
    cart.push(product);
    saveCart(cart);
    showToast('🛒 Added to cart!');
    renderCartIcon();
}

function removeFromCart(index) {
    const cart = getCart();
    cart.splice(index, 1);
    saveCart(cart);
    renderCartIcon();
    renderCartModal();
}

function clearCart() {
    localStorage.removeItem(CART_KEY);
    renderCartIcon();
    renderCartModal();
}

function renderCartIcon() {
    let cart = getCart();
    let icon = document.getElementById('cart-icon');
    if (!icon) return;
    let totalQty = cart.reduce((sum, item) => sum + (item.qty || 1), 0);
    let totalPrice = cart.reduce((sum, item) => sum + ((item.price || 0) * (item.qty || 1)), 0);
    icon.textContent = `🛒 ${totalQty} | ₵${totalPrice}`;
}

function renderCartModal() {
    let cart = getCart();
    let modal = document.getElementById('cart-modal');
    if (!modal) return;
    if (cart.length === 0) {
        modal.innerHTML = '<div style="padding:20px;text-align:center;">Your cart is empty.</div>';
        return;
    }
    modal.innerHTML = `<div style="padding:20px;">
        <h3 style="margin-bottom:10px;">Your Cart</h3>
        <ul style="list-style:none;padding:0;">
            ${cart.map((item,i) => `<li style='margin-bottom:10px;'>
                <strong>${item.title}</strong> <span style='color:#00d4ff;font-weight:700;'>₵${item.price}</span>
                <button onclick='removeFromCart(${i})' style='margin-left:10px;background:#ff6464;color:#fff;border:none;border-radius:6px;padding:4px 8px;cursor:pointer;'>Remove</button>
            </li>`).join('')}
        </ul>
        <button onclick='sendCartToAdmin()' style='margin-top:15px;background:#00d4ff;color:#fff;border:none;border-radius:8px;padding:10px 18px;font-weight:700;cursor:pointer;'>Proceed & Send Cart</button>
        <button onclick='clearCart()' style='margin-top:10px;background:#eee;color:#333;border:none;border-radius:8px;padding:8px 16px;font-weight:600;cursor:pointer;'>Clear Cart</button>
    </div>`;
}

function showCartModal() {
    let modal = document.getElementById('cart-modal');
    if (!modal) return;
    modal.style.display = 'block';
}

function hideCartModal() {
    let modal = document.getElementById('cart-modal');
    if (!modal) return;
    modal.style.display = 'none';
}

function sendCartToAdmin() {
    let cart = getCart();
    if (cart.length === 0) {
        showToast('Your cart is empty!');
        return;
    }
    // Compose message
    let message = 'New Cart Order from GrowthLock:\n';
    cart.forEach((item,i) => {
        message += `${i+1}. ${item.title} - ₵${item.price}\n`;
    });
    message += '\nPlease contact me to complete my order.';
    // Send via mailto (can be replaced with EmailJS or backend)
    let mailto = `mailto:${ADMIN_EMAIL}?subject=GrowthLock Cart Order&body=${encodeURIComponent(message)}`;
    window.location.href = mailto;
    showToast('Cart forwarded to admin!');
    clearCart();
}

document.addEventListener('DOMContentLoaded', () => {
    renderCartIcon();
    // Cart modal close handler
    let modal = document.getElementById('cart-modal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) hideCartModal();
        });
    }
});
