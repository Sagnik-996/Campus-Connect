const fs = require('fs');
const path = require('path');
const pool = require('../models/db');

async function initDatabase() {
  console.log('==================================================');
  console.log(' CampusConnect: Initializing PostgreSQL Database');
  console.log('==================================================');

  try {
    const sqlFilePath = path.join(__dirname, '../database.sql');
    console.log(`Reading SQL schema file from: ${sqlFilePath}`);
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('Executing PostgreSQL DDL and Seed Statements...');
    await pool.query(sqlContent);

    console.log('✅ Database schema created and sample data successfully seeded!');
    console.log('--------------------------------------------------');
    console.log('Summary of Loaded Data:');
    console.log('- 7 Departments (CSE, ISE, ECE, EEE, Mechanical, Civil, AI & ML)');
    console.log('- 5 Venues (DES 1 & 2, ESB 1 & 2, Apex Auditorium)');
    console.log('- 15 Events with exact dates, times, and seats');
    console.log('- Default Admin: admin / admin123');
    console.log('- Sample Students: sagnik@email.com / 1234, rahul@gmail.com, etc.');
    console.log('- Initial Bookings seeded and seat counts synchronized.');
    console.log('==================================================');
  } catch (err) {
    console.error('❌ Failed to initialize database:', err);
  } finally {
    await pool.end();
  }
}

initDatabase();
