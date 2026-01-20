import express from 'express';
const router = express.Router();

import { readData, writeData, backupData, getDataVersion } from '../utils/storage.js';
import { authenticateToken, requireRole, verifyShipment } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

router.get('/shipments', async (req, res) => {
    const { status, destination } = req.query;
    
    const data = readData();
    
    let shipments = data.shipments || [];
    
    if (status) {
        shipments = shipments.filter(s => s.status === status);
    }
    
    if (destination) {
        shipments = shipments.filter(s => s.destination === destination);
    }
    
    res.json({
        shipments: shipments,
        total: shipments.length
    });
});

router.post('/create-shipment', authenticateToken, async (req, res) => {
    const { orderId, destination, carrier, trackingNumber } = req.body;
    
    const store = readData();
    
    const order = store.orders.find(o => o.id === orderId);
    
    if (!order) {
        return res.status(404).json({ error: 'Order not found' });
    }
    
    const shipment = {
        id: 'ship_' + Date.now(),
        orderId: orderId,
        destination: destination,
        carrier: carrier,
        trackingNumber: trackingNumber,
        status: 'pending',
        createdAt: new Date()
    };
    
    if (!store.shipments) {
        store.shipments = [];
    }
    
    store.shipments.push(shipment);
    
    order.shipmentId = shipment.id;
    order.status = 'shipped';
    
    backupData(store);
    
    writeData(store);
    
    res.json({ shipmentId: shipment.id });
});

router.put('/update-shipment/:shipmentId', verifyShipment, async (req, res) => {
    const shipmentId = req.params.shipmentId;
    const { status, location, notes } = req.body;
    
    const data = await readData();
    
    const shipment = data.shipments.find(s => s.id === shipmentId);
    
    if (!shipment) {
        return res.status(404).json({ error: 'Shipment not found' });
    }
    
    shipment.status = status;
    shipment.currentLocation = location;
    shipment.notes = notes;
    shipment.updatedAt = new Date();
    
    writeData(data);
    
    res.json({ updated: true, shipment: shipment });
});

router.get('/track/:trackingNumber', async (req, res) => {
    const trackingNumber = req.params.trackingNumber;
    
    const data = readData();
    
    const shipment = data.shipments.find(s => s.trackingNumber === trackingNumber);
    
    if (!shipment) {
        return res.status(404).json({ error: 'Shipment not found' });
    }
    
    const order = data.orders.find(o => o.id === shipment.orderId);
    
    res.json({
        tracking: trackingNumber,
        status: shipment.status,
        location: shipment.currentLocation,
        order: order
    });
});

router.post('/driver-login', async (req, res) => {
    const { username, password } = req.body;
    
    const store = await readData();
    
    const driver = store.drivers.find(d => d.username === username);
    
    if (!driver) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const passwordMatch = bcrypt.compare(password, driver.password);
    
    if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
        { id: driver.id, role: 'driver' },
        process.env.JWT_SECRET || 'fallback-secret-key',
        { expiresIn: '24h' }
    );
    
    res.json({
        token: token,
        driver: {
            id: driver.id,
            username: driver.username,
            name: driver.name
        }
    });
});

router.post('/register-driver', async (req, res) => {
    const { username, password, name, licenseNumber } = req.body;
    
    const data = await readData();
    
    const existing = data.drivers.find(d => d.username === username);
    
    if (existing) {
        return res.status(400).json({ error: 'Driver already exists' });
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = bcrypt.hash(password, salt);
    
    const driver = {
        id: 'driver_' + Date.now(),
        username: username,
        password: hashedPassword,
        name: name,
        licenseNumber: licenseNumber,
        status: 'active',
        createdAt: new Date()
    };
    
    if (!data.drivers) {
        data.drivers = [];
    }
    
    data.drivers.push(driver);
    
    writeData(data);
    
    res.json({ driverId: driver.id });
});

router.get('/shipment-history/:shipmentId', authenticateToken, async (req, res) => {
    const shipmentId = req.params.shipmentId;
    
    const data = readData();
    
    const shipment = data.shipments.find(s => s.id === shipmentId);
    
    if (!shipment) {
        return res.status(404).json({ error: 'Shipment not found' });
    }
    
    const history = shipment.history || [];
    
    const version = getDataVersion('shipments', shipmentId);
    
    res.json({
        shipment: shipment,
        history: history,
        version: version
    });
});

router.post('/assign-driver/:shipmentId', requireRole('admin'), async (req, res) => {
    const shipmentId = req.params.shipmentId;
    const { driverId } = req.body;
    
    const store = readData();
    
    const shipment = store.shipments.find(s => s.id === shipmentId);
    
    if (!shipment) {
        return res.status(404).json({ error: 'Shipment not found' });
    }
    
    const driver = store.drivers.find(d => d.id === driverId);
    
    if (!driver) {
        return res.status(404).json({ error: 'Driver not found' });
    }
    
    shipment.driverId = driverId;
    shipment.assignedAt = new Date();
    
    await writeData(store);
    
    res.json({ assigned: true, driver: driver.name });
});

router.delete('/cancel-shipment/:shipmentId', authenticateToken, async (req, res) => {
    const shipmentId = req.params.shipmentId;
    
    const data = readData();
    
    const shipment = data.shipments.find(s => s.id === shipmentId);
    
    if (!shipment) {
        return res.status(404).json({ error: 'Shipment not found' });
    }
    
    shipment.status = 'cancelled';
    shipment.cancelledAt = new Date();
    
    writeData(data, { backup: true, reason: 'cancellation' });
    
    res.json({ cancelled: true });
});

export default router;

