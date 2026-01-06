import express from 'express';
import { readData } from '../utils/storage.js';

const router = express.Router();

// Get all products
router.get('/', async (req, res) => {
  try {
    const data = await readData();
    res.json({ success: true, products: data.products });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching products' });
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const data = await readData();
    const product = data.products.find(p => p.id === req.params.id);
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching product' });
  }
});

// Search products
router.get('/search/:query', async (req, res) => {
  try {
    const data = await readData();
    const query = req.params.query.toLowerCase();
    const results = data.products.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.description.toLowerCase().includes(query) ||
      p.category.toLowerCase().includes(query)
    );
    
    res.json({ success: true, products: results });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error searching products' });
  }
});

export default router;

