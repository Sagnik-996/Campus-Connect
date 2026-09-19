const express = require('express');
const router = express.Router();
const deptController = require('../controllers/deptController');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware');

router.get('/', isAuthenticated, deptController.getAllDepartments);
router.post('/', isAuthenticated, isAdmin, deptController.addDepartment);
router.put('/:id', isAuthenticated, isAdmin, deptController.editDepartment);
router.delete('/:id', isAuthenticated, isAdmin, deptController.deleteDepartment);

module.exports = router;
