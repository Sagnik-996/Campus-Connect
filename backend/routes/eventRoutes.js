const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware');

router.get('/', isAuthenticated, eventController.getAllEvents);
// /stats must precede /:id to prevent route clash!
router.get('/stats', isAuthenticated, isAdmin, eventController.getEventStatistics);
router.get('/:id', isAuthenticated, eventController.getEventById);
router.post('/', isAuthenticated, isAdmin, eventController.createEvent);
router.put('/:id', isAuthenticated, isAdmin, eventController.updateEvent);
router.delete('/:id', isAuthenticated, isAdmin, eventController.deleteEvent);

module.exports = router;
