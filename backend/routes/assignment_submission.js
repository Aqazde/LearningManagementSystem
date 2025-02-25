const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');
const { submitAssignment, getSubmissionsByAssignment, getSubmissionById, gradeAssignment } = require('../models/assignment_submission');
const { getAssignmentById } = require('../models/assignment');
const { logger } = require('../utils/logger');

const router = express.Router();

/**
 * 🔹 Submit an assignment (Students Only)
 * Method: POST
 * Route: /api/assignments/submit
 */
router.post('/submit', authenticateToken, authorizeRoles('student'), async (req, res) => {
    const { assignmentId, submissionText } = req.body;
    const studentId = req.user.id; // Extracted from JWT

    try {
        // Check if assignment exists
        const assignment = await getAssignmentById(assignmentId);
        if (!assignment) {
            return res.status(404).json({ message: 'Assignment not found' });
        }

        // Submit assignment
        const submission = await submitAssignment(assignmentId, studentId, submissionText);
        logger.info(`Student ${studentId} submitted assignment ${assignmentId}`);
        res.status(201).json({ message: 'Assignment submitted successfully', submission });
    } catch (error) {
        logger.error(`Error submitting assignment: ${error.message}`);
        res.status(500).json({ message: 'Error submitting assignment', error: error.message });
    }
});

/**
 * 🔹 Get all submissions for an assignment (Teachers Only)
 * Method: GET
 * Route: /api/assignments/:assignmentId/submissions
 */
router.get('/:assignmentId/submissions', authenticateToken, authorizeRoles('teacher'), async (req, res) => {
    const assignmentId = req.params.assignmentId;

    try {
        const submissions = await getSubmissionsByAssignment(assignmentId);
        res.json(submissions);
    } catch (error) {
        logger.error(`Error fetching submissions: ${error.message}`);
        res.status(500).json({ message: 'Error fetching submissions', error: error.message });
    }
});

/**
 * 🔹 Get a specific submission (Students & Teachers)
 * Method: GET
 * Route: /api/assignments/submissions/:id
 */
router.get('/submissions/:id', authenticateToken, async (req, res) => {
    const submissionId = req.params.id;

    try {
        const submission = await getSubmissionById(submissionId);
        if (!submission) {
            return res.status(404).json({ message: 'Submission not found' });
        }
        res.json(submission);
    } catch (error) {
        logger.error(`Error fetching submission: ${error.message}`);
        res.status(500).json({ message: 'Error fetching submission', error: error.message });
    }
});

/**
 * 🔹 Grade an assignment submission (Teachers Only)
 * Method: PUT
 * Route: /api/assignments/submissions/:id/grade
 */
router.put('/submissions/:id/grade', authenticateToken, authorizeRoles('teacher'), async (req, res) => {
    const submissionId = req.params.id;
    const { grade, feedback } = req.body;

    try {
        const gradedSubmission = await gradeAssignment(submissionId, grade, feedback);
        if (!gradedSubmission) {
            return res.status(404).json({ message: 'Submission not found' });
        }
        logger.info(`Teacher graded submission ID ${submissionId} with ${grade}`);
        res.json({ message: 'Assignment graded successfully', gradedSubmission });
    } catch (error) {
        logger.error(`Error grading submission: ${error.message}`);
        res.status(500).json({ message: 'Error grading submission', error: error.message });
    }
});

module.exports = router;
