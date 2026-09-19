const pool = require('../models/db');
const { hashPassword } = require('../authentication/auth');

// 1. Get All Users (Admin Only)
async function getAllUsers(req, res) {
  try {
    const result = await pool.query('SELECT user_id, name, email FROM USERS ORDER BY name ASC');
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('Get All Users Error:', err);
    return res.status(500).json({ error: 'Server error retrieving users.' });
  }
}

// 2. Get User Profile (User Only)
async function getProfile(req, res) {
  const userId = req.session.user.user_id;

  try {
    const result = await pool.query('SELECT user_id, name, email FROM USERS WHERE user_id = $1', [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Get Profile Error:', err);
    return res.status(500).json({ error: 'Server error retrieving profile.' });
  }
}

// 3. Update User Profile (User Only)
async function updateProfile(req, res) {
  const userId = req.session.user.user_id;
  const { name, email, new_password } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  try {
    const existing = await pool.query('SELECT user_id FROM USERS WHERE email = $1 AND user_id != $2', [email.trim().toLowerCase(), userId]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Email is already in use by another user.' });
    }

    let query = 'UPDATE USERS SET name = $1, email = $2';
    const params = [name.trim(), email.trim().toLowerCase()];

    if (new_password && new_password.trim() !== '') {
      const hashed = await hashPassword(new_password);
      params.push(hashed);
      query += `, password = $${params.length}`;
    }

    params.push(userId);
    query += ` WHERE user_id = $${params.length}`;

    await pool.query(query, params);

    req.session.user.name = name.trim();
    req.session.user.email = email.trim().toLowerCase();
    
    req.session.save((err) => {
      if (err) {
        console.error('Profile Update Session Save Error:', err);
        return res.status(500).json({ error: 'Failed to update session settings.' });
      }
      return res.status(200).json({
        message: 'Profile updated successfully!',
        user: {
          user_id: userId,
          name: name.trim(),
          email: email.trim().toLowerCase()
        }
      });
    });
  } catch (err) {
    console.error('Update Profile Error:', err);
    return res.status(500).json({ error: 'Server error updating profile.' });
  }
}

module.exports = {
  getAllUsers,
  getProfile,
  updateProfile
};
