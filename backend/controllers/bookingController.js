const pool = require('../models/db');

// 1. View All Bookings (Admin Only)
async function getAllBookings(req, res) {
  try {
    const result = await pool.query(`
      SELECT b.*, u.name as user_name, u.email as user_email, e.event_name, d.dept_name, v.venue_name
      FROM BOOKINGS b
      JOIN USERS u ON b.user_id = u.user_id
      JOIN EVENTS e ON b.event_id = e.event_id
      JOIN DEPARTMENTS d ON e.dept_id = d.dept_id
      JOIN VENUES v ON e.venue_id = v.venue_id
      ORDER BY b.booking_date DESC, b.booking_id DESC
    `);
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('Get All Bookings Error:', err);
    return res.status(500).json({ error: 'Server error retrieving bookings.' });
  }
}

// 2. View Own Bookings (User Only)
async function getMyBookings(req, res) {
  const userId = req.session.user.user_id;

  try {
    const result = await pool.query(
      `SELECT b.*, e.event_name, d.dept_name, v.venue_name, v.location
       FROM BOOKINGS b
       JOIN EVENTS e ON b.event_id = e.event_id
       JOIN DEPARTMENTS d ON e.dept_id = d.dept_id
       JOIN VENUES v ON e.venue_id = v.venue_id
       WHERE b.user_id = $1
       ORDER BY b.booking_date DESC, b.booking_id DESC`,
      [userId]
    );
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('Get My Bookings Error:', err);
    return res.status(500).json({ error: 'Server error retrieving bookings.' });
  }
}

// 3. Book Event (User Only)
async function bookEvent(req, res) {
  const userId = req.session.user.user_id;
  const { event_id, seats_booked } = req.body;

  if (!event_id || seats_booked === undefined) {
    return res.status(400).json({ error: 'Event ID and seats to book are required.' });
  }

  const seats = parseInt(seats_booked, 10);
  if (isNaN(seats) || seats <= 0) {
    return res.status(400).json({ error: 'Number of seats must be a positive integer.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Fetch Event and lock row for update to prevent race conditions (overbooking)
    const eventRes = await client.query(
      'SELECT event_name, event_date, event_time, total_seats, available_seats FROM EVENTS WHERE event_id = $1 FOR UPDATE',
      [event_id]
    );

    if (eventRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Event not found.' });
    }

    const event = eventRes.rows[0];

    // 2. Check if user already booked this event (Prevent duplicates)
    const existingRes = await client.query(
      'SELECT booking_id FROM BOOKINGS WHERE user_id = $1 AND event_id = $2',
      [userId, event_id]
    );
    if (existingRes.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'You have already booked seats for this event. Cancel your existing booking first if you want to change it.'
      });
    }

    // 3. Check seat availability
    if (event.available_seats < seats) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: `Insufficient seats available. Only ${event.available_seats} seat(s) left.`
      });
    }

    // 4. Reduce available seats
    const newAvailableSeats = event.available_seats - seats;
    await client.query(
      'UPDATE EVENTS SET available_seats = $1 WHERE event_id = $2',
      [newAvailableSeats, event_id]
    );

    // 5. Create booking record
    const bookingRes = await client.query(
      `INSERT INTO BOOKINGS (user_id, event_id, seats_booked, booking_date, event_date, event_time) 
       VALUES ($1, $2, $3, CURRENT_DATE, $4, $5) RETURNING booking_id`,
      [userId, event_id, seats, event.event_date, event.event_time]
    );

    await client.query('COMMIT');

    return res.status(201).json({
      message: 'Booking completed successfully!',
      bookingId: bookingRes.rows[0].booking_id,
      seatsBooked: seats
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Booking Transaction Error:', err);
    return res.status(500).json({ error: 'Server error completing booking.' });
  } finally {
    client.release();
  }
}

// 4. Cancel Booking (User cancels own booking OR Admin cancels any)
async function cancelBooking(req, res) {
  const { id } = req.params;
  const isUserLoggedIn = !!req.session.user;
  const userId = isUserLoggedIn ? req.session.user.user_id : null;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Fetch booking details to verify ownership and get seat count
    const bookingRes = await client.query(
      'SELECT user_id, event_id, seats_booked FROM BOOKINGS WHERE booking_id = $1 FOR UPDATE',
      [id]
    );

    if (bookingRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Booking record not found.' });
    }

    const booking = bookingRes.rows[0];

    // Verify ownership if normal user is cancelling
    if (isUserLoggedIn && booking.user_id !== userId) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Access denied. You can only cancel your own bookings.' });
    }

    // 2. Increase available seats for the event
    const eventRes = await client.query(
      'SELECT available_seats, total_seats FROM EVENTS WHERE event_id = $1 FOR UPDATE',
      [booking.event_id]
    );

    if (eventRes.rows.length > 0) {
      const event = eventRes.rows[0];
      const newAvailable = Math.min(event.total_seats, event.available_seats + booking.seats_booked);
      
      await client.query(
        'UPDATE EVENTS SET available_seats = $1 WHERE event_id = $2',
        [newAvailable, booking.event_id]
      );
    }

    // 3. Delete booking record
    await client.query('DELETE FROM BOOKINGS WHERE booking_id = $1', [id]);

    await client.query('COMMIT');
    return res.status(200).json({ message: 'Booking cancelled successfully.' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Cancellation Transaction Error:', err);
    return res.status(500).json({ error: 'Server error cancelling booking.' });
  } finally {
    client.release();
  }
}

module.exports = {
  getAllBookings,
  getMyBookings,
  bookEvent,
  cancelBooking
};
