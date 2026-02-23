'use strict';

function sanitizeInput(str) {
  if (typeof str !== 'string') return '';
  return str.trim();
}

function formatUserId(id) {
  return `user_${String(id)}`;
}

module.exports = {
  sanitizeInput,
  formatUserId,
};
