const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware');

// Get all events
router.get('/', isAuthenticated, eventController.getAllEvents);

// Get event statistics (Admin only) - MUST BE BEFORE /:id to prevent route clash!
router.get('/stats', isAuthenticated, isAdmin, eventController.getEventStatistics);

// Get event by ID
router.get('/:id', isAuthenticated, eventController.getEventById);

// Admin-only Event CRUD
router.post('/', isAuthenticated, isAdmin, eventController.createEvent);
router.put('/:id', isAuthenticated, isAdmin, eventController.updateEvent);
router.delete('/:id', isAuthenticated, isAdmin, eventController.deleteEvent);

module.exports = router;
