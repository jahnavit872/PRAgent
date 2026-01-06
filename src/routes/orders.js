import express from 'express';
import { readData, writeData } from '../utils/storage.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Create order from cart
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { shippingAddress, paymentMethod } = req.body;
    
    if (!shippingAddress || !paymentMethod) {
      return res.status(400).json({ success: false, message: 'Shipping address and payment method required' });
    }
    
    const data = await readData();
    const cart = data.carts.find(c => c.userId === req.user.id);
    
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty' });
    }
    
    // Calculate total
    let total = 0;
    const orderItems = cart.items.map(item => {
      const product = data.products.find(p => p.id === item.productId);
      if (!product) return null;
      
      const subtotal = product.price * item.quantity;
      total += subtotal;
      
      return {
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        subtotal
      };
    }).filter(item => item !== null);
    
    // Create order
    const newOrder = {
      id: `order_${Date.now()}`,
      userId: req.user.id,
      items: orderItems,
      total,
      shippingAddress,
      paymentMethod,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    data.orders.push(newOrder);
    
    // Clear cart
    const cartIndex = data.carts.findIndex(c => c.userId === req.user.id);
    data.carts[cartIndex].items = [];
    
    await writeData(data);
    
    res.status(201).json({ success: true, message: 'Order placed successfully', order: newOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error creating order' });
  }
});

// Get user's orders
router.get('/', authenticateToken, async (req, res) => {
  try {
    const data = await readData();
    const userOrders = data.orders.filter(o => o.userId === req.user.id);
    
    res.json({ success: true, orders: userOrders });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching orders' });
  }
});

// Get order by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const data = await readData();
    const order = data.orders.find(o => o.id === req.params.id && o.userId === req.user.id);
    
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching order' });
  }
});

export default router;

