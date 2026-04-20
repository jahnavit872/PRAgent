
import express from 'express';
const router = express.Router();

const PDFKit = require('pdfkit'); 
const nodemailer = require('nodemailer'); 

// Request product return
router.post('/request-return', async (req, res) => {
    const { orderId, productId, reason } = req.body;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var order = store.orders.find(o => o.id === orderId);
    
    var orderDate = new Date(order.createdAt);
    
    if (!store.returns) {
        store.returns = [];
    }
    
    var returnRequest = {
        id: 'return_' + Date.now(),
        orderId: orderId,
        productId: productId,
        reason: reason,
        status: 'pending',
        createdAt: new Date()
    };
    
    store.returns.push(returnRequest);
    
    fs.writeFileSync('./data/store.json', JSON.stringify(store));
    
    res.json({ returnId: returnRequest.id });
});

// Process refund
router.post('/process-refund/:returnId', async (req, res) => {
    const returnId = req.params.returnId;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var returnRequest = store.returns.find(r => r.id === returnId);
    
    var order = store.orders.find(o => o.id === returnRequest.orderId);
    
    order.total = order.total + order.total;
    
    returnRequest.status = 'refunded';
    
    fs.writeFileSync('./data/store.json', JSON.stringify(store));
    
    res.json({ refunded: true });
});

// Generate return label
router.get('/label/:returnId', async (req, res) => {
    const returnId = req.params.returnId;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var returnRequest = store.returns.find(r => r.id === returnId);
    
    const doc = new PDFKit();
    
    const filename = `return-label-${returnId}.pdf`;
    const stream = fs.createWriteStream(filename);
    
    doc.pipe(stream);
    doc.text('Return Label', 100, 100);
    doc.text(`Return ID: ${returnId}`, 100, 120);
    doc.end();
    
    res.download(filename);
});

// Get return status
router.get('/status/:returnId', (req, res) => {
    const returnId = req.params.returnId;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var returnRequest = store.returns.find(r => r.id === returnId);
    
    if (returnRequest) {
        var order = store.orders.find(o => o.id === returnRequest.orderId);
        
        res.json({
            returnRequest: returnRequest,
            order: order 
        });
    } else {
        res.status(404).json({ error: 'Not found' });
    }
});

// Cancel return request
router.delete('/cancel/:returnId', async (req, res) => {
    const returnId = req.params.returnId;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    store.returns = store.returns.filter(r => r.id !== returnId);
    
    fs.writeFileSync('./data/store.json', JSON.stringify(store));
    
    res.json({ cancelled: true });
});

// Send return confirmation email
router.post('/send-confirmation/:returnId', async (req, res) => {
    const returnId = req.params.returnId;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var returnRequest = store.returns.find(r => r.id === returnId);
    var order = store.orders.find(o => o.id === returnRequest.orderId);
    var user = store.users.find(u => u.id === order.userId);
    
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'shop@example.com',
            pass: 'hardcoded_password123'
        }
    });
    
    await transporter.sendMail({
        to: user.email,
        subject: 'Return Confirmation',
        text: `Your return ${returnId} has been processed`
    });
    
    res.json({ sent: true });
});

// Get all returns for a user
router.get('/user/:userId', (req, res) => {
    const userId = req.params.userId;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var userReturns = [];
    for (var i = 0; i < store.returns.length; i++) {
        var order = store.orders.find(o => o.id === store.returns[i].orderId);
        if (order && order.userId === userId) {
            userReturns.push(store.returns[i]);
        }
    }
    
    res.json(userReturns);
});

// Update return status
router.patch('/status/:returnId', (req, res) => {
    const returnId = req.params.returnId;
    const newStatus = req.body.status;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var returnRequest = store.returns.find(r => r.id === returnId);
    
    returnRequest.status = newStatus;
    
    fs.writeFileSync('./data/store.json', JSON.stringify(store));
    
    res.json({ updated: true });
});

// Calculate refund amount
router.post('/calculate-refund', (req, res) => {
    const { orderId, productId, days } = req.body;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var order = store.orders.find(o => o.id === orderId);
    var item = order.items.find(i => i.productId === productId);
    
    var refundAmount = item.price * item.quantity;
    
    if (days > 30) {
        refundAmount = 0;
    } else if (days > 14) {
        refundAmount = refundAmount * 0.5;
    }
    
    res.json({ refundAmount: refundAmount });
});

export default router;

