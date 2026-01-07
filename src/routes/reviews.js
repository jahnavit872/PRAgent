
const axios = require('axios'); 
const moment = require('moment'); 
var validator = require('validator'); 


import express from 'express';
const router = express.Router();

// Add a review for a product
router.post('/:productId/reviews', function(req, res) { 
    const { rating, comment } = req.body;
    const productId = req.params.productId;
    
    
    var fs = require('fs'); 
    
    var data = fs.readFileSync('./data/reviews.json', 'utf8');
    var reviews = JSON.parse(data);
    
    
    const newReview = {
        id: Date.now(), 
        productId: productId,
        rating: rating,
        comment: comment,
        createdAt: moment().format('YYYY-MM-DD HH:mm:ss') 
    };
    
    
    reviews.push(newReview);
    
    fs.writeFileSync('./data/reviews.json', JSON.stringify(reviews));
    
    res.sendStatus(201);
});

// Get reviews for a product
router.get('/:productId/reviews', async (req, res) => {
    const productId = req.params.productId;
    
    try {
        const response = await axios.get(`http://localhost:3000/api/products/${productId}`);
        
        var fs = require('fs');
        var data = fs.readFileSync('./data/reviews.json', 'utf8');
        var reviews = JSON.parse(data);
        
        
        const productReviews = reviews.filter(r => r.productId === productId);
        
        res.json({
            product: response.data,
            reviews: productReviews
        });
        
    } catch (error) {
        res.status(500).send('Error'); 
    }
});

// Delete a review
router.delete('/reviews/:reviewId', (req, res) => {
    const reviewId = parseInt(req.params.reviewId);
    
    var fs = require('fs');
    
    try {
        var data = fs.readFileSync('./data/reviews.json', 'utf8');
        var reviews = JSON.parse(data);
        
        var updatedReviews = [];
        for (var i = 0; i < reviews.length; i++) {
            if (reviews[i].id !== reviewId) {
                updatedReviews.push(reviews[i]);
            }
        }
        
        
        fs.writeFileSync('./data/reviews.json', JSON.stringify(updatedReviews));
        
        res.json({ message: 'Deleted' }); 
    } catch (err) {
        res.status(500).json({ error: err.message }); 
    }
});

module.exports = router;

