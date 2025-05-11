const pool = require('../config/postgreConfig');

/**
 * 🔹 Get overall assignment performance for a student
 */
const getAssignmentPerformance = async (studentId) => {
    const query = `
        SELECT a.title, s.grade, s.feedback, a.due_date
        FROM assignment_submissions s
        JOIN assignments a ON s.assignment_id = a.id
        WHERE s.student_id = $1
        ORDER BY a.due_date DESC`;
    const result = await pool.query(query, [studentId]);
    return result.rows;
};

/**
 * 🔹 Get overall quiz performance for a student
 */
const getQuizPerformance = async (studentId) => {
    const query = `
        SELECT q.title, qs.score, qs.submitted_at
        FROM quiz_submissions qs
        JOIN quizzes q ON qs.quiz_id = q.id
        WHERE qs.student_id = $1
        ORDER BY qs.submitted_at DESC`;
    const result = await pool.query(query, [studentId]);
    return result.rows;
};

/**
 * 🔹 Get average grades (assignments and quizzes)
 */
const getAverageScores = async (studentId) => {
    const query = `
        SELECT
            (SELECT AVG(grade) FROM assignment_submissions WHERE student_id = $1) AS avg_assignment_score,
            (SELECT AVG(score) FROM quiz_submissions WHERE student_id = $1) AS avg_quiz_score`;
    const result = await pool.query(query, [studentId]);
    return result.rows[0];
};


/**
 * 🔹 Average assignment grades per assignment for teacher's courses
 */
const getAssignmentStatsForTeacher = async (teacherId, courseId = null) => {
    let query = `
        SELECT a.title, a.course_id, AVG(s.grade) AS average_grade, COUNT(s.id) AS submissions
        FROM assignments a
        LEFT JOIN assignment_submissions s ON s.assignment_id = a.id
        WHERE a.created_by = $1`;
    const values = [teacherId];

    if (courseId) {
        query += ` AND a.course_id = $2`;
        values.push(courseId);
    }

    query += ` GROUP BY a.id ORDER BY a.course_id, a.id`;

    const result = await pool.query(query, values);
    return result.rows;
};

/**
 * 🔹 Average quiz scores per quiz for teacher's courses
 */
const getQuizStatsForTeacher = async (teacherId) => {
    const query = `
        SELECT q.title, q.course_id, AVG(s.score) AS average_score, COUNT(s.id) AS attempts
        FROM quizzes q
        LEFT JOIN quiz_submissions s ON s.quiz_id = q.id
        WHERE q.created_by = $1
        GROUP BY q.id
        ORDER BY q.course_id, q.id`;
    const result = await pool.query(query, [teacherId]);
    return result.rows;
};


module.exports = {
    getAssignmentPerformance,
    getQuizPerformance,
    getAverageScores,

    // Teacher stats
    getAssignmentStatsForTeacher,
    getQuizStatsForTeacher
};
