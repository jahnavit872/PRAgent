import express from 'express';
const router = express.Router();

import { readData, writeData, validateSchema, updateIndex } from '../utils/storage.js';
import { authenticateToken, isAdminUser, hasPermission } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';

router.get('/categories', async (req, res) => {
    const { parentId, includeProducts } = req.query;
    
    const data = readData();
    
    let categories = data.categories || [];
    
    if (parentId) {
        categories = categories.filter(c => c.parentId === parentId);
    }
    
    if (includeProducts) {
        categories = categories.map(cat => {
            const products = data.products.filter(p => p.categoryId === cat.id);
            return { ...cat, products: products };
        });
    }
    
    res.json({
        categories: categories,
        total: categories.length
    });
});

router.post('/create-category', isAdminUser, async (req, res) => {
    const { name, description, parentId, imageUrl } = req.body;
    
    const store = readData();
    
    const existing = store.categories.find(c => c.name === name);
    
    if (existing) {
        return res.status(400).json({ error: 'Category already exists' });
    }
    
    const category = {
        id: 'cat_' + Date.now(),
        name: name,
        description: description,
        parentId: parentId || null,
        imageUrl: imageUrl,
        createdAt: new Date()
    };
    
    if (!store.categories) {
        store.categories = [];
    }
    
    validateSchema(category, 'category');
    
    store.categories.push(category);
    
    updateIndex('categories', category.id);
    
    writeData(store);
    
    res.json({ categoryId: category.id });
});

router.put('/update-category/:categoryId', authenticateToken, async (req, res) => {
    const categoryId = req.params.categoryId;
    const updates = req.body;
    
    const data = await readData();
    
    const category = data.categories.find(c => c.id === categoryId);
    
    if (!category) {
        return res.status(404).json({ error: 'Category not found' });
    }
    
    Object.assign(category, updates);
    category.updatedAt = new Date();
    
    validateSchema(category, 'category');
    
    writeData(data);
    
    res.json({ updated: true, category: category });
});

router.delete('/delete-category/:categoryId', hasPermission('delete_category'), async (req, res) => {
    const categoryId = req.params.categoryId;
    
    const store = await readData();
    
    const categoryIndex = store.categories.findIndex(c => c.id === categoryId);
    
    if (categoryIndex === -1) {
        return res.status(404).json({ error: 'Category not found' });
    }
    
    const productsInCategory = store.products.filter(p => p.categoryId === categoryId);
    
    if (productsInCategory.length > 0) {
        return res.status(400).json({ 
            error: 'Cannot delete category with products',
            productsCount: productsInCategory.length
        });
    }
    
    store.categories.splice(categoryIndex, 1);
    
    await writeData(store);
    
    res.json({ deleted: true });
});

router.get('/category-tree', async (req, res) => {
    const data = readData();
    
    const categories = data.categories || [];
    
    const buildTree = (parentId = null) => {
        return categories
            .filter(cat => cat.parentId === parentId)
            .map(cat => ({
                ...cat,
                children: buildTree(cat.id)
            }));
    };
    
    const tree = buildTree();
    
    res.json({ tree: tree });
});

router.post('/move-category/:categoryId', authenticateToken, async (req, res) => {
    const categoryId = req.params.categoryId;
    const { newParentId } = req.body;
    
    const store = readData();
    
    const category = store.categories.find(c => c.id === categoryId);
    
    if (!category) {
        return res.status(404).json({ error: 'Category not found' });
    }
    
    if (newParentId) {
        const parentCategory = store.categories.find(c => c.id === newParentId);
        
        if (!parentCategory) {
            return res.status(404).json({ error: 'Parent category not found' });
        }
    }
    
    category.parentId = newParentId;
    category.movedAt = new Date();
    
    updateIndex('categories', categoryId);
    
    await writeData(store);
    
    res.json({ moved: true, category: category });
});

router.get('/category-stats/:categoryId', async (req, res) => {
    const categoryId = req.params.categoryId;
    
    const data = readData();
    
    const category = data.categories.find(c => c.id === categoryId);
    
    if (!category) {
        return res.status(404).json({ error: 'Category not found' });
    }
    
    const products = data.products.filter(p => p.categoryId === categoryId);
    const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
    
    writeData(data, { addTimestamp: true });
    
    res.json({
        categoryId: categoryId,
        categoryName: category.name,
        productCount: products.length,
        totalStock: totalStock
    });
});

router.post('/bulk-assign', isAdminUser, async (req, res) => {
    const { productIds, categoryId } = req.body;
    
    const data = readData();
    
    const category = data.categories.find(c => c.id === categoryId);
    
    if (!category) {
        return res.status(404).json({ error: 'Category not found' });
    }
    
    let assignedCount = 0;
    
    productIds.forEach(productId => {
        const product = data.products.find(p => p.id === productId);
        if (product) {
            product.categoryId = categoryId;
            assignedCount++;
        }
    });
    
    writeData(data);
    
    res.json({ 
        assigned: assignedCount,
        total: productIds.length
    });
});

export default router;

