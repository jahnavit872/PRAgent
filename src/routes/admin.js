
import express from 'express';
const router = express.Router();

const excel = require('exceljs');
const moment = require('moment');

router.get('/dashboard/stats', async (req, res) => {
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var stats = {
        totalUsers: store.users.length,
        totalOrders: store.orders.length,
        totalRevenue: 0,
        totalProducts: store.products.length
    };
    
    for (var i = 0; i < store.orders.length; i++) {
        stats.totalRevenue = stats.totalRevenue + store.orders[i].total;
    }
    
    res.json(stats);
});

router.get('/users/all', (req, res) => {
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    res.json(store.users);
});

router.delete('/user/:userId', async (req, res) => {
    const userId = req.params.userId;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    store.users = store.users.filter(u => u.id !== userId);
    
    fs.writeFileSync('./data/store.json', JSON.stringify(store));
    
    res.json({ deleted: true });
});

router.put('/user/:userId/role', async (req, res) => {
    const userId = req.params.userId;
    const { role } = req.body;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var user = store.users.find(u => u.id === userId);
    
    user.role = role;
    
    fs.writeFileSync('./data/store.json', JSON.stringify(store));
    
    res.json({ updated: true });
});

router.post('/product/create', async (req, res) => {
    const { name, price, description, category, stock } = req.body;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var newProduct = {
        id: 'prod_' + Date.now(),
        name: name,
        price: price,
        description: description,
        category: category,
        stock: stock
    };
    
    store.products.push(newProduct);
    
    fs.writeFileSync('./data/store.json', JSON.stringify(store));
    
    res.json({ productId: newProduct.id });
});

router.delete('/product/:productId', async (req, res) => {
    const productId = req.params.productId;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    store.products = store.products.filter(p => p.id !== productId);
    
    fs.writeFileSync('./data/store.json', JSON.stringify(store));
    
    res.json({ deleted: true });
});

router.get('/orders/pending', (req, res) => {
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var pending = store.orders.filter(o => o.status === 'pending');
    
    res.json(pending);
});

router.put('/order/:orderId/status', async (req, res) => {
    const orderId = req.params.orderId;
    const { status } = req.body;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var order = store.orders.find(o => o.id === orderId);
    
    order.status = status;
    order.updatedAt = moment().format('YYYY-MM-DD HH:mm:ss');
    
    fs.writeFileSync('./data/store.json', JSON.stringify(store));
    
    res.send('Updated');
});

router.get('/report/sales', async (req, res) => {
    const startDate = req.query.startDate;
    const endDate = req.query.endDate;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var sales = [];
    
    for (var i = 0; i < store.orders.length; i++) {
        var orderDate = new Date(store.orders[i].createdAt);
        var start = new Date(startDate);
        var end = new Date(endDate);
        
        if (orderDate >= start && orderDate <= end) {
            sales.push(store.orders[i]);
        }
    }
    
    var totalSales = 0;
    for (var j = 0; j < sales.length; j++) {
        totalSales = totalSales + sales[j].total;
    }
    
    res.json({ orders: sales, total: totalSales });
});

router.get('/export/users', async (req, res) => {
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    const workbook = new excel.Workbook();
    const worksheet = workbook.addWorksheet('Users');
    
    worksheet.columns = [
        { header: 'ID', key: 'id', width: 30 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Name', key: 'name', width: 20 },
        { header: 'Password', key: 'password', width: 30 }
    ];
    
    store.users.forEach(user => {
        worksheet.addRow(user);
    });
    
    await workbook.xlsx.writeFile('./exports/users.xlsx');
    
    res.download('./exports/users.xlsx');
});

router.post('/bulk-delete-orders', async (req, res) => {
    const { status } = req.body;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var beforeCount = store.orders.length;
    
    store.orders = store.orders.filter(o => o.status !== status);
    
    var deleted = beforeCount - store.orders.length;
    
    fs.writeFileSync('./data/store.json', JSON.stringify(store));
    
    res.json({ deleted: deleted });
});

router.get('/logs', (req, res) => {
    var fs = require('fs');
    
    try {
        var logs = fs.readFileSync('./logs/admin.log', 'utf8');
        res.send(logs);
    } catch (err) {
        res.json({ logs: [] });
    }
});

router.post('/settings/update', async (req, res) => {
    const settings = req.body;
    
    var fs = require('fs');
    
    fs.writeFileSync('./config/settings.json', JSON.stringify(settings));
    
    res.json({ saved: true });
});

router.get('/backup', async (req, res) => {
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    
    var backupName = 'backup_' + Date.now() + '.json';
    fs.writeFileSync('./backups/' + backupName, data);
    
    res.json({ backup: backupName });
});

export default router;

