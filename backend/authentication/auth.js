const bcrypt = require('bcryptjs');

/**
 * Hash a plain text password.
 * @param {string} password 
 * @returns {Promise<string>} Hashed password
 */
async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

/**
 * Compare plain text password with its hash.
 * @param {string} password 
 * @param {string} hash 
 * @returns {Promise<boolean>} Match result
 */
async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

module.exports = {
  hashPassword,
  verifyPassword
};
