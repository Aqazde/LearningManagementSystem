const pool = require('../config/postgreConfig');

/**
 * 🔹 Create a new course (Admin Only)
 */
const createCourse = async (title, description, adminId) => {
    const query = `INSERT INTO courses (title, description, created_by) VALUES ($1, $2, $3) RETURNING *`;
    const values = [title, description, adminId];
    const result = await pool.query(query, values);
    return result.rows[0];
};

/**
 * 🔹 Get all courses
 */
const getAllCourses = async () => {
    const query = `SELECT courses.*, users.name AS admin_name FROM courses 
                   JOIN users ON courses.created_by = users.id`;
    const result = await pool.query(query);
    return result.rows;
};

/**
 * 🔹 Get course by ID
 */
const getCourseById = async (courseId) => {
    const query = `SELECT courses.*, users.name AS admin_name FROM courses 
                   JOIN users ON courses.created_by = users.id
                   WHERE courses.id = $1`;
    const result = await pool.query(query, [courseId]);
    return result.rows[0];
};

/**
 * 🔹 Update course details (Admin Only)
 */
const updateCourse = async (courseId, title, description) => {
    const query = `UPDATE courses SET title = $1, description = $2 WHERE id = $3 RETURNING *`;
    const values = [title, description, courseId];
    const result = await pool.query(query, values);
    return result.rows[0];
};

/**
 * 🔹 Delete a course (Admin Only)
 */
const deleteCourse = async (courseId) => {
    const query = `DELETE FROM courses WHERE id = $1 RETURNING *`;
    const result = await pool.query(query, [courseId]);
    return result.rows[0];
};

/**
 * 🔹 Get all courses assigned to a teacher
 */
const getCoursesByTeacher = async (teacherId) => {
    const result = await pool.query(`
        SELECT c.* FROM courses c
        JOIN course_teachers ct ON ct.course_uuid = c.uuid
        WHERE ct.teacher_id = $1
    `, [teacherId]);
    return result.rows;
};

module.exports = {
    createCourse,
    getAllCourses,
    getCourseById,
    updateCourse,
    deleteCourse,
    getCoursesByTeacher
};
