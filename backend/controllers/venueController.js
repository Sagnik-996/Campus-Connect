const pool = require('../models/db');

// List all venues
async function getAllVenues(req, res) {
  try {
    const [venues] = await pool.query('SELECT * FROM VENUES ORDER BY venue_id ASC');
    return res.status(200).json(venues);
  } catch (err) {
    console.error('Get All Venues Error:', err);
    return res.status(500).json({ error: 'Server error retrieving venues.' });
  }
}

// Add Venue (Admin only)
async function addVenue(req, res) {
  const { venue_name, location, capacity } = req.body;
  if (!venue_name || !location || capacity === undefined) {
    return res.status(400).json({ error: 'Venue name, location, and capacity are required.' });
  }

  const capacityVal = parseInt(capacity);
  if (isNaN(capacityVal) || capacityVal <= 0) {
    return res.status(400).json({ error: 'Capacity must be a positive integer.' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO VENUES (venue_name, location, capacity) VALUES (?, ?, ?)',
      [venue_name.trim(), location.trim(), capacityVal]
    );
    return res.status(201).json({
      message: 'Venue added successfully!',
      venue_id: result.insertId
    });
  } catch (err) {
    console.error('Add Venue Error:', err);
    return res.status(500).json({ error: 'Server error adding venue.' });
  }
}

// Edit Venue (Admin only)
async function editVenue(req, res) {
  const { id } = req.params;
  const { venue_name, location, capacity } = req.body;

  if (!venue_name || !location || capacity === undefined) {
    return res.status(400).json({ error: 'Venue name, location, and capacity are required.' });
  }

  const capacityVal = parseInt(capacity);
  if (isNaN(capacityVal) || capacityVal <= 0) {
    return res.status(400).json({ error: 'Capacity must be a positive integer.' });
  }

  try {
    const [result] = await pool.query(
      'UPDATE VENUES SET venue_name = ?, location = ?, capacity = ? WHERE venue_id = ?',
      [venue_name.trim(), location.trim(), capacityVal, id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Venue not found.' });
    }
    return res.status(200).json({ message: 'Venue updated successfully!' });
  } catch (err) {
    console.error('Edit Venue Error:', err);
    return res.status(500).json({ error: 'Server error updating venue.' });
  }
}

// Delete Venue (Admin only)
async function deleteVenue(req, res) {
  const { id } = req.params;

  try {
    const [result] = await pool.query('DELETE FROM VENUES WHERE venue_id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Venue not found.' });
    }
    return res.status(200).json({ message: 'Venue deleted successfully!' });
  } catch (err) {
    console.error('Delete Venue Error:', err);
    return res.status(500).json({ error: 'Server error deleting venue.' });
  }
}

module.exports = {
  getAllVenues,
  addVenue,
  editVenue,
  deleteVenue
};
