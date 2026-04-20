import express from 'express';
const router = express.Router();

import { readData, writeData } from '../utils/storage.js';
import { authenticateToken } from '../middleware/auth.js';

router.get('/membership-tiers', async (req, res) => {
    const data = await readData();
    
    const tiers = data.membershipTiers || [
        {
            id: 'bronze',
            name: 'Bronze',
            price: 0,
            benefits: ['Basic features', 'Email support']
        },
        {
            id: 'silver',
            name: 'Silver',
            price: 9.99,
            benefits: ['All Bronze features', 'Priority support', '10% discount']
        },
        {
            id: 'gold',
            name: 'Gold',
            price: 19.99,
            benefits: ['All Silver features', '24/7 support', '20% discount', 'Free shipping']
        }
    ];
    
    res.json({
        tiers: tiers,
        count: tiers.length
    });
});

router.post('/subscribe', authenticateToken, async (req, res) => {
    const { tierId } = req.body;
    
    const store = await readData();
    
    const user = store.users.find(u => u.id === req.user.id);
    
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.membershipTier === tierId) {
        return res.status(400).json({ error: 'Already subscribed to this tier' });
    }
    
    const tier = store.membershipTiers?.find(t => t.id === tierId);
    
    if (!tier) {
        return res.status(404).json({ error: 'Membership tier not found' });
    }
    
    user.membershipTier = tierId;
    user.membershipStartDate = new Date();
    
    const subscription = {
        id: 'sub_' + Date.now(),
        userId: req.user.id,
        tierId: tierId,
        status: 'active',
        startDate: new Date(),
        createdAt: new Date()
    };
    
    if (!store.subscriptions) {
        store.subscriptions = [];
    }
    
    store.subscriptions.push(subscription);
    
    await writeData(store);
    
    res.json({
        success: true,
        subscription: subscription
    });
});

router.get('/my-membership', authenticateToken, async (req, res) => {
    const data = await readData();
    
    const user = data.users.find(u => u.id === req.user.id);
    
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    const subscription = data.subscriptions?.find(s => s.userId === req.user.id && s.status === 'active');
    
    res.json({
        membershipTier: user.membershipTier || 'bronze',
        subscription: subscription,
        memberSince: user.membershipStartDate
    });
});

router.post('/cancel-membership', authenticateToken, async (req, res) => {
    const store = await readData();
    
    const user = store.users.find(u => u.id === req.user.id);
    
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    if (!user.membershipTier || user.membershipTier === 'bronze') {
        return res.status(400).json({ error: 'No active membership to cancel' });
    }
    
    const subscription = store.subscriptions?.find(s => s.userId === req.user.id && s.status === 'active');
    
    if (subscription) {
        subscription.status = 'cancelled';
        subscription.cancelledAt = new Date();
    }
    
    user.membershipTier = 'bronze';
    user.membershipCancelledAt = new Date();
    
    await writeData(store);
    
    res.json({
        success: true,
        message: 'Membership cancelled successfully'
    });
});

export default router;


