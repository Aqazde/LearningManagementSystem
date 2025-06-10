const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');
const { enrollStudent, getStudentEnrollments, unenrollStudent } = require('../models/enrollment');
const { getCourseById } = require('../models/course');
const { logger } = require('../utils/logger');

const router = express.Router();

/**
 * 🔹 Enroll in a course (Students Only)
 * Method: POST
 * Route: /api/enrollments/:courseId
 */
router.post('/:courseId', authenticateToken, authorizeRoles('student'), async (req, res) => {
    const userId = req.user.id;
    const courseId = req.params.courseId;

    try {
        const course = await getCourseById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const enrollment = await enrollStudent(userId, courseId);
        logger.info(`User ${userId} enrolled in course ${courseId}`);
        res.status(201).json({ message: 'Enrolled successfully', enrollment });
    } catch (error) {
        logger.error(`Error enrolling in course: ${error.message}`);
        res.status(400).json({ message: error.message });
    }
});

/**
 * 🔹 Get all enrolled courses (Students Only)
 * Method: GET
 * Route: /api/enrollments/my-courses
 */
router.get('/my-courses', authenticateToken, authorizeRoles('student'), async (req, res) => {
    const userId = req.user.id;

    try {
        const courses = await getStudentEnrollments(userId);
        res.json(courses);
    } catch (error) {
        logger.error(`Error fetching enrollments: ${error.message}`);
        res.status(500).json({ message: 'Error fetching enrollments', error: error.message });
    }
});

/**
 * 🔹 Unenroll from a course (Students Only)
 * Method: DELETE
 * Route: /api/enrollments/:courseId
 */
router.delete('/:courseId', authenticateToken, authorizeRoles('student'), async (req, res) => {
    const userId = req.user.id;
    const courseId = req.params.courseId;

    try {
        // Check if enrolled
        const unenrollment = await unenrollStudent(userId, courseId);
        if (!unenrollment) {
            return res.status(400).json({ message: 'User is not enrolled in this course' });
        }

        logger.info(`User ${userId} unenrolled from course ${courseId}`);
        res.json({ message: 'Unenrolled successfully' });
    } catch (error) {
        logger.error(`Error unenrolling: ${error.message}`);
        res.status(500).json({ message: 'Error unenrolling', error: error.message });
    }
});

module.exports = router;
