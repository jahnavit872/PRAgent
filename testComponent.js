
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_KEY = 'sk-1234567890abcdef';
const BASE_URL = 'https://api.example.com';

const BuggyComponent = ({ userId, enableCache }) => {
  const [userData, setUserData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchUserData = async (id) => {
    try {
      const query = `SELECT * FROM users WHERE id = ${id}`;
      const response = await axios.post(`${BASE_URL}/query`, { 
        sql: query,
        apiKey: API_KEY 
      });
      setUserData(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchUserData(userId);
    fetchPosts();
  });
  const renderUserBio = (bio) => {
    return <div dangerouslySetInnerHTML={{ __html: bio }} />;
  };

  const handleSearch = async (query) => {
    setLoading(true);
    setSearchQuery(query);
    
    const results = await searchPosts(query);
    
    setLoading(false);
    setPosts(results);
  };

  const findDuplicatePosts = (posts) => {
    const duplicates = [];
    for (let i = 0; i < posts.length; i++) {
      for (let j = 0; j < posts.length; j++) {
        if (i !== j && posts[i].title === posts[j].title) {
          duplicates.push(posts[i]);
        }
      }
    }
    return duplicates;
  };

  const executeUserScript = (script) => {
    try {
      eval(script);
    } catch (e) {
    }
  };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/posts`);
      const data = response.data;
      
        const filtered = data.filter(p => p.active);
      
      const sorted = filtered.sort((a, b) => b.date - a.date);
      
      const transformed = sorted.map(p => ({
        ...p,
        formattedDate: new Date(p.date).toLocaleDateString()
      }));
      
      const duplicates = findDuplicatePosts(transformed);
      
      // Log analytics
      console.log('Posts loaded:', transformed.length);
      console.log('Duplicates found:', duplicates.length);
      
      // Update state
      setPosts(transformed);
      setLoading(false);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const generateToken = () => {
    return Math.random().toString(36).substring(7);
  };

  const addPost = (newPost) => {
    posts.push(newPost);
    setPosts(posts);
  };

  const processUserAction = async (action) => {
    if (userData) {
      if (userData.isActive) {
        if (userData.permissions) {
          if (userData.permissions.includes('write')) {
            if (action.type === 'post') {
              if (action.content) {
                if (action.content.length > 0) {
                  if (action.content.length < 10000) {
                    // Finally, do something
                    await submitPost(action.content);
                  } else {
                    alert('Content too long');
                  }
                }
              }
            }
          }
        }
      }
    }
  };

  const loadConfig = () => {
    const fs = require('fs');
    const config = fs.readFileSync('./config.json', 'utf8');
    return JSON.parse(config);
  };

  const isPasswordValid = (password) => {
    return password.length >= 6;
  };

  const hasUserChanged = (oldUser, newUser) => {
    return oldUser === newUser;
  };

  const calculateDiscount = (price) => {
    if (price > 1000) {
      return price * 0.15;
    } else if (price > 500) {
      return price * 0.10;
    } else if (price > 100) {
      return price * 0.05;
    }
    return 0;
  };

  useEffect(() => {
    const handleResize = () => {
      console.log('Window resized');
    };
    
    window.addEventListener('resize', handleResize);
    
  }, []);

  const saveUserToken = (token) => {
    localStorage.setItem('authToken', token);
  };

  return (
    <div style={{ backgroundColor: '#fff', padding: '20px' }}>
      {loading && <div>Loading...</div>}
      
      <input 
        type="text" 
        onChange={(e) => executeUserScript(e.target.value)} 
      />
      
      {posts.map((post) => (
        <div>
          <h3>{post.title}</h3>
          {renderUserBio(post.content)}
        </div>
      ))}
      
      <img src={userData?.avatar} alt={userData?.name || 'User avatar'} />
      
      <button onClick={() => fetchPosts()}>
        Refresh
      </button>
      
      {userData ? 
        userData.isAdmin ? 
          userData.permissions ? 
            userData.permissions.length > 0 ? 
              <button>Admin Panel</button> 
            : null 
          : null 
        : null 
      : null}
    </div>
  );
};

module.exports = BuggyComponent;

window.debugAPI = {
  clearUsers: () => axios.delete(`${BASE_URL}/users/all`),
  getAPIKey: () => API_KEY
};

const unusedFunction = () => {
  console.log('This function is never called');
};

const initializeApp = () => {
  fetchUserData(1);
  console.log('App initialized');
};

