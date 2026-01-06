// Products page functionality
let allProducts = [];

async function loadProducts() {
    try {
        const data = await apiRequest('/api/products');
        if (data.success) {
            allProducts = data.products;
            displayProducts(allProducts);
        }
    } catch (error) {
        console.error('Error loading products:', error);
        document.getElementById('products-container').innerHTML = 
            '<div class="empty-state"><h3>Error loading products</h3></div>';
    }
}

function displayProducts(products) {
    const container = document.getElementById('products-container');
    
    if (products.length === 0) {
        container.innerHTML = '<div class="empty-state"><h3>No products found</h3></div>';
        return;
    }

    container.innerHTML = products.map(product => `
        <div class="product-card">
            <img src="${product.image}" alt="${product.name}">
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <p class="price">$${product.price.toFixed(2)}</p>
            <p style="padding: 0 1rem; color: var(--text-secondary);">
                ${product.stock > 0 ? `In Stock: ${product.stock}` : 'Out of Stock'}
            </p>
            <button 
                class="btn btn-primary" 
                onclick="addToCart('${product.id}')"
                ${!isLoggedIn() || product.stock === 0 ? 'disabled' : ''}
            >
                ${!isLoggedIn() ? 'Login to Buy' : product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
        </div>
    `).join('');
}

async function addToCart(productId) {
    if (!isLoggedIn()) {
        alert('Please login to add items to cart');
        window.location.href = '/login.html';
        return;
    }

    try {
        const data = await apiRequest('/api/cart/add', {
            method: 'POST',
            body: JSON.stringify({ productId, quantity: 1 })
        });

        if (data.success) {
            showAlert('Item added to cart!', 'success');
            updateCartCount();
        } else {
            showAlert(data.message || 'Error adding to cart', 'error');
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        showAlert('Error adding to cart', 'error');
    }
}

// Search functionality
function setupSearch() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filtered = allProducts.filter(p => 
                p.name.toLowerCase().includes(query) ||
                p.description.toLowerCase().includes(query) ||
                p.category.toLowerCase().includes(query)
            );
            displayProducts(filtered);
        });
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    setupSearch();
});

