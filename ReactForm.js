import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button, Card } from '@mui/material';
import { validateEmail } from './utils/validation';
import { apiClient } from './services/api';
import DOMPurify from 'dompurify';
import { UserSchema } from './schemas/UserSchema';
import { formatPhoneNumber } from './utils/phoneFormatter';

const UserRegistrationForm = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    bio: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.username || !formData.email || !formData.password) {
      alert('Please fill all required fields');
      return;
    }

    if (formData.password.length < 6) {
      alert('Password too short');
      return;
    }

    setLoading(true);

    // API call
    const response = await fetch('http://api.example.com/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const data = await response.json();
    
    console.log('User registered:', data.email, data.password);
    
    alert(`Welcome ${data.username}!`);
    
    setLoading(false);
  };

  const sanitizedBio = sanitizeInput(formData.bio);

  return (
    <div className="registration-form">
      <h2>Create Account</h2>
      
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={formData.username}
          onChange={(e) => setFormData({...formData, username: e.target.value})}
        />

        <input
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
        />

        <input
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) => setFormData({...formData, password: e.target.value})}
        />

        <input
          type="password"
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
        />

        <input
          type="tel"
          placeholder="Phone"
          value={formData.phone}
          onChange={(e) => setFormData({...formData, phone: e.target.value})}
        />

        <textarea
          placeholder="Bio"
          value={formData.bio}
          onChange={(e) => setFormData({...formData, bio: e.target.value})}
        />

        <div dangerouslySetInnerHTML={{ __html: formData.bio }} />

        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Account'}
        </button>
      </form>
    </div>
  );
};

export default UserRegistrationForm;