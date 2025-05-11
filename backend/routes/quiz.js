const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');
const {
    createQuiz,
    addQuizQuestion,
    getQuizzesByCourse,
    getQuizWithQuestions
} = require('../models/quiz');
const { logger } = require('../utils/logger');

const router = express.Router();

/**
 * 🔹 Create a new quiz (Teachers Only)
 * POST /api/quizzes/create
 */
router.post('/create', authenticateToken, authorizeRoles('teacher'), async (req, res) => {
    const {
        courseId, title, description, weekLabel, dueDate,
        allowMultipleAttempts, timeLimit, questions
    } = req.body;

    const teacherId = req.user.id;

    try {
        const quiz = await createQuiz(courseId, title, description, weekLabel, dueDate, allowMultipleAttempts, timeLimit, teacherId);

        for (const q of questions) {
            await addQuizQuestion(
                quiz.id,
                q.questionText,
                q.questionType,
                q.options || null,
                q.correctAnswer || null,
                q.points || 0);
        }

        logger.info(`Quiz created: ${title} by Teacher ID: ${teacherId}`);
        res.status(201).json({ message: 'Quiz created successfully', quiz });
    } catch (error) {
        logger.error(`Error creating quiz: ${error.message}`);
        res.status(500).json({ message: 'Error creating quiz', error: error.message });
    }
});

/**
 * 🔹 Get quizzes for a course (Students & Teachers)
 * GET /api/quizzes/course/:courseId
 */
router.get('/course/:courseId', authenticateToken, async (req, res) => {
    try {
        const quizzes = await getQuizzesByCourse(req.params.courseId);
        res.json(quizzes);
    } catch (error) {
        logger.error(`Error fetching quizzes: ${error.message}`);
        res.status(500).json({ message: 'Error fetching quizzes' });
    }
});

/**
 * 🔹 Get specific quiz with questions
 * GET /api/quizzes/:quizId
 */
router.get('/:quizId', authenticateToken, async (req, res) => {
    try {
        const data = await getQuizWithQuestions(req.params.quizId);
        if (!data.quiz) return res.status(404).json({ message: 'Quiz not found' });

        res.json(data);
    } catch (error) {
        logger.error(`Error fetching quiz: ${error.message}`);
        res.status(500).json({ message: 'Error fetching quiz' });
    }
});

module.exports = router;
