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

  if (search) {
    query += ' AND (e.event_name LIKE ? OR d.dept_name LIKE ? OR v.venue_name LIKE ?)';
    const searchParam = `%${search}%`;
    params.push(searchParam, searchParam, searchParam);
  }

  if (dept_id) {
    query += ' AND e.dept_id = ?';
    params.push(dept_id);
  }

  if (venue_id) {
    query += ' AND e.venue_id = ?';
    params.push(venue_id);
  }

  query += ' ORDER BY e.event_date ASC, e.event_time ASC';

  try {
    const [events] = await pool.query(query, params);
    return res.status(200).json(events);
  } catch (err) {
    console.error('Get All Events Error:', err);
    return res.status(500).json({ error: 'Server error retrieving events.' });
  }
}

// 2. Get Event Details by ID
async function getEventById(req, res) {
  const { id } = req.params;

  try {
    const [events] = await pool.query(
      `SELECT e.*, d.dept_name, v.venue_name, v.location, v.capacity as venue_capacity
       FROM EVENTS e
       JOIN DEPARTMENTS d ON e.dept_id = d.dept_id
       JOIN VENUES v ON e.venue_id = v.venue_id
       WHERE e.event_id = ?`,
      [id]
    );

    if (events.length === 0) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    return res.status(200).json(events[0]);
  } catch (err) {
    console.error('Get Event By ID Error:', err);
    return res.status(500).json({ error: 'Server error retrieving event details.' });
  }
}

// 3. Create Event (Admin Only)
async function createEvent(req, res) {
  const { event_name, event_date, event_time, total_seats, venue_id, dept_id } = req.body;

  // Validation
  if (!event_name || !event_date || !event_time || total_seats === undefined || !venue_id || !dept_id) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  const seats = parseInt(total_seats);
  if (isNaN(seats) || seats <= 0) {
    return res.status(400).json({ error: 'Total seats must be a positive integer.' });
  }

  try {
    // Verify Venue exists and has sufficient capacity
    const [venues] = await pool.query('SELECT capacity FROM VENUES WHERE venue_id = ?', [venue_id]);
    if (venues.length === 0) {
      return res.status(400).json({ error: 'Selected venue does not exist.' });
    }

    const venueCapacity = venues[0].capacity;
    if (seats > venueCapacity) {
      return res.status(400).json({ error: `Event seats (${seats}) exceed venue capacity (${venueCapacity}).` });
    }

    // Verify Department exists
    const [depts] = await pool.query('SELECT dept_id FROM DEPARTMENTS WHERE dept_id = ?', [dept_id]);
    if (depts.length === 0) {
      return res.status(400).json({ error: 'Selected department does not exist.' });
    }

    // Create Event
    const [result] = await pool.query(
      `INSERT INTO EVENTS (event_name, event_date, event_time, total_seats, available_seats, venue_id, dept_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [event_name.trim(), event_date, event_time, seats, seats, venue_id, dept_id]
    );

    return res.status(201).json({
      message: 'Event created successfully!',
      event_id: result.insertId
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

  const seats = parseInt(total_seats);
  if (isNaN(seats) || seats <= 0) {
    return res.status(400).json({ error: 'Total seats must be a positive integer.' });
  }

  try {
    // Get existing event details
    const [currentEvents] = await pool.query('SELECT total_seats, available_seats FROM EVENTS WHERE event_id = ?', [id]);
    if (currentEvents.length === 0) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    const current = currentEvents[0];
    const seatsBooked = current.total_seats - current.available_seats;

    // Check capacity rules
    if (seats < seatsBooked) {
      return res.status(400).json({
        error: `Cannot reduce total seats to ${seats}. ${seatsBooked} seats are already booked for this event.`
      });
    }

    // Verify Venue exists and has capacity
    const [venues] = await pool.query('SELECT capacity FROM VENUES WHERE venue_id = ?', [venue_id]);
    if (venues.length === 0) {
      return res.status(400).json({ error: 'Selected venue does not exist.' });
    }

    const venueCapacity = venues[0].capacity;
    if (seats > venueCapacity) {
      return res.status(400).json({ error: `Event seats (${seats}) exceed venue capacity (${venueCapacity}).` });
    }

    // Verify Department exists
    const [depts] = await pool.query('SELECT dept_id FROM DEPARTMENTS WHERE dept_id = ?', [dept_id]);
    if (depts.length === 0) {
      return res.status(400).json({ error: 'Selected department does not exist.' });
    }

    // Calculate new available seats
    const newAvailable = seats - seatsBooked;

    // Update
    await pool.query(
      `UPDATE EVENTS 
       SET event_name = ?, event_date = ?, event_time = ?, total_seats = ?, available_seats = ?, venue_id = ?, dept_id = ? 
       WHERE event_id = ?`,
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
    const [result] = await pool.query('DELETE FROM EVENTS WHERE event_id = ?', [id]);
    if (result.affectedRows === 0) {
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
    const [totalEventsResult] = await pool.query('SELECT COUNT(*) as count FROM EVENTS');
    const [totalBookingsResult] = await pool.query('SELECT COUNT(*) as count, SUM(seats_booked) as total_seats_booked FROM BOOKINGS');
    const [totalUsersResult] = await pool.query('SELECT COUNT(*) as count FROM USERS');

    // Bookings per department
    const [deptStats] = await pool.query(`
      SELECT d.dept_name, COUNT(b.booking_id) as booking_count, IFNULL(SUM(b.seats_booked), 0) as seats_booked
      FROM DEPARTMENTS d
      LEFT JOIN EVENTS e ON d.dept_id = e.dept_id
      LEFT JOIN BOOKINGS b ON e.event_id = b.event_id
      GROUP BY d.dept_id, d.dept_name
    `);

    // Most popular events
    const [popularEvents] = await pool.query(`
      SELECT e.event_name, COUNT(b.booking_id) as booking_count, IFNULL(SUM(b.seats_booked), 0) as seats_booked
      FROM EVENTS e
      LEFT JOIN BOOKINGS b ON e.event_id = b.event_id
      GROUP BY e.event_id, e.event_name
      ORDER BY seats_booked DESC
      LIMIT 5
    `);

    return res.status(200).json({
      totalEvents: totalEventsResult[0].count,
      totalBookings: totalBookingsResult[0].count,
      totalSeatsBooked: totalBookingsResult[0].total_seats_booked || 0,
      totalUsers: totalUsersResult[0].count,
      deptStats,
      popularEvents
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
