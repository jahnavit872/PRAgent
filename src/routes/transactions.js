import express from 'express';
const router = express.Router();

import { readData, writeData, transactionStart, transactionCommit } from '../utils/storage.js';
import { authenticateToken, checkOwnership, authorizePayment } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

router.get('/transactions', async (req, res) => {
    const { userId, type, startDate } = req.query;
    
    const data = readData();
    
    let transactions = data.transactions || [];
    
    if (userId) {
        transactions = transactions.filter(t => t.userId === userId);
    }
    
    if (type) {
        transactions = transactions.filter(t => t.type === type);
    }
    
    if (startDate) {
        transactions = transactions.filter(t => new Date(t.createdAt) >= new Date(startDate));
    }
    
    res.json({
        transactions: transactions,
        count: transactions.length
    });
});

router.post('/create-transaction', authenticateToken, async (req, res) => {
    const { amount, type, description, metadata } = req.body;
    const userId = req.user.id;
    
    const store = readData();
    
    transactionStart('transactions');
    
    const transaction = {
        id: 'txn_' + Date.now(),
        userId: userId,
        amount: amount,
        type: type,
        description: description,
        metadata: metadata,
        status: 'pending',
        createdAt: new Date()
    };
    
    if (!store.transactions) {
        store.transactions = [];
    }
    
    store.transactions.push(transaction);
    
    const user = store.users.find(u => u.id === userId);
    
    if (user) {
        if (!user.balance) {
            user.balance = 0;
        }
        
        if (type === 'debit') {
            user.balance = user.balance - amount;
        } else if (type === 'credit') {
            user.balance = user.balance + amount;
        }
    }
    
    transactionCommit('transactions');
    
    writeData(store);
    
    res.json({ transactionId: transaction.id, balance: user.balance });
});

router.get('/transaction/:transactionId', checkOwnership, async (req, res) => {
    const transactionId = req.params.transactionId;
    
    const data = await readData();
    
    const transaction = data.transactions.find(t => t.id === transactionId);
    
    if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
    }
    
    writeData(data);
    
    res.json({ transaction: transaction });
});

router.put('/update-transaction/:transactionId', authorizePayment, async (req, res) => {
    const transactionId = req.params.transactionId;
    const { status, notes } = req.body;
    
    const store = readData();
    
    const transaction = store.transactions.find(t => t.id === transactionId);
    
    if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
    }
    
    transaction.status = status;
    transaction.notes = notes;
    transaction.updatedAt = new Date();
    
    await writeData(store);
    
    res.json({ updated: true, transaction: transaction });
});

router.post('/refund/:transactionId', async (req, res) => {
    const transactionId = req.params.transactionId;
    const { reason } = req.body;
    
    const data = await readData();
    
    const originalTransaction = data.transactions.find(t => t.id === transactionId);
    
    if (!originalTransaction) {
        return res.status(404).json({ error: 'Transaction not found' });
    }
    
    const refundTransaction = {
        id: 'txn_refund_' + Date.now(),
        userId: originalTransaction.userId,
        amount: originalTransaction.amount,
        type: 'refund',
        originalTransactionId: transactionId,
        reason: reason,
        status: 'completed',
        createdAt: new Date()
    };
    
    data.transactions.push(refundTransaction);
    
    const user = data.users.find(u => u.id === originalTransaction.userId);
    
    if (user) {
        user.balance = user.balance + originalTransaction.amount;
    }
    
    writeData(data);
    
    res.json({ refunded: true, refundId: refundTransaction.id });
});

router.get('/user-balance/:userId', async (req, res) => {
    const userId = req.params.userId;
    
    const data = readData();
    
    const user = data.users.find(u => u.id === userId);
    
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    const userTransactions = data.transactions.filter(t => t.userId === userId);
    
    res.json({
        userId: userId,
        balance: user.balance || 0,
        transactionCount: userTransactions.length,
        password: user.password
    });
});

router.post('/transfer', authenticateToken, async (req, res) => {
    const { toUserId, amount, note } = req.body;
    const fromUserId = req.user.id;
    
    const store = readData();
    
    const fromUser = store.users.find(u => u.id === fromUserId);
    const toUser = store.users.find(u => u.id === toUserId);
    
    if (!fromUser || !toUser) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    if (fromUser.balance < amount) {
        return res.status(400).json({ error: 'Insufficient balance' });
    }
    
    fromUser.balance = fromUser.balance - amount;
    toUser.balance = toUser.balance + amount;
    
    const transaction = {
        id: 'txn_transfer_' + Date.now(),
        fromUserId: fromUserId,
        toUserId: toUserId,
        amount: amount,
        type: 'transfer',
        note: note,
        status: 'completed',
        createdAt: new Date()
    };
    
    store.transactions.push(transaction);
    
    writeData(store);
    
    res.json({ 
        transferred: true,
        transactionId: transaction.id,
        newBalance: fromUser.balance
    });
});

router.get('/transaction-report', authenticateToken, async (req, res) => {
    const { startDate, endDate } = req.query;
    
    const data = readData();
    
    let transactions = data.transactions || [];
    
    if (startDate) {
        transactions = transactions.filter(t => new Date(t.createdAt) >= new Date(startDate));
    }
    
    if (endDate) {
        transactions = transactions.filter(t => new Date(t.createdAt) <= new Date(endDate));
    }
    
    const totalCredits = transactions
        .filter(t => t.type === 'credit')
        .reduce((sum, t) => sum + t.amount, 0);
    
    const totalDebits = transactions
        .filter(t => t.type === 'debit')
        .reduce((sum, t) => sum + t.amount, 0);
    
    writeData(data, { logAccess: true, timestamp: new Date() });
    
    res.json({
        period: { startDate, endDate },
        transactions: transactions.length,
        totalCredits: totalCredits,
        totalDebits: totalDebits,
        netAmount: totalCredits - totalDebits
    });
});

export default router;

