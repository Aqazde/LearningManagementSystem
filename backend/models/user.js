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

const findAllUsers = async () => {
    const query = `SELECT id, name, email, role FROM users`;
    return (await pool.query(query)).rows;
};

const updateUserRole = async (id, role) => {
    const query = `UPDATE users SET role = $1 WHERE id = $2 RETURNING *`;
    return (await pool.query(query, [role, id])).rows[0];
};

const deleteUser = async (id) => {
    const query = `DELETE FROM users WHERE id = $1`;
    await pool.query(query, [id]);
};

const updateUserPassword = async (userId, newPassword) => {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const query = `UPDATE users SET password = $1 WHERE id = $2`;
    await pool.query(query, [hashedPassword, userId]);
};

module.exports = { createUser, findUserByEmail, findAllUsers, updateUserRole, deleteUser, updateUserPassword, findUserById };
