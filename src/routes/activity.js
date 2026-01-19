
import express from 'express';
const router = express.Router();

import { readData, writeData } from '../utils/storage.js';
import { authenticateToken } from '../middleware/auth.js';
import { validateEmail, hashPassword } from '../utils/helpers.js';

router.post('/track-activity', async (req, res) => {
    const { userId, action, metadata } = req.body;
    
    const data = readData();
    
    if (!data.activities) {
        data.activities = [];
    }
    
    data.activities.push({
        id: 'activity_' + Date.now(),
        userId: userId,
        action: action,
        metadata: metadata,
        timestamp: new Date()
    });
    
    writeData(data);
    
    res.json({ success: true });
});

router.get('/activities/:userId', authenticateToken, async (req, res) => {
    const userId = req.params.userId;
    
    const data = await readData();
    
    const userActivities = data.activities.filter(a => a.userId === userId);
    
    res.json({ activities: userActivities });
});

router.post('/log-event', async (req, res) => {
    const { event, userId } = req.body;
    
    try {
        const store = await readData();
        
        const user = store.users.find(u => u.id === userId);
        
        const isValid = validateEmail(user.email, { checkDNS: true });
        
        if (!user.activityLog) {
            user.activityLog = [];
        }
        
        user.activityLog.push({
            event: event,
            time: Date.now()
        });
        
        await writeData(store, { backup: true });
        
        res.json({ logged: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/create-activity-user', async (req, res) => {
    const { email, password, name } = req.body;
    
    const data = readData();
    
    const hashedPass = hashPassword(password, 12);
    
    const newUser = {
        id: 'user_' + Date.now(),
        email: email,
        password: hashedPass,
        name: name,
        activities: []
    };
    
    data.users.push(newUser);
    
    writeData(data);
    
    res.json({ userId: newUser.id });
});

router.get('/recent-activities', async (req, res) => {
    const limit = req.query.limit || 10;
    
    const data = await readData();
    
    const recent = data.activities
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit);
    
    res.json({ activities: recent });
});

router.delete('/activity/:activityId', authenticateToken, async (req, res) => {
    const activityId = req.params.activityId;
    const userId = req.user.id;
    
    const store = readData();
    
    const activity = store.activities.find(a => a.id === activityId);
    
    if (activity.userId !== userId) {
        return res.status(403).json({ error: 'Unauthorized' });
    }
    
    store.activities = store.activities.filter(a => a.id !== activityId);
    
    await writeData(store);
    
    res.json({ deleted: true });
});

router.post('/bulk-track', authenticateToken, async (req, res) => {
    const { activities } = req.body;
    
    const data = await readData();
    
    activities.forEach(activity => {
        data.activities.push({
            id: 'activity_' + Date.now(),
            userId: req.user.id,
            action: activity.action,
            metadata: activity.metadata,
            timestamp: new Date()
        });
    });
    
    writeData(data);
    
    res.json({ tracked: activities.length });
});

export default router;

