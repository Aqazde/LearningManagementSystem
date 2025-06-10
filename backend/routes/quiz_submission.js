const express = require('express');
const {
    createQuizSubmission,
    saveQuizAnswer,
    finalizeQuizSubmission,
    getSubmissionsByQuiz,
    getAnswersBySubmission,
    hasStudentAttempted,
    getSubmissionByStudent
} = require('../models/quiz_submission');
const { getQuizById, getQuestionsByQuizId } = require('../models/quiz'); // Assuming these exist
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');
const { logger } = require('../utils/logger');

const router = express.Router();

/**
 * 🔹 Submit Quiz (Students Only)
 * POST /api/quizzes/submit
 */
router.post('/submit', authenticateToken, authorizeRoles('student'), async (req, res) => {
    const { quizId, answers } = req.body;
    const studentId = req.user.id;
    const startTime = new Date();

    try {
        const quiz = await getQuizById(quizId);

        if (!quiz) {
            return res.status(404).json({ message: 'Quiz not found' });
        }

        const alreadyAttempted = await hasStudentAttempted(quizId, studentId);
        if (alreadyAttempted && !quiz.allow_multiple_attempts) {
            return res.status(403).json({ message: "You have already taken this quiz. Only one attempt allowed." });
        }

        const submission = await createQuizSubmission(quizId, studentId, startTime, 1);
        const questions = await getQuestionsByQuizId(quizId);

        let totalScore = 0;

        for (const answer of answers) {
            const question = questions.find(q => q.id === answer.questionId);
            if (!question) continue;

            let isCorrect = null;
            let pointsAwarded = 0;

            if (question.question_type === 'multiple_choice' && question.correct_answer !== null) {
                isCorrect = answer.studentAnswer === question.correct_answer;
                pointsAwarded = isCorrect ? question.points : 0;
                totalScore += pointsAwarded;
            }

            await saveQuizAnswer(
                submission.id,
                answer.questionId,
                answer.studentAnswer,
                isCorrect,
                pointsAwarded
            );
        }

        const finalized = await finalizeQuizSubmission(submission.id, totalScore, true);

        res.status(201).json({
            message: 'Quiz submitted successfully',
            submission: finalized
        });
    } catch (error) {
        logger.error(`Error submitting quiz: ${error.message}`);
        res.status(500).json({ message: 'Error submitting quiz', error: error.message });
    }
});

/**
 * 🔹 Get Submissions for a Quiz (Teachers Only)
 * GET /api/quizzes/:quizId/submissions
 */
router.get('/:quizId/submissions', authenticateToken, authorizeRoles('teacher'), async (req, res) => {
    try {
        const quizId = req.params.quizId;
        const submissions = await getSubmissionsByQuiz(quizId);
        res.json(submissions);
    } catch (error) {
        logger.error(`Error fetching quiz submissions: ${error.message}`);
        res.status(500).json({ message: 'Error fetching submissions', error: error.message });
    }
});

/**
 * 🔹 Get Submission Details (Teacher & Student)
 * GET /api/quizzes/submissions/:submissionId
 */
router.get('/submissions/:submissionId', authenticateToken, async (req, res) => {
    const submissionId = req.params.submissionId;

    try {
        const answers = await getAnswersBySubmission(submissionId);
        res.json(answers);
    } catch (error) {
        logger.error(`Error fetching quiz answers: ${error.message}`);
        res.status(500).json({ message: 'Error fetching answers', error: error.message });
    }
});

/**
 * 🔹 Get a student's submission for a quiz (auth'd student only)
 * GET /api/quizzes/:quizId/my-submission
 */
router.get('/:quizId/my-submission', authenticateToken, authorizeRoles('student'), async (req, res) => {
    const quizId = req.params.quizId;
    const studentId = req.user.id;

    try {
        const submission = await getSubmissionByStudent(quizId, studentId);
        if (!submission) {
            return res.status(404).json({ message: 'No submission found for this student and quiz' });
        }

        const answers = await getAnswersBySubmission(submission.id);

        res.json({
            submission,
            answers
        });
    } catch (error) {
        logger.error(`Error getting student's submission: ${error.message}`);
        res.status(500).json({ message: 'Failed to fetch submission', error: error.message });
    }
});

module.exports = router;
