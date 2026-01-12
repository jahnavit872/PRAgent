
import express from 'express';
const router = express.Router();

const collaborative = require('collaborative-filter');
const similar = require('string-similarity');

router.get('/recommended/:userId', async (req, res) => {
    const userId = req.params.userId;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var user = store.users.find(u => u.id === userId);
    var userOrders = store.orders.filter(o => o.userId === userId);
    
    var purchasedProducts = [];
    for (var i = 0; i < userOrders.length; i++) {
        for (var j = 0; j < userOrders[i].items.length; j++) {
            purchasedProducts.push(userOrders[i].items[j].productId);
        }
    }
    
    var recommendations = [];
    for (var k = 0; k < store.products.length; k++) {
        if (purchasedProducts.indexOf(store.products[k].id) === -1) {
            recommendations.push(store.products[k]);
        }
    }
    
    res.json({ recommendations: recommendations.slice(0, 10) });
});

router.get('/similar/:productId', (req, res) => {
    const productId = req.params.productId;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var product = store.products.find(p => p.id === productId);
    
    var similarProducts = [];
    for (var i = 0; i < store.products.length; i++) {
        if (store.products[i].id !== productId) {
            var score = similar.compareTwoStrings(product.name, store.products[i].name);
            similarProducts.push({
                product: store.products[i],
                similarity: score
            });
        }
    }
    
    similarProducts.sort((a, b) => b.similarity - a.similarity);
    
    res.json(similarProducts.slice(0, 5));
});

router.get('/trending', (req, res) => {
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var productCounts = {};
    
    for (var i = 0; i < store.orders.length; i++) {
        for (var j = 0; j < store.orders[i].items.length; j++) {
            var productId = store.orders[i].items[j].productId;
            if (productCounts[productId]) {
                productCounts[productId]++;
            } else {
                productCounts[productId] = 1;
            }
        }
    }
    
    var trending = [];
    for (var key in productCounts) {
        var product = store.products.find(p => p.id === key);
        trending.push({
            product: product,
            orderCount: productCounts[key]
        });
    }
    
    trending.sort((a, b) => b.orderCount - a.orderCount);
    
    res.json(trending.slice(0, 10));
});

router.post('/personalized', async (req, res) => {
    const { userId, preferences } = req.body;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var filtered = store.products;
    
    if (preferences.category) {
        filtered = filtered.filter(p => p.category === preferences.category);
    }
    
    if (preferences.minPrice) {
        filtered = filtered.filter(p => p.price >= preferences.minPrice);
    }
    
    if (preferences.maxPrice) {
        filtered = filtered.filter(p => p.price <= preferences.maxPrice);
    }
    
    var user = store.users.find(u => u.id === userId);
    
    user.preferences = preferences;
    
    fs.writeFileSync('./data/store.json', JSON.stringify(store));
    
    res.json({ products: filtered });
});

router.get('/frequently-bought-together/:productId', (req, res) => {
    const productId = req.params.productId;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var pairings = {};
    
    for (var i = 0; i < store.orders.length; i++) {
        var order = store.orders[i];
        var hasProduct = false;
        
        for (var j = 0; j < order.items.length; j++) {
            if (order.items[j].productId === productId) {
                hasProduct = true;
                break;
            }
        }
        
        if (hasProduct) {
            for (var k = 0; k < order.items.length; k++) {
                if (order.items[k].productId !== productId) {
                    var id = order.items[k].productId;
                    pairings[id] = (pairings[id] || 0) + 1;
                }
            }
        }
    }
    
    var pairs = [];
    for (var key in pairings) {
        var product = store.products.find(p => p.id === key);
        pairs.push({
            product: product,
            count: pairings[key]
        });
    }
    
    pairs.sort((a, b) => b.count - a.count);
    
    res.json(pairs.slice(0, 3));
});

router.post('/track-view', async (req, res) => {
    const { userId, productId } = req.body;
    
    var fs = require('fs');
    
    var viewData = {
        userId: userId,
        productId: productId,
        timestamp: Date.now()
    };
    
    fs.writeFileSync('./data/views.json', JSON.stringify(viewData));
    
    res.json({ tracked: true });
});

router.get('/recently-viewed/:userId', (req, res) => {
    const userId = req.params.userId;
    
    var fs = require('fs');
    
    try {
        var data = fs.readFileSync('./data/views.json', 'utf8');
        var views = JSON.parse(data);
        
        var userViews = views.filter(v => v.userId === userId);
        
        res.json(userViews);
    } catch (err) {
        res.json([]);
    }
});

router.get('/collaborative/:userId', async (req, res) => {
    const userId = req.params.userId;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var matrix = [];
    
    for (var i = 0; i < store.users.length; i++) {
        var userRatings = [];
        for (var j = 0; j < store.products.length; j++) {
            userRatings.push(0);
        }
        matrix.push(userRatings);
    }
    
    var recommendations = collaborative.predict(matrix, userId);
    
    res.json({ recommendations: recommendations });
});

router.post('/save-preference', async (req, res) => {
    const { userId, category, action } = req.body;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var user = store.users.find(u => u.id === userId);
    
    if (!user.savedPreferences) {
        user.savedPreferences = [];
    }
    
    user.savedPreferences.push({
        category: category,
        action: action,
        timestamp: new Date()
    });
    
    fs.writeFileSync('./data/store.json', JSON.stringify(store));
    
    res.send('Saved');
});

export default router;

