const pool = require('../config/postgreConfig');

/**
 * 🔹 Submit a quiz (initial metadata)
 */
const createQuizSubmission = async (quizId, studentId, startTime) => {
    const query = `
        INSERT INTO quiz_submissions (quiz_id, student_id, start_time)
        VALUES ($1, $2, $3)
        RETURNING *`;
    const values = [quizId, studentId, startTime];
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

module.exports = {
    createQuizSubmission,
    saveQuizAnswer,
    finalizeQuizSubmission,
    getSubmissionsByQuiz,
    getAnswersBySubmission
};
