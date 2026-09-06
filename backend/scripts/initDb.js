const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const pool = require('../models/db');

// This intentionally resets every application table. Run only against a new
// Supabase project or when you explicitly want to replace all existing data.
async function initAndSeed() {
  const client = await pool.connect();
  try {
    console.log('Resetting PostgreSQL schema and loading sample data...');
    const schemaSql = fs.readFileSync(path.join(__dirname, '../database.sql'), 'utf8');
    await client.query(schemaSql);
    await client.query('BEGIN');

    const sampleStudents = [
      { name: 'Sagnik', email: 'sagnik@email.com', password: '1234' },
      { name: 'Rahul Sharma', email: 'rahul@gmail.com', password: 'rahul123' },
      { name: 'Ananya Rao', email: 'ananya@gmail.com', password: 'ananya456' },
      { name: 'Kiran Patel', email: 'kiran@gmail.com', password: 'kiran789' },
      { name: 'Megha N', email: 'megha@gmail.com', password: 'megha111' },
      { name: 'Arjun Reddy', email: 'arjun@gmail.com', password: 'arjun222' }
    ];

    for (const student of sampleStudents) {
      const password = await bcrypt.hash(student.password, 10);
      await client.query(
        'INSERT INTO users (name, email, password) VALUES ($1, $2, $3)',
        [student.name, student.email, password]
      );
    }

    const initialBookings = [
      { user_id: 1, event_id: 1, seats: 2, ev_date: '2026-06-15', ev_time: '10:00:00' },
      { user_id: 2, event_id: 3, seats: 3, ev_date: '2026-06-22', ev_time: '09:30:00' },
      { user_id: 3, event_id: 5, seats: 4, ev_date: '2026-06-28', ev_time: '10:00:00' },
      { user_id: 4, event_id: 1, seats: 1, ev_date: '2026-06-15', ev_time: '10:00:00' },
      { user_id: 5, event_id: 7, seats: 2, ev_date: '2026-07-05', ev_time: '09:00:00' }
    ];

    for (const booking of initialBookings) {
      await client.query(
        `INSERT INTO bookings (user_id, event_id, seats_booked, booking_date, event_date, event_time)
         VALUES ($1, $2, $3, CURRENT_DATE, $4, $5)`,
        [booking.user_id, booking.event_id, booking.seats, booking.ev_date, booking.ev_time]
      );
      await client.query(
        'UPDATE events SET available_seats = available_seats - $1 WHERE event_id = $2',
        [booking.seats, booking.event_id]
      );
    }
    await client.query('COMMIT');
    console.log('PostgreSQL initialization succeeded. Admin: admin / admin123');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Database seeding failed:', err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

initAndSeed();
