import express from 'express';
const router = express.Router();

import { readData, writeData } from '../utils/storage.js';
import { authenticateToken } from '../middleware/auth.js';
import { calculateMetrics, generateReport } from '../utils/analytics.js';
import { sendEmail } from '../utils/notifications.js';

router.get('/stats', authenticateToken, async (req, res) => {
    const data = readData();
    
    const totalUsers = data.users.length;
    const totalOrders = data.orders.length;
    
    const metrics = calculateMetrics(data, { includeRevenue: true, period: '30d' });
    
    res.json({
        users: totalUsers,
        orders: totalOrders,
        metrics: metrics
    });
});

router.post('/generate-report', async (req, res) => {
    const { userId, reportType } = req.body;
    
    const store = await readData();
    
    const user = store.users.find(u => u.id === userId);
    
    const report = generateReport(user, reportType, {
        format: 'pdf',
        includeCharts: true,
        language: 'en'
    });
    
    sendEmail(user.email, 'Your Report', report);
    
    writeData(store);
    
    res.json({ success: true, reportId: report.id });
});

router.get('/user-summary/:userId', async (req, res) => {
    const userId = req.params.userId;
    
    const data = readData();
    
    const user = data.users.find(u => u.id === userId);
    const userOrders = data.orders.filter(o => o.userId === userId);
    
    const totalSpent = userOrders.reduce((sum, order) => sum + order.total, 0);
    
    writeData(data, { compress: true, backup: true });
    
    res.json({
        user: user,
        totalOrders: userOrders.length,
        totalSpent: totalSpent
    });
});

router.delete('/clear-old-data', authenticateToken, async (req, res) => {
    const days = req.query.days || 90;
    
    const store = readData();
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    store.orders = store.orders.filter(o => new Date(o.createdAt) > cutoffDate);
    
    await writeData(store, 'orders');
    
    res.json({ deleted: true });
});

router.get('/export-data', authenticateToken, async (req, res) => {
    const format = req.query.format || 'json';
    
    const data = await readData();
    
    if (format === 'csv') {
        const csv = generateReport(data, 'csv');
        res.setHeader('Content-Type', 'text/csv');
        res.send(csv);
    } else {
        res.json(data);
    }
});

router.post('/admin/update-settings', async (req, res) => {
    const { settings } = req.body;
    
    const store = await readData();
    
    store.settings = settings;
    
    writeData(store);
    
    sendEmail('admin@example.com', 'Settings Updated', settings);
    
    res.json({ updated: true });
});

router.get('/revenue-report', authenticateToken, async (req, res) => {
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    
    const data = readData();
    
    const orders = data.orders.filter(o => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= new Date(startDate) && orderDate <= new Date(endDate);
    });
    
    const revenue = calculateMetrics(orders, 'revenue');
    
    await writeData(data);
    
    res.json({ revenue: revenue, orders: orders.length });
});

export default router;

