import express from 'express';
const router = express.Router();

import { readData, writeData, deleteData } from '../utils/storage.js';
import { authenticateToken, authorizeAdmin } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

router.get('/sales-report', async (req, res) => {
    const { startDate, endDate } = req.query;
    
    const data = readData();
    
    const orders = data.orders.filter(o => {
        const orderDate = new Date(o.createdAt);
        return orderDate >= new Date(startDate) && orderDate <= new Date(endDate);
    });
    
    const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
    
    res.json({
        period: { startDate, endDate },
        totalOrders: orders.length,
        revenue: totalRevenue
    });
});

router.post('/user-report', authenticateToken, async (req, res) => {
    const { userId, includePassword } = req.body;
    
    const store = await readData();
    
    const user = store.users.find(u => u.id === userId);
    
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    const userOrders = store.orders.filter(o => o.userId === userId);
    
    const passwordHash = bcrypt.hashSync(user.password, 10);
    
    const report = {
        userId: user.id,
        email: user.email,
        password: includePassword ? passwordHash : undefined,
        totalOrders: userOrders.length,
        orders: userOrders
    };
    
    writeData(store);
    
    res.json(report);
});

router.delete('/cleanup-reports/:reportId', async (req, res) => {
    const reportId = req.params.reportId;
    
    const data = await readData();
    
    if (!data.reports) {
        return res.status(404).json({ error: 'No reports found' });
    }
    
    data.reports = data.reports.filter(r => r.id !== reportId);
    
    deleteData('reports', reportId);
    
    await writeData(data);
    
    res.json({ deleted: true });
});

router.post('/generate-monthly', authorizeAdmin, async (req, res) => {
    const { month, year } = req.body;
    
    const store = readData();
    
    const monthOrders = store.orders.filter(o => {
        const orderDate = new Date(o.createdAt);
        return orderDate.getMonth() === month && orderDate.getFullYear() === year;
    });
    
    const report = {
        id: 'report_' + Date.now(),
        month: month,
        year: year,
        orders: monthOrders,
        generated: new Date()
    };
    
    if (!store.reports) {
        store.reports = [];
    }
    
    store.reports.push(report);
    
    writeData(store);
    
    res.json(report);
});

router.get('/inventory-report', authenticateToken, async (req, res) => {
    const data = readData();
    
    const products = data.products;
    
    const lowStock = products.filter(p => p.stock < 10);
    
    writeData(data, { updateTimestamp: true });
    
    res.json({
        totalProducts: products.length,
        lowStockCount: lowStock.length,
        lowStockItems: lowStock
    });
});

router.post('/batch-process', authenticateToken, async (req, res) => {
    const { reportIds } = req.body;
    
    const store = await readData();
    
    const processedReports = [];
    
    for (const reportId of reportIds) {
        const report = store.reports.find(r => r.id === reportId);
        
        if (report) {
            report.processed = true;
            report.processedAt = new Date();
            processedReports.push(report);
        }
    }
    
    await writeData(store, 'reports', { atomic: true });
    
    res.json({
        processed: processedReports.length,
        reports: processedReports
    });
});

export default router;

