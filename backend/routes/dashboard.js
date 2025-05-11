const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');
const {
    getAssignmentPerformance,
    getQuizPerformance,
    getAverageScores,
    getAssignmentStatsForTeacher,
    getQuizStatsForTeacher
} = require('../models/dashboard');
const { logger } = require('../utils/logger');

const router = express.Router();

/**
 * 🔹 Student Performance Dashboard
 * GET /api/dashboard/student
 * Role: Student
 */
router.get('/student', authenticateToken, authorizeRoles('student'), async (req, res) => {
    const studentId = req.user.id;

    try {
        const assignments = await getAssignmentPerformance(studentId);
        const quizzes = await getQuizPerformance(studentId);
        const averages = await getAverageScores(studentId);

        res.json({
            assignments,
            quizzes,
            averages
        });
    } catch (error) {
        logger.error(`Dashboard fetch error for student ${studentId}: ${error.message}`);
        res.status(500).json({ message: 'Error fetching dashboard data', error: error.message });
    }
});

/**
 * 🔹 Teacher Dashboard
 * GET /api/dashboard/teacher
 * Role: Teacher
 */
router.get('/teacher', authenticateToken, authorizeRoles('teacher'), async (req, res) => {
    const teacherId = req.user.id;

    try {
        const assignmentStats = await getAssignmentStatsForTeacher(teacherId);
        const quizStats = await getQuizStatsForTeacher(teacherId);

        res.json({
            assignments: assignmentStats,
            quizzes: quizStats
        });
    } catch (error) {
        logger.error(`Dashboard fetch error for teacher ${teacherId}: ${error.message}`);
        res.status(500).json({ message: 'Error fetching dashboard data', error: error.message });
    }
});

module.exports = router;
