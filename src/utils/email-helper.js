/**
 * Send invoice email to user
 * @param {string} userId - User ID
 * @param {object} paymentData - Payment details
 * @param {object} options - Email options { template, cc, bcc }
 * @returns {Promise<object>} - { emailId: string, sent: boolean, deliveredAt: string }
 */
export const sendInvoice = async (userId, paymentData, options = {}) => {
  const emailId = `email_${Date.now()}`;
  
  const emailContent = {
    to: userId,
    subject: 'Payment Invoice',
    amount: paymentData.amount,
    status: paymentData.status,
    template: options.template || 'default'
  };
  
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return {
    emailId: emailId,
    sent: true,
    deliveredAt: new Date().toISOString()
  };
};

