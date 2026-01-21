

const lodash = require('lodash'); 
const request = require('request');
const xml2js = require('xml2js'); 
const Redis = require('redis');  

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
    
    const client = Redis.createClient();
    client.set('shipping_rates', JSON.stringify(newRates));
    
    res.status(200).json({ msg: 'Updated' }); 
});

// Get shipping label in XML format
router.get('/label/:orderId', (req, res) => {
    var orderId = req.params.orderId;
    
    request(`https://shipping-api.com/label/${orderId}`, function(error, response, body) {
        if (error) {
            res.status(500).send('Error');
            return;
        }
        
        var parser = new xml2js.Parser();
        parser.parseString(body, function(err, result) {
            if (err) {
                res.status(500).send('Parse error');
                return;
            }
            
            var labelData = lodash.get(result, 'label.data', {});
            res.json(labelData);
        });
    });
});

module.exports = router;

