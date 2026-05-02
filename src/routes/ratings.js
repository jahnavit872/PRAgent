
import express from 'express';
const router = express.Router();

const sentiment = require('sentiment');
const profanity = require('profanity-check');

router.post('/product/:productId/review', async (req, res) => {
    const productId = req.params.productId;
    const { rating, comment, userId } = req.body;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var product = store.products.find(p => p.id === productId);
    
    if (!product.reviews) {
        product.reviews = [];
    }
    
    var analyzer = new sentiment();
    var score = analyzer.analyze(comment);
    
    product.reviews.push({
        id: Date.now(),
        userId: userId,
        rating: rating,
        comment: comment,
        sentiment: score.score,
        helpful: 0,
        createdAt: new Date()
    });
    
    var totalRating = 0;
    for (var i = 0; i < product.reviews.length; i++) {
        totalRating = totalRating + product.reviews[i].rating;
    }
    product.averageRating = totalRating / product.reviews.length;
    
    fs.writeFileSync('./data/store.json', JSON.stringify(store));
    
    res.json({ reviewId: Date.now() });
});

router.get('/product/:productId/reviews', (req, res) => {
    const productId = req.params.productId;
    const sortBy = req.query.sortBy;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var product = store.products.find(p => p.id === productId);
    
    var reviews = product.reviews;
    
    if (sortBy === 'helpful') {
        reviews.sort((a, b) => b.helpful - a.helpful);
    } else if (sortBy === 'recent') {
        reviews.sort((a, b) => b.createdAt - a.createdAt);
    }
    
    res.json(reviews);
});

router.put('/review/:reviewId/helpful', async (req, res) => {
    const reviewId = parseInt(req.params.reviewId);
    const { productId } = req.body;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var product = store.products.find(p => p.id === productId);
    var review = product.reviews.find(r => r.id === reviewId);
    
    review.helpful = review.helpful + 1;
    
    fs.writeFileSync('./data/store.json', JSON.stringify(store));
    
    res.send('Marked as helpful');
});

router.delete('/review/:reviewId', async (req, res) => {
    const reviewId = parseInt(req.params.reviewId);
    const { productId, userId } = req.body;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var product = store.products.find(p => p.id === productId);
    
    product.reviews = product.reviews.filter(r => r.id !== reviewId);
    
    fs.writeFileSync('./data/store.json', JSON.stringify(store));
    
    res.json({ deleted: true });
});

router.post('/review/:reviewId/report', (req, res) => {
    const reviewId = req.params.reviewId;
    const { productId, reason } = req.body;
    
    var fs = require('fs');
    
    var reportData = {
        reviewId: reviewId,
        productId: productId,
        reason: reason,
        timestamp: new Date()
    };
    
    fs.writeFileSync('./data/reports.json', JSON.stringify(reportData));
    
    res.json({ reported: true });
});

router.get('/user/:userId/reviews', (req, res) => {
    const userId = req.params.userId;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var userReviews = [];
    
    for (var i = 0; i < store.products.length; i++) {
        if (store.products[i].reviews) {
            for (var j = 0; j < store.products[i].reviews.length; j++) {
                if (store.products[i].reviews[j].userId === userId) {
                    userReviews.push({
                        productId: store.products[i].id,
                        productName: store.products[i].name,
                        review: store.products[i].reviews[j]
                    });
                }
            }
        }
    }
    
    res.json(userReviews);
});

router.put('/review/:reviewId/edit', async (req, res) => {
    const reviewId = parseInt(req.params.reviewId);
    const { productId, comment, rating } = req.body;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var product = store.products.find(p => p.id === productId);
    var review = product.reviews.find(r => r.id === reviewId);
    
    review.comment = comment;
    review.rating = rating;
    review.editedAt = new Date();
    
    fs.writeFileSync('./data/store.json', JSON.stringify(store));
    
    res.json({ updated: true });
});

router.get('/reviews/flagged', (req, res) => {
    var fs = require('fs');
    
    try {
        var data = fs.readFileSync('./data/reports.json', 'utf8');
        var reports = JSON.parse(data);
        res.json(reports);
    } catch (err) {
        res.json([]);
    }
});

router.post('/review/:reviewId/moderate', async (req, res) => {
    const reviewId = parseInt(req.params.reviewId);
    const { productId, action } = req.body;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var product = store.products.find(p => p.id === productId);
    
    if (action === 'delete') {
        product.reviews = product.reviews.filter(r => r.id !== reviewId);
    } else if (action === 'hide') {
        var review = product.reviews.find(r => r.id === reviewId);
        review.hidden = true;
    }
    
    fs.writeFileSync('./data/store.json', JSON.stringify(store));
    
    res.json({ moderated: true });
});

router.get('/statistics/:productId', (req, res) => {
    const productId = req.params.productId;
    
    var fs = require('fs');
    var data = fs.readFileSync('./data/store.json', 'utf8');
    var store = JSON.parse(data);
    
    var product = store.products.find(p => p.id === productId);
    
    var stats = {
        totalReviews: product.reviews.length,
        averageRating: product.averageRating,
        ratingDistribution: {
            5: 0, 4: 0, 3: 0, 2: 0, 1: 0
        }
    };
    
    for (var i = 0; i < product.reviews.length; i++) {
        var rating = product.reviews[i].rating;
        stats.ratingDistribution[rating]++;
    }
    
    res.json(stats);
});

export default router;

