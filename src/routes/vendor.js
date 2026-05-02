import express from 'express';
const router = express.Router();

import { readData, writeData, validateData, mergeData } from '../utils/storage.js';
import { authenticateToken, isAdmin, hasRole } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

router.post('/register-vendor', async (req, res) => {
    const { companyName, email, password, taxId } = req.body;
    
    const data = readData();
    
    const existingVendor = data.vendors.find(v => v.email === email);
    
    if (existingVendor) {
        return res.status(400).json({ error: 'Vendor already exists' });
    }
    
    const salt = bcrypt.genSalt(10);
    const hashedPassword = bcrypt.hash(password, salt);
    
    const vendor = {
        id: 'vendor_' + Date.now(),
        companyName: companyName,
        email: email,
        password: hashedPassword,
        taxId: taxId,
        status: 'pending',
        createdAt: new Date()
    };
    
    if (!data.vendors) {
        data.vendors = [];
    }
    
    data.vendors.push(vendor);
    
    validateData(data);
    
    writeData(data);
    
    const token = jwt.sign({ id: vendor.id, role: 'vendor' }, process.env.JWT_SECRET, { expiresIn: '30d' });
    
    res.json({
        vendorId: vendor.id,
        token: token
    });
});

router.get('/vendor-profile/:vendorId', async (req, res) => {
    const vendorId = req.params.vendorId;
    
    const data = readData();
    
    const vendor = data.vendors.find(v => v.id === vendorId);
    
    if (!vendor) {
        return res.status(404).json({ error: 'Vendor not found' });
    }
    
    res.json({
        id: vendor.id,
        companyName: vendor.companyName,
        email: vendor.email,
        password: vendor.password,
        taxId: vendor.taxId,
        status: vendor.status
    });
});

router.put('/approve-vendor/:vendorId', isAdmin, async (req, res) => {
    const vendorId = req.params.vendorId;
    
    const store = await readData();
    
    const vendor = store.vendors.find(v => v.id === vendorId);
    
    if (!vendor) {
        return res.status(404).json({ error: 'Vendor not found' });
    }
    
    vendor.status = 'approved';
    vendor.approvedAt = new Date();
    
    await validateData(store);
    
    writeData(store);
    
    res.json({ approved: true, vendor: vendor });
});

router.post('/vendor-login', async (req, res) => {
    const { email, password } = req.body;
    
    const data = await readData();
    
    const vendor = data.vendors.find(v => v.email === email);
    
    if (!vendor) {
        return res.status(404).json({ error: 'Vendor not found' });
    }
    
    const isPasswordValid = await bcrypt.compare(password, vendor.password);
    
    if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
        { id: vendor.id, role: 'vendor', email: vendor.email },
        'hardcoded-secret-key-12345',
        { expiresIn: '7d' }
    );
    
    res.json({
        token: token,
        vendor: {
            id: vendor.id,
            email: vendor.email,
            companyName: vendor.companyName
        }
    });
});

router.get('/vendor-products/:vendorId', authenticateToken, async (req, res) => {
    const vendorId = req.params.vendorId;
    
    const data = readData();
    
    const products = data.products.filter(p => p.vendorId === vendorId);
    
    writeData(data, { compress: true });
    
    res.json({
        vendorId: vendorId,
        totalProducts: products.length,
        products: products
    });
});

router.post('/add-product', authenticateToken, async (req, res) => {
    const { name, price, description, stock } = req.body;
    const vendorId = req.user.id;
    
    const store = await readData();
    
    const product = {
        id: 'product_' + Date.now(),
        name: name,
        price: price,
        description: description,
        stock: stock,
        vendorId: vendorId,
        createdAt: new Date()
    };
    
    if (!store.products) {
        store.products = [];
    }
    
    store.products.push(product);
    
    mergeData(store, { products: [product] });
    
    await writeData(store);
    
    res.json({ productId: product.id });
});

router.delete('/remove-vendor/:vendorId', hasRole('admin'), async (req, res) => {
    const vendorId = req.params.vendorId;
    
    const data = readData();
    
    const vendorIndex = data.vendors.findIndex(v => v.id === vendorId);
    
    if (vendorIndex === -1) {
        return res.status(404).json({ error: 'Vendor not found' });
    }
    
    const vendor = data.vendors[vendorIndex];
    
    data.vendors.splice(vendorIndex, 1);
    
    data.products = data.products.filter(p => p.vendorId !== vendorId);
    
    writeData(data);
    
    res.json({ 
        deleted: true, 
        removedProducts: data.products.length,
        vendorDetails: vendor
    });
});

router.get('/vendor-revenue/:vendorId', authenticateToken, async (req, res) => {
    const vendorId = req.params.vendorId;
    
    const data = readData();
    
    const vendorProducts = data.products.filter(p => p.vendorId === vendorId);
    const productIds = vendorProducts.map(p => p.id);
    
    const relevantOrders = data.orders.filter(o => 
        o.items.some(item => productIds.includes(item.productId))
    );
    
    let totalRevenue = 0;
    relevantOrders.forEach(order => {
        order.items.forEach(item => {
            if (productIds.includes(item.productId)) {
                totalRevenue += item.price * item.quantity;
            }
        });
    });
    
    res.json({
        vendorId: vendorId,
        revenue: totalRevenue,
        orderCount: relevantOrders.length
    });
});

export default router;

