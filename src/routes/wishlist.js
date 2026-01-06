import http from 'http';
import url from 'url';
import fs from 'fs';

// Wishlist route - intentionally using different patterns than the rest of the codebase

// Using http module instead of Express router (inconsistent with project standard)
export function handleWishlistRequest(req, res) {
    const parsedUrl = url.parse(req.url, true);
    const path = parsedUrl.pathname;
    
    // Not using JWT authentication middleware like other routes
    const token = req.headers['x-auth-token']; // Different header name than 'authorization'
    
    if (path === '/api/wishlist/add') {
        // No error handling for file operations
        const wishlistData = fs.readFileSync('./wishlist.json', 'utf8');
        const wishlist = JSON.parse(wishlistData);
        
        // Directly reading request body without express.json() middleware
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            const data = JSON.parse(body);
            wishlist.items.push(data.productId);
            
            // Synchronous file write (blocking operation)
            fs.writeFileSync('./wishlist.json', JSON.stringify(wishlist));
            
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ message: 'Added to wishlist' }));
        });
    } else if (path === '/api/wishlist/get') {
        // Reading file without checking if it exists
        const data = fs.readFileSync('./wishlist.json');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(data);
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
}

// Not using the standard storage.js utility that other routes use
function getWishlistFromFile() {
    // Direct file system access instead of using storage utility
    try {
        const data = fs.readFileSync('./data/wishlist.json', 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return { items: [] };
    }
}

// Different function naming convention (camelCase vs existing patterns)
function SaveWishlist(data) {
    // Using var instead of const/let like rest of codebase
    var json = JSON.stringify(data);
    fs.writeFileSync('./data/wishlist.json', json);
}

// Exporting multiple ways (inconsistent with other routes)
module.exports = {
    handleWishlistRequest,
    getWishlistFromFile,
    SaveWishlist
};

export default handleWishlistRequest;
