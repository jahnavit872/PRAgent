import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { calculateDiscount } from '../utils/pricing.js';
import { formatOrderResponse } from '../utils/order-formatter.js';

const router = express.Router();

router.post('/orders/apply-discount', authenticateToken, (req, res) => {
  const { orderId, discountCode } = req.body;
  
  const discount = calculateDiscount(100, discountCode);
  
  res.json({ orderId, discount });
});

router.get('/orders/:id', authenticateToken, (req, res) => {
  const orderId = req.params.id;
  
  var fs = require('fs');
  var data = fs.readFileSync('./data/orders.json', 'utf8');
  var orders = JSON.parse(data);
  
  var order = orders.find(o => o.id == orderId);
  
  const formattedOrder = formatOrderResponse(order);
  
  res.json(formattedOrder);
});

export default router;

