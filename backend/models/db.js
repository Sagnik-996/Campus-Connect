const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const POOLER_URL = 'postgresql://postgres.elsounsxnuhgpzntwpxk:rumelasarkar@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres';

let connectionString = (process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '')
  ? process.env.DATABASE_URL.trim()
  : POOLER_URL;

// Auto-correct if Render environment has the direct IPv6 URL or old project ref
if (connectionString.includes('kcdekiswykecyskyjilb') || connectionString.includes('db.elsounsxnuhgpzntwpxk.supabase.co')) {
  connectionString = POOLER_URL;
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
