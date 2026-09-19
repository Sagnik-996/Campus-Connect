const pool = require('../models/db');

// 1. Get All Events (with optional filters: search, dept, venue)
async function getAllEvents(req, res) {
  const { search, dept_id, venue_id } = req.query;

  let query = `
    SELECT e.*, d.dept_name, v.venue_name, v.location, v.capacity as venue_capacity
    FROM EVENTS e
    JOIN DEPARTMENTS d ON e.dept_id = d.dept_id
    JOIN VENUES v ON e.venue_id = v.venue_id
    WHERE 1=1
  `;
  const params = [];

  if (search && search.trim() !== '') {
    const searchParam = `%${search.trim()}%`;
    params.push(searchParam, searchParam, searchParam);
    query += ` AND (e.event_name ILIKE $${params.length - 2} OR d.dept_name ILIKE $${params.length - 1} OR v.venue_name ILIKE $${params.length})`;
  }

  if (dept_id && dept_id.trim() !== '') {
    params.push(parseInt(dept_id, 10));
    query += ` AND e.dept_id = $${params.length}`;
  }

  if (venue_id && venue_id.trim() !== '') {
    params.push(parseInt(venue_id, 10));
    query += ` AND e.venue_id = $${params.length}`;
  }

  query += ' ORDER BY e.event_date ASC, e.event_time ASC';

  try {
    const result = await pool.query(query, params);
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('Get All Events Error:', err);
    return res.status(500).json({ error: 'Server error retrieving events.' });
  }
}

