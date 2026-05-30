const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { execSync } = require('child_process');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Sagnik2006',
  database: process.env.DB_NAME || 'event_booking'
};

async function initAndSeed() {
  console.log('Resetting database and loading exact schema/sample data...');
  
  try {
    // 1. Execute SQL schema file via MySQL CLI client to guarantee correct multi-line execution
    const sqlFilePath = path.join(__dirname, '../database.sql');
    const mysqlCmd = `/usr/local/mysql/bin/mysql -u ${dbConfig.user} -p"${dbConfig.password}" < "${sqlFilePath}"`;
    execSync(mysqlCmd, { stdio: 'inherit' });
    console.log('MySQL schema file loaded successfully via CLI.');

    // 2. Connect to database using connection pool to do password hashing and bookings seed
    const connection = await mysql.createConnection(dbConfig);
    console.log('Connected to event_booking database.');

    // 3. Clear users and bookings (tables already cleared by DROP TABLE in database.sql, but let's be safe)
    await connection.query('SET FOREIGN_KEY_CHECKS = 0;');
    await connection.query('TRUNCATE TABLE BOOKINGS;');
    await connection.query('TRUNCATE TABLE USERS;');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1;');

    // 4. Seed sample Student Users (with bcrypt hashing)
    const sampleStudents = [
      { name: 'Sagnik', email: 'sagnik@email.com', password: '1234' },
      { name: 'Rahul Sharma', email: 'rahul@gmail.com', password: 'rahul123' },
      { name: 'Ananya Rao', email: 'ananya@gmail.com', password: 'ananya456' },
      { name: 'Kiran Patel', email: 'kiran@gmail.com', password: 'kiran789' },
      { name: 'Megha N', email: 'megha@gmail.com', password: 'megha111' },
      { name: 'Arjun Reddy', email: 'arjun@gmail.com', password: 'arjun222' }
    ];

    console.log('Hashing and seeding student credentials...');
    for (let s of sampleStudents) {
      const hash = await bcrypt.hash(s.password, 10);
      await connection.query(
        'INSERT INTO USERS (name, email, password) VALUES (?, ?, ?)',
        [s.name, s.email, hash]
      );
    }
    console.log('Student users seeded.');

    // 5. Seed some initial bookings and decrement available event seats
    // User 1 (Sagnik) books Event 1 (IEEE Orientation) for 2 seats
    // User 2 (Rahul) books Event 3 (AI Workshop) for 3 seats
    // User 3 (Ananya) books Event 5 (Robotics Expo) for 4 seats
    // User 4 (Kiran) books Event 1 (IEEE Orientation) for 1 seat
    // User 5 (Megha) books Event 7 (Placement Readiness) for 2 seats
    const initialBookings = [
      { user_id: 1, event_id: 1, seats: 2, ev_date: '2026-06-15', ev_time: '10:00:00' },
      { user_id: 2, event_id: 3, seats: 3, ev_date: '2026-06-22', ev_time: '09:30:00' },
      { user_id: 3, event_id: 5, seats: 4, ev_date: '2026-06-28', ev_time: '10:00:00' },
      { user_id: 4, event_id: 1, seats: 1, ev_date: '2026-06-15', ev_time: '10:00:00' },
      { user_id: 5, event_id: 7, seats: 2, ev_date: '2026-07-05', ev_time: '09:00:00' }
    ];

    console.log('Seeding initial bookings and adjusting available seat counts...');
    for (let b of initialBookings) {
      // 1. Insert booking row
      await connection.query(
        'INSERT INTO BOOKINGS (user_id, event_id, seats_booked, booking_date, event_date, event_time) VALUES (?, ?, ?, CURDATE(), ?, ?)',
        [b.user_id, b.event_id, b.seats, b.ev_date, b.ev_time]
      );

      // 2. Decrement available seats in events
      const [events] = await connection.query('SELECT total_seats, available_seats FROM EVENTS WHERE event_id = ?', [b.event_id]);
      if (events.length > 0) {
        const newAvailable = events[0].available_seats - b.seats;
        await connection.query('UPDATE EVENTS SET available_seats = ? WHERE event_id = ?', [newAvailable, b.event_id]);
      }
    }

    console.log('Initial bookings seeded successfully.');
    console.log('==================================================');
    console.log(' DATABASE INITIALIZATION SUCCEEDED!              ');
    console.log(' Schema, Venues, Depts, Events loaded.            ');
    console.log(' Admin: admin / admin123                          ');
    console.log(' Student: sagnik@email.com / 1234                ');
    console.log('==================================================');
    
    await connection.end();
  } catch (err) {
    console.error('Database seeding failed:', err);
  }
}

initAndSeed();
