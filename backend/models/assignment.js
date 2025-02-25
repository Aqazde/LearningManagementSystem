const pool = require('../config/postgreConfig');

/**
 * 🔹 Create a new assignment (Teacher Only)
 */
const createAssignment = async (courseId, title, description, dueDate, teacherId) => {
    const query = `INSERT INTO assignments (course_id, title, description, due_date, created_by) 
                   VALUES ($1, $2, $3, $4, $5) RETURNING *`;
    const values = [courseId, title, description, dueDate, teacherId];
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
    return result.rows[0]; // Returns the deleted assignment details
};

module.exports = {
    createAssignment,
    getAssignmentsByCourse,
    getAssignmentById,
    updateAssignment,
    deleteAssignment
};
