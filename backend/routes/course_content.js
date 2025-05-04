const express = require('express');
const {
    createCourseContent,
    getContentByCourseId,
    getContentById,
    updateCourseContent,
    deleteCourseContent
} = require('../models/course_content');

const { authenticateToken, authorizeRoles } = require('../middlewares/auth');
const { logger } = require('../utils/logger');

const router = express.Router();

/**
 * 🔹 Publish new content (Teacher/Admin)
 * POST /api/content/create
 */
router.post('/create', authenticateToken, authorizeRoles('teacher', 'admin'), async (req, res) => {
    const { courseId, title, contentType, contentUrl, description } = req.body;
    const createdBy = req.user.id;

    try {
        const content = await createCourseContent(courseId, title, contentType, contentUrl, description, createdBy);
        logger.info(`Content published by user ${createdBy} for course ${courseId}`);
        res.status(201).json({ message: 'Content created successfully', content });
    } catch (error) {
        logger.error(`Error creating content: ${error.message}`);
        res.status(500).json({ message: 'Error creating content' });
    }
});

/**
 * 🔹 Get all content for a course (Student, Teacher, Admin)
 * GET /api/content/course/:courseId
 */
router.get('/course/:courseId', authenticateToken, async (req, res) => {
    try {
        const contents = await getContentByCourseId(req.params.courseId);
        res.json(contents);
    } catch (error) {
        logger.error(`Error fetching content: ${error.message}`);
        res.status(500).json({ message: 'Error fetching content' });
    }
});

/**
 * 🔹 Get specific content
 * GET /api/content/:id
 */
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const content = await getContentById(req.params.id);
        if (!content) return res.status(404).json({ message: 'Content not found' });
        res.json(content);
    } catch (error) {
        logger.error(`Error fetching content: ${error.message}`);
        res.status(500).json({ message: 'Error fetching content' });
    }
});

/**
 * 🔹 Update content (Teacher/Admin)
 * PUT /api/content/:id
 */
router.put('/:id', authenticateToken, authorizeRoles('teacher', 'admin'), async (req, res) => {
    const { title, contentType, contentUrl, description } = req.body;

    try {
        const updated = await updateCourseContent(req.params.id, title, contentType, contentUrl, description);
        if (!updated) return res.status(404).json({ message: 'Content not found' });
        logger.info(`Content updated: ID ${req.params.id}`);
        res.json({ message: 'Content updated', updated });
    } catch (error) {
        logger.error(`Error updating content: ${error.message}`);
        res.status(500).json({ message: 'Error updating content' });
    }
});

/**
 * 🔹 Delete content (Teacher/Admin)
 * DELETE /api/content/:id
 */
router.delete('/:id', authenticateToken, authorizeRoles('teacher', 'admin'), async (req, res) => {
    try {
        const deleted = await deleteCourseContent(req.params.id);
        if (!deleted) return res.status(404).json({ message: 'Content not found' });
        logger.info(`Content deleted: ID ${req.params.id}`);
        res.json({ message: 'Content deleted' });
    } catch (error) {
        logger.error(`Error deleting content: ${error.message}`);
        res.status(500).json({ message: 'Error deleting content' });
    }
});

module.exports = router;
