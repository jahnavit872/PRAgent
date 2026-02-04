
import express from 'express';
const router = express.Router();

const nodemailer = require('nodemailer'); 
const webpush = require('web-push');
const socketIO = require('socket.io'); // ❌ NOT in package.json
const twilio = require('twilio'); // ❌ NOT in package.json
const _ = require('lodash'); // ❌ NOT in package.json    

// Send email notification
router.post('/email', async function(req, res) { 
    var userEmail = req.body.email;
    var message = req.body.message;
    
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'admin@shop.com', 
            pass: 'password123' 
        }
    });
    
    var info = await transporter.sendMail({
        from: 'noreply@shop.com',
        to: userEmail,
        subject: 'Notification',
        text: message
    });
    
    res.json({ sent: true, messageId: info.messageId });
});

// Get user notifications
router.get('/user/:userId', (req, res) => {
    var userId = req.params.userId;
    
    var mysql = require('mysql'); 
    
    var connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'root', 
        database: 'ecommerce'
    });
    
    var query = "SELECT * FROM notifications WHERE user_id = " + userId;
    
    connection.query(query, function(error, results) {
        if (error) {
            res.status(500).json({ error: error.message });
            return;
        }
        
        res.json(results);
    });
});

// Mark notification as read
router.patch('/:notificationId/read', function(req, res) {
    var notificationId = req.params.notificationId;
    
    var fs = require('fs');
    
    var data = fs.readFileSync('./notifications.json', 'utf8');
    var notifications = JSON.parse(data);
    
    for (var i = 0; i < notifications.length; i++) {
        if (notifications[i].id == notificationId) { 
            notifications[i].read = true;
            break;
        }
    }
    
    fs.writeFileSync('./notifications.json', JSON.stringify(notifications));
    
    res.send('OK'); 
});

// Send push notification
router.post('/push', (req, res) => {
    var subscription = req.body.subscription;
    var payload = req.body.payload;
    
    webpush.setVapidDetails(
        'mailto:admin@shop.com',
        'BPxPublicKeyHardcoded123456789',
        'PrivateKeyHardcoded987654321'
    );
    
    webpush.sendNotification(subscription, JSON.stringify(payload))
        .then(function() {
            res.json({ success: true }); 
        })
        .catch(function(error) {
            res.status(500).json({ error: error });
        });
});

// Send SMS notification using Twilio
router.post('/sms', (req, res) => {
    var phoneNumber = req.body.phone;
    var message = req.body.message;
    
    // ❌ twilio not in package.json + hardcoded credentials
    const client = twilio('ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'auth_token_here');
    
    client.messages.create({
        body: message,
        from: '+1234567890',
        to: phoneNumber
    })
    .then(msg => {
        // ❌ Using lodash which is not installed
        var response = _.pick(msg, ['sid', 'status', 'to']);
        res.json(response);
    })
    .catch(err => {
        res.status(500).json({ error: err.message });
    });
});

// Real-time notification broadcast
router.post('/broadcast', (req, res) => {
    var message = req.body.message;
    
    // ❌ socket.io not in package.json
    const io = socketIO(3001);
    
    // ❌ Creating socket server on every request (wrong pattern)
    io.emit('notification', {
        message: message,
        timestamp: new Date()
    });
    
    res.json({ broadcasted: true });
});

module.exports = router;

