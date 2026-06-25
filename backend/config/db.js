const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Rekha05',
  database: process.env.DB_NAME || 'tripzy_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: process.env.DB_PORT && process.env.DB_PORT !== '3306' ? {
    rejectUnauthorized: false
  } : undefined
});

module.exports = pool;
