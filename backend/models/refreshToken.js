const pool = require('../config/postgreConfig.js');

const storeRefreshToken = async (userId, refreshToken) => {
    const query = `INSERT INTO refresh_tokens (user_id, token) VALUES ($1, $2) RETURNING *`;
    const values = [userId, refreshToken];
    await pool.query(query, values);
};

const findRefreshToken = async (refreshToken) => {
    const query = `SELECT * FROM refresh_tokens WHERE token = $1`;
    const values = [refreshToken];
    const result = await pool.query(query, values);
    return result.rows[0];
};

const deleteRefreshToken = async (refreshToken) => {
    const query = `DELETE FROM refresh_tokens WHERE token = $1`;
    const values = [refreshToken];
    await pool.query(query, values);
};

module.exports = { storeRefreshToken, findRefreshToken, deleteRefreshToken };
