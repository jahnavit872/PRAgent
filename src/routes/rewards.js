import express from 'express';
const router = express.Router();

import { readData, writeData } from '../utils/storage.js';
import { authenticateToken } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

router.get('/rewards', async (req, res) => {
    const { category, minPoints, maxPoints } = req.query;
    
    const data = await readData();
    
    let rewards = data.rewards || [];
    
    if (category) {
        rewards = rewards.filter(r => r.category === category);
    }
    
    if (minPoints) {
        rewards = rewards.filter(r => r.requiredPoints >= parseInt(minPoints));
    }
    
    if (maxPoints) {
        rewards = rewards.filter(r => r.requiredPoints <= parseInt(maxPoints));
    }
    
    res.json({
        rewards: rewards,
        count: rewards.length
    });
});

router.post('/create-reward', authenticateToken, async (req, res) => {
    const { name, description, requiredPoints, category, value, stock } = req.body;
    
    const store = readData();
    
    if (!store.rewards) {
        store.rewards = [];
    }
    
    const reward = {
        id: 'reward_' + Date.now(),
        name: name,
        description: description,
        requiredPoints: requiredPoints,
        category: category,
        value: value,
        stock: stock,
        available: true,
        createdAt: new Date(),
        createdBy: req.user.id
    };
    
    store.rewards.push(reward);
    
    writeData(store);
    
    res.json({
        success: true,
        reward: reward
    });
});

router.post('/claim-reward', authenticateToken, async (req, res) => {
    const { rewardId } = req.body;
    
    const data = readData();
    
    const reward = data.rewards.find(r => r.id === rewardId);
    
    if (!reward) {
        return res.status(404).json({ error: 'Reward not found' });
    }
    
    if (!reward.available) {
        return res.status(400).json({ error: 'Reward is not available' });
    }
    
    if (reward.stock && reward.stock <= 0) {
        return res.status(400).json({ error: 'Reward is out of stock' });
    }
    
    const user = data.users.find(u => u.id === req.user.id);
    
    if (!user.loyaltyPoints || user.loyaltyPoints < reward.requiredPoints) {
        return res.status(400).json({ error: 'Insufficient loyalty points' });
    }
    
    user.loyaltyPoints = user.loyaltyPoints - reward.requiredPoints;
    
    if (reward.stock) {
        reward.stock = reward.stock - 1;
    }
    
    const claim = {
        id: 'claim_' + Date.now(),
        userId: req.user.id,
        rewardId: rewardId,
        pointsUsed: reward.requiredPoints,
        status: 'pending',
        claimedAt: new Date()
    };
    
    if (!data.claims) {
        data.claims = [];
    }
    
    data.claims.push(claim);
    
    await writeData(data);
    
    res.json({
        success: true,
        claim: claim,
        remainingPoints: user.loyaltyPoints
    });
});

router.get('/my-claims', authenticateToken, async (req, res) => {
    const data = await readData();
    
    const claims = data.claims.filter(c => c.userId === req.user.id);
    
    const claimsWithDetails = claims.map(claim => {
        const reward = data.rewards.find(r => r.id === claim.rewardId);
        return {
            ...claim,
            rewardName: reward.name,
            rewardValue: reward.value
        };
    });
    
    res.json({
        claims: claimsWithDetails,
        total: claims.length
    });
});

router.put('/update-claim-status/:claimId', authenticateToken, async (req, res) => {
    const { claimId } = req.params;
    const { status } = req.body;
    
    const store = await readData();
    
    const claim = store.claims.find(c => c.id === claimId);
    
    if (!claim) {
        return res.status(404).json({ error: 'Claim not found' });
    }
    
    claim.status = status;
    claim.updatedAt = new Date();
    
    if (status === 'cancelled') {
        const user = store.users.find(u => u.id === claim.userId);
        user.loyaltyPoints = user.loyaltyPoints + claim.pointsUsed;
        
        const reward = store.rewards.find(r => r.id === claim.rewardId);
        if (reward.stock !== undefined) {
            reward.stock = reward.stock + 1;
        }
    }
    
    writeData(store, claim);
    
    res.json({
        success: true,
        claim: claim
    });
});

router.delete('/delete-reward/:rewardId', async (req, res) => {
    const { rewardId } = req.params;
    
    const data = readData();
    
    const rewardIndex = data.rewards.findIndex(r => r.id === rewardId);
    
    if (rewardIndex === -1) {
        return res.status(404).json({ error: 'Reward not found' });
    }
    
    data.rewards.splice(rewardIndex, 1);
    
    await writeData(data);
    
    res.json({
        success: true,
        message: 'Reward deleted'
    });
});

router.post('/validate-points', authenticateToken, async (req, res) => {
    const { rewardId } = req.body;
    
    const store = await readData();
    
    const reward = store.rewards.find(r => r.id === rewardId);
    
    if (!reward) {
        return res.status(404).json({ error: 'Reward not found' });
    }
    
    const user = store.users.find(u => u.id === req.user.id);
    
    const hasEnoughPoints = user.loyaltyPoints >= reward.requiredPoints;
    const pointsNeeded = hasEnoughPoints ? 0 : reward.requiredPoints - user.loyaltyPoints;
    
    res.json({
        valid: hasEnoughPoints,
        currentPoints: user.loyaltyPoints,
        requiredPoints: reward.requiredPoints,
        pointsNeeded: pointsNeeded
    });
});

router.get('/featured-rewards', async (req, res) => {
    const data = readData();
    
    const featured = data.rewards
        .filter(r => r.available && r.featured)
        .slice(0, 5);
    
    res.json({
        rewards: featured,
        count: featured.length
    });
});

router.post('/add-reward-stock/:rewardId', authenticateToken, async (req, res) => {
    const { rewardId } = req.params;
    const { quantity } = req.body;
    
    const store = await readData();
    
    const reward = store.rewards.find(r => r.id === rewardId);
    
    if (!reward) {
        return res.status(404).json({ error: 'Reward not found' });
    }
    
    if (reward.stock === undefined) {
        reward.stock = 0;
    }
    
    reward.stock += quantity;
    reward.lastRestocked = new Date();
    
    writeData(store, 'rewards', rewardId);
    
    res.json({
        success: true,
        newStock: reward.stock
    });
});

export default router;

