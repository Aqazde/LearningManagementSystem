const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');
const {
    createQuiz,
    addQuizQuestion,
    getQuizzesByCourse,
    getQuizWithQuestions,
    getQuizById
} = require('../models/quiz');
const { logger } = require('../utils/logger');
const { OpenAI } = require('openai');

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
/**
 * 🔹 Create a new quiz (Teachers Only)
 * POST /api/quizzes/create
 */
router.post('/create', authenticateToken, authorizeRoles('teacher'), async (req, res) => {
    const {
        courseId, title, description, weekLabel, dueDate,
        allowMultipleAttempts, timeLimit, questions = []
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
                q.points || 0
            );
        }

        logger.info(`Quiz created: ${title} by Teacher ID: ${teacherId}`);
        res.status(201).json({ message: 'Quiz created successfully', quiz });
    } catch (error) {
        logger.error(`Error creating quiz: ${error.message}`);
        res.status(500).json({ message: 'Error creating quiz', error: error.message });
    }
});

/**
 * 🔹 Create a quiz using OpenAI-generated questions
 * POST /api/quizzes/create-with-ai
 */
router.post('/create-with-ai', authenticateToken, authorizeRoles('teacher'), async (req, res) => {
    const {
        courseId, title, description, weekLabel, dueDate,
        allowMultipleAttempts, timeLimit,
        topic, numQuestions = 5, questionType = 'multiple_choice', difficulty = 'medium'
    } = req.body;

    const teacherId = req.user.id;

    const prompt = `
Generate ${numQuestions} ${difficulty} ${questionType} questions on the topic "${topic}".
Return them as a JSON array with this structure:
[
  {
    "questionText": "...",
    "questionType": "${questionType}",
    "options": ["A", "B", "C", "D"], // Only for multiple_choice
    "correctAnswer": "A",
    "points": 5
  }
]`;

    try {
        // Step 1: Generate questions
        const response = await openai.chat.completions.create({
            model: 'gpt-4.1-mini',
            messages: [
                { role: 'system', content: 'You are a helpful quiz generator for educators.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.7
        });

        const aiContent = response.choices[0].message.content;
        let questions;
        try {
            questions = JSON.parse(aiContent);
        } catch (parseErr) {
            return res.status(500).json({ message: 'Failed to parse AI response', raw: aiContent });
        }

        // Step 2: Create quiz
        const quiz = await createQuiz(courseId, title, description, weekLabel, dueDate, allowMultipleAttempts, timeLimit, teacherId);

        // Step 3: Save questions
        for (const q of questions) {
            await addQuizQuestion(
                quiz.id,
                q.questionText,
                q.questionType,
                q.options || null,
                q.correctAnswer || null,
                q.points || 0
            );
        }

        logger.info(`AI-generated quiz created: ${title} by Teacher ID: ${teacherId}`);
        res.status(201).json({ message: 'AI quiz created successfully', quiz, questions });

    } catch (error) {
        logger.error(`AI quiz creation failed: ${error.message}`);
        res.status(500).json({ message: 'Failed to create AI quiz', error: error.message });
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
        res.status(500).json({ message: 'Error fetching quiz', error: error.message });
    }
});

/**
 * 🔹 Quiz Metadata Only (for student preview)
 * GET /api/quizzes/:quizId/metadata
 */
router.get('/:quizId/metadata', authenticateToken, async (req, res) => {
    try {
        const quiz = await getQuizById(req.params.quizId);
        if (!quiz) return res.status(404).json({ message: 'Quiz not found' });

        res.json({
            id: quiz.id,
            title: quiz.title,
            description: quiz.description,
            course_id: quiz.course_id,
            time_limit: quiz.time_limit,
            allow_multiple_attempts: quiz.allow_multiple_attempts,
            due_date: quiz.due_date
        });
    } catch (error) {
        logger.error(`Error fetching quiz metadata: ${error.message}`);
        res.status(500).json({ message: 'Error fetching quiz metadata' });
    }
});

module.exports = router;
