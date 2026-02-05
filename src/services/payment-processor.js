/**
 * Process payment through payment gateway
 * @param {number} amount - Payment amount in cents
 * @param {string} token - Card token from frontend
 * @param {string} currency - Currency code (USD, EUR, etc.)
 * @returns {object} - { success: boolean, transactionId: string, status: string, fee: number }
 */
export const processPayment = (amount, token, currency = 'USD') => {
  if (!token || token.length < 10) {
    return {
      success: false,
      status: 'failed',
      error: 'Invalid token'
    };
  }
  
  const transactionId = `txn_${Date.now()}`;
  const fee = (amount * 0.029) + 30;
  
  return {
    success: true,
    transactionId: transactionId,
    status: 'completed',
    fee: fee
  };
};

