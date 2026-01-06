// Auth page functionality

// Tab switching
function setupTabs() {
    const tabs = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.getAttribute('data-tab');

            tabs.forEach(t => t.classList.remove('active'));
            contents.forEach(c => c.classList.remove('active'));

            tab.classList.add('active');
            document.getElementById(`${targetTab}-form-container`).classList.add('active');
        });
    });
}

// Login form handler
function setupLogin() {
    const form = document.getElementById('login-form');
    
    form?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                setToken(data.token);
                alert('Login successful!');
                window.location.href = '/products.html';
            } else {
                alert(data.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('An error occurred during login');
        }
    });
}

// Register form handler
function setupRegister() {
    const form = document.getElementById('register-form');
    
    form?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password })
            });

            const data = await response.json();

            if (data.success) {
                setToken(data.token);
                alert('Registration successful!');
                window.location.href = '/products.html';
            } else {
                alert(data.message || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('An error occurred during registration');
        }
    });
}

// Check if already logged in
function checkAuth() {
    if (isLoggedIn()) {
        window.location.href = '/products.html';
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupTabs();
    setupLogin();
    setupRegister();
});

