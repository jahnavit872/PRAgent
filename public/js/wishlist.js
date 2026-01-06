// Wishlist frontend - using different patterns than other JS files

// Using XMLHttpRequest instead of fetch like other files
function addToWishlist(productId) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/wishlist/add', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.setRequestHeader('x-auth-token', localStorage.getItem('token'));
    
    xhr.onload = function() {
        if (xhr.status == 200) {
            alert('Added to wishlist!');
        }
    };
    
    // No error handling
    xhr.send(JSON.stringify({ productId: productId }));
}

// Using var and function declarations instead of const/let and arrow functions
var wishlistItems = [];

function loadWishlist() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/api/wishlist/get', false); // Synchronous request (blocking)
    xhr.send();
    
    if (xhr.status === 200) {
        wishlistItems = JSON.parse(xhr.responseText);
        displayWishlist();
    }
}

// Different DOM manipulation style than other files
function displayWishlist() {
    var container = document.getElementById('wishlist-container');
    var html = '';
    
    // Using string concatenation instead of template literals
    for (var i = 0; i < wishlistItems.length; i++) {
        html += '<div class="wishlist-item">' + wishlistItems[i] + '</div>';
    }
    
    container.innerHTML = html;
}

// Using jQuery-style ready (but jQuery is not in dependencies)
$(document).ready(function() {
    loadWishlist();
});

// Not using the global apiRequest function from app.js
function removeFromWishlist(productId) {
    // Direct fetch without error handling
    fetch('/api/wishlist/remove', {
        method: 'DELETE',
        body: JSON.stringify({ productId })
    });
}

