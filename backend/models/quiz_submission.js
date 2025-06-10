const pool = require('../config/postgreConfig');

/**
 * 🔹 Submit a quiz (initial metadata)
 */
const createQuizSubmission = async (quizId, studentId, startTime, attemptNumber = 1) => {
    const query = `
        INSERT INTO quiz_submissions (quiz_id, student_id, start_time, attempt_number)
        VALUES ($1, $2, $3, $4)
        RETURNING *`;
    const values = [quizId, studentId, startTime, attemptNumber];
    const result = await pool.query(query, values);
    return result.rows[0];
};

/**
 * 🔹 Save an individual quiz answer
 */
const saveQuizAnswer = async (submissionId, questionId, studentAnswer, isCorrect, pointsAwarded) => {
    const query = `
        INSERT INTO quiz_answers (submission_id, question_id, student_answer, is_correct, points_awarded)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *`;
    const values = [submissionId, questionId, studentAnswer, isCorrect, pointsAwarded];
    const result = await pool.query(query, values);
    return result.rows[0];
};

/**
 * 🔹 Finalize submission with total score
 */
const finalizeQuizSubmission = async (submissionId, totalScore, graded = true) => {
    const query = `
        UPDATE quiz_submissions
        SET score = $1, graded = $2, submitted_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *`;
    const values = [totalScore, graded, submissionId];
    const result = await pool.query(query, values);
    return result.rows[0];
};

/**
 * 🔹 Get all submissions for a quiz
 */
const getSubmissionsByQuiz = async (quizId) => {
    const query = `
        SELECT qs.*, u.name AS student_name
        FROM quiz_submissions qs
        JOIN users u ON qs.student_id = u.id
        WHERE qs.quiz_id = $1`;
    const result = await pool.query(query, [quizId]);
    return result.rows;
};

/**
 * 🔹 Get detailed answers for a submission
 */
const getAnswersBySubmission = async (submissionId) => {
    const query = `
        SELECT qa.*, qq.question_text
        FROM quiz_answers qa
        JOIN quiz_questions qq ON qa.question_id = qq.id
        WHERE qa.submission_id = $1`;
    const result = await pool.query(query, [submissionId]);
    return result.rows;
};

const hasStudentAttempted = async (quizId, studentId) => {
    const result = await pool.query(
        `SELECT * FROM quiz_submissions WHERE quiz_id = $1 AND student_id = $2`,
        [quizId, studentId]
    );
    return result.rows.length > 0;
};

const getSubmissionByStudent = async (quizId, studentId) => {
    const query = `
        SELECT *
        FROM quiz_submissions
        WHERE quiz_id = $1 AND student_id = $2
        ORDER BY submitted_at DESC
        LIMIT 1;
    `;
    const result = await pool.query(query, [quizId, studentId]);
    return result.rows[0]; // либо null
};

module.exports = {
    createQuizSubmission,
    saveQuizAnswer,
    finalizeQuizSubmission,
    getSubmissionsByQuiz,
    getAnswersBySubmission,
    hasStudentAttempted,
    getSubmissionByStudent
};
