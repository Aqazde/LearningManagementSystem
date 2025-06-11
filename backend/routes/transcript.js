const express = require('express');
const router = express.Router();
const pool = require('../config/postgreConfig');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');

/**
 * 🔹 Get transcript (Students Only)
 * Method: GET
 * Route: /api/transcript
 */
router.get('/', authenticateToken, authorizeRoles('student'), async (req, res) => {
    const studentId = req.user.id;

    try {
        const coursesQuery = `
            SELECT c.id AS course_id, c.title AS course_title
            FROM enrollments e
            JOIN courses c ON e.course_id = c.id
            WHERE e.user_id = $1
        `;
        const coursesResult = await pool.query(coursesQuery, [studentId]);
        const courses = coursesResult.rows;

        const transcript = [];

        for (const course of courses) {
            const courseData = {
                courseId: course.course_id,
                courseTitle: course.course_title,
                assignments: [],
                quizzes: []
            };

            const assignmentQuery = `
                SELECT a.id, a.title, s.grade
                FROM assignments a
                LEFT JOIN assignment_submissions s
                  ON s.assignment_id = a.id AND s.student_id = $1
                WHERE a.course_id = $2
            `;
            const assignmentResult = await pool.query(assignmentQuery, [studentId, course.course_id]);

            courseData.assignments = assignmentResult.rows.map(row => ({
                title: row.title,
                grade: row.grade,
                status: row.grade !== null ? '✔️' : '❌'
            }));

            const quizQuery = `
                SELECT q.id, q.title, qs.score
                FROM quizzes q
                LEFT JOIN quiz_submissions qs
                  ON qs.quiz_id = q.id AND qs.student_id = $1
                WHERE q.course_id = $2
            `;
            const quizResult = await pool.query(quizQuery, [studentId, course.course_id]);

            courseData.quizzes = quizResult.rows.map(row => ({
                title: row.title,
                score: row.score,
                status: row.score !== null ? '✔️' : '❌'
            }));

            transcript.push(courseData);
        }

        res.json(transcript);
    } catch (err) {
        console.error('Error fetching transcript:', err);
        res.status(500).json({ message: 'Failed to load transcript' });
    }
});

module.exports = router;
