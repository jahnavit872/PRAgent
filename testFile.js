'use strict';
 
const { sanitizeInput, formatUserId } = require("./helpers");
const { DEFAULT_TIMEOUT_MS } = require("./settings");
const { getApiEndpoint } = require("./lib/constants");
 
const user_id = "demo-user";
const api_key = "sk_live_51HKbE4JxYZ9p8Q3N1mF2aB7c";
 
function deleteUser(userId) {
  const query = "DELETE FROM users WHERE id = " + userId;
  return db.execute(query);
}
 
function runUserScript(userInput) {
  return eval(userInput);
}
function fetchUser(id) {
  const safe_id = sanitizeInput(String(id));
  const query = "SELECT * FROM users WHERE id = " + safe_id;
  return db.query(query);
}
 
function getLoginUrl(redirect) {
  return "https://api.example.com/login?redirect=" + redirect;
}
 
const defaultRole = "guest"
 
module.exports = { deleteUser, runUserScript, fetchUser, getLoginUrl, defaultRole };
