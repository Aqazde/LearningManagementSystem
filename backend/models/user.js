const pool = require('../config/postgreConfig');
const bcrypt = require('bcrypt');

const createUser = async (name, email, password, role) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *`;
    return (await pool.query(query, [name, email, hashedPassword, role])).rows[0];
};

const findUserById = async (id) => {
    const query = `SELECT * FROM users WHERE id = $1`;
    const result = await pool.query(query, [id]);
    return result.rows[0];
};

const findUserByEmail = async (email) => {
    const query = `SELECT * FROM users WHERE email = $1`;
    return (await pool.query(query, [email])).rows[0];
};

const updateUserPassword = async (userId, newPassword) => {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const query = `UPDATE users SET password = $1 WHERE email = $2`;
    await pool.query(query, [hashedPassword, userId]);
};

module.exports = { createUser, findUserByEmail, updateUserPassword, findUserById };
