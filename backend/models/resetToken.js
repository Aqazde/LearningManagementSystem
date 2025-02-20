const pool = require('../config/postgreConfig');

const storeResetToken = async (userId, token) => {
    const query = `INSERT INTO reset_tokens (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL '1 hour') RETURNING *`;
    await pool.query(query, [userId, token]);
};

const findResetToken = async (token) => {
    const query = `SELECT user_id FROM reset_tokens WHERE token = $1 AND expires_at > NOW()`;
    const result = await pool.query(query, [token]);
    return result.rows[0];
};

const deleteResetToken = async (token) => {
    const query = `DELETE FROM reset_tokens WHERE token = $1`;
    await pool.query(query, [token]);
};

module.exports = { storeResetToken, findResetToken, deleteResetToken };
