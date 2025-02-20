const pool = require('../config/postgreConfig');
const bcrypt = require('bcrypt');

const createUser = async (name, email, password, role) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    const query = `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *`;
    const values = [name, email, hashedPassword, role];
    const result = await pool.query(query, values);
    return result.rows[0];
};

const findUserByEmail = async (email) => {
    const query = `SELECT * FROM users WHERE email = $1`;
    const values = [email];
    const result = await pool.query(query, values);
    return result.rows[0];
};

module.exports = { createUser, findUserByEmail };
