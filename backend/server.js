const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const apiRouter = require('./api/api');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS setup
// Since we use sessions (credentials), we must define a specific origin or reflect the requesting origin
// and set credentials: true.
app.use(cors({
  origin: true,
  credentials: true
}));

// Parsing requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configurations
app.use(session({
  secret: process.env.SESSION_SECRET || 'college_event_booking_secret_key_987654321',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // set to true if using HTTPS, must be false for local dev HTTP
    httpOnly: true,
    sameSite: 'lax', // Lax works well for local cross-origin redirection
    maxAge: 24 * 60 * 60 * 1000 // 1 day session persistence
  }
}));

// API Routes
app.use('/api', apiRouter);

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
