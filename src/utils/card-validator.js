/**
 * Validate card details
 * @param {string} cardNumber - Card number
 * @param {string} cvv - CVV code
 * @param {string} expiry - Expiry date in MM/YY format
 * @returns {boolean} - true if valid, false otherwise
 */
export const validateCardDetails = (cardNumber, cvv, expiry) => {
  if (!cardNumber || cardNumber.length < 13 || cardNumber.length > 19) {
    return false;
  }
  
  if (!cvv || cvv.length < 3 || cvv.length > 4) {
    return false;
  }
  
  if (!expiry || !/^\d{2}\/\d{2}$/.test(expiry)) {
    return false;
  }
  
  return true;
};

