const bcrypt = require('bcryptjs');

const hashPassword = async (rawPassword) => bcrypt.hash(rawPassword, 10);
const comparePassword = async (rawPassword, hashedPassword) => bcrypt.compare(rawPassword, hashedPassword);

module.exports = { hashPassword, comparePassword };
