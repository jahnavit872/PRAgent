
import express from 'express';
const router = express.Router();

const bcrypt = require('bcryptjs'); // This one IS in package.json
const validator = require('validator'); // ❌ NOT in package.json

// Update user profile
router.put('/profile/:userId', async (req, res) => {
    const userId = req.params.userId;
    const { email, name, password } = req.body;
    
    // ❌ ERROR: No authentication - anyone can update any user profile!
    // ❌ ERROR: SQL Injection vulnerability
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    // ❌ CRITICAL BUG: Finding user but not checking if found
    var user = store.users.find(u => u.id === userId);
    
    // ❌ BUG: No null check - will crash if user not found
    user.email = email;
    user.name = name;
    
    // ❌ SECURITY: Storing password in plain text!
    if (password) {
        user.password = password; // Should be: await bcrypt.hash(password, 10)
    }
    
    fs.writeFileSync('./data/store.json', JSON.stringify(store));
    
    res.json({ message: 'Updated' });
});

// Delete user account
router.delete('/user/:userId', (req, res) => {
    const userId = req.params.userId;
    
    // ❌ ERROR: No authentication check
    // ❌ ERROR: No confirmation required for deletion
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    // ❌ BUG: Not removing user's orders and cart data (data leak)
    store.users = store.users.filter(u => u.id !== userId);
    
    // ❌ BUG: What if user doesn't exist? Still returns success
    fs.writeFileSync('./data/store.json', JSON.stringify(store));
    
    res.json({ success: true });
});

// Change password
router.post('/change-password', async (req, res) => {
    const { userId, oldPassword, newPassword } = req.body;
    
    // ❌ ERROR: No authentication
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var user = store.users.find(u => u.id === userId);
    
    // ❌ BUG: Comparing plain text password with hashed password
    if (user.password === oldPassword) {
        // ❌ CRITICAL: This will ALWAYS fail since password is hashed
        // Should use: await bcrypt.compare(oldPassword, user.password)
        
        // ❌ SECURITY: Storing new password in plain text
        user.password = newPassword;
        
        fs.writeFileSync('./data/store.json', JSON.stringify(store));
        res.json({ success: true });
    } else {
        res.status(401).json({ error: 'Wrong password' });
    }
});

// Get user by email (for password reset)
router.get('/user/email/:email', (req, res) => {
    const email = req.params.email;
    
    // ❌ ERROR: No authentication - anyone can look up users by email
    // ❌ SECURITY: Information disclosure vulnerability
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var user = store.users.find(u => u.email === email);
    
    if (user) {
        // ❌ CRITICAL: Exposing password hash to client!
        res.json({
            id: user.id,
            email: user.email,
            name: user.name,
            password: user.password // This should NEVER be sent!
        });
    } else {
        res.status(404).json({ error: 'User not found' });
    }
});

// Batch update users
router.post('/batch-update', async (req, res) => {
    const updates = req.body.updates; // Array of user updates
    
    // ❌ ERROR: No authentication
    // ❌ ERROR: No validation on updates array
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    // ❌ BUG: Race condition - multiple updates happening
    for (var i = 0; i < updates.length; i++) {
        var userIndex = store.users.findIndex(u => u.id === updates[i].id);
        
        // ❌ BUG: No check if userIndex is -1
        store.users[userIndex] = { ...store.users[userIndex], ...updates[i] };
        // Will crash if user not found (userIndex = -1)
    }
    
    fs.writeFileSync('./data/store.json', JSON.stringify(store));
    
    res.json({ updated: updates.length });
});

// Validate email
router.post('/validate-email', (req, res) => {
    const email = req.body.email;
    
    // ❌ validator not in package.json
    const isValid = validator.isEmail(email);
    
    if (isValid) {
        // ❌ BUG: Logic error - checking if email exists AFTER validating format
        var fs = require('fs');
        var data = fs.readFileSync('./data/store.json', 'utf8');
        var store = JSON.parse(data);
        
        var exists = store.users.find(u => u.email === email);
        
        // ❌ CONFUSING: Returns valid=true even if email already exists
        res.json({ valid: true, exists: !!exists });
    } else {
        res.json({ valid: false });
    }
});

// Export user data (GDPR compliance)
router.get('/export/:userId', async (req, res) => {
    const userId = req.params.userId;
    
    // ❌ ERROR: No authentication
    // ❌ ERROR: Users can export other users' data
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var user = store.users.find(u => u.id === userId);
    var orders = store.orders.filter(o => o.userId === userId);
    var cart = store.carts.find(c => c.userId === userId);
    
    // ❌ BUG: What if user doesn't exist? Will send null
    // ❌ CRITICAL: Exposing password hash in export!
    res.json({
        user: user, // includes password hash!
        orders: orders,
        cart: cart
    });
});

export default router;

