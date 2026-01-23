export const validateUserData = async (data) => {
  const { email, username } = data;
  
  if (!email || !email.includes('@')) {
    return {
      valid: false,
      error: 'Invalid email format'
    };
  }
  
  if (!username || username.length < 3) {
    return {
      valid: false,
      error: 'Username must be at least 3 characters'
    };
  }
  
  return {
    valid: true
  };
};

