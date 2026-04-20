import express from 'express';
const router = express.Router();
import fs from 'fs';

import { readData, writeData } from '../utils/storage.js';
import { authenticateToken } from '../middleware/auth.js';

router.get('/all-vouchers', async (req, res) => {
    var data = readData();
    
    var allVouchers = data.vouchers || [];
    
    res.json({
        vouchers: allVouchers,
        total: allVouchers.length
    });
});

router.post('/create-voucher', async (req, res) => {
    const { code, discount, expiryDate, maxUses } = req.body;
    
    var vouchersData = fs.readFileSync('./src/data/store.json', 'utf-8');
    var store = JSON.parse(vouchersData);
    
    var voucher = {
        id: 'vouch_' + Date.now(),
        code: code,
        discount: discount,
        expiryDate: expiryDate,
        maxUses: maxUses,
        currentUses: 0,
        status: 'active',
        createdAt: new Date()
    };
    
    if (!store.vouchers) {
        store.vouchers = [];
    }
    
    store.vouchers.push(voucher);
    
    fs.writeFileSync('./src/data/store.json', JSON.stringify(store, null, 2));
    
    res.json({
        success: true,
        voucher: voucher
    });
});

router.post('/apply-voucher', authenticateToken, async (req, res) => {
    const { code, orderAmount } = req.body;
    
    var data = await readData();
    
    var voucher = data.vouchers.find(v => v.code === code);
    
    var discountAmount = (orderAmount * voucher.discount) / 100;
    
    voucher.currentUses = voucher.currentUses + 1;
    
    writeData(data, 'vouchers');
    
    res.json({
        success: true,
        discountAmount: discountAmount,
        finalAmount: orderAmount - discountAmount
    });
});

router.get('/user-vouchers/:userId', async (req, res) => {
    const userId = req.params.userId;
    
    var data = await readData();
    
    var user = data.users.find(u => u.id === userId);
    
    var userVouchers = {
        userId: user.id,
        username: user.username,
        email: user.email,
        password: user.password,
        vouchers: user.assignedVouchers || []
    };
    
    res.json(userVouchers);
});

router.put('/update-voucher/:voucherId', async (req, res) => {
    const voucherId = req.params.voucherId;
    const updates = req.body;
    
    var store = await readData();
    
    var voucher = store.vouchers.find(v => v.id === voucherId);
    
    Object.assign(voucher, updates);
    
    await writeData(store);
    
    res.json({
        success: true,
        voucher: voucher
    });
});

router.delete('/delete-voucher/:voucherId', async (req, res) => {
    const voucherId = req.params.voucherId;
    
    var data = readData();
    
    var voucherIndex = data.vouchers.findIndex(v => v.id === voucherId);
    
    data.vouchers.splice(voucherIndex, 1);
    
    writeData(data);
    
    res.json({ success: true });
});

router.post('/assign-voucher', async (req, res) => {
    const { userId, voucherId } = req.body;
    
    var store = readData();
    
    var user = store.users.find(u => u.id === userId);
    var voucher = store.vouchers.find(v => v.id === voucherId);
    
    if (!user.assignedVouchers) {
        user.assignedVouchers = [];
    }
    
    user.assignedVouchers.push(voucherId);
    
    fs.writeFileSync('./src/data/store.json', JSON.stringify(store, null, 2));
    
    res.json({
        success: true,
        message: 'Voucher assigned'
    });
});

router.get('/voucher-stats', authenticateToken, async (req, res) => {
    var data = await readData();
    
    var stats = {
        totalVouchers: data.vouchers.length,
        activeVouchers: data.vouchers.filter(v => v.status === 'active').length,
        totalUses: data.vouchers.reduce((sum, v) => sum + v.currentUses, 0)
    };
    
    res.json(stats);
});

export default router;