// 2. Get Event Details by ID
async function getEventById(req, res) {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `SELECT e.*, d.dept_name, v.venue_name, v.location, v.capacity as venue_capacity
       FROM EVENTS e
       JOIN DEPARTMENTS d ON e.dept_id = d.dept_id
       JOIN VENUES v ON e.venue_id = v.venue_id
       WHERE e.event_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Get Event By ID Error:', err);
    return res.status(500).json({ error: 'Server error retrieving event details.' });
  }
}

// 3. Create Event (Admin Only)
async function createEvent(req, res) {
  const { event_name, event_date, event_time, total_seats, venue_id, dept_id } = req.body;

  if (!event_name || !event_date || !event_time || total_seats === undefined || !venue_id || !dept_id) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const seats = parseInt(total_seats, 10);
  if (isNaN(seats) || seats <= 0) {
    return res.status(400).json({ error: 'Total seats must be a positive integer.' });
  }

  try {
    // Verify Venue exists and has sufficient capacity
    const venueRes = await pool.query('SELECT capacity FROM VENUES WHERE venue_id = $1', [venue_id]);
    if (venueRes.rows.length === 0) {
      return res.status(400).json({ error: 'Selected venue does not exist.' });
    }

    const venueCapacity = venueRes.rows[0].capacity;
    if (seats > venueCapacity) {
      return res.status(400).json({ error: `Event seats (${seats}) exceed venue capacity (${venueCapacity}).` });
    }

    // Verify Department exists
    const deptRes = await pool.query('SELECT dept_id FROM DEPARTMENTS WHERE dept_id = $1', [dept_id]);
    if (deptRes.rows.length === 0) {
      return res.status(400).json({ error: 'Selected department does not exist.' });
    }

    const result = await pool.query(
      `INSERT INTO EVENTS (event_name, event_date, event_time, total_seats, available_seats, venue_id, dept_id) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING event_id`,
      [event_name.trim(), event_date, event_time, seats, seats, venue_id, dept_id]
    );

    return res.status(201).json({
      message: 'Event created successfully!',
      event_id: result.rows[0].event_id
    });
  } catch (err) {
    console.error('Create Event Error:', err);
    return res.status(500).json({ error: 'Server error creating event.' });
  }
}

// 4. Update Event (Admin Only)
async function updateEvent(req, res) {
  const { id } = req.params;
  const { event_name, event_date, event_time, total_seats, venue_id, dept_id } = req.body;

  if (!event_name || !event_date || !event_time || total_seats === undefined || !venue_id || !dept_id) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const seats = parseInt(total_seats, 10);
  if (isNaN(seats) || seats <= 0) {
    return res.status(400).json({ error: 'Total seats must be a positive integer.' });
  }

  try {
    const curRes = await pool.query('SELECT total_seats, available_seats FROM EVENTS WHERE event_id = $1', [id]);
    if (curRes.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    const current = curRes.rows[0];
    const seatsBooked = current.total_seats - current.available_seats;

    if (seats < seatsBooked) {
      return res.status(400).json({
        error: `Cannot reduce total seats to ${seats}. ${seatsBooked} seats are already booked for this event.`
      });
    }

    const venueRes = await pool.query('SELECT capacity FROM VENUES WHERE venue_id = $1', [venue_id]);
    if (venueRes.rows.length === 0) {
      return res.status(400).json({ error: 'Selected venue does not exist.' });
    }

    const venueCapacity = venueRes.rows[0].capacity;
    if (seats > venueCapacity) {
      return res.status(400).json({ error: `Event seats (${seats}) exceed venue capacity (${venueCapacity}).` });
    }

    const deptRes = await pool.query('SELECT dept_id FROM DEPARTMENTS WHERE dept_id = $1', [dept_id]);
    if (deptRes.rows.length === 0) {
      return res.status(400).json({ error: 'Selected department does not exist.' });
    }

    const newAvailable = seats - seatsBooked;

    await pool.query(
      `UPDATE EVENTS 
       SET event_name = $1, event_date = $2, event_time = $3, total_seats = $4, available_seats = $5, venue_id = $6, dept_id = $7 
       WHERE event_id = $8`,
      [event_name.trim(), event_date, event_time, seats, newAvailable, venue_id, dept_id, id]
    );

    return res.status(200).json({ message: 'Event updated successfully!' });
  } catch (err) {
    console.error('Update Event Error:', err);
    return res.status(500).json({ error: 'Server error updating event.' });
  }
}

// 5. Delete Event (Admin Only)
async function deleteEvent(req, res) {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM EVENTS WHERE event_id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Event not found.' });
    }
    return res.status(200).json({ message: 'Event deleted successfully!' });
  } catch (err) {
    console.error('Delete Event Error:', err);
    return res.status(500).json({ error: 'Server error deleting event.' });
  }
}

// 6. Get Event Statistics (Admin Only)
async function getEventStatistics(req, res) {
  try {
    const totalEventsRes = await pool.query('SELECT COUNT(*)::int as count FROM EVENTS');
    const totalBookingsRes = await pool.query('SELECT COUNT(*)::int as count, COALESCE(SUM(seats_booked), 0)::int as total_seats_booked FROM BOOKINGS');
    const totalUsersRes = await pool.query('SELECT COUNT(*)::int as count FROM USERS');

    const deptStatsRes = await pool.query(`
      SELECT d.dept_name, COUNT(b.booking_id)::int as booking_count, COALESCE(SUM(b.seats_booked), 0)::int as seats_booked
      FROM DEPARTMENTS d
      LEFT JOIN EVENTS e ON d.dept_id = e.dept_id
      LEFT JOIN BOOKINGS b ON e.event_id = b.event_id
      GROUP BY d.dept_id, d.dept_name
      ORDER BY d.dept_id ASC
    `);

    const popularEventsRes = await pool.query(`
      SELECT e.event_name, COUNT(b.booking_id)::int as booking_count, COALESCE(SUM(b.seats_booked), 0)::int as seats_booked
      FROM EVENTS e
      LEFT JOIN BOOKINGS b ON e.event_id = b.event_id
      GROUP BY e.event_id, e.event_name
      ORDER BY seats_booked DESC
      LIMIT 5
    `);

    return res.status(200).json({
      totalEvents: totalEventsRes.rows[0].count,
      totalBookings: totalBookingsRes.rows[0].count,
      totalSeatsBooked: totalBookingsRes.rows[0].total_seats_booked || 0,
      totalUsers: totalUsersRes.rows[0].count,
      deptStats: deptStatsRes.rows,
      popularEvents: popularEventsRes.rows
    });
  } catch (err) {
    console.error('Get Stats Error:', err);
    return res.status(500).json({ error: 'Server error calculating statistics.' });
  }
}

module.exports = {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventStatistics
};
