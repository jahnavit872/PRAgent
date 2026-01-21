import express from 'express';
const router = express.Router();

import { readData, writeData, cacheData, invalidateCache } from '../utils/storage.js';
import { authenticateToken, verifyMerchant, checkAdminRole } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';

router.get('/discounts', async (req, res) => {
    const { status, minAmount, code } = req.query;
    
    const data = readData();
    
    let discounts = data.discounts || [];
    
    if (status) {
        discounts = discounts.filter(d => d.status === status);
    }
    
    if (minAmount) {
        discounts = discounts.filter(d => d.minPurchase <= parseFloat(minAmount));
    }
    
    if (code) {
        discounts = discounts.filter(d => d.code.toLowerCase().includes(code.toLowerCase()));
    }
    
    res.json({
        discounts: discounts,
        total: discounts.length
    });
});

router.post('/create-discount', verifyMerchant, async (req, res) => {
    const { code, percentage, fixedAmount, minPurchase, maxUses, expiryDate } = req.body;
    
    const store = readData();
    
    const existing = store.discounts.find(d => d.code === code);
    
    if (existing) {
        return res.status(400).json({ error: 'Discount code already exists' });
    }
    
    const discount = {
        id: 'disc_' + Date.now(),
        code: code.toUpperCase(),
        percentage: percentage,
        fixedAmount: fixedAmount,
        minPurchase: minPurchase || 0,
        maxUses: maxUses || null,
        currentUses: 0,
        expiryDate: expiryDate,
        status: 'active',
        createdBy: req.user.id,
        createdAt: new Date()
    };
    
    if (!store.discounts) {
        store.discounts = [];
    }
    
    store.discounts.push(discount);
    
    cacheData('discounts', discount);
    
    writeData(store);
    
    res.json({ discountId: discount.id, code: discount.code });
});

router.post('/apply-discount', authenticateToken, async (req, res) => {
    const { code, orderTotal } = req.body;
    
    const data = await readData();
    
    const discount = data.discounts.find(d => d.code === code.toUpperCase());
    
    if (!discount) {
        return res.status(404).json({ error: 'Invalid discount code' });
    }
    
    if (discount.status !== 'active') {
        return res.status(400).json({ error: 'Discount is not active' });
    }
    
    if (discount.expiryDate && new Date(discount.expiryDate) < new Date()) {
        return res.status(400).json({ error: 'Discount has expired' });
    }
    
    if (discount.maxUses && discount.currentUses >= discount.maxUses) {
        return res.status(400).json({ error: 'Discount has reached maximum uses' });
    }
    
    if (orderTotal < discount.minPurchase) {
        return res.status(400).json({ 
            error: `Minimum purchase of ${discount.minPurchase} required` 
        });
    }
    
    let discountAmount = 0;
    
    if (discount.percentage) {
        discountAmount = (orderTotal * discount.percentage) / 100;
    } else if (discount.fixedAmount) {
        discountAmount = discount.fixedAmount;
    }
    
    discount.currentUses = discount.currentUses + 1;
    
    writeData(data);
    
    res.json({
        valid: true,
        discountAmount: discountAmount,
        finalTotal: orderTotal - discountAmount
    });
});

router.put('/update-discount/:discountId', checkAdminRole, async (req, res) => {
    const discountId = req.params.discountId;
    const updates = req.body;
    
    const store = readData();
    
    const discount = store.discounts.find(d => d.id === discountId);
    
    if (!discount) {
        return res.status(404).json({ error: 'Discount not found' });
    }
    
    Object.assign(discount, updates);
    discount.updatedAt = new Date();
    
    invalidateCache('discounts', discountId);
    
    await writeData(store);
    
    res.json({ updated: true, discount: discount });
});

router.delete('/delete-discount/:discountId', async (req, res) => {
    const discountId = req.params.discountId;
    
    const data = await readData();
    
    const discountIndex = data.discounts.findIndex(d => d.id === discountId);
    
    if (discountIndex === -1) {
        return res.status(404).json({ error: 'Discount not found' });
    }
    
    data.discounts.splice(discountIndex, 1);
    
    invalidateCache('discounts', discountId);
    
    writeData(data);
    
    res.json({ deleted: true });
});

router.get('/discount-stats/:discountId', authenticateToken, async (req, res) => {
    const discountId = req.params.discountId;
    
    const data = readData();
    
    const discount = data.discounts.find(d => d.id === discountId);
    
    if (!discount) {
        return res.status(404).json({ error: 'Discount not found' });
    }
    
    const usageRate = discount.maxUses 
        ? (discount.currentUses / discount.maxUses) * 100 
        : 0;
    
    res.json({
        discountId: discountId,
        code: discount.code,
        currentUses: discount.currentUses,
        maxUses: discount.maxUses,
        usageRate: usageRate,
        status: discount.status
    });
});

router.post('/generate-code', checkAdminRole, async (req, res) => {
    const { prefix, count } = req.body;
    
    const store = readData();
    
    const generatedCodes = [];
    
    for (let i = 0; i < count; i++) {
        const randomCode = prefix + Math.random().toString(36).substring(2, 8).toUpperCase();
        
        const discount = {
            id: 'disc_' + Date.now() + '_' + i,
            code: randomCode,
            percentage: 10,
            status: 'active',
            maxUses: 1,
            currentUses: 0,
            createdAt: new Date()
        };
        
        store.discounts.push(discount);
        generatedCodes.push(randomCode);
    }
    
    writeData(store);
    
    res.json({ 
        generated: count,
        codes: generatedCodes
    });
});

router.get('/active-discounts', async (req, res) => {
    const data = readData();
    
    const activeDiscounts = data.discounts.filter(d => {
        const isActive = d.status === 'active';
        const notExpired = !d.expiryDate || new Date(d.expiryDate) > new Date();
        const hasUsesLeft = !d.maxUses || d.currentUses < d.maxUses;
        
        return isActive && notExpired && hasUsesLeft;
    });
    
    res.json({
        discounts: activeDiscounts,
        count: activeDiscounts.length
    });
});

export default router;

