const pool = require('../models/db');

// 1. View All Bookings (Admin Only)
async function getAllBookings(req, res) {
  try {
    const [bookings] = await pool.query(`
      SELECT b.*, u.name as user_name, u.email as user_email, e.event_name, d.dept_name, v.venue_name
      FROM BOOKINGS b
      JOIN USERS u ON b.user_id = u.user_id
      JOIN EVENTS e ON b.event_id = e.event_id
      JOIN DEPARTMENTS d ON e.dept_id = d.dept_id
      JOIN VENUES v ON e.venue_id = v.venue_id
      ORDER BY b.booking_date DESC, b.booking_id DESC
    `);
    return res.status(200).json(bookings);
  } catch (err) {
    console.error('Get All Bookings Error:', err);
    return res.status(500).json({ error: 'Server error retrieving bookings.' });
  }
}

// 2. View Own Bookings (User Only)
async function getMyBookings(req, res) {
  const userId = req.session.user.user_id;

  try {
    const [bookings] = await pool.query(
      `SELECT b.*, e.event_name, d.dept_name, v.venue_name, v.location
       FROM BOOKINGS b
       JOIN EVENTS e ON b.event_id = e.event_id
       JOIN DEPARTMENTS d ON e.dept_id = d.dept_id
       JOIN VENUES v ON e.venue_id = v.venue_id
       WHERE b.user_id = ?
       ORDER BY b.booking_date DESC, b.booking_id DESC`,
      [userId]
    );
    return res.status(200).json(bookings);
  } catch (err) {
    console.error('Get My Bookings Error:', err);
    return res.status(500).json({ error: 'Server error retrieving bookings.' });
  }
}

// 3. Book Event (User Only)
async function bookEvent(req, res) {
  const userId = req.session.user.user_id;
  const { event_id, seats_booked } = req.body;

  // Validation
  if (!event_id || seats_booked === undefined) {
    return res.status(400).json({ error: 'Event ID and seats to book are required.' });
  }

  const seats = parseInt(seats_booked);
  if (isNaN(seats) || seats <= 0) {
    return res.status(400).json({ error: 'Number of seats must be a positive integer.' });
  }

  const connection = await pool.getConnection();
  try {
    // Start Transaction for Atomicity
    await connection.beginTransaction();

    // 1. Fetch Event and lock row for update to prevent race conditions (overbooking)
    const [events] = await connection.query(
      'SELECT event_name, event_date, event_time, total_seats, available_seats FROM EVENTS WHERE event_id = ? FOR UPDATE',
      [event_id]
    );

    if (events.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Event not found.' });
    }

    const event = events[0];

    // 2. Check if user already booked this event (Prevent duplicates)
    const [existing] = await connection.query(
      'SELECT booking_id FROM BOOKINGS WHERE user_id = ? AND event_id = ?',
      [userId, event_id]
    );
    if (existing.length > 0) {
      await connection.rollback();
      return res.status(400).json({ error: 'You have already booked seats for this event. Cancel your existing booking first if you want to change it.' });
    }

    // 3. Check seat availability
    if (event.available_seats < seats) {
      await connection.rollback();
      return res.status(400).json({
        error: `Insufficient seats available. Only ${event.available_seats} seat(s) left.`
      });
    }

    // 4. Reduce available seats (safety check against negative numbers is implicitly handled by step 3)
    const newAvailableSeats = event.available_seats - seats;
    await connection.query(
      'UPDATE EVENTS SET available_seats = ? WHERE event_id = ?',
      [newAvailableSeats, event_id]
    );

    // 5. Create booking record (inheriting event_date and event_time as required by schema)
    const [bookingResult] = await connection.query(
      `INSERT INTO BOOKINGS (user_id, event_id, seats_booked, booking_date, event_date, event_time) 
       VALUES (?, ?, ?, CURDATE(), ?, ?)`,
      [userId, event_id, seats, event.event_date, event.event_time]
    );

    // Commit Transaction
    await connection.commit();

    return res.status(201).json({
      message: 'Booking completed successfully!',
      bookingId: bookingResult.insertId,
      seatsBooked: seats
    });
  } catch (err) {
    await connection.rollback();
    console.error('Booking Transaction Error:', err);
    return res.status(500).json({ error: 'Server error completing booking.' });
  } finally {
    connection.release();
  }
}

// 4. Cancel Booking (User cancels own booking OR Admin cancels any)
async function cancelBooking(req, res) {
  const { id } = req.params;
  const isUserLoggedIn = !!req.session.user;
  const isAdminLoggedIn = !!req.session.admin;
  const userId = isUserLoggedIn ? req.session.user.user_id : null;

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Fetch booking details to verify ownership and get seat count
    const [bookings] = await connection.query(
      'SELECT user_id, event_id, seats_booked FROM BOOKINGS WHERE booking_id = ? FOR UPDATE',
      [id]
    );

    if (bookings.length === 0) {
      await connection.rollback();
      return res.status(404).json({ error: 'Booking record not found.' });
    }

    const booking = bookings[0];

    // Verify ownership if normal user is cancelling
    if (isUserLoggedIn && booking.user_id !== userId) {
      await connection.rollback();
      return res.status(403).json({ error: 'Access denied. You can only cancel your own bookings.' });
    }

    // 2. Increase available seats for the event
    const [events] = await connection.query(
      'SELECT available_seats, total_seats FROM EVENTS WHERE event_id = ? FOR UPDATE',
      [booking.event_id]
    );

    if (events.length > 0) {
      const event = events[0];
      const newAvailable = Math.min(event.total_seats, event.available_seats + booking.seats_booked);
      
      await connection.query(
        'UPDATE EVENTS SET available_seats = ? WHERE event_id = ?',
        [newAvailable, booking.event_id]
      );
    }

    // 3. Delete booking record
    await connection.query('DELETE FROM BOOKINGS WHERE booking_id = ?', [id]);

    await connection.commit();
    return res.status(200).json({ message: 'Booking cancelled successfully.' });
  } catch (err) {
    await connection.rollback();
    console.error('Cancellation Transaction Error:', err);
    return res.status(500).json({ error: 'Server error cancelling booking.' });
  } finally {
    connection.release();
  }
}

module.exports = {
  getAllBookings,
  getMyBookings,
  bookEvent,
  cancelBooking
};
