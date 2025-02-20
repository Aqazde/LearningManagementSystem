const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createUser, findUserByEmail } = require('../models/user');
const { storeRefreshToken, findRefreshToken, deleteRefreshToken } = require('../models/refreshToken');
const router = express.Router();

router.post('/register', async (req, res) => {
    const { name, email, password, role } = req.body;

    try {
        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await createUser(name, email, password, role || 'student');
        res.status(201).json({ message: 'User registered successfully', user });
    } catch (error) {
        res.status(500).json({ message: 'Error registering user', error: error.message });
    }
});

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
            { expiresIn: '15m' } // Shorter expiry for security
        );

        const refreshToken = jwt.sign(
            { id: user.id },
            process.env.REFRESH_TOKEN_SECRET,
            { expiresIn: '7d' }
        );

        await storeRefreshToken(user.id, refreshToken);

        res.status(200).json({ message: 'Login successful', accessToken, refreshToken });
    } catch (error) {
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
});

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
        res.status(500).json({ message: 'Error refreshing token', error: error.message });
    }
});

router.post('/logout', async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return res.status(400).json({ message: 'Refresh token required' });
    }

    try {
        await deleteRefreshToken(refreshToken);
        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error logging out', error: error.message });
    }
});

module.exports = router;
