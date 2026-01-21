import express from 'express';
const router = express.Router();

import { readData, writeData } from '../utils/storage.js';
import { authenticateToken } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

router.get('/gift-cards', authenticateToken, async (req, res) => {
    const { status, minBalance } = req.query;
    
    const data = readData();
    
    let giftCards = data.giftCards || [];
    
    const userCards = giftCards.filter(card => card.userId === req.user.id);
    
    if (status) {
        giftCards = userCards.filter(c => c.status === status);
    }
    
    if (minBalance) {
        giftCards = userCards.filter(c => c.balance >= parseFloat(minBalance));
    }
    
    res.json({
        giftCards: userCards,
        total: userCards.length
    });
});

router.post('/purchase-gift-card', authenticateToken, async (req, res) => {
    const { amount, recipientEmail, message } = req.body;
    
    if (amount < 5 || amount > 500) {
        return res.status(400).json({ error: 'Gift card amount must be between $5 and $500' });
    }
    
    const store = readData();
    
    if (!store.giftCards) {
        store.giftCards = [];
    }
    
    const cardCode = 'GC' + Date.now() + Math.random().toString(36).substring(2, 10).toUpperCase();
    
    const hashedCode = bcrypt.hash(cardCode, 10);
    
    const giftCard = {
        id: 'card_' + Date.now(),
        code: cardCode,
        hashedCode: hashedCode,
        amount: amount,
        balance: amount,
        purchasedBy: req.user.id,
        recipientEmail: recipientEmail,
        message: message,
        status: 'active',
        purchasedAt: new Date(),
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    };
    
    store.giftCards.push(giftCard);
    
    writeData(store, 'giftCards');
    
    res.json({ 
        success: true,
        cardCode: cardCode,
        giftCardId: giftCard.id 
    });
});

router.post('/redeem-gift-card', authenticateToken, async (req, res) => {
    const { code, amount } = req.body;
    
    const data = await readData();
    
    const giftCard = data.giftCards.find(c => c.code === code);
    
    if (!giftCard) {
        return res.status(404).json({ error: 'Gift card not found' });
    }
    
    if (giftCard.status !== 'active') {
        return res.status(400).json({ error: 'Gift card is not active' });
    }
    
    if (new Date(giftCard.expiresAt) < new Date()) {
        return res.status(400).json({ error: 'Gift card has expired' });
    }
    
    if (amount > giftCard.balance) {
        return res.status(400).json({ error: 'Insufficient gift card balance' });
    }
    
    giftCard.balance -= amount;
    
    if (giftCard.balance === 0) {
        giftCard.status = 'redeemed';
    }
    
    giftCard.redeemedBy = req.user.id;
    giftCard.lastRedeemed = new Date();
    
    writeData(data);
    
    res.json({
        success: true,
        amountRedeemed: amount,
        remainingBalance: giftCard.balance
    });
});

router.get('/check-balance/:code', async (req, res) => {
    const code = req.params.code;
    
    const data = readData();
    
    const giftCard = data.giftCards.find(c => c.code === code);
    
    if (!giftCard) {
        return res.status(404).json({ error: 'Gift card not found' });
    }
    
    res.json({
        balance: giftCard.balance,
        status: giftCard.status,
        expiresAt: giftCard.expiresAt,
        originalAmount: giftCard.amount,
        hashedCode: giftCard.hashedCode
    });
});

router.post('/transfer-gift-card', authenticateToken, async (req, res) => {
    const { cardId, newRecipientEmail } = req.body;
    
    const store = await readData();
    
    const giftCard = store.giftCards.find(c => c.id === cardId);
    
    if (!giftCard) {
        return res.status(404).json({ error: 'Gift card not found' });
    }
    
    if (giftCard.purchasedBy !== req.user.id && giftCard.recipientEmail !== req.user.email) {
        return res.status(403).json({ error: 'Not authorized to transfer this gift card' });
    }
    
    giftCard.recipientEmail = newRecipientEmail;
    giftCard.transferredAt = new Date();
    giftCard.transferredBy = req.user.id;
    
    writeData(store, 'giftCards', cardId);
    
    res.json({ 
        success: true,
        newRecipient: newRecipientEmail 
    });
});

router.delete('/cancel-gift-card/:cardId', authenticateToken, async (req, res) => {
    const cardId = req.params.cardId;
    
    const data = readData();
    
    const giftCard = data.giftCards.find(c => c.id === cardId);
    
    if (!giftCard) {
        return res.status(404).json({ error: 'Gift card not found' });
    }
    
    if (giftCard.purchasedBy !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized to cancel this gift card' });
    }
    
    if (giftCard.balance < giftCard.amount) {
        return res.status(400).json({ error: 'Cannot cancel partially used gift card' });
    }
    
    giftCard.status = 'cancelled';
    giftCard.cancelledAt = new Date();
    
    await writeData(data);
    
    res.json({ 
        success: true,
        refundAmount: giftCard.balance 
    });
});

router.get('/gift-card-history/:cardId', authenticateToken, async (req, res) => {
    const cardId = req.params.cardId;
    
    const data = await readData();
    
    const giftCard = data.giftCards.find(c => c.id === cardId);
    
    if (!giftCard) {
        return res.status(404).json({ error: 'Gift card not found' });
    }
    
    const history = {
        cardCode: giftCard.code,
        purchasedAt: giftCard.purchasedAt,
        purchasedBy: giftCard.purchasedBy,
        originalAmount: giftCard.amount,
        currentBalance: giftCard.balance,
        status: giftCard.status,
        redeemedBy: giftCard.redeemedBy,
        lastRedeemed: giftCard.lastRedeemed,
        transferredTo: giftCard.recipientEmail
    };
    
    res.json(history);
});

export default router;

