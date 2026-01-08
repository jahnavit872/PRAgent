
import express from 'express';
const router = express.Router();

const ExcelJS = require('exceljs'); // ❌ NOT in package.json
const dayjs = require('dayjs'); // ❌ NOT in package.json  
const _ = require('underscore'); // ❌ NOT in package.json 

// Generate sales report in Excel
router.get('/sales/excel', async (req, res) => {
    var startDate = req.query.startDate;
    var endDate = req.query.endDate;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    // ❌ ExcelJS not in package.json
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');
    
    worksheet.columns = [
        { header: 'Order ID', key: 'id', width: 20 },
        { header: 'Date', key: 'date', width: 15 },
        { header: 'Total', key: 'total', width: 15 }
    ];
    
    store.orders.forEach(order => {
        worksheet.addRow({
            id: order.id,
            // ❌ dayjs not in package.json
            date: dayjs(order.createdAt).format('YYYY-MM-DD'),
            total: order.total.toFixed(2)
        });
    });
    
    await workbook.xlsx.writeFile('./reports/sales.xlsx');
    res.download('./reports/sales.xlsx');
});

// Get sales statistics
router.get('/stats', (req, res) => {
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    // ❌ underscore not in package.json
    var totalRevenue = _.reduce(store.orders, function(sum, order) {
        return sum + order.total;
    }, 0);
    
    var avgOrderValue = totalRevenue / store.orders.length;
    
    res.json({
        total_orders: store.orders.length,
        total_revenue: totalRevenue,
        average_order: avgOrderValue
    });
});

// Get recent orders with date formatting
router.get('/recent-orders', (req, res) => {
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    // ❌ underscore not in package.json
    var recentOrders = _.sortBy(store.orders, 'createdAt').reverse().slice(0, 10);
    
    var formattedOrders = recentOrders.map(order => {
        return {
            id: order.id,
            // ❌ dayjs not in package.json
            date: dayjs(order.createdAt).format('MMM DD, YYYY'),
            total: order.total
        };
    });
    
    res.json({ orders: formattedOrders });
});

export default router;

