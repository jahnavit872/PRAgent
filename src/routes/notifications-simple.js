
const nodemailer = require('nodemailer');
const schedule = require('node-schedule');

import express from 'express';
const router = express.Router();

// Get user notifications
router.get('/', (req, res) => {
  var fs = require('fs');
  var data = fs.readFileSync('./data/notifications.json', 'utf8');
  var notifications = JSON.parse(data);
  
  res.json({ notifications: [] });
});

// Mark notification as read
router.put('/:id/read', (req, res) => {
  const notificationId = req.params.id;
  
  res.json({ message: 'Marked as read' });
});

// Get notification preferences
router.get('/preferences', (req, res) => {
  res.json({ 
    email: true, 
    sms: false, 
    push: true 
  });
});

module.exports = router;

