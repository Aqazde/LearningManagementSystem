const pool = require('../config/postgreConfig');

// 🔹 Create a new quiz
const createQuiz = async (courseId, title, description, weekLabel, dueDate, allowMultipleAttempts, timeLimit, createdBy) => {
    const query = `
        INSERT INTO quizzes (course_id, title, description, week_label, due_date, allow_multiple_attempts, time_limit, created_by)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`;
    const values = [courseId, title, description, weekLabel, dueDate, allowMultipleAttempts, timeLimit, createdBy];
    const result = await pool.query(query, values);
    return result.rows[0];
};

// 🔹 Add question to quiz
const addQuizQuestion = async (quizId, questionText, questionType, options, correctAnswer, points) => {
    const query = `
        INSERT INTO quiz_questions (quiz_id, question_text, question_type, options, correct_answer, points)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *`;
    const result = await pool.query(query, [quizId, questionText, questionType, options, correctAnswer, points]);
    return result.rows[0];
};

// 🔹 Get quizzes for a course
const getQuizzesByCourse = async (courseId) => {
    const result = await pool.query(
        `SELECT * FROM quizzes WHERE course_id = $1 ORDER BY week_label`,
        [courseId]
    );
    return result.rows;
};

// 🔹 Get full quiz with questions
const getQuizWithQuestions = async (quizId) => {
    const quizResult = await pool.query(`SELECT * FROM quizzes WHERE id = $1`, [quizId]);
    const questionsResult = await pool.query(`SELECT * FROM quiz_questions WHERE quiz_id = $1`, [quizId]);

    return {
        quiz: quizResult.rows[0],
        questions: questionsResult.rows
    };
};

// 🔹 Get quiz only (used in submission route)
const getQuizById = async (quizId) => {
    const result = await pool.query(`SELECT * FROM quizzes WHERE id = $1`, [quizId]);
    return result.rows[0];
};

// 🔹 Get questions only (used in submission route)
const getQuestionsByQuizId = async (quizId) => {
    const result = await pool.query(`SELECT * FROM quiz_questions WHERE quiz_id = $1`, [quizId]);
    return result.rows;
};

module.exports = {
    createQuiz,
    addQuizQuestion,
    getQuizzesByCourse,
    getQuizWithQuestions,
    getQuizById,
    getQuestionsByQuizId
};
