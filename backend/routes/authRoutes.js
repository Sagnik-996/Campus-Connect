const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Public endpoints
router.post('/register', authController.registerUser);
router.post('/login', authController.loginUser);
router.post('/admin/login', authController.loginAdmin);
router.get('/status', authController.getSessionStatus);

// Authenticated endpoints
router.post('/logout', authController.logout);

module.exports = router;
