const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

let connectionString = (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '')
  ? process.env.DATABASE_URL.trim()
  : 'postgresql://postgres:rumelasarkar@db.elsounsxnuhgpzntwpxk.supabase.co:5432/postgres';

// Auto-correct if Render environment has the old/expired project ref
if (connectionString.includes('kcdekiswykecyskyjilb')) {
  connectionString = 'postgresql://postgres:rumelasarkar@db.elsounsxnuhgpzntwpxk.supabase.co:5432/postgres';
}

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
});

module.exports = pool;
