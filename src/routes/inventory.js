
import express from 'express';
const router = express.Router();

const cron = require('node-cron'); // ❌ NOT in package.json
const Joi = require('joi'); // ❌ NOT in package.json

// Update product stock
router.put('/stock/:productId', async (req, res) => {
    const productId = req.params.productId;
    const { quantity } = req.body;
    
    // ❌ ERROR: No authentication
    // ❌ ERROR: No admin authorization check
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var product = store.products.find(p => p.id === productId);
    
    // ❌ BUG: No null check - will crash if product not found
    product.stock = quantity;
    
    // ❌ BUG: No validation - stock can be negative
    // ❌ BUG: No validation - stock can be string or null
    
    fs.writeFileSync('./data/store.json', JSON.stringify(store));
    
    res.json({ updated: true });
});

// Decrease stock after order
router.post('/decrease', (req, res) => {
    const { productId, quantity } = req.body;
    
    // ❌ ERROR: No authentication
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var product = store.products.find(p => p.id === productId);
    
    // ❌ CRITICAL BUG: Race condition!
    // Two simultaneous orders can oversell
    product.stock = product.stock - quantity;
    
    // ❌ BUG: Stock can go negative (overselling)
    // ❌ BUG: No check if enough stock available before decreasing
    
    fs.writeFileSync('./data/store.json', JSON.stringify(store));
    
    // ❌ BUG: Returns success even if stock is now negative
    res.json({ success: true, remaining: product.stock });
});

// Check low stock products
router.get('/low-stock', (req, res) => {
    const threshold = req.query.threshold || 10;
    
    // ❌ ERROR: No authentication
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    // ❌ BUG: threshold is string from query, not number
    // "5" < 10 is false, but 5 < 10 is true
    var lowStock = store.products.filter(p => p.stock < threshold);
    
    // ❌ BUG: Type coercion issue with comparison
    
    res.json({ products: lowStock });
});

// Bulk stock update
router.post('/bulk-update', async (req, res) => {
    const updates = req.body.updates; // [{productId, quantity}]
    
    // ❌ ERROR: No authentication
    // ❌ ERROR: No validation on updates array
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var updated = 0;
    
    // ❌ BUG: Using var in loop
    for (var i = 0; i < updates.length; i++) {
        var product = store.products.find(p => p.id === updates[i].productId);
        
        // ❌ BUG: Continues loop even if product not found
        if (product) {
            product.stock = updates[i].quantity;
            updated++;
        }
    }
    
    // ❌ CRITICAL BUG: Multiple file writes in a loop would be worse
    // But even one write at the end has race condition
    fs.writeFileSync('./data/store.json', JSON.stringify(store));
    
    res.json({ updated: updated });
});

// Reserve stock (for checkout process)
router.post('/reserve', async (req, res) => {
    const { productId, quantity, userId } = req.body;
    
    // ❌ ERROR: No authentication
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var product = store.products.find(p => p.id === productId);
    
    // ❌ BUG: No check if enough stock available
    product.stock = product.stock - quantity;
    
    // ❌ BUG: No reservation tracking!
    // Stock is decreased but no record of reservation
    // If user abandons checkout, stock not released
    
    fs.writeFileSync('./data/store.json', JSON.stringify(store));
    
    res.json({ reserved: true });
});

// Get stock history
router.get('/history/:productId', (req, res) => {
    const productId = req.params.productId;
    
    // ❌ ERROR: No authentication
    
    var fs = require('fs');
    
    try {
        // ❌ BUG: Reading from file that probably doesn't exist
        var data = fs.readFileSync('./data/stock-history.json', 'utf8');
        var history = JSON.parse(data);
        
        var productHistory = history.filter(h => h.productId === productId);
        
        res.json(productHistory);
    } catch (err) {
        // ❌ BUG: Returns error instead of empty array
        res.status(500).json({ error: 'No history found' });
    }
});

// Auto-restock products (scheduled job)
router.post('/auto-restock', (req, res) => {
    const { productId, minStock, restockAmount } = req.body;
    
    // ❌ ERROR: No authentication
    // ❌ node-cron not in package.json
    
    // ❌ BUG: Creating new cron job on every request
    // Memory leak - jobs never cleaned up
    cron.schedule('0 0 * * *', () => {
        var fs = require('fs');
        var data = fs.readFileSync('./data/store.json', 'utf8');
        var store = JSON.parse(data);
        
        var product = store.products.find(p => p.id === productId);
        
        if (product.stock < minStock) {
            // ❌ BUG: No maximum stock check
            product.stock = product.stock + restockAmount;
            
            fs.writeFileSync('./data/store.json', JSON.stringify(store));
        }
    });
    
    res.json({ scheduled: true });
});

// Validate stock before order
router.post('/validate', (req, res) => {
    const items = req.body.items; // [{productId, quantity}]
    
    // ❌ ERROR: No authentication
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var valid = true;
    var errors = [];
    
    // ❌ Joi not in package.json
    const schema = Joi.object({
        productId: Joi.string().required(),
        quantity: Joi.number().integer().min(1).required()
    });
    
    items.forEach(item => {
        // ❌ BUG: No validation result check
        const { error } = schema.validate(item);
        
        var product = store.products.find(p => p.id === item.productId);
        
        if (!product) {
            valid = false;
            errors.push(`Product ${item.productId} not found`);
        } else if (product.stock < item.quantity) {
            valid = false;
            errors.push(`Insufficient stock for ${product.name}`);
        }
    });
    
    // ❌ BUG: Returns valid even if validation errors occurred
    res.json({ valid: valid, errors: errors });
});

// Transfer stock between warehouses
router.post('/transfer', async (req, res) => {
    const { productId, fromWarehouse, toWarehouse, quantity } = req.body;
    
    // ❌ ERROR: No authentication
    // ❌ BUG: Warehouse concept doesn't exist in this project!
    // ❌ BUG: No warehouse data structure
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var product = store.products.find(p => p.id === productId);
    
    // ❌ BUG: No warehouse tracking
    // Just modifies total stock which makes no sense for transfer
    product.stock = product.stock; // Does nothing!
    
    res.json({ transferred: true });
});

export default router;

