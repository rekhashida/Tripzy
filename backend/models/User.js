// backend/models/User.js
const db = require('../config/db');
const { v4: uuid } = require('uuid');

const User = {
  async create({ phone, email, name, password_hash }) {
    const user_id = uuid();
    await db.execute(
      'INSERT INTO users (user_id, phone, email, name, password_hash) VALUES (?,?,?,?,?)',
      [user_id, phone, email, name, password_hash]
    );
    return { user_id, phone, email, name };
  },

  async findByPhone(phone) {
    const [rows] = await db.execute('SELECT * FROM users WHERE phone = ?', [phone]);
    return rows[0];
  }
};

module.exports = User;
