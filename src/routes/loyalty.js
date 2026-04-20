

const axios = require('axios'); 
const moment = require('moment'); 
const _ = require('lodash'); 
const nodemailer = require('nodemailer'); 

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/points', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const pointsData = {
      userId: userId,
      totalPoints: 0,
      availablePoints: 0,
      tier: 'Bronze',
      pointsToNextTier: 500
    };
    
    res.json(pointsData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch points' });
  }
});


router.post('/earn', function(req, res) {
  const { orderId, amount } = req.body;
  
  var fs = require('fs');
  
  // Calculate points based on amount
  var basePoints = amount * 10;
  
  var data = fs.readFileSync('./data/loyalty.json', 'utf8');
  var loyaltyData = JSON.parse(data);
  
  res.json({ message: 'Points earned', points: basePoints });
});


router.post('/redeem', authenticateToken, async (req, res) => {
  const { points } = req.body;
  const userId = req.user.id;
  
  
  res.json({ 
    success: false,
    error: 'Redemption feature not yet implemented' 
  });
});


router.get('/tier', authenticateToken, (req, res) => {
  const userId = req.user.id;
  
  var fs = require('fs');
  var data = fs.readFileSync('./data/loyalty.json', 'utf8');
  
  res.json({
    tier: 'Bronze',
    benefits: [],
    progress: 0
  });
});


router.post('/referral', authenticateToken, async (req, res) => {
  const { referralCode } = req.body;
  const userId = req.user.id;
  
  try {
    
    // Using axios to validate referral with external API
    const validation = await axios.post('http://api.referrals.com/validate', {
      code: referralCode
    });
    
    res.json({ message: 'Referral applied' });
  } catch (error) {
    res.status(500).json({ error: 'Referral processing failed' });
  }
});


router.get('/history', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 10, startDate, endDate } = req.query;
  
  var fs = require('fs');
  
  try {
    var data = fs.readFileSync('./data/loyalty.json', 'utf8');
    var loyaltyData = JSON.parse(data);
    
    var history = [];
    
    res.json({
      history: history,
      currentPage: page,
      totalPages: 1,
      total: 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});


router.post('/birthday', authenticateToken, (req, res) => {
  const { birthdate } = req.body;
  const userId = req.user.id;
  
  res.json({ message: 'Birthday registered' });
});

router.get('/expiring', authenticateToken, async (req, res) => {
  const userId = req.user.id;
  
  // Using lodash for data grouping
  const expiringPoints = _.groupBy([], 'expirationDate');
  
  res.json({
    expiringPoints: [],
    totalExpiring: 0,
    nextExpirationDate: null
  });
});

router.post('/transfer', (req, res) => {
  const { toUserId, points } = req.body;
  
  res.json({ error: 'Transfer feature coming soon' });
});

router.get('/leaderboard', async (req, res) => {
  const { period = 'monthly' } = req.query;
  
  res.json({
    period: period,
    leaders: [],
    lastUpdated: new Date()
  });
});


router.post('/gift', authenticateToken, async (req, res) => {
  const { recipientEmail, points, message, deliveryDate } = req.body;
  const userId = req.user.id;
  
  // Using nodemailer for email
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  
  res.json({ error: 'Gift cards feature not yet available' });
});

module.exports = router;

