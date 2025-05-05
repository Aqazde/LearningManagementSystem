const pool = require('../config/postgreConfig');

/**
 * 🔹 Submit an assignment (Student Only)
 */
const submitAssignment = async (assignmentId, studentId, submissionText, fileUrl = null) => {
    const query = `
        INSERT INTO assignment_submissions 
        (assignment_id, student_id, submission_text, file_url)
        VALUES ($1, $2, $3, $4) RETURNING *`;
    const result = await pool.query(query, [assignmentId, studentId, submissionText, fileUrl]);
    return result.rows[0];
};

/**
 * 🔹 Get all submissions for a specific assignment (Teacher Only)
 */
const getSubmissionsByAssignment = async (assignmentId) => {
    const query = `SELECT assignment_submissions.*, users.name AS student_name 
                   FROM assignment_submissions 
                   JOIN users ON assignment_submissions.student_id = users.id
                   WHERE assignment_submissions.assignment_id = $1`;
    const result = await pool.query(query, [assignmentId]);
    return result.rows;
};

/**
 * 🔹 Get a specific submission by ID (Teachers & Students)
 */
const getSubmissionById = async (submissionId) => {
    const query = `SELECT * FROM assignment_submissions WHERE id = $1`;
    const result = await pool.query(query, [submissionId]);
    return result.rows[0];
};

/**
 * 🔹 Grade an assignment submission (Teacher Only)
 */
const gradeAssignment = async (submissionId, grade, feedback) => {
    const query = `UPDATE assignment_submissions 
                   SET grade = $1, feedback = $2 
                   WHERE id = $3 RETURNING *`;
    const values = [grade, feedback, submissionId];
    const result = await pool.query(query, values);
    return result.rows[0];
};

module.exports = {
    submitAssignment,
    getSubmissionsByAssignment,
    getSubmissionById,
    gradeAssignment
};
