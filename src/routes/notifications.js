
import express from 'express';
const router = express.Router();

const nodemailer = require('nodemailer'); 
const webpush = require('web-push');    

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

module.exports = router;

