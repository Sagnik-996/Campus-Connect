const pool = require('../models/db');
const { hashPassword, verifyPassword } = require('../authentication/auth');

// 1. User Registration
async function registerUser(req, res) {
  const { name, email, password } = req.body;

  // Basic validation
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields (name, email, password) are required.' });
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format.' });
  }

  try {
    // Prevent duplicate email registration
    const { rows: existing } = await pool.query(
      'SELECT user_id FROM users WHERE email = $1',
      [email.trim().toLowerCase()]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: 'A user with this email already exists.' });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Insert user
    const result = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING user_id',
      [name.trim(), email.trim().toLowerCase(), hashedPassword]
    );

    return res.status(201).json({
      message: 'Registration successful! Please log in.',
      userId: result.rows[0].user_id
    });

  } catch (err) {
    console.error('Registration Error:', err);
    return res.status(500).json({ error: 'Server error during registration.' });
  }
}

// 2. User Login
async function loginUser(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const { rows: users } = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email.trim().toLowerCase()]
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = users[0];
    const match = await verifyPassword(password, user.password);

    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    req.session.user = {
      user_id: user.user_id,
      name: user.name,
      email: user.email,
      role: 'user'
    };

    req.session.save((err) => {
      if (err) {
        console.error('Session Save Error:', err);
        return res.status(500).json({ error: 'Failed to initialize session.' });
      }

      return res.status(200).json({
        message: 'Login successful!',
        user: {
          user_id: user.user_id,
          name: user.name,
          email: user.email,
          role: 'user'
        }
      });
    });

  } catch (err) {
    console.error('User Login Error:', err);
    return res.status(500).json({ error: 'Server error during login.' });
  }
}

// 3. Admin Login
async function loginAdmin(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required.' });
  }

  try {
    const { rows: admins } = await pool.query(
      'SELECT * FROM admins WHERE username = $1',
      [username.trim()]
    );

    if (admins.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    const admin = admins[0];
    const match = await verifyPassword(password, admin.password);

    if (!match) {
      return res.status(401).json({ error: 'Invalid username or password.' });
    }

    req.session.admin = {
      admin_id: admin.admin_id,
      username: admin.username,
      role: 'admin'
    };

    req.session.save((err) => {
      if (err) {
        console.error('Admin Session Save Error:', err);
        return res.status(500).json({ error: 'Failed to initialize session.' });
      }

      return res.status(200).json({
        message: 'Admin login successful!',
        admin: {
          admin_id: admin.admin_id,
          username: admin.username,
          role: 'admin'
        }
      });
    });

  } catch (err) {
    console.error('Admin Login Error:', err);
    return res.status(500).json({ error: 'Server error during admin login.' });
  }
}

// 4. Logout
function logout(req, res) {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout Session Destroy Error:', err);
      return res.status(500).json({ error: 'Failed to log out.' });
    }

    res.clearCookie('connect.sid');
    return res.status(200).json({ message: 'Logged out successfully.' });
  });
}

// 5. Session Status
function getSessionStatus(req, res) {
  if (req.session.admin) {
    return res.status(200).json({
      loggedIn: true,
      role: 'admin',
      session: req.session.admin
    });
  } else if (req.session.user) {
    return res.status(200).json({
      loggedIn: true,
      role: 'user',
      session: req.session.user
    });
  } else {
    return res.status(200).json({
      loggedIn: false
    });
  }
}

module.exports = {
  registerUser,
  loginUser,
  loginAdmin,
  logout,
  getSessionStatus
};