// Account page functionality
let currentUser = null;
let editMode = false;

async function loadAccountData() {
    if (!isLoggedIn()) {
        window.location.href = '/login.html';
        return;
    }

    try {
        // Load user info
        const userData = await apiRequest('/api/auth/me');
        if (userData.success) {
            currentUser = userData.user;
            displayUserInfo(userData.user);
        }

        // Load statistics
        await loadAccountStats();

        // Load recent orders
        await loadRecentOrders();
    } catch (error) {
        console.error('Error loading account data:', error);
        showAlert('Error loading account data', 'error');
    }
}

function displayUserInfo(user) {
    document.getElementById('user-name').textContent = user.name;
    document.getElementById('user-email').textContent = user.email;
    
    // Set initials in avatar
    const initials = user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    document.getElementById('user-initials').textContent = initials;

    // Set joined date (you could add this to user data)
    const joined = new Date().getFullYear();
    document.getElementById('user-joined').textContent = joined;
}

async function loadAccountStats() {
    try {
        // Get orders
        const ordersData = await apiRequest('/api/orders');
        const orders = ordersData.success ? ordersData.orders : [];

        // Get cart
        const cartData = await apiRequest('/api/cart');
        const cart = cartData.success ? cartData.cart : { items: [] };

        // Calculate statistics
        const totalOrders = orders.length;
        const totalSpent = orders.reduce((sum, order) => sum + order.total, 0);
        const cartItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        const pendingOrders = orders.filter(o => o.status === 'pending').length;

        // Display stats
        document.getElementById('total-orders').textContent = totalOrders;
        document.getElementById('total-spent').textContent = `$${totalSpent.toFixed(2)}`;
        document.getElementById('cart-items').textContent = cartItems;
        document.getElementById('pending-orders').textContent = pendingOrders;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadRecentOrders() {
    try {
        const data = await apiRequest('/api/orders');
        if (data.success) {
            const recentOrders = data.orders
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 3);

            displayRecentOrders(recentOrders);
        }
    } catch (error) {
        console.error('Error loading recent orders:', error);
    }
}

function displayRecentOrders(orders) {
    const container = document.getElementById('recent-orders-container');

    if (orders.length === 0) {
        container.innerHTML = '<p class="text-muted">No orders yet. Start shopping!</p>';
        return;
    }

    container.innerHTML = orders.map(order => {
        const date = new Date(order.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        return `
            <div class="recent-order-item">
                <div class="recent-order-info">
                    <strong>Order #${order.id.substring(6, 16)}</strong>
                    <span class="order-status ${order.status}">${order.status.toUpperCase()}</span>
                </div>
                <div class="recent-order-details">
                    <span>${date}</span>
                    <span class="order-total">$${order.total.toFixed(2)}</span>
                </div>
            </div>
        `;
    }).join('');
}

function toggleEditMode() {
    editMode = !editMode;
    const editSection = document.getElementById('edit-profile-section');
    
    if (editMode) {
        // Show edit form and populate with current data
        document.getElementById('edit-name').value = currentUser.name;
        document.getElementById('edit-email').value = currentUser.email;
        document.getElementById('edit-password').value = '';
        editSection.style.display = 'block';
        editSection.scrollIntoView({ behavior: 'smooth' });
    } else {
        // Hide edit form
        editSection.style.display = 'none';
    }
}

async function handleProfileUpdate(e) {
    e.preventDefault();

    const name = document.getElementById('edit-name').value;
    const email = document.getElementById('edit-email').value;
    const password = document.getElementById('edit-password').value;

    try {
        const updateData = { name, email };
        if (password) {
            updateData.password = password;
        }

        // Note: You would need to implement a PUT /api/auth/profile endpoint
        // For now, we'll show a message
        showAlert('Profile update feature coming soon! This would update your profile in a real implementation.', 'success');
        toggleEditMode();

        // In a real implementation, you would do:
        // const data = await apiRequest('/api/auth/profile', {
        //     method: 'PUT',
        //     body: JSON.stringify(updateData)
        // });
        
        // if (data.success) {
        //     currentUser = data.user;
        //     displayUserInfo(data.user);
        //     showAlert('Profile updated successfully!', 'success');
        //     toggleEditMode();
        // } else {
        //     showAlert(data.message || 'Error updating profile', 'error');
        // }
    } catch (error) {
        console.error('Error updating profile:', error);
        showAlert('Error updating profile', 'error');
    }
}

function handleLogout(e) {
    e.preventDefault();
    if (confirm('Are you sure you want to logout?')) {
        removeToken();
        showAlert('Logged out successfully', 'success');
        setTimeout(() => {
            window.location.href = '/';
        }, 1000);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadAccountData();
    
    const editForm = document.getElementById('edit-profile-form');
    if (editForm) {
        editForm.addEventListener('submit', handleProfileUpdate);
    }
});

