// Cart page functionality
let cart = null;

async function loadCart() {
    if (!isLoggedIn()) {
        window.location.href = '/login.html';
        return;
    }

    try {
        const data = await apiRequest('/api/cart');
        if (data.success) {
            cart = data.cart;
            displayCart();
        }
    } catch (error) {
        console.error('Error loading cart:', error);
        document.getElementById('cart-container').innerHTML = 
            '<div class="empty-state"><h3>Error loading cart</h3></div>';
    }
}

function displayCart() {
    const container = document.getElementById('cart-container');
    const summary = document.getElementById('cart-summary');

    if (!cart || cart.items.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>Your cart is empty</h3>
                <p>Add some products to get started!</p>
                <a href="/products.html" class="btn btn-primary">Shop Now</a>
            </div>
        `;
        summary.style.display = 'none';
        return;
    }

    // Display cart items
    container.innerHTML = cart.items.map(item => {
        if (!item.product) return '';
        
        return `
            <div class="cart-item">
                <img src="${item.product.image}" alt="${item.product.name}">
                <div class="cart-item-details">
                    <h3>${item.product.name}</h3>
                    <p>$${item.product.price.toFixed(2)} each</p>
                    <p>Subtotal: $${(item.product.price * item.quantity).toFixed(2)}</p>
                </div>
                <div class="cart-item-actions">
                    <input 
                        type="number" 
                        class="quantity-input" 
                        value="${item.quantity}" 
                        min="1" 
                        max="${item.product.stock}"
                        onchange="updateQuantity('${item.productId}', this.value)"
                    >
                    <button class="btn btn-danger" onclick="removeFromCart('${item.productId}')">Remove</button>
                </div>
            </div>
        `;
    }).join('');

    // Calculate and display summary
    const subtotal = cart.items.reduce((sum, item) => {
        return item.product ? sum + (item.product.price * item.quantity) : sum;
    }, 0);
    const shipping = 10.00;
    const total = subtotal + shipping;

    document.getElementById('cart-subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('cart-total').textContent = `$${total.toFixed(2)}`;
    summary.style.display = 'block';
}

async function updateQuantity(productId, quantity) {
    try {
        const data = await apiRequest('/api/cart/update', {
            method: 'PUT',
            body: JSON.stringify({ productId, quantity: parseInt(quantity) })
        });

        if (data.success) {
            await loadCart();
            updateCartCount();
        } else {
            showAlert(data.message || 'Error updating cart', 'error');
        }
    } catch (error) {
        console.error('Error updating quantity:', error);
        showAlert('Error updating cart', 'error');
    }
}

async function removeFromCart(productId) {
    if (!confirm('Remove this item from cart?')) return;

    try {
        const data = await apiRequest(`/api/cart/remove/${productId}`, {
            method: 'DELETE'
        });

        if (data.success) {
            showAlert('Item removed from cart', 'success');
            await loadCart();
            updateCartCount();
        } else {
            showAlert(data.message || 'Error removing item', 'error');
        }
    } catch (error) {
        console.error('Error removing from cart:', error);
        showAlert('Error removing item', 'error');
    }
}

// Checkout modal
function setupCheckout() {
    const checkoutBtn = document.getElementById('checkout-btn');
    const modal = document.getElementById('checkout-modal');
    const closeBtn = document.querySelector('.close');
    const checkoutForm = document.getElementById('checkout-form');

    checkoutBtn?.addEventListener('click', () => {
        modal.style.display = 'block';
    });

    closeBtn?.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    checkoutForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        await placeOrder();
    });
}

async function placeOrder() {
    const shippingAddress = document.getElementById('shipping-address').value;
    const paymentMethod = document.getElementById('payment-method').value;

    try {
        const data = await apiRequest('/api/orders', {
            method: 'POST',
            body: JSON.stringify({ shippingAddress, paymentMethod })
        });

        if (data.success) {
            showAlert('Order placed successfully!', 'success');
            document.getElementById('checkout-modal').style.display = 'none';
            setTimeout(() => {
                window.location.href = '/orders.html';
            }, 1500);
        } else {
            showAlert(data.message || 'Error placing order', 'error');
        }
    } catch (error) {
        console.error('Error placing order:', error);
        showAlert('Error placing order', 'error');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadCart();
    setupCheckout();
});

