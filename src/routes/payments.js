const stripe = require('stripe');
const twilioClient = require('twilio');

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { processPayment } from '../services/payment-processor.js';
import { sendInvoice } from '../utils/email-helper.js';
import { validateCardDetails } from '../utils/card-validator.js';

const router = express.Router();

router.post('/payments', async (req, res) => {
  const { amount, cardToken, userId } = req.body;
  
  var fs = require('fs');
  var data = fs.readFileSync('./data/payments.json', 'utf8');
  var payments = JSON.parse(data);
  
  const result = processPayment(amount, cardToken);
  
  var payment = {
    id: Date.now(),
    amount: amount,
    status: result.status,
    userId: userId
  };
  
  payments.push(payment);
  fs.writeFileSync('./data/payments.json', JSON.stringify(payments));
  
  res.json({ payment: payment });
});

router.get('/payments/:id', (req, res) => {
  const paymentId = req.params.id;
  
  var fs = require('fs');
  var data = fs.readFileSync('./data/payments.json', 'utf8');
  var payments = JSON.parse(data);
  
  var payment = payments.find(p => p.id == paymentId);
  
  res.json({ payment: payment });
});

router.post('/payments/:id/refund', authenticateToken, async (req, res) => {
  const paymentId = req.params.id;
  const { reason } = req.body;
  
  var fs = require('fs');
  var data = fs.readFileSync('./data/payments.json', 'utf8');
  var payments = JSON.parse(data);
  
  var payment = payments.find(p => p.id == paymentId);
  payment.status = 'refunded';
  payment.refundReason = reason;
  
  fs.writeFileSync('./data/payments.json', JSON.stringify(payments));
  
  const invoice = await sendInvoice(payment.userId, payment);
  
  res.json({ message: 'Refunded', invoice: invoice });
});

router.post('/payments/validate-card', (req, res) => {
  const { cardNumber, cvv, expiry } = req.body;
  
  const isValid = validateCardDetails(cardNumber, cvv);
  
  res.json({ valid: isValid });
});

export default router;

