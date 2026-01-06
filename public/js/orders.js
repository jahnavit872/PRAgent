// Orders page functionality

async function loadOrders() {
    if (!isLoggedIn()) {
        window.location.href = '/login.html';
        return;
    }

    try {
        const data = await apiRequest('/api/orders');
        if (data.success) {
            displayOrders(data.orders);
        }
    } catch (error) {
        console.error('Error loading orders:', error);
        document.getElementById('orders-container').innerHTML = 
            '<div class="empty-state"><h3>Error loading orders</h3></div>';
    }
}

function displayOrders(orders) {
    const container = document.getElementById('orders-container');

    if (orders.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>No orders yet</h3>
                <p>Start shopping to create your first order!</p>
                <a href="/products.html" class="btn btn-primary">Shop Now</a>
            </div>
        `;
        return;
    }

    // Sort orders by date (newest first)
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    container.innerHTML = orders.map(order => {
        const date = new Date(order.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
            <div class="order-card">
                <div class="order-header">
                    <div>
                        <h3>Order #${order.id}</h3>
                        <p style="color: var(--text-secondary);">${date}</p>
                    </div>
                    <span class="order-status ${order.status}">${order.status.toUpperCase()}</span>
                </div>
                
                <div class="order-items">
                    ${order.items.map(item => `
                        <div class="order-item">
                            <span>${item.name} x ${item.quantity}</span>
                            <span>$${item.subtotal.toFixed(2)}</span>
                        </div>
                    `).join('')}
                </div>
                
                <div class="order-total">
                    Total: $${order.total.toFixed(2)}
                </div>
                
                <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border-color);">
                    <p><strong>Shipping Address:</strong></p>
                    <p style="color: var(--text-secondary);">${order.shippingAddress}</p>
                    <p style="margin-top: 0.5rem;"><strong>Payment Method:</strong> ${formatPaymentMethod(order.paymentMethod)}</p>
                </div>
            </div>
        `;
    }).join('');
}

function formatPaymentMethod(method) {
    return method.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadOrders();
});

