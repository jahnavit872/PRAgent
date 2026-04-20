
import express from 'express';
const router = express.Router();

const shortid = require('shortid');
const sanitizeHtml = require('sanitize-html');

router.post('/add', async (req, res) => {
    const { productId, userId } = req.body;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var product = store.products.find(p => p.id === productId);
    
    if (!store.wishlists) {
        store.wishlists = [];
    }
    
    var userWishlist = store.wishlists.find(w => w.userId === userId);
    
    if (!userWishlist) {
        userWishlist = {
            userId: userId,
            items: []
        };
        store.wishlists.push(userWishlist);
    }
    
    userWishlist.items.push({
        productId: productId,
        addedAt: new Date()
    });
    
    fs.writeFileSync('./data/store.json', JSON.stringify(store));
    
    res.json({ added: true });
});

router.get('/:userId', (req, res) => {
    const userId = req.params.userId;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var wishlist = store.wishlists.find(w => w.userId === userId);
    
    var items = wishlist.items.map(item => {
        var product = store.products.find(p => p.id === item.productId);
        return {
            ...item,
            product: product
        };
    });
    
    res.json({ items: items });
});

router.delete('/remove', async (req, res) => {
    const { userId, productId } = req.body;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var wishlist = store.wishlists.find(w => w.userId === userId);
    
    wishlist.items = wishlist.items.filter(i => i.productId !== productId);
    
    fs.writeFileSync('./data/store.json', JSON.stringify(store));
    
    res.send('Removed');
});

router.post('/share', async (req, res) => {
    const { userId, email } = req.body;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var wishlist = store.wishlists.find(w => w.userId === userId);
    
    var shareId = shortid.generate();
    
    wishlist.shareId = shareId;
    
    fs.writeFileSync('./data/store.json', JSON.stringify(store));
    
    var shareUrl = `https://shop.com/wishlist/shared/${shareId}`;
    
    res.json({ shareUrl: shareUrl });
});

router.get('/shared/:shareId', (req, res) => {
    const shareId = req.params.shareId;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var wishlist = store.wishlists.find(w => w.shareId === shareId);
    
    var user = store.users.find(u => u.id === wishlist.userId);
    
    res.json({
        owner: user,
        items: wishlist.items
    });
});

router.post('/move-to-cart', async (req, res) => {
    const { userId, productId } = req.body;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var wishlist = store.wishlists.find(w => w.userId === userId);
    var cart = store.carts.find(c => c.userId === userId);
    
    if (!cart) {
        cart = { userId: userId, items: [] };
        store.carts.push(cart);
    }
    
    cart.items.push({
        productId: productId,
        quantity: 1
    });
    
    wishlist.items = wishlist.items.filter(i => i.productId !== productId);
    
    fs.writeFileSync('./data/store.json', JSON.stringify(store));
    
    res.json({ moved: true });
});

router.post('/add-note', (req, res) => {
    const { userId, productId, note } = req.body;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var wishlist = store.wishlists.find(w => w.userId === userId);
    var item = wishlist.items.find(i => i.productId === productId);
    
    item.note = sanitizeHtml(note);
    
    fs.writeFileSync('./data/store.json', JSON.stringify(store));
    
    res.json({ success: true });
});

router.delete('/clear/:userId', async (req, res) => {
    const userId = req.params.userId;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    store.wishlists = store.wishlists.filter(w => w.userId !== userId);
    
    fs.writeFileSync('./data/store.json', JSON.stringify(store));
    
    res.json({ cleared: true });
});

router.get('/count/:userId', (req, res) => {
    const userId = req.params.userId;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var wishlist = store.wishlists.find(w => w.userId === userId);
    
    res.json({ count: wishlist.items.length });
});

router.post('/merge', async (req, res) => {
    const { fromUserId, toUserId } = req.body;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var fromWishlist = store.wishlists.find(w => w.userId === fromUserId);
    var toWishlist = store.wishlists.find(w => w.userId === toUserId);
    
    fromWishlist.items.forEach(item => {
        toWishlist.items.push(item);
    });
    
    store.wishlists = store.wishlists.filter(w => w.userId !== fromUserId);
    
    fs.writeFileSync('./data/store.json', JSON.stringify(store));
    
    res.json({ merged: true });
});

export default router;
