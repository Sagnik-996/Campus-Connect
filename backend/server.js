const express = require('express');
const cors = require('cors');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const apiRouter = require('./api/api');

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for Render/production reverse proxy
app.set('trust proxy', 1);

// CORS setup - Allow all origins dynamically with credentials
app.use(cors({
  origin: true,
  credentials: true
}));

// Request parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'campusconnect_production_session_secret_key_987654321',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Safest for Render's reverse proxy terminating TLS
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));

// API Routes
app.use('/api', apiRouter);

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve Frontend static assets
app.use(express.static(path.join(__dirname, '../frontend')));

// Fallback for multi-page frontend routing
app.get('*', (req, res, next) => {
  if (req.url.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(` CampusConnect Server is running!`);
  console.log(` Port: ${PORT}`);
  console.log(` URL:  http://localhost:${PORT}`);
  console.log(` Database: PostgreSQL / Supabase`);
  console.log(`==================================================`);
});
