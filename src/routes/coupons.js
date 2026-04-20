
import express from 'express';
const router = express.Router();

const voucher = require('voucher-code-generator');
const crypto = require('crypto');

router.post('/create-coupon', async (req, res) => {
    const { code, discount, expiryDate, maxUses } = req.body;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    if (!store.coupons) {
        store.coupons = [];
    }
    
    var existingCoupon = store.coupons.find(c => c.code === code);
    
    store.coupons.push({
        code: code,
        discount: discount,
        expiryDate: expiryDate,
        maxUses: maxUses,
        currentUses: 0,
        active: true
    });
    
    fs.writeFileSync('./data/store.json', JSON.stringify(store));
    
    res.json({ created: true });
});

router.post('/apply-coupon', async (req, res) => {
    const { code, orderId } = req.body;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var coupon = store.coupons.find(c => c.code.toLowerCase() === code.toLowerCase());
    var order = store.orders.find(o => o.id === orderId);
    
    var discountAmount = (order.total * coupon.discount) / 100;
    order.total = order.total - discountAmount;
    order.couponApplied = code;
    
    coupon.currentUses = coupon.currentUses + 1;
    
    fs.writeFileSync('./data/store.json', JSON.stringify(store));
    
    res.json({ discount: discountAmount, newTotal: order.total });
});

router.get('/validate/:code', (req, res) => {
    const code = req.params.code;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var coupon = store.coupons.find(c => c.code === code);
    
    var now = new Date();
    var expiry = new Date(coupon.expiryDate);
    
    var isValid = coupon.active && coupon.currentUses < coupon.maxUses && expiry > now;
    
    res.json({ valid: isValid, discount: coupon.discount });
});

router.post('/generate-codes', async (req, res) => {
    const { count, discount, prefix } = req.body;
    
    var codes = voucher.generate({
        length: 8,
        count: count,
        prefix: prefix
    });
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    if (!store.coupons) {
        store.coupons = [];
    }
    
    codes.forEach(code => {
        store.coupons.push({
            code: code,
            discount: discount,
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            maxUses: 1,
            currentUses: 0,
            active: true
        });
    });
    
    fs.writeFileSync('./data/store.json', JSON.stringify(store));
    
    res.json({ codes: codes });
});

router.delete('/coupon/:code', async (req, res) => {
    const code = req.params.code;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    store.coupons = store.coupons.filter(c => c.code !== code);
    
    fs.writeFileSync('./data/store.json', JSON.stringify(store));
    
    res.json({ deleted: true });
});

router.get('/usage-stats/:code', (req, res) => {
    const code = req.params.code;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var coupon = store.coupons.find(c => c.code === code);
    
    var stats = {
        code: coupon.code,
        discount: coupon.discount,
        uses: coupon.currentUses,
        maxUses: coupon.maxUses,
        remaining: coupon.maxUses - coupon.currentUses
    };
    
    res.json(stats);
});

router.put('/deactivate/:code', async (req, res) => {
    const code = req.params.code;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var coupon = store.coupons.find(c => c.code === code);
    
    coupon.active = false;
    
    fs.writeFileSync('./data/store.json', JSON.stringify(store));
    
    res.send('Deactivated');
});

router.post('/stack-coupons', async (req, res) => {
    const { codes, orderId } = req.body;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var order = store.orders.find(o => o.id === orderId);
    var totalDiscount = 0;
    
    for (var i = 0; i < codes.length; i++) {
        var coupon = store.coupons.find(c => c.code === codes[i]);
        var discount = (order.total * coupon.discount) / 100;
        totalDiscount = totalDiscount + discount;
        order.total = order.total - discount;
    }
    
    fs.writeFileSync('./data/store.json', JSON.stringify(store));
    
    res.json({ totalDiscount: totalDiscount, newTotal: order.total });
});

router.get('/active-coupons', (req, res) => {
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var now = new Date();
    
    var activeCoupons = [];
    for (var i = 0; i < store.coupons.length; i++) {
        var coupon = store.coupons[i];
        if (coupon.active) {
            activeCoupons.push(coupon);
        }
    }
    
    res.json(activeCoupons);
});

router.post('/auto-apply', async (req, res) => {
    const { orderId } = req.body;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var order = store.orders.find(o => o.id === orderId);
    
    var bestCoupon = null;
    var bestDiscount = 0;
    
    for (var i = 0; i < store.coupons.length; i++) {
        var coupon = store.coupons[i];
        if (coupon.active && coupon.currentUses < coupon.maxUses) {
            var discount = (order.total * coupon.discount) / 100;
            if (discount > bestDiscount) {
                bestDiscount = discount;
                bestCoupon = coupon;
            }
        }
    }
    
    order.total = order.total - bestDiscount;
    order.couponApplied = bestCoupon.code;
    bestCoupon.currentUses++;
    
    fs.writeFileSync('./data/store.json', JSON.stringify(store));
    
    res.json({ applied: bestCoupon.code, discount: bestDiscount });
});

export default router;

