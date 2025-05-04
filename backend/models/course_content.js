const pool = require('../config/postgreConfig');

/**
 * 🔹 Create new course content (Admin/Teacher)
 */
const createCourseContent = async (courseId, title, contentType, contentUrl, description, createdBy) => {
    const query = `
        INSERT INTO course_content (course_id, title, content_type, content_url, description, created_by)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`;
    const values = [courseId, title, contentType, contentUrl, description, createdBy];
    const result = await pool.query(query, values);
    return result.rows[0];
};

/**
 * 🔹 Get all content for a course
 */
const getContentByCourseId = async (courseId) => {
    const query = `SELECT * FROM course_content WHERE course_id = $1 ORDER BY created_at DESC`;
    const result = await pool.query(query, [courseId]);
    return result.rows;
};

/**
 * 🔹 Get single content item by ID
 */
const getContentById = async (contentId) => {
    const query = `SELECT * FROM course_content WHERE id = $1`;
    const result = await pool.query(query, [contentId]);
    return result.rows[0];
};

/**
 * 🔹 Update course content
 */
const updateCourseContent = async (contentId, title, contentType, contentUrl, description) => {
    const query = `
        UPDATE course_content
        SET title = $1, content_type = $2, content_url = $3, description = $4
        WHERE id = $5
        RETURNING *`;
    const values = [title, contentType, contentUrl, description, contentId];
    const result = await pool.query(query, values);
    return result.rows[0];
};

/**
 * 🔹 Delete content
 */
const deleteCourseContent = async (contentId) => {
    const query = `DELETE FROM course_content WHERE id = $1 RETURNING *`;
    const result = await pool.query(query, [contentId]);
    return result.rows[0];
};

module.exports = {
    createCourseContent,
    getContentByCourseId,
    getContentById,
    updateCourseContent,
    deleteCourseContent
};
