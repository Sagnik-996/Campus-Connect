const express = require('express');
const router = express.Router();

const authRoutes = require('../routes/authRoutes');
const eventRoutes = require('../routes/eventRoutes');
const bookingRoutes = require('../routes/bookingRoutes');
const departmentRoutes = require('../routes/departmentRoutes');
const venueRoutes = require('../routes/venueRoutes');
const userRoutes = require('../routes/userRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/events', eventRoutes);
router.use('/bookings', bookingRoutes);
router.use('/departments', departmentRoutes);
router.use('/venues', venueRoutes);
router.use('/users', userRoutes);

module.exports = router;
