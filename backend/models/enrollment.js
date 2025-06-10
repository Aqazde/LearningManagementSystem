const pool = require('../config/postgreConfig');

/**
 * 🔹 Enroll a student in a course
 */
const enrollStudent = async (userId, courseId) => {
    const query = `INSERT INTO enrollments (user_id, course_id)
                   VALUES ($1, $2)
                   ON CONFLICT (user_id, course_id) DO NOTHING
                   RETURNING *`;
    try {
        const result = await pool.query(query, [userId, courseId]);
        return result.rows[0];
    } catch (error) {
        if (error.code === '23505') {
            throw new Error('User is already enrolled in this course');
        }
        throw error;
    }
};

/**
 * 🔹 Get all courses a student is enrolled in
 */
const getStudentEnrollments = async (userId) => {
    const query = `SELECT courses.* FROM courses 
                   JOIN enrollments ON courses.id = enrollments.course_id
                   WHERE enrollments.user_id = $1`;
    const result = await pool.query(query, [userId]);
    return result.rows;
};

/**
 * 🔹 Check if a student is enrolled in a course
 */
const isStudentEnrolled = async (userId, courseId) => {
    const query = `SELECT * FROM enrollments WHERE user_id = $1 AND course_id = $2`;
    const result = await pool.query(query, [userId, courseId]);
    return result.rows.length > 0;
};

/**
 * 🔹 Unenroll a student from a course
 */
const unenrollStudent = async (userId, courseId) => {
    const query = `DELETE FROM enrollments WHERE user_id = $1 AND course_id = $2 RETURNING *`;
    const result = await pool.query(query, [userId, courseId]);
    return result.rows[0];
};

module.exports = {
    enrollStudent,
    getStudentEnrollments,
    isStudentEnrolled,
    unenrollStudent
};
