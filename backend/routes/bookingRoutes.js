const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { isAuthenticated, isAdmin, isUser } = require('../middleware/authMiddleware');

router.get('/', isAuthenticated, isAdmin, bookingController.getAllBookings);
router.get('/my', isAuthenticated, isUser, bookingController.getMyBookings);
router.post('/', isAuthenticated, isUser, bookingController.bookEvent);
router.delete('/:id', isAuthenticated, bookingController.cancelBooking);

module.exports = router;
