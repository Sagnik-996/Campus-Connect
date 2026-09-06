const pool = require('../models/db');

async function getAllBookings(req, res) {
  try {
    const { rows: bookings } = await pool.query(`
      SELECT b.*, u.name AS user_name, u.email AS user_email, e.event_name, d.dept_name, v.venue_name
      FROM bookings b
      JOIN users u ON b.user_id = u.user_id
      JOIN events e ON b.event_id = e.event_id
      JOIN departments d ON e.dept_id = d.dept_id
      JOIN venues v ON e.venue_id = v.venue_id
      ORDER BY b.booking_date DESC, b.booking_id DESC
    `);
    return res.status(200).json(bookings);
  } catch (err) {
    console.error('Get All Bookings Error:', err);
    return res.status(500).json({ error: 'Server error retrieving bookings.' });
  }
}

async function getMyBookings(req, res) {
  const userId = req.session.user.user_id;
  try {
    const { rows: bookings } = await pool.query(
      `SELECT b.*, e.event_name, d.dept_name, v.venue_name, v.location
       FROM bookings b
       JOIN events e ON b.event_id = e.event_id
       JOIN departments d ON e.dept_id = d.dept_id
       JOIN venues v ON e.venue_id = v.venue_id
       WHERE b.user_id = $1
       ORDER BY b.booking_date DESC, b.booking_id DESC`,
      [userId]
    );
    return res.status(200).json(bookings);
  } catch (err) {
    console.error('Get My Bookings Error:', err);
    return res.status(500).json({ error: 'Server error retrieving bookings.' });
  }
}

async function bookEvent(req, res) {
  const userId = req.session.user.user_id;
  const { event_id, seats_booked } = req.body;
  if (!event_id || seats_booked === undefined) {
    return res.status(400).json({ error: 'Event ID and seats to book are required.' });
  }
  const seats = parseInt(seats_booked, 10);
  if (Number.isNaN(seats) || seats <= 0) {
    return res.status(400).json({ error: 'Number of seats must be a positive integer.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: events } = await client.query(
      'SELECT event_name, event_date, event_time, total_seats, available_seats FROM events WHERE event_id = $1 FOR UPDATE',
      [event_id]
    );
    if (events.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Event not found.' });
    }
    const event = events[0];
    const { rows: existing } = await client.query(
      'SELECT booking_id FROM bookings WHERE user_id = $1 AND event_id = $2',
      [userId, event_id]
    );
    if (existing.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'You have already booked seats for this event. Cancel your existing booking first if you want to change it.' });
    }
    if (event.available_seats < seats) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `Insufficient seats available. Only ${event.available_seats} seat(s) left.` });
    }
    await client.query('UPDATE events SET available_seats = $1 WHERE event_id = $2', [event.available_seats - seats, event_id]);
    const bookingResult = await client.query(
      `INSERT INTO bookings (user_id, event_id, seats_booked, booking_date, event_date, event_time)
       VALUES ($1, $2, $3, CURRENT_DATE, $4, $5) RETURNING booking_id`,
      [userId, event_id, seats, event.event_date, event.event_time]
    );
    await client.query('COMMIT');
    return res.status(201).json({ message: 'Booking completed successfully!', bookingId: bookingResult.rows[0].booking_id, seatsBooked: seats });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Booking Transaction Error:', err);
    return res.status(500).json({ error: 'Server error completing booking.' });
  } finally {
    client.release();
  }
}

async function cancelBooking(req, res) {
  const { id } = req.params;
  const isUserLoggedIn = !!req.session.user;
  const userId = isUserLoggedIn ? req.session.user.user_id : null;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows: bookings } = await client.query(
      'SELECT user_id, event_id, seats_booked FROM bookings WHERE booking_id = $1 FOR UPDATE', [id]
    );
    if (bookings.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Booking record not found.' });
    }
    const booking = bookings[0];
    if (isUserLoggedIn && booking.user_id !== userId) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Access denied. You can only cancel your own bookings.' });
    }
    const { rows: events } = await client.query(
      'SELECT available_seats, total_seats FROM events WHERE event_id = $1 FOR UPDATE', [booking.event_id]
    );
    if (events.length > 0) {
      const event = events[0];
      await client.query('UPDATE events SET available_seats = $1 WHERE event_id = $2', [Math.min(event.total_seats, event.available_seats + booking.seats_booked), booking.event_id]);
    }
    await client.query('DELETE FROM bookings WHERE booking_id = $1', [id]);
    await client.query('COMMIT');
    return res.status(200).json({ message: 'Booking cancelled successfully.' });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Cancellation Transaction Error:', err);
    return res.status(500).json({ error: 'Server error cancelling booking.' });
  } finally {
    client.release();
  }
}

module.exports = { getAllBookings, getMyBookings, bookEvent, cancelBooking };
