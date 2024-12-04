const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const router = express.Router();

router.get('/', authenticateToken, (req, res) => {
    res.send('All courses are accessible here!');
});

router.post('/create', authenticateToken, authorizeRoles('admin'), (req, res) => {
    res.send('Course created successfully by admin!');
});

module.exports = router;
