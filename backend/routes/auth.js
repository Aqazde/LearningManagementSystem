const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { findUserByEmail, findUserById, createUser, updateUserPassword } = require('../models/user');
const { storeRefreshToken, findRefreshToken, deleteRefreshToken } = require('../models/refreshToken');
const { storeResetToken, findResetToken, deleteResetToken } = require('../models/resetToken');
const { sendResetEmail } = require('../utils/emailService');
const { logger } = require('../utils/logger');

const router = express.Router();

/**
 * 🔹 User Registration - POST /api/auth/register
 * Creates a new user with hashed password and stores in PostgreSQL
 */
router.post('/register', async (req, res) => {
    const { name, email, password, role } = req.body;

    try {
        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await createUser(name, email, password, role || 'student');
        logger.info(`User registered: ${email}`);

        res.status(201).json({ message: 'User registered successfully', user });
    } catch (error) {
        logger.error(`Error registering user: ${error.message}`);
        res.status(500).json({ message: 'Error registering user', error: error.message });
    }
});

/**
 * 🔹 User Login - POST /api/auth/login
 * Authenticates user and returns access & refresh tokens
 */
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await findUserByEmail(email);
        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const accessToken = jwt.sign(
            { id: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '15m' }
        );

        const refreshToken = jwt.sign(
            { id: user.id },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '7d' }
        );

        await storeRefreshToken(user.id, refreshToken);
        logger.info(`User logged in: ${email}`);

        res.status(200).json({ message: 'Login successful', accessToken, refreshToken });
    } catch (error) {
        logger.error(`Error logging in: ${error.message}`);
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
});

/**
 * 🔹 Refresh Access Token - POST /api/auth/refresh-token
 * Returns a new access token if the refresh token is valid
 */
router.post('/refresh-token', async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return res.status(403).json({ message: 'Refresh token is required' });
    }

    try {
        const storedToken = await findRefreshToken(refreshToken);
        if (!storedToken) {
            return res.status(403).json({ message: 'Invalid refresh token' });
        }

        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
            if (err) {
                return res.status(403).json({ message: 'Invalid refresh token' });
            }

            const newAccessToken = jwt.sign(
                { id: user.id, role: user.role },
                process.env.JWT_SECRET,
                { expiresIn: '15m' }
            );

            res.json({ accessToken: newAccessToken });
        });
    } catch (error) {
        logger.error(`Error refreshing token: ${error.message}`);
        res.status(500).json({ message: 'Error refreshing token', error: error.message });
    }
});

/**
 * 🔹 Logout User - POST /api/auth/logout
 * Deletes the refresh token from the database
 */
router.post('/logout', async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh token required' });
    }

    try {
        await deleteRefreshToken(refreshToken);
        logger.info(`User logged out`);
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        logger.error(`Error logging out: ${error.message}`);
        res.status(500).json({ message: 'Error logging out', error: error.message });
    }
});

/**
 * 🔹 Request Password Reset - POST /api/auth/forgot-password
 * Sends a password reset link to the user's email
 */
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        const user = await findUserByEmail(email);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        await storeResetToken(user.id, resetToken);
        await sendResetEmail(email, resetToken);

        logger.info(`Password reset requested for ${email}`);
        res.json({ message: 'Password reset email sent' });
    } catch (error) {
        logger.error(`Error in forgot-password: ${error.message}`);
        res.status(500).json({ message: 'Error processing request' });
    }
});

/**
 * 🔹 Reset Password - POST /api/auth/reset-password
 * Resets user's password using the reset token
 */
router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        console.log("🔍 Received Reset Token:", token);

        const resetTokenData = await findResetToken(token);
        if (!resetTokenData) {
            console.log("❌ Token not found or expired in DB");
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        console.log("✅ Token Found. User ID:", resetTokenData.user_id);

        const user = await findUserById(resetTokenData.user_id);
        if (!user) {
            console.log("❌ No user found with ID:", resetTokenData.user_id);
            return res.status(404).json({ message: 'User not found' });
        }

        await updateUserPassword(user.id, newPassword);
        await deleteResetToken(token);

        console.log("✅ Password reset successful for:", user.email);
        res.json({ message: 'Password reset successful' });
    } catch (error) {
        console.error("❌ Error in reset-password:", error.message);
        res.status(500).json({ message: 'Error processing request' });
    }
});



module.exports = router;
