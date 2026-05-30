const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { isAuthenticated, isAdmin, isUser } = require('../middleware/authMiddleware');

// Get all bookings (Admin only)
router.get('/', isAuthenticated, isAdmin, bookingController.getAllBookings);

// Get own bookings (User only)
router.get('/my', isAuthenticated, isUser, bookingController.getMyBookings);

// Book an event (User only)
router.post('/', isAuthenticated, isUser, bookingController.bookEvent);

// Cancel a booking (User or Admin - verification is handled in the controller)
router.delete('/:id', isAuthenticated, bookingController.cancelBooking);

module.exports = router;
