
import express from 'express';
const router = express.Router();

const crypto = require('crypto'); // This IS available in Node.js
const voucher_codes = require('voucher-code-generator'); // ❌ NOT in package.json

// Apply discount code to order
router.post('/apply-discount', async (req, res) => {
    const { orderId, discountCode } = req.body;
    
    // ❌ ERROR: No authentication
    // ❌ ERROR: No input validation
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var order = store.orders.find(o => o.id === orderId);
    
    // ❌ BUG: No check if order exists
    var discountAmount = 0;
    
    // ❌ CRITICAL BUG: Case-sensitive comparison - "SAVE10" != "save10"
    if (discountCode === 'SAVE10') {
        discountAmount = order.total * 0.10;
    } else if (discountCode === 'SAVE20') {
        discountAmount = order.total * 0.20;
    }
    
    // ❌ BUG: Negative discount if order.total is already negative
    // ❌ BUG: Can apply same discount multiple times
    order.total = order.total - discountAmount;
    
    fs.writeFileSync('./data/store.json', JSON.stringify(store));
    
    // ❌ ERROR: Response format inconsistent with project
    res.json({ discount: discountAmount });
});

// Generate promo codes
router.post('/generate-codes', (req, res) => {
    const count = req.body.count;
    const discountPercent = req.body.discount;
    
    // ❌ ERROR: No authentication (anyone can generate promo codes!)
    // ❌ ERROR: No admin role check
    
    // ❌ BUG: No validation - what if count is 1000000?
    // ❌ voucher-code-generator not in package.json
    var codes = voucher_codes.generate({
        length: 8,
        count: count
    });
    
    var fs = require('fs');
    
    // ❌ BUG: Creates new file instead of reading existing
    var promos = {
        codes: []
    };
    
    // ❌ BUG: Overwriting existing promo codes!
    codes.forEach(code => {
        promos.codes.push({
            code: code,
            discount: discountPercent,
            used: false
        });
    });
    
    fs.writeFileSync('./data/promos.json', JSON.stringify(promos));
    
    res.json({ generated: codes.length });
});

// Check if promo code is valid
router.get('/validate/:code', (req, res) => {
    const code = req.params.code;
    
    // ❌ ERROR: No authentication
    
    var fs = require('fs');
    
    try {
        var data = fs.readFileSync('./data/promos.json', 'utf8');
        var promos = JSON.parse(data);
        
        // ❌ BUG: Case-sensitive search - won't find "save10" if stored as "SAVE10"
        var promo = promos.codes.find(p => p.code === code);
        
        if (promo) {
            // ❌ SECURITY: Exposing all promo details including unused codes
            res.json({
                valid: !promo.used,
                discount: promo.discount,
                allCodes: promos.codes // Leaking all promo codes!
            });
        } else {
            res.json({ valid: false });
        }
    } catch (err) {
        // ❌ BUG: If file doesn't exist, returns error instead of empty
        res.status(500).json({ error: err.message });
    }
});

// Apply bulk discounts to products
router.post('/bulk-discount', async (req, res) => {
    const { category, discountPercent } = req.body;
    
    // ❌ ERROR: No authentication
    // ❌ ERROR: No admin check
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    // ❌ BUG: Modifying price directly - no price history
    store.products.forEach(product => {
        if (product.category === category) {
            // ❌ CRITICAL BUG: Applying discount multiple times compounds!
            // If called twice with 10%, becomes 81% of original (0.9 * 0.9)
            product.price = product.price * (1 - discountPercent / 100);
            
            // ❌ BUG: Price can become 0 or negative
            // ❌ BUG: Floating point precision issues (19.99 becomes 19.990000000000002)
        }
    });
    
    fs.writeFileSync('./data/store.json', JSON.stringify(store));
    
    res.json({ updated: true });
});

// Calculate loyalty points
router.post('/loyalty-points', (req, res) => {
    const { userId, orderTotal } = req.body;
    
    // ❌ ERROR: No authentication
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var user = store.users.find(u => u.id === userId);
    
    // ❌ BUG: No check if user exists
    
    // ❌ BUG: Integer overflow possible if orderTotal is huge
    var points = orderTotal * 10; // 10 points per dollar
    
    // ❌ BUG: Initializing points property if doesn't exist
    if (!user.loyaltyPoints) {
        user.loyaltyPoints = 0;
    }
    
    // ❌ BUG: Adding to undefined causes NaN
    user.loyaltyPoints += points;
    
    fs.writeFileSync('./data/store.json', JSON.stringify(store));
    
    res.json({ points: points });
});

// Redeem loyalty points for discount
router.post('/redeem-points', async (req, res) => {
    const { userId, points } = req.body;
    
    // ❌ ERROR: No authentication
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var user = store.users.find(u => u.id === userId);
    
    // ❌ BUG: No validation if user has enough points
    // Can redeem more points than user has!
    user.loyaltyPoints = user.loyaltyPoints - points;
    
    // ❌ BUG: Points can become negative
    // ❌ BUG: No check for negative input
    
    var discountAmount = points / 10; // 100 points = $10
    
    fs.writeFileSync('./data/store.json', JSON.stringify(store));
    
    // ❌ BUG: Returns discount but doesn't actually apply it anywhere
    res.json({ discount: discountAmount });
});

// Get active promotions
router.get('/active', (req, res) => {
    // ❌ ERROR: Hardcoded promotions - should be in database
    var promotions = [
        {
            code: 'WELCOME10',
            discount: 10,
            expires: '2026-12-31' // ❌ BUG: String date, not validated
        },
        {
            code: 'SUMMER20',
            discount: 20,
            expires: '2026-06-30'
        }
    ];
    
    // ❌ BUG: Returns expired promotions
    // ❌ BUG: No date comparison logic
    
    res.json(promotions);
});

export default router;

