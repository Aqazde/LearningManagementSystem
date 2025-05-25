const pool = require('../config/postgreConfig');

/**
 * 🔹 Assign teacher to course
 */
const assignTeacherToCourse = async (teacherId, courseUuid) => {
    const result = await pool.query(
        `INSERT INTO course_teachers (teacher_id, course_uuid)
         VALUES ($1, $2)
         ON CONFLICT (teacher_id, course_uuid) DO NOTHING
         RETURNING *`,
        [teacherId, courseUuid]
    );
    return result.rows[0];
};

/**
 * 🔹 Get all teachers assigned to a course
 */
const getTeachersByCourse = async (courseUuid) => {
    const result = await pool.query(
        `SELECT u.id, u.name, u.email FROM course_teachers ct
         JOIN users u ON u.id = ct.teacher_id
         WHERE ct.course_uuid = $1`,
        [courseUuid]
    );
    return result.rows;
};

/**
 * 🔹 Get all courses assigned to a teacher
 */
const getCoursesForTeacher = async (teacherId) => {
    const result = await pool.query(
        `SELECT c.* FROM course_teachers ct
         JOIN courses c ON c.uuid = ct.course_uuid
         WHERE ct.teacher_id = $1`,
        [teacherId]
    );
    return result.rows;
};

/**
 * 🔹 Remove teacher from course
 */
const removeTeacherFromCourse = async (teacherId, courseUuid) => {
    await pool.query(
        `DELETE FROM course_teachers WHERE teacher_id = $1 AND course_uuid = $2`,
        [teacherId, courseUuid]
    );
};

module.exports = {
    assignTeacherToCourse,
    getTeachersByCourse,
    getCoursesForTeacher,
    removeTeacherFromCourse
};
