const pool = require('../models/db');

// 1. Get All Events (with optional filters: search, dept, venue)
async function getAllEvents(req, res) {
  const { search, dept_id, venue_id } = req.query;

  let query = `
    SELECT e.*, d.dept_name, v.venue_name, v.location, v.capacity as venue_capacity
    FROM events e
    JOIN departments d ON e.dept_id = d.dept_id
    JOIN venues v ON e.venue_id = v.venue_id
    WHERE 1=1
  `;
  const params = [];


  try {
   let index = 1;

if (search) {
  query += ` AND (e.event_name ILIKE $${index} OR d.dept_name ILIKE $${index + 1} OR v.venue_name ILIKE $${index + 2})`;
  const searchParam = `%${search}%`;
  params.push(searchParam, searchParam, searchParam);
  index += 3;
}

if (dept_id) {
  query += ` AND e.dept_id = $${index}`;
  params.push(dept_id);
  index++;
}

if (venue_id) {
  query += ` AND e.venue_id = $${index}`;
  params.push(venue_id);
}
query += ' ORDER BY e.event_date ASC, e.event_time ASC';


const { rows: events } = await pool.query(query, params);
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
    const { rows: events } = await pool.query(
      `SELECT e.*, d.dept_name, v.venue_name, v.location, v.capacity as venue_capacity
       FROM events e
       JOIN departments d ON e.dept_id = d.dept_id
       JOIN venues v ON e.venue_id = v.venue_id
       WHERE e.event_id = $1`,
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
    const { rows: venues } = await pool.query('SELECT capacity FROM venues WHERE venue_id = $1', [venue_id]);
    if (venues.length === 0) {
      return res.status(400).json({ error: 'Selected venue does not exist.' });
    }

    const venueCapacity = venues[0].capacity;
    if (seats > venueCapacity) {
      return res.status(400).json({ error: `Event seats (${seats}) exceed venue capacity (${venueCapacity}).` });
    }

    // Verify Department exists
    const { rows: depts } = await pool.query('SELECT dept_id FROM departments WHERE dept_id = $1', [dept_id]);
    if (depts.length === 0) {
      return res.status(400).json({ error: 'Selected department does not exist.' });
    }

    // Create Event
    const result = await pool.query(
`INSERT INTO events
(event_name,event_date,event_time,total_seats,available_seats,venue_id,dept_id)
VALUES ($1,$2,$3,$4,$5,$6,$7)
RETURNING event_id`,
[
event_name.trim(),
event_date,
event_time,
seats,
seats,
venue_id,
dept_id
]
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

  const seats = parseInt(total_seats);
  if (isNaN(seats) || seats <= 0) {
    return res.status(400).json({ error: 'Total seats must be a positive integer.' });
  }

  try {
    // Get existing event details
    const { rows: currentEvents } = await pool.query('SELECT total_seats, available_seats FROM events WHERE event_id = $1', [id]);
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
    const { rows: venues } = await pool.query('SELECT capacity FROM venues WHERE venue_id = $1', [venue_id]);
    if (venues.length === 0) {
      return res.status(400).json({ error: 'Selected venue does not exist.' });
    }

    const venueCapacity = venues[0].capacity;
    if (seats > venueCapacity) {
      return res.status(400).json({ error: `Event seats (${seats}) exceed venue capacity (${venueCapacity}).` });
    }

    // Verify Department exists
    const { rows: depts } = await pool.query('SELECT dept_id FROM departments WHERE dept_id = $1', [dept_id]);
    if (depts.length === 0) {
      return res.status(400).json({ error: 'Selected department does not exist.' });
    }

    // Calculate new available seats
    const newAvailable = seats - seatsBooked;

    // Update
    await pool.query(
      `UPDATE events
SET
event_name=$1,
event_date=$2,
event_time=$3,
total_seats=$4,
available_seats=$5,
venue_id=$6,
dept_id=$7
WHERE event_id=$8`,
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
    const result = await pool.query('DELETE FROM events WHERE event_id = $1', [id]);
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
    const { rows: totalEventsResult } = await pool.query('SELECT COUNT(*) as count FROM events');
    const { rows: totalBookingsResult } = await pool.query(
'SELECT COUNT(*) AS count, COALESCE(SUM(seats_booked), 0) AS total_seats_booked FROM bookings'
);
    const { rows: totalUsersResult } = await pool.query('SELECT COUNT(*) as count FROM users');

    // Bookings per department
    const { rows: deptStats } = await pool.query(`
      SELECT d.dept_name, COUNT(b.booking_id) as booking_count, COALESCE(SUM(b.seats_booked), 0) as seats_booked
      FROM departments d
      LEFT JOIN events e ON d.dept_id = e.dept_id
      LEFT JOIN bookings b ON e.event_id = b.event_id
      GROUP BY d.dept_id, d.dept_name
    `);

    // Most popular events
    const { rows: popularEvents } = await pool.query(`
      SELECT e.event_name, COUNT(b.booking_id) as booking_count, COALESCE(SUM(b.seats_booked), 0) as seats_booked
      FROM events e
      LEFT JOIN bookings b ON e.event_id = b.event_id
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
