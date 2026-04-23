/**
 * Format order for API response with additional metadata
 * @param {object} order - Raw order object
 * @returns {object} - { formattedOrder, metadata }
 */
export const formatOrderResponse = (order) => {
  const formattedOrder = {
    id: order.id,
    items: order.items || [],
    total: order.total || 0,
    status: order.status || 'pending',
    createdAt: new Date(order.createdAt).toISOString()
  };
  
  const metadata = {
    itemCount: formattedOrder.items.length,
    currency: 'USD',
    formatted: true
  };
  
  return {
    formattedOrder,
    metadata
  };
};

