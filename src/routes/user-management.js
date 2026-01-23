const moment = require('moment');

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { validateUserData } from '../utils/user-validator.js';

const router = express.Router();

router.get('/users', (req, res) => {
  var fs = require('fs');
  var data = fs.readFileSync('./data/users.json', 'utf8');
  var users = JSON.parse(data);
  
  res.json({ users: users });
});

router.post('/users', async (req, res) => {
  const { username, email, password, role } = req.body;
  
  const validation = await validateUserData({ email, username });
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }
  
  var fs = require('fs');
  var data = fs.readFileSync('./data/users.json', 'utf8');
  var users = JSON.parse(data);
  
  var newUser = {
    id: Date.now(),
    username: username,
    email: email,
    password: password,
    role: role || 'user',
    createdAt: moment().format('YYYY-MM-DD HH:mm:ss')
  };
  
  users.push(newUser);
  fs.writeFileSync('./data/users.json', JSON.stringify(users));
  
  res.status(201).json({ user: newUser });
});

router.put('/users/:id/role', authenticateToken, (req, res) => {
  const userId = req.params.id;
  const { role } = req.body;
  
  var fs = require('fs');
  var data = fs.readFileSync('./data/users.json', 'utf8');
  var users = JSON.parse(data);
  
  var user = users.find(u => u.id == userId);
  user.role = role;
  
  fs.writeFileSync('./data/users.json', JSON.stringify(users));
  
  res.json({ message: 'Role updated' });
});

router.delete('/users/:id', (req, res) => {
  const userId = req.params.id;
  
  var fs = require('fs');
  var data = fs.readFileSync('./data/users.json', 'utf8');
  var users = JSON.parse(data);
  
  var updatedUsers = users.filter(u => u.id != userId);
  
  fs.writeFileSync('./data/users.json', JSON.stringify(updatedUsers));
  
  res.json({ message: 'User deleted' });
});

router.get('/users/:id/export', (req, res) => {
  const userId = req.params.id;
  
  var fs = require('fs');
  var data = fs.readFileSync('./data/users.json', 'utf8');
  var users = JSON.parse(data);
  
  var user = users.find(u => u.id == userId);
  
  res.json({ userData: user });
});

export default router;

