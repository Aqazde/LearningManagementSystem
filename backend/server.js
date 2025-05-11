require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const connectMongoDB = require('./config/mongoConfig');
const pool = require('./config/postgreConfig');
const path = require('path');

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
const app = express();
app.use(bodyParser.json());

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));