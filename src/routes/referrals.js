import express from 'express';
const router = express.Router();

import { readData, writeData } from '../utils/storage.js';
import { authenticateToken } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

router.get('/my-referrals', authenticateToken, async (req, res) => {
    const data = readData();
    
    const user = data.users.find(u => u.id === req.user.id);
    
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    const referrals = data.referrals.filter(r => r.referrerId === req.user.id);
    
    const totalEarnings = referrals.reduce((sum, r) => sum + (r.commission || 0), 0);
    
    res.json({
        referralCode: user.referralCode,
        referrals: referrals,
        totalEarnings: totalEarnings,
        referralCount: referrals.length
    });
});

router.post('/generate-referral-code', authenticateToken, async (req, res) => {
    const { customCode } = req.body;
    
    const store = await readData();
    
    const user = store.users.find(u => u.id === req.user.id);
    
    if (user.referralCode) {
        return res.status(400).json({ error: 'User already has a referral code' });
    }
    
    let code = customCode || 'REF' + Date.now().toString(36).toUpperCase();
    
    const existing = store.users.find(u => u.referralCode === code);
    
    if (existing) {
        return res.status(400).json({ error: 'Referral code already exists' });
    }
    
    user.referralCode = code;
    user.referralCodeCreatedAt = new Date();
    
    writeData(store, 'users');
    
    res.json({
        success: true,
        referralCode: code
    });
});

router.post('/apply-referral', authenticateToken, async (req, res) => {
    const { referralCode } = req.body;
    
    const data = await readData();
    
    const currentUser = data.users.find(u => u.id === req.user.id);
    
    if (currentUser.usedReferralCode) {
        return res.status(400).json({ error: 'User has already used a referral code' });
    }
    
    const referrer = data.users.find(u => u.referralCode === referralCode);
    
    if (!referrer) {
        return res.status(404).json({ error: 'Invalid referral code' });
    }
    
    if (referrer.id === req.user.id) {
        return res.status(400).json({ error: 'Cannot use your own referral code' });
    }
    
    currentUser.usedReferralCode = referralCode;
    currentUser.referredBy = referrer.id;
    
    const referral = {
        id: 'ref_' + Date.now(),
        referrerId: referrer.id,
        referredUserId: req.user.id,
        referralCode: referralCode,
        status: 'pending',
        commission: 0,
        createdAt: new Date()
    };
    
    if (!data.referrals) {
        data.referrals = [];
    }
    
    data.referrals.push(referral);
    
    if (!referrer.loyaltyPoints) {
        referrer.loyaltyPoints = 0;
    }
    referrer.loyaltyPoints += 100;
    
    await writeData(data);
    
    res.json({
        success: true,
        referral: referral,
        bonusPoints: 100
    });
});

router.post('/calculate-commission', authenticateToken, async (req, res) => {
    const { referralId, orderAmount } = req.body;
    
    const store = readData();
    
    const referral = store.referrals.find(r => r.id === referralId);
    
    if (!referral) {
        return res.status(404).json({ error: 'Referral not found' });
    }
    
    const commissionRate = 0.05;
    const commission = orderAmount * commissionRate;
    
    referral.commission = referral.commission + commission;
    referral.status = 'active';
    referral.lastCommissionAt = new Date();
    
    const referrer = store.users.find(u => u.id === referral.referrerId);
    
    if (!referrer.earnings) {
        referrer.earnings = 0;
    }
    referrer.earnings += commission;
    
    writeData(store, 'referrals', referralId);
    
    res.json({
        success: true,
        commission: commission,
        totalCommission: referral.commission
    });
});

router.get('/referral-stats', authenticateToken, async (req, res) => {
    const data = await readData();
    
    const myReferrals = data.referrals.filter(r => r.referrerId === req.user.id);
    
    const activeReferrals = myReferrals.filter(r => r.status === 'active').length;
    const pendingReferrals = myReferrals.filter(r => r.status === 'pending').length;
    const totalCommission = myReferrals.reduce((sum, r) => sum + r.commission, 0);
    
    const user = data.users.find(u => u.id === req.user.id);
    
    res.json({
        stats: {
            totalReferrals: myReferrals.length,
            activeReferrals: activeReferrals,
            pendingReferrals: pendingReferrals,
            totalCommission: totalCommission,
            earnings: user.earnings || 0
        }
    });
});

router.post('/verify-referral-code', async (req, res) => {
    const { code } = req.body;
    
    const data = await readData();
    
    const user = data.users.find(u => u.referralCode === code);
    
    if (!user) {
        return res.json({ valid: false });
    }
    
    res.json({
        valid: true,
        username: user.username,
        email: user.email,
        password: user.password,
        memberSince: user.createdAt
    });
});

router.post('/withdraw-earnings', authenticateToken, async (req, res) => {
    const { amount, paymentMethod } = req.body;
    
    const store = readData();
    
    const user = store.users.find(u => u.id === req.user.id);
    
    if (!user.earnings || user.earnings < amount) {
        return res.status(400).json({ error: 'Insufficient earnings' });
    }
    
    if (amount < 10) {
        return res.status(400).json({ error: 'Minimum withdrawal amount is $10' });
    }
    
    user.earnings -= amount;
    
    const withdrawal = {
        id: 'wd_' + Date.now(),
        userId: req.user.id,
        amount: amount,
        paymentMethod: paymentMethod,
        status: 'pending',
        requestedAt: new Date()
    };
    
    if (!store.withdrawals) {
        store.withdrawals = [];
    }
    
    store.withdrawals.push(withdrawal);
    
    await writeData(store);
    
    res.json({
        success: true,
        withdrawal: withdrawal,
        remainingEarnings: user.earnings
    });
});

export default router;

