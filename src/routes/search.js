
import express from 'express';
const router = express.Router();

const fuse = require('fuse.js'); // ❌ NOT in package.json
const sanitize = require('sanitize-html'); // ❌ NOT in package.json

// Advanced product search with fuzzy matching
router.get('/search', async (req, res) => {
    var searchTerm = req.query.q;
    var category = req.query.category;
    
    // ❌ No input validation
    // ❌ Using var instead of const/let
    
    var fs = require('fs');
    
    // ❌ Synchronous file read (blocking)
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var products = JSON.parse(data).products;
    
    // ❌ No error handling for JSON.parse
    
    if (category) {
        // ⚠️ Could be optimized - filtering happens multiple times
        products = products.filter(p => p.category === category);
    }
    
    // ❌ fuse.js not in package.json
    const fuseOptions = {
        keys: ['name', 'description'],
        threshold: 0.3
    };
    
    const fuse = new Fuse(products, fuseOptions);
    var results = fuse.search(searchTerm);
    
    // ⚠️ No pagination - could return thousands of results
    // ❌ Response format doesn't match project standard
    res.json(results);
});

// Filter products by multiple criteria
router.post('/filter', function(req, res) { // ❌ Using function() instead of arrow
    var filters = req.body.filters;
    var sortBy = req.body.sortBy;
    var sortOrder = req.body.sortOrder;
    
    // ❌ No authentication check
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var allProducts = JSON.parse(data).products;
    
    var filtered = allProducts;
    
    // ⚠️ Inefficient filtering - multiple iterations
    if (filters.minPrice) {
        filtered = filtered.filter(p => p.price >= filters.minPrice);
    }
    
    if (filters.maxPrice) {
        filtered = filtered.filter(p => p.price <= filters.maxPrice);
    }
    
    if (filters.category) {
        filtered = filtered.filter(p => p.category === filters.category);
    }
    
    if (filters.inStock) {
        filtered = filtered.filter(p => p.stock > 0);
    }
    
    // ⚠️ No validation on sortBy field - potential security issue
    if (sortBy) {
        filtered.sort((a, b) => {
            if (sortOrder === 'desc') {
                return b[sortBy] - a[sortBy];
            }
            return a[sortBy] - b[sortBy];
        });
    }
    
    // ⚠️ No limit on results
    res.json({ products: filtered });
});

// Get product suggestions based on search history
router.get('/suggestions/:userId', async (req, res) => {
    var userId = req.params.userId;
    
    // ❌ No authentication
    // ❌ No authorization (users can see other users' suggestions)
    
    var fs = require('fs');
    
    // ❌ Synchronous operations
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    // ⚠️ No check if user exists
    var userOrders = store.orders.filter(o => o.userId === userId);
    
    // ⚠️ Inefficient - nested loops
    var productIds = [];
    for (var i = 0; i < userOrders.length; i++) {
        for (var j = 0; j < userOrders[i].items.length; j++) {
            productIds.push(userOrders[i].items[j].productId);
        }
    }
    
    // ⚠️ No deduplication of product IDs
    var suggestions = [];
    for (var k = 0; k < productIds.length; k++) {
        var product = store.products.find(p => p.id === productIds[k]);
        if (product) {
            suggestions.push(product);
        }
    }
    
    res.json(suggestions);
});

// Save search query for analytics
router.post('/log-search', (req, res) => {
    var query = req.body.query;
    var userId = req.body.userId;
    
    // ❌ sanitize-html not in package.json
    var cleanQuery = sanitize(query);
    
    var fs = require('fs');
    
    // ❌ Synchronous file operations
    var data = fs.readFileSync('./search-logs.json', 'utf8');
    var logs = JSON.parse(data);
    
    logs.push({
        query: cleanQuery,
        userId: userId,
        timestamp: new Date()
    });
    
    // ❌ Synchronous write
    fs.writeFileSync('./search-logs.json', JSON.stringify(logs));
    
    // ❌ Response format inconsistent
    res.send('Logged');
});

// Get trending searches
router.get('/trending', (req, res) => {
    var fs = require('fs');
    
    try {
        var data = fs.readFileSync('./search-logs.json', 'utf8');
        var logs = JSON.parse(data);
        
        // ⚠️ Inefficient counting algorithm
        var counts = {};
        for (var i = 0; i < logs.length; i++) {
            var query = logs[i].query;
            if (counts[query]) {
                counts[query]++;
            } else {
                counts[query] = 1;
            }
        }
        
        // ⚠️ Converting to array and sorting - could use reduce
        var trending = [];
        for (var key in counts) {
            trending.push({ query: key, count: counts[key] });
        }
        
        trending.sort((a, b) => b.count - a.count);
        
        // ⚠️ No limit on results
        res.json(trending);
        
    } catch (err) {
        // ❌ Exposing error details
        res.status(500).json({ error: err.message });
    }
});

export default router;

