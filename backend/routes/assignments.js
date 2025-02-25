const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');
const { createAssignment, getAssignmentsByCourse, getAssignmentById, updateAssignment, deleteAssignment } = require('../models/assignment');
const { logger } = require('../utils/logger');

const router = express.Router();

/**
 * 🔹 Create a new assignment (Teachers Only)
 * Method: POST
 * Route: /api/assignments/create
 */
router.post('/create', authenticateToken, authorizeRoles('teacher'), async (req, res) => {
    const { courseId, title, description, dueDate } = req.body;
    const teacherId = req.user.id; // Extracted from JWT

    try {
        const assignment = await createAssignment(courseId, title, description, dueDate, teacherId);
        logger.info(`Assignment created: ${title} by Teacher ID: ${teacherId}`);
        res.status(201).json({ message: 'Assignment created successfully', assignment });
    } catch (error) {
        logger.error(`Error creating assignment: ${error.message}`);
        res.status(500).json({ message: 'Error creating assignment', error: error.message });
    }
});

/**
 * 🔹 Get all assignments for a course (Students & Teachers)
 * Method: GET
 * Route: /api/assignments/course/:courseId
 */
router.get('/course/:courseId', authenticateToken, async (req, res) => {
    const courseId = req.params.courseId;

    try {
        const assignments = await getAssignmentsByCourse(courseId);
        res.json(assignments);
    } catch (error) {
        logger.error(`Error fetching assignments: ${error.message}`);
        res.status(500).json({ message: 'Error fetching assignments', error: error.message });
    }
});

/**
 * 🔹 Get a specific assignment (Students & Teachers)
 * Method: GET
 * Route: /api/assignments/:id
 */
router.get('/:id', authenticateToken, async (req, res) => {
    const assignmentId = req.params.id;

    try {
        const assignment = await getAssignmentById(assignmentId);
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }
        res.json(assignment);
    } catch (error) {
        logger.error(`Error fetching assignment: ${error.message}`);
        res.status(500).json({ message: 'Error fetching assignment', error: error.message });
    }
});

/**
 * 🔹 Update assignment (Teachers Only)
 * Method: PUT
 * Route: /api/assignments/:id
 */
router.put('/:id', authenticateToken, authorizeRoles('teacher'), async (req, res) => {
    const assignmentId = req.params.id;
    const { title, description, dueDate } = req.body;

    try {
        const updatedAssignment = await updateAssignment(assignmentId, title, description, dueDate);
        if (!updatedAssignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }
        logger.info(`Assignment updated: ID ${assignmentId}`);
        res.json({ message: 'Assignment updated successfully', updatedAssignment });
    } catch (error) {
        logger.error(`Error updating assignment: ${error.message}`);
        res.status(500).json({ message: 'Error updating assignment', error: error.message });
    }
});

/**
 * 🔹 Delete an assignment (Teachers Only)
 * Method: DELETE
 * Route: /api/assignments/:id
 */
router.delete('/:id', authenticateToken, authorizeRoles('teacher'), async (req, res) => {
    const assignmentId = req.params.id;

    try {
        const deletedAssignment = await deleteAssignment(assignmentId);
        if (!deletedAssignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }
        logger.info(`Assignment deleted: ID ${assignmentId}`);
        res.json({ message: 'Assignment deleted successfully' });
    } catch (error) {
        logger.error(`Error deleting assignment: ${error.message}`);
        res.status(500).json({ message: 'Error deleting assignment', error: error.message });
    }
});

module.exports = router;
