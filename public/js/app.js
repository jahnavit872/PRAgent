// Global app utilities
const API_URL = window.location.origin;

// Auth utilities
function getToken() {
    return localStorage.getItem('token');
}

function setToken(token) {
    localStorage.setItem('token', token);
}

function removeToken() {
    localStorage.removeItem('token');
}

function isLoggedIn() {
    return !!getToken();
}

// API request helper with auth
async function apiRequest(endpoint, options = {}) {
    const token = getToken();
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
    });

    const data = await response.json();
    
    if (!response.ok && response.status === 401) {
        // Token expired or invalid
        removeToken();
        updateNavbar();
        if (window.location.pathname !== '/login.html') {
            alert('Session expired. Please login again.');
            window.location.href = '/login.html';
        }
    }

    return data;
}

// Update navbar based on login status
function updateNavbar() {
    const loginLink = document.getElementById('login-link');
    const logoutLink = document.getElementById('logout-link');
    const ordersLink = document.getElementById('orders-link');

    if (isLoggedIn()) {
        if (loginLink) loginLink.style.display = 'none';
        if (logoutLink) logoutLink.style.display = 'inline';
        if (ordersLink) ordersLink.style.display = 'inline';
    } else {
        if (loginLink) loginLink.style.display = 'inline';
        if (logoutLink) logoutLink.style.display = 'none';
        if (ordersLink) ordersLink.style.display = 'none';
    }

    updateCartCount();
}

// Update cart count in navbar
async function updateCartCount() {
    const cartCountEl = document.getElementById('cart-count');
    if (!cartCountEl) return;

    if (!isLoggedIn()) {
        cartCountEl.textContent = '0';
        return;
    }

    try {
        const data = await apiRequest('/api/cart');
        if (data.success) {
            const count = data.cart.items.reduce((sum, item) => sum + item.quantity, 0);
            cartCountEl.textContent = count;
        }
    } catch (error) {
        console.error('Error updating cart count:', error);
    }
}

// Logout handler
function setupLogout() {
    const logoutLink = document.getElementById('logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            removeToken();
            alert('Logged out successfully');
            window.location.href = '/';
        });
    }
}

// Show alert message
function showAlert(message, type = 'success') {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    const container = document.querySelector('.container');
    if (container) {
        container.insertBefore(alert, container.firstChild);
        
        setTimeout(() => {
            alert.remove();
        }, 3000);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    updateNavbar();
    setupLogout();
});

