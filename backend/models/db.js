const { Pool } = require('pg');
const path = require('path');

require('dotenv').config({
  path: path.join(__dirname, '../.env'),
  // A stale DATABASE_URL exported by a local terminal must not silently win
  // over this project's .env. Render supplies NODE_ENV=production, where its
  // dashboard value remains authoritative.
  override: process.env.NODE_ENV !== 'production'
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Supabase and Render require TLS. Set DATABASE_SSL=false only for a local
  // PostgreSQL server that does not use TLS.
  ssl: process.env.DATABASE_SSL === 'false' ? false : { rejectUnauthorized: false },
  max: Number(process.env.DB_POOL_MAX || 10),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000
});

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error:', error.message);
});

module.exports = pool;
