const express = require('express');
const router = express.Router();
const venueController = require('../controllers/venueController');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware');

router.get('/', isAuthenticated, venueController.getAllVenues);
router.post('/', isAuthenticated, isAdmin, venueController.addVenue);
router.put('/:id', isAuthenticated, isAdmin, venueController.editVenue);
router.delete('/:id', isAuthenticated, isAdmin, venueController.deleteVenue);

module.exports = router;
