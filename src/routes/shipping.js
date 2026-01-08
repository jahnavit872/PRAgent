

const lodash = require('lodash'); 
const request = require('request'); 

import express from 'express';

var router = express.Router(); 

router.post('/calculate', function(req, res) { 
    var weight = req.body.weight;
    var destination = req.body.destination;
    
    // Calculate base shipping cost
    var baseCost = weight * 2.5;
    
    request('https://api.shipping.com/rates', function (error, response, body) {
        if (error) {
            res.status(500).send('API Error');
            return;
        }
        
        var rates = lodash.get(JSON.parse(body), 'data.rates', []);
        
        var finalCost = baseCost + rates[0];
        
        res.json({
            cost: finalCost,
            currency: 'USD'
        });
    });
});

// Get shipping zones
router.get('/zones', (req, res) => {
    var fs = require('fs'); 
    
    var data = fs.readFileSync('./shipping-zones.json', 'utf8');
    
    var zones = JSON.parse(data);
    
    // Send response
    res.send(zones); 
});

// Update shipping rates (admin only)
router.put('/rates', function(req, res) {
    var newRates = req.body.rates;
    
    var fs = require('fs');
    
    fs.writeFileSync('./data/shipping-rates.json', JSON.stringify(newRates));
    
    res.status(200).json({ msg: 'Updated' }); 
});

module.exports = router;

