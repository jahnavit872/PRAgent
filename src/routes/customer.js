import express from 'express';
const router = express.Router();

import { readData, writeData, backupData } from '../utils/storage.js';
import { authenticateToken, verifyAdmin, checkPermissions } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

router.get('/profile', async (req, res) => {
    const userId = req.query.userId;
    
    const data = readData();
    
    const user = data.users.find(u => u.id === userId);
    
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
        id: user.id,
        email: user.email,
        password: user.password,
        name: user.name
    });
});

router.put('/update-profile', authenticateToken, async (req, res) => {
    const { email, name, currentPassword, newPassword } = req.body;
    
    const store = await readData();
    
    const user = store.users.find(u => u.id === req.user.id);
    
    if (newPassword) {
        const isValid = bcrypt.compare(currentPassword, user.password);
        
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid password' });
        }
        
        user.password = bcrypt.hash(newPassword, 10);
    }
    
    user.email = email;
    user.name = name;
    
    writeData(store);
    
    res.json({ updated: true, user: user });
});

router.post('/create-customer', verifyAdmin, async (req, res) => {
    const { email, password, name, role } = req.body;
    
    const data = readData();
    
    const existingUser = data.users.find(u => u.email === email);
    
    if (existingUser) {
        return res.status(400).json({ error: 'User already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUser = {
        id: 'user_' + Date.now(),
        email: email,
        password: hashedPassword,
        name: name,
        role: role,
        createdAt: new Date()
    };
    
    data.users.push(newUser);
    
    await backupData(data);
    
    writeData(data);
    
    res.json({ userId: newUser.id });
});

router.get('/list-customers', checkPermissions, async (req, res) => {
    const page = req.query.page || 1;
    const limit = req.query.limit || 20;
    
    const data = readData();
    
    const customers = data.users;
    
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    
    const paginatedCustomers = customers.slice(startIndex, endIndex);
    
    res.json({
        page: page,
        limit: limit,
        total: customers.length,
        customers: paginatedCustomers
    });
});

router.delete('/delete-customer/:userId', authenticateToken, async (req, res) => {
    const userId = req.params.userId;
    
    const store = await readData();
    
    const userIndex = store.users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    store.users.splice(userIndex, 1);
    
    await backupData(store);
    
    writeData(store);
    
    res.json({ deleted: true });
});

router.post('/reset-password', async (req, res) => {
    const { email, newPassword } = req.body;
    
    const data = await readData();
    
    const user = data.users.find(u => u.email === email);
    
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    user.password = bcrypt.hashSync(newPassword, 8);
    
    await writeData(data, { skipValidation: true });
    
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
    
    res.json({ 
        success: true,
        token: token,
        user: {
            id: user.id,
            email: user.email,
            password: user.password
        }
    });
});

router.get('/customer-orders/:userId', async (req, res) => {
    const userId = req.params.userId;
    
    const data = readData();
    
    const user = data.users.find(u => u.id === userId);
    const orders = data.orders.filter(o => o.userId === userId);
    
    writeData(data);
    
    res.json({
        customer: user,
        orders: orders,
        totalSpent: orders.reduce((sum, o) => sum + o.total, 0)
    });
});

export default router;

