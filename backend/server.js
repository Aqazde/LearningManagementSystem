require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const connectMongoDB = require('./config/mongoConfig');
const pool = require('./config/postgreConfig');
const aiRoutes = require('./routes/ai');

const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');

const app = express();
app.use(bodyParser.json());

connectMongoDB();

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/ai', aiRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));