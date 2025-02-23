const express = require('express');
const { findAllUsers, findUserById, updateUserRole, deleteUser } = require('../models/user');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');
const { logger } = require('../utils/logger');

const router = express.Router();

/**
 * 🔹 Get All Users (Admin Only) - GET /api/admin/users
 */
router.get('/users', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const users = await findAllUsers();
        res.json(users);
    } catch (error) {
        logger.error(`Error fetching users: ${error.message}`);
        res.status(500).json({ message: 'Error fetching users' });
    }
});

/**
 * 🔹 Get User by ID (Admin Only) - GET /api/admin/users/:id
 */
router.get('/users/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const user = await findUserById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        logger.error(`Error fetching user: ${error.message}`);
        res.status(500).json({ message: 'Error fetching user' });
    }
});

/**
 * 🔹 Update User Role (Admin Only) - PUT /api/admin/users/:id/role
 */
router.put('/users/:id/role', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    const { role } = req.body;
    try {
        const updatedUser = await updateUserRole(req.params.id, role);
        if (!updatedUser) return res.status(404).json({ message: 'User not found' });

        logger.info(`User role updated: ${updatedUser.email} → ${role}`);
        res.json({ message: 'User role updated successfully', updatedUser });
    } catch (error) {
        logger.error(`Error updating user role: ${error.message}`);
        res.status(500).json({ message: 'Error updating user role' });
    }
});

/**
 * 🔹 Delete User (Admin Only) - DELETE /api/admin/users/:id
 */
router.delete('/users/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        await deleteUser(req.params.id);
        logger.info(`User deleted: ID ${req.params.id}`);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        logger.error(`Error deleting user: ${error.message}`);
        res.status(500).json({ message: 'Error deleting user' });
    }
});

module.exports = router;
