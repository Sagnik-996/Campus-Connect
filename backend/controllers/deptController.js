const pool = require('../models/db');

// List all departments
async function getAllDepartments(req, res) {
  try {
    const [depts] = await pool.query('SELECT * FROM DEPARTMENTS ORDER BY dept_id ASC');
    return res.status(200).json(depts);
  } catch (err) {
    console.error('Get All Departments Error:', err);
    return res.status(500).json({ error: 'Server error retrieving departments.' });
  }
}

// Add Department (Admin only)
async function addDepartment(req, res) {
  const { dept_name } = req.body;
  if (!dept_name || !dept_name.trim()) {
    return res.status(400).json({ error: 'Department name is required.' });
  }

  try {
    const [result] = await pool.query('INSERT INTO DEPARTMENTS (dept_name) VALUES (?)', [dept_name.trim()]);
    return res.status(201).json({
      message: 'Department added successfully!',
      dept_id: result.insertId,
      dept_name: dept_name.trim()
    });
  } catch (err) {
    console.error('Add Department Error:', err);
    return res.status(500).json({ error: 'Server error adding department.' });
  }
}

// Edit Department (Admin only)
async function editDepartment(req, res) {
  const { id } = req.params;
  const { dept_name } = req.body;

  if (!dept_name || !dept_name.trim()) {
    return res.status(400).json({ error: 'Department name is required.' });
  }

  try {
    const [result] = await pool.query('UPDATE DEPARTMENTS SET dept_name = ? WHERE dept_id = ?', [dept_name.trim(), id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Department not found.' });
    }
    return res.status(200).json({ message: 'Department updated successfully!' });
  } catch (err) {
    console.error('Edit Department Error:', err);
    return res.status(500).json({ error: 'Server error updating department.' });
  }
}

// Delete Department (Admin only)
async function deleteDepartment(req, res) {
  const { id } = req.params;

  try {
    const [result] = await pool.query('DELETE FROM DEPARTMENTS WHERE dept_id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Department not found.' });
    }
    return res.status(200).json({ message: 'Department deleted successfully!' });
  } catch (err) {
    console.error('Delete Department Error:', err);
    return res.status(500).json({ error: 'Server error deleting department.' });
  }
}

module.exports = {
  getAllDepartments,
  addDepartment,
  editDepartment,
  deleteDepartment
};
