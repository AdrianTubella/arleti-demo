// auth.js
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

// Hashear una contraseña
async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

// Verificar contraseña
async function verifyPassword(plainPassword, hashedPassword) {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

module.exports = { hashPassword, verifyPassword };