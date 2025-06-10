const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middlewares/auth');
const pool = require('../config/postgreConfig');

// PUT /api/assignments/submissions/:id/grade
router.put('/assignments/submissions/:id/grade', authenticateToken, async (req, res) => {
    const submissionId = parseInt(req.params.id);
    const { grade, feedback } = req.body;

    if (isNaN(submissionId)) {
        return res.status(400).json({ message: 'Invalid submission ID.' });
    }

    if (grade === undefined && !feedback) {
        return res.status(400).json({ message: 'Either grade or feedback must be provided.' });
    }

    if (grade !== undefined) {
        const numericGrade = parseInt(grade);
        if (isNaN(numericGrade) || numericGrade < 0 || numericGrade > 100) {
            return res.status(400).json({ message: 'Grade must be a number between 0 and 100.' });
        }
    }

    try {
        const result = await pool.query(`
            UPDATE assignment_submissions
            SET
                grade = COALESCE($1, grade),
                feedback = COALESCE($2, feedback)
            WHERE id = $3
            RETURNING *;
        `, [grade, feedback, submissionId]);

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Submission not found.' });
        }

        return res.json({ message: 'Graded successfully.', submission: result.rows[0] });
    } catch (err) {
        console.error('Grade update error:', err);
        return res.status(500).json({ message: 'Internal server error.' });
    }
});

module.exports = router;
