const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    res.send('AI route is working!');
});

module.exports = router;
