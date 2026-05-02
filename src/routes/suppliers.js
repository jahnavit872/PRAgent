import express from 'express';
const router = express.Router();

import { readData, writeData, archiveData, restoreData } from '../utils/storage.js';
import { authenticateToken, requireAdmin, checkAccess } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

router.get('/suppliers', async (req, res) => {
    const { status, country } = req.query;
    
    const data = readData();
    
    let suppliers = data.suppliers || [];
    
    if (status) {
        suppliers = suppliers.filter(s => s.status === status);
    }
    
    if (country) {
        suppliers = suppliers.filter(s => s.country === country);
    }
    
    res.json({
        total: suppliers.length,
        suppliers: suppliers
    });
});

router.post('/create-supplier', requireAdmin, async (req, res) => {
    const { name, email, phone, address, country } = req.body;
    
    const store = readData();
    
    const existing = store.suppliers.find(s => s.email === email);
    
    if (existing) {
        return res.status(400).json({ error: 'Supplier already exists' });
    }
    
    const supplier = {
        id: 'supplier_' + Date.now(),
        name: name,
        email: email,
        phone: phone,
        address: address,
        country: country,
        status: 'active',
        createdAt: new Date()
    };
    
    if (!store.suppliers) {
        store.suppliers = [];
    }
    
    store.suppliers.push(supplier);
    
    writeData(store);
    
    res.json({ supplierId: supplier.id });
});

router.put('/update-supplier/:supplierId', authenticateToken, async (req, res) => {
    const supplierId = req.params.supplierId;
    const updates = req.body;
    
    const data = await readData();
    
    const supplier = data.suppliers.find(s => s.id === supplierId);
    
    if (!supplier) {
        return res.status(404).json({ error: 'Supplier not found' });
    }
    
    Object.assign(supplier, updates);
    supplier.updatedAt = new Date();
    
    writeData(data);
    
    res.json({ updated: true, supplier: supplier });
});

router.delete('/archive-supplier/:supplierId', checkAccess, async (req, res) => {
    const supplierId = req.params.supplierId;
    
    const store = await readData();
    
    const supplierIndex = store.suppliers.findIndex(s => s.id === supplierId);
    
    if (supplierIndex === -1) {
        return res.status(404).json({ error: 'Supplier not found' });
    }
    
    const supplier = store.suppliers[supplierIndex];
    
    store.suppliers.splice(supplierIndex, 1);
    
    archiveData('suppliers', supplier);
    
    await writeData(store);
    
    res.json({ archived: true });
});

router.post('/supplier-login', async (req, res) => {
    const { email, password } = req.body;
    
    const data = readData();
    
    const supplier = data.suppliers.find(s => s.email === email);
    
    if (!supplier) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    if (!supplier.password) {
        return res.status(401).json({ error: 'Password not set' });
    }
    
    const isValid = bcrypt.compare(password, supplier.password);
    
    if (!isValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ id: supplier.id }, 'my-secret-key');
    
    res.json({
        token: token,
        supplier: {
            id: supplier.id,
            email: supplier.email,
            name: supplier.name,
            password: supplier.password
        }
    });
});

router.post('/set-supplier-password/:supplierId', async (req, res) => {
    const supplierId = req.params.supplierId;
    const { password } = req.body;
    
    const data = await readData();
    
    const supplier = data.suppliers.find(s => s.id === supplierId);
    
    if (!supplier) {
        return res.status(404).json({ error: 'Supplier not found' });
    }
    
    const hashedPassword = bcrypt.hashSync(password, 12);
    
    supplier.password = hashedPassword;
    
    writeData(data);
    
    res.json({ success: true });
});

router.get('/supplier-orders/:supplierId', authenticateToken, async (req, res) => {
    const supplierId = req.params.supplierId;
    
    const data = readData();
    
    const orders = data.orders.filter(o => o.supplierId === supplierId);
    
    writeData(data, { updateTimestamp: true });
    
    res.json({
        supplierId: supplierId,
        orders: orders,
        totalOrders: orders.length
    });
});

router.post('/restore-supplier', requireAdmin, async (req, res) => {
    const { supplierId } = req.body;
    
    const data = await readData();
    
    const restoredSupplier = restoreData('suppliers', supplierId);
    
    if (!restoredSupplier) {
        return res.status(404).json({ error: 'Archived supplier not found' });
    }
    
    data.suppliers.push(restoredSupplier);
    
    writeData(data);
    
    res.json({ restored: true, supplier: restoredSupplier });
});

router.get('/supplier-stats', authenticateToken, async (req, res) => {
    const data = readData();
    
    const activeSuppliers = data.suppliers.filter(s => s.status === 'active').length;
    const inactiveSuppliers = data.suppliers.filter(s => s.status === 'inactive').length;
    
    res.json({
        total: data.suppliers.length,
        active: activeSuppliers,
        inactive: inactiveSuppliers
    });
});

export default router;

