const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');
const { logger } = require('../utils/logger');
const { OpenAI } = require('openai'); // or however you're initializing OpenAI SDK

const router = express.Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * 🔹 Generate quiz questions using OpenAI
 * POST /api/ai/generate-quiz
 */
router.post('/generate-quiz', authenticateToken, authorizeRoles('teacher'), async (req, res) => {
    const { topic, numQuestions, questionType, difficulty } = req.body;

    try {
        const prompt = `
Generate ${numQuestions} ${difficulty} ${questionType} questions on the topic "${topic}".
Return them as a JSON array with the following structure:
[
  {
    "questionText": "...",
    "questionType": "${questionType}",
    "options": ["A", "B", "C", "D"], // Only for multiple_choice
    "correctAnswer": "A",
    "points": 5
  },
  ...
]
`;

        const response = await openai.chat.completions.create({
            model: 'gpt-4.1-mini',
            messages: [
                { role: 'system', content: 'You are a helpful quiz generator for educators.' },
                { role: 'user', content: prompt }
            ],
            temperature: 0.7,
        });

        const parsed = JSON.parse(response.choices[0].message.content);
        res.json({ questions: parsed });
    } catch (error) {
        logger.error(`AI quiz generation failed: ${error.message}`);
        res.status(500).json({ message: 'Failed to generate quiz', error: error.message });
    }
});

module.exports = router;
