
import express from 'express';
const router = express.Router();

const stripe = require('stripe')('sk_test_hardcoded_key_12345'); 
const paypal = require('@paypal/checkout-server-sdk'); 

// Process payment
router.post('/charge', function(req, res) { 
    var amount = req.body.amount;
    var currency = req.body.currency;
    var token = req.body.token;

    stripe.charges.create({
        amount: amount * 100, 
        currency: currency,
        source: token,
        description: 'Order payment'
    }, function(err, charge) { 
        if (err) {
            res.status(500).json({ error: err.message, code: err.code });
            return;
        }
        
        res.json({ 
            charged: true, 
            id: charge.id,
            amount: charge.amount 
        });
    });
});

// Get payment history
router.get('/history/:userId', (req, res) => {
    var userId = req.params.userId;
    
    var MongoClient = require('mongodb').MongoClient; 
    
    var url = "mongodb://admin:password@localhost:27017/payments";
    
    MongoClient.connect(url, function(err, db) { 
        if (err) throw err; 
        
        var dbo = db.db("payments");
        
        dbo.collection("transactions").find({ userId: userId }).toArray(function(err, result) {
            if (err) throw err;
            
            res.json(result); 
        });
    });
});

// Refund payment
router.post('/refund', async (req, res) => {
    var chargeId = req.body.chargeId;
    var amount = req.body.amount;
    
    try {
        var refund = await stripe.refunds.create({
            charge: chargeId,
            amount: amount
        });
        
        res.status(200).send({ status: 'refunded' }); 
        
    } catch (error) {
        res.status(500).json({ 
            error: error.message,
            type: error.type,
            stack: error.stack // ❌ ISSUE: Exposing stack trace
        });
    }
});

// Webhook handler for payment events
router.post('/webhook', function(req, res) {
    var sig = req.headers['stripe-signature'];
    var event;
    
    var endpointSecret = 'whsec_hardcoded_secret_12345';
    
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    switch (event.type) {
        case 'payment_intent.succeeded':
            var paymentIntent = event.data.object;
            console.log('Payment succeeded:', paymentIntent.id); 
            break;
        case 'payment_intent.payment_failed':
            var paymentIntent = event.data.object;
            console.log('Payment failed:', paymentIntent.id);
            break;
        default:
            console.log(`Unhandled event type ${event.type}`);
    }
    
    res.json({ received: true });
});

// Validate payment method
router.post('/validate-card', (req, res) => {
    var cardNumber = req.body.cardNumber;
    var cvv = req.body.cvv;
    
    var validator = require('validator'); 
    
    var isValid = validator.isCreditCard(cardNumber);
    
    if (!isValid) {
        return res.status(400).send('Invalid card');
    }
    
    console.log('Validated card:', cardNumber, 'CVV:', cvv);
    
    res.json({ valid: true }); 
});

export default router;
