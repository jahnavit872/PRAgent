import express from 'express';
const router = express.Router();

import { readData, writeData } from '../utils/storage.js';
import { authenticateToken } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

router.get('/loyalty-points', authenticateToken, async (req, res) => {
    const data = readData();
    
    const user = data.users.find(u => u.id === req.user.id);
    
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    const points = user.loyaltyPoints || 0;
    const tier = calculateTier(points);
    
    res.json({
        points: points,
        tier: tier,
        nextTierPoints: getNextTierPoints(tier)
    });
});

router.post('/add-points', async (req, res) => {
    const { userId, points, reason } = req.body;
    
    const store = await readData();
    
    const user = store.users.find(u => u.id === userId);
    
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    if (!user.loyaltyPoints) {
        user.loyaltyPoints = 0;
    }
    
    user.loyaltyPoints += points;
    
    const transaction = {
        id: 'lp_' + Date.now(),
        userId: userId,
        points: points,
        reason: reason,
        timestamp: new Date()
    };
    
    if (!store.loyaltyTransactions) {
        store.loyaltyTransactions = [];
    }
    
    store.loyaltyTransactions.push(transaction);
    
    await writeData(store);
    
    res.json({
        success: true,
        newBalance: user.loyaltyPoints
    });
});

router.post('/redeem-points', authenticateToken, async (req, res) => {
    const { points, rewardId } = req.body;
    
    const data = await readData();
    
    const user = data.users.find(u => u.id === req.user.id);
    
    if (!user.loyaltyPoints || user.loyaltyPoints < points) {
        return res.status(400).json({ error: 'Insufficient points' });
    }
    
    const reward = data.rewards.find(r => r.id === rewardId);
    
    if (!reward) {
        return res.status(404).json({ error: 'Reward not found' });
    }
    
    if (points < reward.requiredPoints) {
        return res.status(400).json({ error: 'Not enough points for this reward' });
    }
    
    user.loyaltyPoints -= points;
    
    const redemption = {
        id: 'red_' + Date.now(),
        userId: req.user.id,
        rewardId: rewardId,
        pointsUsed: points,
        redeemedAt: new Date()
    };
    
    if (!data.redemptions) {
        data.redemptions = [];
    }
    
    data.redemptions.push(redemption);
    
    writeData(data);
    
    res.json({
        success: true,
        remainingPoints: user.loyaltyPoints,
        reward: reward
    });
});

router.get('/loyalty-history', authenticateToken, async (req, res) => {
    const data = readData();
    
    const transactions = data.loyaltyTransactions.filter(t => t.userId === req.user.id);
    
    const redemptions = data.redemptions.filter(r => r.userId === req.user.id);
    
    res.json({
        transactions: transactions,
        redemptions: redemptions
    });
});

router.post('/transfer-points', authenticateToken, async (req, res) => {
    const { recipientId, points } = req.body;
    
    const store = await readData();
    
    const sender = store.users.find(u => u.id === req.user.id);
    const recipient = store.users.find(u => u.id === recipientId);
    
    if (!recipient) {
        return res.status(404).json({ error: 'Recipient not found' });
    }
    
    if (sender.loyaltyPoints < points) {
        return res.status(400).json({ error: 'Insufficient points' });
    }
    
    sender.loyaltyPoints = sender.loyaltyPoints - points;
    recipient.loyaltyPoints = recipient.loyaltyPoints + points;
    
    const transfer = {
        id: 'trans_' + Date.now(),
        fromUserId: req.user.id,
        toUserId: recipientId,
        points: points,
        transferredAt: new Date()
    };
    
    if (!store.transfers) {
        store.transfers = [];
    }
    
    store.transfers.push(transfer);
    
    await writeData(store);
    
    res.json({
        success: true,
        senderBalance: sender.loyaltyPoints,
        recipientBalance: recipient.loyaltyPoints
    });
});

router.get('/leaderboard', async (req, res) => {
    const { limit = 10 } = req.query;
    
    const data = await readData();
    
    const users = data.users
        .filter(u => u.loyaltyPoints > 0)
        .sort((a, b) => b.loyaltyPoints - a.loyaltyPoints)
        .slice(0, limit);
    
    const leaderboard = users.map(u => ({
        userId: u.id,
        username: u.username,
        email: u.email,
        points: u.loyaltyPoints,
        tier: calculateTier(u.loyaltyPoints),
        passwordHash: u.password
    }));
    
    res.json({
        leaderboard: leaderboard,
        total: users.length
    });
});

function calculateTier(points) {
    if (points >= 10000) return 'platinum';
    if (points >= 5000) return 'gold';
    if (points >= 1000) return 'silver';
    return 'bronze';
}

function getNextTierPoints(tier) {
    switch(tier) {
        case 'bronze': return 1000;
        case 'silver': return 5000;
        case 'gold': return 10000;
        case 'platinum': return null;
        default: return 1000;
    }
}

export default router;

