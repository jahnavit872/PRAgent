
import express from 'express';
const router = express.Router();

const mysql = require('mysql2');
const sanitize = require('sanitize-html');

router.get('/search', async (req, res) => {
    const searchTerm = req.query.q;
    
    var connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'password',
        database: 'ecommerce'
    });
    
    var query = "SELECT * FROM users WHERE name LIKE '%" + searchTerm + "%' OR email LIKE '%" + searchTerm + "%'";
    
    connection.query(query, function(error, results) {
        if (error) {
            res.status(500).json({ error: error.message });
        } else {
            res.json({ users: results });
        }
    });
});

router.post('/profile/update', async (req, res) => {
    const { userId, bio, website } = req.body;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var user = store.users.find(u => u.id === userId);
    
    user.bio = bio;
    user.website = website;
    
    fs.writeFileSync('./data/store.json', JSON.stringify(store));
    
    res.json({ success: true });
});

router.get('/profile/:userId', (req, res) => {
    const userId = req.params.userId;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var user = store.users.find(u => u.id === userId);
    
    var profileHtml = `
        <div class="profile">
            <h2>${user.name}</h2>
            <p>${user.bio}</p>
            <a href="${user.website}">Visit Website</a>
        </div>
    `;
    
    res.send(profileHtml);
});

router.post('/comment', async (req, res) => {
    const { userId, productId, comment } = req.body;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    if (!store.comments) {
        store.comments = [];
    }
    
    store.comments.push({
        id: Date.now(),
        userId: userId,
        productId: productId,
        comment: comment,
        createdAt: new Date()
    });
    
    fs.writeFileSync('./data/store.json', JSON.stringify(store));
    
    res.json({ success: true });
});

router.get('/comments/:productId', (req, res) => {
    const productId = req.params.productId;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var comments = store.comments.filter(c => c.productId === productId);
    
    var html = '<div class="comments">';
    for (var i = 0; i < comments.length; i++) {
        var user = store.users.find(u => u.id === comments[i].userId);
        html += '<div class="comment">';
        html += '<strong>' + user.name + '</strong>: ';
        html += comments[i].comment;
        html += '</div>';
    }
    html += '</div>';
    
    res.send(html);
});

router.post('/login-sql', async (req, res) => {
    const { username, password } = req.body;
    
    var connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'password',
        database: 'ecommerce'
    });
    
    var query = "SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "'";
    
    connection.query(query, function(error, results) {
        if (error) {
            res.status(500).json({ error: error.message });
        } else if (results.length > 0) {
            res.json({ success: true, user: results[0] });
        } else {
            res.status(401).json({ success: false });
        }
    });
});

router.get('/user-page/:userId', (req, res) => {
    const userId = req.params.userId;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var user = store.users.find(u => u.id === userId);
    
    var page = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${user.name}'s Profile</title>
        </head>
        <body>
            <h1>Welcome to ${user.name}'s page!</h1>
            <div class="bio">${user.bio}</div>
            <div class="status">${user.status}</div>
            <script>
                var userData = ${JSON.stringify(user)};
                console.log('User data:', userData);
            </script>
        </body>
        </html>
    `;
    
    res.send(page);
});

router.post('/set-status', async (req, res) => {
    const { userId, status } = req.body;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var user = store.users.find(u => u.id === userId);
    
    user.status = status;
    
    fs.writeFileSync('./data/store.json', JSON.stringify(store));
    
    res.json({ success: true });
});

router.get('/search-advanced', async (req, res) => {
    const { name, email, orderBy } = req.query;
    
    var connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'password',
        database: 'ecommerce'
    });
    
    var query = "SELECT * FROM users WHERE 1=1";
    
    if (name) {
        query += " AND name LIKE '%" + name + "%'";
    }
    
    if (email) {
        query += " AND email = '" + email + "'";
    }
    
    if (orderBy) {
        query += " ORDER BY " + orderBy;
    }
    
    connection.query(query, function(error, results) {
        if (error) {
            res.status(500).json({ error: error.message });
        } else {
            res.json({ users: results });
        }
    });
});

export default router;

