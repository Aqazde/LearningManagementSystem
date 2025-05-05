const pool = require('../config/postgreConfig');

/**
 * 🔹 Create a new assignment (Teacher Only)
 */
const createAssignment = async (
    courseId, title, description, dueDate, teacherId,
    weekLabel, allowFile, allowText, fileRequired, textRequired
) => {
    const query = `
        INSERT INTO assignments 
        (course_id, title, description, due_date, created_by, week_label, allow_file, allow_text, file_required, text_required) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *`;
    const values = [courseId, title, description, dueDate, teacherId, weekLabel, allowFile, allowText, fileRequired, textRequired];
    const result = await pool.query(query, values);
    return result.rows[0];
};

/**
 * 🔹 Get all assignments for a course
 */
const getAssignmentsByCourse = async (courseId) => {
    const query = `SELECT * FROM assignments WHERE course_id = $1`;
    const result = await pool.query(query, [courseId]);
    return result.rows;
};

/**
 * 🔹 Get assignments grouped by week
 */
const getAssignmentsGroupedByWeek = async (courseId) => {
    const query = `
        SELECT week_label, json_agg(a.*) AS assignments
        FROM assignments a
        WHERE course_id = $1
        GROUP BY week_label
        ORDER BY week_label`;
    const result = await pool.query(query, [courseId]);
    return result.rows;
};

/**
 * 🔹 Get a specific assignment by ID
 */
const getAssignmentById = async (assignmentId) => {
    const query = `SELECT * FROM assignments WHERE id = $1`;
    const result = await pool.query(query, [assignmentId]);
    return result.rows[0];
};

/**
 * 🔹 Update assignment details (Teacher Only)
 */
const updateAssignment = async (assignmentId, title, description, dueDate) => {
    const query = `UPDATE assignments SET title = $1, description = $2, due_date = $3 WHERE id = $4 RETURNING *`;
    const values = [title, description, dueDate, assignmentId];
    const result = await pool.query(query, values);
    return result.rows[0];
};

/**
 * 🔹 Delete an assignment (Teacher Only)
 */
const deleteAssignment = async (assignmentId) => {
    const query = `DELETE FROM assignments WHERE id = $1 RETURNING *`;
    const result = await pool.query(query, [assignmentId]);
    return result.rows[0];
};

module.exports = {
    createAssignment,
    getAssignmentsByCourse,
    getAssignmentsGroupedByWeek,
    getAssignmentById,
    updateAssignment,
    deleteAssignment
};
