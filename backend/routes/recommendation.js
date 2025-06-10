const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');
const { getQuizWithQuestions, getQuizzesByCourse } = require('../models/quiz');
const { getAnswersBySubmission, getSubmissionsByQuiz } = require('../models/quiz_submission');
const { OpenAI } = require('openai');
const { logger } = require('../utils/logger');

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * 🔹 Generate recommendations based on one quiz result
 * POST /api/recommendation/quiz/:quizId
 */
router.post('/quiz/:quizId', authenticateToken, authorizeRoles('student'), async (req, res) => {
    const quizId = req.params.quizId;
    const studentId = req.user.id;

    try {
        const quizData = await getQuizWithQuestions(quizId);
        if (!quizData.quiz) return res.status(404).json({ message: 'Quiz not found' });

        // Get student's submission (we assume single attempt)
        const allSubmissions = await getSubmissionsByQuiz(quizId);
        const studentSub = allSubmissions.find(sub => sub.student_id === studentId);

        if (!studentSub) {
            return res.status(404).json({ message: 'No submission found for this quiz.' });
        }

        const answers = await getAnswersBySubmission(studentSub.id);

        const prompt = `
You are an AI education assistant.

Based on the following quiz and the student's performance, give a personalized study recommendation (max 100 words) OR list topics the student should revise.

Quiz Title: "${quizData.quiz.title}"

Questions and student answers:
${answers.map(ans => `Q: ${ans.question_text}\nStudent Answer: ${ans.student_answer} — ${ans.is_correct ? '✅ Correct' : '❌ Incorrect'}`).join('\n\n')}

Student Score: ${studentSub.score}

Your output should be either:
- A bullet list of 2–4 suggested topics to review
OR
- A concise recommendation paragraph (under 100 words)
`;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4.1-mini',
            messages: [
                { role: 'system', content: 'You are a helpful tutor assistant.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.6
        });

        const response = completion.choices[0].message.content;
        res.json({ recommendation: response });

    } catch (error) {
        logger.error(`Quiz recommendation error: ${error.message}`);
        res.status(500).json({ message: 'Failed to generate recommendation', error: error.message });
    }
});


/**
 * 🔹 Generate global course recommendation based on all quiz performance
 * POST /api/recommendation/course/:courseId
 */
router.post('/course/:courseId', authenticateToken, authorizeRoles('student'), async (req, res) => {
    const courseId = req.params.courseId;
    const studentId = req.user.id;

    try {
        const quizzes = await getQuizzesByCourse(courseId);

        if (!quizzes || quizzes.length === 0) {
            return res.status(404).json({ message: 'No quizzes found for course' });
        }

        let quizSummaries = [];

        for (const quiz of quizzes) {
            const full = await getQuizWithQuestions(quiz.id);
            const allSubs = await getSubmissionsByQuiz(quiz.id);
            const studentSub = allSubs.find(s => s.student_id === studentId);

            if (!studentSub) continue;

            const answers = await getAnswersBySubmission(studentSub.id);

            const summary = `
Quiz: ${quiz.title}
Score: ${studentSub.score}
${answers.map(ans => `Q: ${ans.question_text}\nA: ${ans.student_answer} — ${ans.is_correct ? 'Correct' : 'Incorrect'}`).join('\n')}
`;
            quizSummaries.push(summary);
        }

        if (quizSummaries.length === 0) {
            return res.status(404).json({ message: 'No quiz results available for this student.' });
        }

        const prompt = `
Act as an educational AI assistant. A student has completed several quizzes from the course "${courseId}".

Review their quiz results below, identify their weaknesses and generate one personalized recommendation paragraph (max 100 words) or a bullet list of suggested study topics.

${quizSummaries.join('\n\n')}

Respond only with the final recommendation.
`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4.1-mini',
            messages: [
                { role: 'system', content: 'You are a helpful tutor assistant.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.7
        });

        const content = response.choices[0].message.content;
        res.json({ recommendation: content });

    } catch (error) {
        logger.error(`Course recommendation error: ${error.message}`);
        res.status(500).json({ message: 'Failed to generate course recommendation', error: error.message });
    }
});

module.exports = router;
