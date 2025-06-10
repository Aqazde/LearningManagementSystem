const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');
const pool = require('../config/postgreConfig');
const { extractTextFromFile, runPlagiarismCheck } = require('../utils/plagiarism');
const router = express.Router();

/**
 * POST /api/plagiarism/check/:submissionId
 * Teachers only
 */
router.post('/check/:submissionId', authenticateToken, authorizeRoles('teacher'), async (req, res) => {
    const { submissionId } = req.params;

    try {
        const submissionResult = await pool.query(
            'SELECT * FROM assignment_submissions WHERE id = $1',
            [submissionId]
        );
        const submission = submissionResult.rows[0];
        if (!submission) return res.status(404).json({ message: 'Submission not found' });

        const assignmentId = submission.assignment_id;
        const studentId = submission.student_id;

        let targetText = submission.submission_text;
        if (!targetText && submission.file_url) {
            targetText = await extractTextFromFile(submission.file_url);
        }

        if (!targetText || targetText.trim() === '') {
    return res.status(400).json({ message: "Uploaded file contains no readable text." });
}

        const otherSubmissionsRes = await pool.query(
            `SELECT id, student_id, submission_text, file_url FROM assignment_submissions
             WHERE assignment_id = $1 AND student_id != $2`,
            [assignmentId, studentId]
        );

        const otherTexts = await Promise.all(otherSubmissionsRes.rows.map(async (sub) => {
            if (sub.submission_text) return sub.submission_text;
            else if (sub.file_url) return await extractTextFromFile(sub.file_url);
            return '';
        }));

        const similarityScores = await runPlagiarismCheck(targetText, otherTexts);

        const results = otherSubmissionsRes.rows.map((sub, i) => ({
            id: sub.id,
            studentId: sub.student_id,
            similarity: similarityScores[i]
        })).sort((a, b) => b.similarity - a.similarity);

        res.json({ matches: results });
    } catch (err) {
        console.error('Plagiarism Check Error:', err);
        res.status(500).json({ message: 'Internal error during plagiarism check' });
    }
});

module.exports = router;
