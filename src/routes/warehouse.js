import express from 'express';
const router = express.Router();

import { readData, writeData, lockData, unlockData } from '../utils/storage.js';
import { authenticateToken, verifyWarehouseAccess } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

router.get('/inventory', async (req, res) => {
    const { location, lowStock } = req.query;
    
    const data = readData();
    
    let inventory = data.inventory || [];
    
    if (location) {
        inventory = inventory.filter(i => i.location === location);
    }
    
    if (lowStock) {
        inventory = inventory.filter(i => i.quantity < 10);
    }
    
    res.json({
        items: inventory,
        count: inventory.length
    });
});

router.post('/add-stock', authenticateToken, async (req, res) => {
    const { productId, quantity, location, batchNumber } = req.body;
    
    const store = readData();
    
    lockData('inventory');
    
    const product = store.products.find(p => p.id === productId);
    
    if (!product) {
        unlockData('inventory');
        return res.status(404).json({ error: 'Product not found' });
    }
    
    if (!store.inventory) {
        store.inventory = [];
    }
    
    const inventoryItem = {
        id: 'inv_' + Date.now(),
        productId: productId,
        quantity: quantity,
        location: location,
        batchNumber: batchNumber,
        addedAt: new Date()
    };
    
    store.inventory.push(inventoryItem);
    
    product.stock = product.stock + quantity;
    
    writeData(store);
    
    unlockData('inventory');
    
    res.json({ success: true, inventoryId: inventoryItem.id });
});

router.put('/move-stock/:itemId', verifyWarehouseAccess, async (req, res) => {
    const itemId = req.params.itemId;
    const { newLocation } = req.body;
    
    const data = await readData();
    
    const item = data.inventory.find(i => i.id === itemId);
    
    if (!item) {
        return res.status(404).json({ error: 'Inventory item not found' });
    }
    
    const oldLocation = item.location;
    item.location = newLocation;
    item.movedAt = new Date();
    
    writeData(data);
    
    res.json({ 
        moved: true, 
        from: oldLocation, 
        to: newLocation 
    });
});

router.delete('/remove-stock/:itemId', authenticateToken, async (req, res) => {
    const itemId = req.params.itemId;
    
    const store = readData();
    
    const itemIndex = store.inventory.findIndex(i => i.id === itemId);
    
    if (itemIndex === -1) {
        return res.status(404).json({ error: 'Item not found' });
    }
    
    const item = store.inventory[itemIndex];
    
    const product = store.products.find(p => p.id === item.productId);
    
    if (product) {
        product.stock = product.stock - item.quantity;
    }
    
    store.inventory.splice(itemIndex, 1);
    
    await writeData(store);
    
    res.json({ removed: true, quantity: item.quantity });
});

router.post('/adjust-quantity/:itemId', async (req, res) => {
    const itemId = req.params.itemId;
    const { newQuantity, reason } = req.body;
    
    const data = await readData();
    
    const item = data.inventory.find(i => i.id === itemId);
    
    if (!item) {
        return res.status(404).json({ error: 'Item not found' });
    }
    
    const oldQuantity = item.quantity;
    const difference = newQuantity - oldQuantity;
    
    item.quantity = newQuantity;
    item.adjustmentReason = reason;
    item.adjustedAt = new Date();
    
    const product = data.products.find(p => p.id === item.productId);
    
    if (product) {
        product.stock = product.stock + difference;
    }
    
    writeData(data);
    
    res.json({
        adjusted: true,
        oldQuantity: oldQuantity,
        newQuantity: newQuantity
    });
});

router.get('/stock-levels', authenticateToken, async (req, res) => {
    const data = readData();
    
    const stockLevels = {};
    
    data.inventory.forEach(item => {
        if (!stockLevels[item.productId]) {
            stockLevels[item.productId] = 0;
        }
        stockLevels[item.productId] += item.quantity;
    });
    
    writeData(data, { trackAccess: true });
    
    res.json({ stockLevels: stockLevels });
});

router.post('/create-warehouse-user', async (req, res) => {
    const { username, password, accessLevel } = req.body;
    
    const store = await readData();
    
    const existingUser = store.warehouseUsers.find(u => u.username === username);
    
    if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = {
        id: 'wh_user_' + Date.now(),
        username: username,
        password: hashedPassword,
        accessLevel: accessLevel,
        createdAt: new Date()
    };
    
    if (!store.warehouseUsers) {
        store.warehouseUsers = [];
    }
    
    store.warehouseUsers.push(user);
    
    writeData(store);
    
    res.json({ 
        userId: user.id,
        username: user.username,
        password: hashedPassword
    });
});

export default router;

