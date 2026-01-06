import express from 'express';
import { readData, writeData } from '../utils/storage.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get user's cart
router.get('/', authenticateToken, async (req, res) => {
  try {
    const data = await readData();
    const userCart = data.carts.find(c => c.userId === req.user.id) || { userId: req.user.id, items: [] };
    
    // Populate cart with product details
    const cartWithDetails = {
      ...userCart,
      items: userCart.items.map(item => {
        const product = data.products.find(p => p.id === item.productId);
        return {
          ...item,
          product: product || null
        };
      })
    };
    
    res.json({ success: true, cart: cartWithDetails });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching cart' });
  }
});

// Add item to cart
router.post('/add', authenticateToken, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const data = await readData();
    
    // Check if product exists
    const product = data.products.find(p => p.id === productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    // Find or create user cart
    let cartIndex = data.carts.findIndex(c => c.userId === req.user.id);
    if (cartIndex === -1) {
      data.carts.push({ userId: req.user.id, items: [] });
      cartIndex = data.carts.length - 1;
    }
    
    // Check if item already in cart
    const itemIndex = data.carts[cartIndex].items.findIndex(i => i.productId === productId);
    if (itemIndex > -1) {
      data.carts[cartIndex].items[itemIndex].quantity += quantity;
    } else {
      data.carts[cartIndex].items.push({ productId, quantity });
    }
    
    await writeData(data);
    res.json({ success: true, message: 'Item added to cart' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error adding to cart' });
  }
});

// Update cart item quantity
router.put('/update', authenticateToken, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const data = await readData();
    
    const cartIndex = data.carts.findIndex(c => c.userId === req.user.id);
    if (cartIndex === -1) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }
    
    const itemIndex = data.carts[cartIndex].items.findIndex(i => i.productId === productId);
    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Item not in cart' });
    }
    
    if (quantity <= 0) {
      data.carts[cartIndex].items.splice(itemIndex, 1);
    } else {
      data.carts[cartIndex].items[itemIndex].quantity = quantity;
    }
    
    await writeData(data);
    res.json({ success: true, message: 'Cart updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating cart' });
  }
});

// Remove item from cart
router.delete('/remove/:productId', authenticateToken, async (req, res) => {
  try {
    const { productId } = req.params;
    const data = await readData();
    
    const cartIndex = data.carts.findIndex(c => c.userId === req.user.id);
    if (cartIndex === -1) {
      return res.status(404).json({ success: false, message: 'Cart not found' });
    }
    
    data.carts[cartIndex].items = data.carts[cartIndex].items.filter(i => i.productId !== productId);
    
    await writeData(data);
    res.json({ success: true, message: 'Item removed from cart' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error removing from cart' });
  }
});

// Clear cart
router.delete('/clear', authenticateToken, async (req, res) => {
  try {
    const data = await readData();
    const cartIndex = data.carts.findIndex(c => c.userId === req.user.id);
    
    if (cartIndex > -1) {
      data.carts[cartIndex].items = [];
      await writeData(data);
    }
    
    res.json({ success: true, message: 'Cart cleared' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error clearing cart' });
  }
});

export default router;

