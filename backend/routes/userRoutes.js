const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { isAuthenticated, isAdmin, isUser } = require('../middleware/authMiddleware');

// Admin route: View all users
router.get('/', isAuthenticated, isAdmin, userController.getAllUsers);

// User routes: Manage own profile
router.get('/profile', isAuthenticated, isUser, userController.getProfile);
router.put('/profile', isAuthenticated, isUser, userController.updateProfile);

module.exports = router;
