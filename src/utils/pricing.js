/**
 * Calculate discount based on amount, code, and user tier
 * @param {number} amount - Order amount
 * @param {string} code - Discount code
 * @param {string} userTier - User tier (bronze, silver, gold)
 * @returns {object} - { discountAmount, finalAmount, percentage }
 */
export const calculateDiscount = (amount, code, userTier) => {
  let percentage = 0;
  
  if (code === 'SAVE10') percentage = 10;
  if (code === 'SAVE20') percentage = 20;
  
  // Tier bonus
  if (userTier === 'silver') percentage += 5;
  if (userTier === 'gold') percentage += 10;
  
  const discountAmount = (amount * percentage) / 100;
  const finalAmount = amount - discountAmount;
  
  return {
    discountAmount,
    finalAmount,
    percentage
  };
};

