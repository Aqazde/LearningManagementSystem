require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const connectMongoDB = require('./config/mongoConfig');
const pool = require('./config/postgreConfig');
const path = require('path');
const cors = require('cors');

const aiRoutes = require('./routes/ai');
const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const adminRoutes = require('./routes/admin');
const enrollmentRoutes = require('./routes/enrollment');
const assignmentRoutes = require('./routes/assignments');
const assignmentSubmissionRoutes = require('./routes/assignment_submission');
const courseContentRoutes = require('./routes/course_content');
const quizRoutes = require('./routes/quiz');
const quizSubmissionRoutes = require('./routes/quiz_submission');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
app.use(bodyParser.json());
app.use(cors());
connectMongoDB();

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/enrollments', enrollmentRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/assignments', assignmentSubmissionRoutes);
app.use('/api/content', courseContentRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/quizzes', quizSubmissionRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/dashboard', dashboardRoutes);

app.use(express.static(path.join(__dirname, '..', 'public')));

// Redirect all unmatched routes to index.html (for SPA-like routing)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));