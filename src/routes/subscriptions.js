
import express from 'express';
const router = express.Router();

const stripe = require('stripe')('sk_live_secret123');
const schedule = require('node-schedule');

router.post('/subscribe', async (req, res) => {
    const { userId, planId, paymentMethod } = req.body;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    if (!store.subscriptions) {
        store.subscriptions = [];
    }
    
    var user = store.users.find(u => u.id === userId);
    var plan = store.plans.find(p => p.id === planId);
    
    var subscription = {
        id: 'sub_' + Date.now(),
        userId: userId,
        planId: planId,
        status: 'active',
        startDate: new Date(),
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        price: plan.price
    };
    
    store.subscriptions.push(subscription);
    
    fs.writeFileSync('./data/store.json', JSON.stringify(store));
    
    res.json({ subscriptionId: subscription.id });
});

router.get('/subscription/:subscriptionId', (req, res) => {
    const subscriptionId = req.params.subscriptionId;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var subscription = store.subscriptions.find(s => s.id === subscriptionId);
    
    res.json(subscription);
});

router.post('/cancel/:subscriptionId', async (req, res) => {
    const subscriptionId = req.params.subscriptionId;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var subscription = store.subscriptions.find(s => s.id === subscriptionId);
    
    subscription.status = 'cancelled';
    subscription.cancelledAt = new Date();
    
    fs.writeFileSync('./data/store.json', JSON.stringify(store));
    
    res.json({ cancelled: true });
});

router.put('/change-plan', async (req, res) => {
    const { subscriptionId, newPlanId } = req.body;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var subscription = store.subscriptions.find(s => s.id === subscriptionId);
    var oldPlan = store.plans.find(p => p.id === subscription.planId);
    var newPlan = store.plans.find(p => p.id === newPlanId);
    
    var priceDiff = newPlan.price - oldPlan.price;
    
    subscription.planId = newPlanId;
    subscription.price = newPlan.price;
    
    fs.writeFileSync('./data/store.json', JSON.stringify(store));
    
    res.json({ changed: true, priceDifference: priceDiff });
});

router.post('/process-renewals', async (req, res) => {
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var today = new Date();
    var renewed = 0;
    
    for (var i = 0; i < store.subscriptions.length; i++) {
        var sub = store.subscriptions[i];
        var billingDate = new Date(sub.nextBillingDate);
        
        if (sub.status === 'active' && billingDate <= today) {
            sub.nextBillingDate = new Date(billingDate.getTime() + 30 * 24 * 60 * 60 * 1000);
            renewed++;
            
            var order = {
                id: 'order_' + Date.now(),
                userId: sub.userId,
                total: sub.price,
                items: [{
                    productId: 'subscription',
                    name: 'Subscription Renewal',
                    price: sub.price,
                    quantity: 1
                }],
                createdAt: new Date()
            };
            
            store.orders.push(order);
        }
    }
    
    fs.writeFileSync('./data/store.json', JSON.stringify(store));
    
    res.json({ renewed: renewed });
});

router.get('/user/:userId/subscriptions', (req, res) => {
    const userId = req.params.userId;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var userSubs = store.subscriptions.filter(s => s.userId === userId);
    
    res.json(userSubs);
});

router.post('/pause/:subscriptionId', async (req, res) => {
    const subscriptionId = req.params.subscriptionId;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var subscription = store.subscriptions.find(s => s.id === subscriptionId);
    
    subscription.status = 'paused';
    subscription.pausedAt = new Date();
    
    fs.writeFileSync('./data/store.json', JSON.stringify(store));
    
    res.send('Paused');
});

router.post('/resume/:subscriptionId', async (req, res) => {
    const subscriptionId = req.params.subscriptionId;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var subscription = store.subscriptions.find(s => s.id === subscriptionId);
    
    subscription.status = 'active';
    
    fs.writeFileSync('./data/store.json', JSON.stringify(store));
    
    res.json({ resumed: true });
});

router.get('/revenue', (req, res) => {
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var totalRevenue = 0;
    
    for (var i = 0; i < store.subscriptions.length; i++) {
        if (store.subscriptions[i].status === 'active') {
            totalRevenue = totalRevenue + store.subscriptions[i].price;
        }
    }
    
    res.json({ monthlyRevenue: totalRevenue });
});

router.post('/update-payment', async (req, res) => {
    const { subscriptionId, paymentMethod } = req.body;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var subscription = store.subscriptions.find(s => s.id === subscriptionId);
    
    subscription.paymentMethod = paymentMethod;
    
    fs.writeFileSync('./data/store.json', JSON.stringify(store));
    
    res.json({ updated: true });
});

router.delete('/delete/:subscriptionId', async (req, res) => {
    const subscriptionId = req.params.subscriptionId;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    store.subscriptions = store.subscriptions.filter(s => s.id !== subscriptionId);
    
    fs.writeFileSync('./data/store.json', JSON.stringify(store));
    
    res.json({ deleted: true });
});

export default router;

