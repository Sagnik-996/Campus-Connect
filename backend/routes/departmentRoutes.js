const express = require('express');
const router = express.Router();
const deptController = require('../controllers/deptController');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware');

// Get all departments - available to logged-in users/admins
router.get('/', isAuthenticated, deptController.getAllDepartments);

// CRUD operations - Admins only
router.post('/', isAuthenticated, isAdmin, deptController.addDepartment);
router.put('/:id', isAuthenticated, isAdmin, deptController.editDepartment);
router.delete('/:id', isAuthenticated, isAdmin, deptController.deleteDepartment);

module.exports = router;
