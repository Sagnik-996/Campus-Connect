const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const apiRouter = require('./api/api');

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && !process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET must be set when NODE_ENV=production.');
}

// Render terminates HTTPS before forwarding requests to this app.  Trusting that
// proxy lets Express mark session cookies as secure in production.
if (isProduction) app.set('trust proxy', 1);

// CORS setup
// Since we use sessions (credentials), we must define a specific origin or reflect the requesting origin
// and set credentials: true.
const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
app.use(cors({
  origin(origin, callback) {
    // Requests from the frontend served by this app have no Origin header.
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS'));
  },
  credentials: true
}));

// Parsing requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configurations
app.use(session({
  secret: process.env.SESSION_SECRET || 'development-only-secret-change-me',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: isProduction,
    httpOnly: true,
    sameSite: 'lax', // Lax works well for local cross-origin redirection
    maxAge: 24 * 60 * 60 * 1000 // 1 day session persistence
  }
}));

// API Routes
app.use('/api', apiRouter);

app.get('/api/health', async (req, res) => {
  try {
    const pool = require('./models/db');
    await pool.query('SELECT 1');
    return res.status(200).json({ status: 'ok', database: 'connected' });
  } catch (error) {
    console.error('Health-check database error:', error.message);
    return res.status(503).json({ status: 'unavailable', database: 'disconnected' });
  }
});

// Serve Frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// Fallback to index.html for single page client routes, though this is a multi-page app
app.get('*', (req, res, next) => {
  // If request is for an API endpoint, do not serve index.html (let it 404)
  if (req.url.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(` College Event Booking Server is running!`);
  console.log(` Port: ${PORT}`);
  console.log(` URL:  http://localhost:${PORT}`);
  console.log(`==================================================`);
});
