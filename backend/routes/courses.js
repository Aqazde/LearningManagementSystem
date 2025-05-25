const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');
const { createCourse, getAllCourses, getCourseById, updateCourse, deleteCourse, getCoursesByTeacher } = require('../models/course');
const { logger } = require('../utils/logger');

const router = express.Router();

/**
 * 🔹 Create a new course (Admin Only)
 * Method: POST
 * Route: /api/courses/create
 */
router.post('/create', authenticateToken, authorizeRoles('admin', 'teacher'), async (req, res) => {
    const { title, description } = req.body;
    const adminId = req.user.id; // Extracted from JWT

    try {
        const course = await createCourse(title, description, adminId);
        logger.info(`Course created: ${title} by Admin ID: ${adminId}`);
        res.status(201).json({ message: 'Course created successfully', course });
    } catch (error) {
        logger.error(`Error creating course: ${error.message}`);
        res.status(500).json({ message: 'Error creating course', error: error.message });
    }
});

/**
 * 🔹 Get all courses (Open to all users)
 * Method: GET
 * Route: /api/courses
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const courses = await getAllCourses();
        res.json(courses);
    } catch (error) {
        logger.error(`Error fetching courses: ${error.message}`);
        res.status(500).json({ message: 'Error fetching courses', error: error.message });
    }
});

/**
 * 🔹 Get courses assigned to logged-in teacher
 * Method: GET
 * Route: /api/courses/my-teacher-courses
 */
router.get('/my-teacher-courses', authenticateToken, authorizeRoles('teacher'), async (req, res) => {
    try {
        const courses = await getCoursesByTeacher(req.user.id);
        res.json(courses);
    } catch (error) {
        logger.error(`Error fetching teacher's courses: ${error.message}`);
        res.status(500).json({ message: 'Error fetching teacher courses' });
    }
});

/**
 * 🔹 Get course by ID (Open to all users)
 * Method: GET
 * Route: /api/courses/:id
 */
router.get('/:id', authenticateToken, async (req, res) => {
    const courseId = req.params.id;

    try {
        const course = await getCourseById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }
        res.json(course);
    } catch (error) {
        logger.error(`Error fetching course: ${error.message}`);
        res.status(500).json({ message: 'Error fetching course', error: error.message });
    }
});

/**
 * 🔹 Update course (Admin Only)
 * Method: PUT
 * Route: /api/courses/:id
 */
router.put('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    const courseId = req.params.id;
    const { title, description } = req.body;

    try {
        const updatedCourse = await updateCourse(courseId, title, description);
        if (!updatedCourse) {
            return res.status(404).json({ message: 'Course not found' });
        }
        logger.info(`Course updated: ID ${courseId}`);
        res.json({ message: 'Course updated successfully', updatedCourse });
    } catch (error) {
        logger.error(`Error updating course: ${error.message}`);
        res.status(500).json({ message: 'Error updating course', error: error.message });
    }
});

/**
 * 🔹 Delete course (Admin Only)
 * Method: DELETE
 * Route: /api/courses/:id
 */
router.delete('/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    const courseId = req.params.id;

    try {
        const deletedCourse = await deleteCourse(courseId);
        if (!deletedCourse) {
            return res.status(404).json({ message: 'Course not found' });
        }
        logger.info(`Course deleted: ID ${courseId}`);
        res.json({ message: 'Course deleted successfully' });
    } catch (error) {
        logger.error(`Error deleting course: ${error.message}`);
        res.status(500).json({ message: 'Error deleting course', error: error.message });
    }
});

module.exports = router;
