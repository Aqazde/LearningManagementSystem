const express = require('express');
const { findAllUsers, findUserById, updateUserRole, deleteUser, createUser, findUserByEmail, updateUserPassword } = require('../models/user');
const { assignTeacherToCourse, getTeachersByCourse, removeTeacherFromCourse } = require('../models/course_teacher');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');
const { enrollStudent, unenrollStudent } = require('../models/enrollment');
const { getCourseById } = require('../models/course');
const { logger } = require('../utils/logger');

const router = express.Router();
const pool = require('../config/postgreConfig');

/**
 * 🔹 Get All Users (Admin Only) - GET /api/admin/users
 */
router.get('/users', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const users = await findAllUsers();
        res.json(users);
    } catch (error) {
        logger.error(`Error fetching users: ${error.message}`);
        res.status(500).json({ message: 'Error fetching users' });
    }
});

/**
 * 🔹 Get User by ID (Admin Only) - GET /api/admin/users/:id
 */
router.get('/users/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        const user = await findUserById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (error) {
        logger.error(`Error fetching user: ${error.message}`);
        res.status(500).json({ message: 'Error fetching user' });
    }
});

/**
 * 🔹 Admin Creates User with Role
 * POST /api/auth/admin-create
 * Requires: name, email, password, role (admin|teacher|student)
 */
router.post('/users/create', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!['admin', 'teacher', 'student'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role. Must be admin, teacher, or student' });
    }

    try {
        const existingUser = await findUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await createUser(name, email, password, role);
        logger.info(`Admin created user ${email} with role ${role}`);
        res.status(201).json({ message: 'User created successfully', user });
    } catch (error) {
        logger.error(`Error creating user by admin: ${error.message}`);
        res.status(500).json({ message: 'Error creating user', error: error.message });
    }
});

/**
 * 🔹 Update User Role (Admin Only) - PUT /api/admin/users/:id/role
 */
router.put('/users/:id/role', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    const { role } = req.body;
    try {
        const updatedUser = await updateUserRole(req.params.id, role);
        if (!updatedUser) return res.status(404).json({ message: 'User not found' });

        logger.info(`User role updated: ${updatedUser.email} → ${role}`);
        res.json({ message: 'User role updated successfully', updatedUser });
    } catch (error) {
        logger.error(`Error updating user role: ${error.message}`);
        res.status(500).json({ message: 'Error updating user role' });
    }
});

/**
 * 🔹 Delete User (Admin Only) - DELETE /api/admin/users/:id
 */
router.delete('/users/:id', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    try {
        await deleteUser(req.params.id);
        logger.info(`User deleted: ID ${req.params.id}`);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        logger.error(`Error deleting user: ${error.message}`);
        res.status(500).json({ message: 'Error deleting user' });
    }
});

/**
 * 🔹 Assign teacher to a course (Admin Only)
 * Method: POST
 * Route: /api/admin/assign-teacher
 */
router.post('/assign-teacher', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    const { teacherId, courseUuid } = req.body;

    if (!teacherId || !courseUuid) {
        return res.status(400).json({ message: 'Missing teacherId or courseUuid' });
    }

    try {
        const teacher = await findUserById(teacherId);
        if (!teacher || teacher.role !== 'teacher') {
            return res.status(400).json({ message: 'Invalid teacher ID or user is not a teacher' });
        }

        const courseCheck = await pool.query(`SELECT * FROM courses WHERE uuid = $1`, [courseUuid]);
        if (courseCheck.rowCount === 0) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const result = await assignTeacherToCourse(teacherId, courseUuid);
        if (!result) {
            return res.status(409).json({ message: 'Teacher already assigned' });
        }

        res.json({ message: 'Teacher assigned to course', result });

    } catch (error) {
        logger.error(`Error assigning teacher: ${error.message}`);
        res.status(500).json({ message: 'Error assigning teacher', error: error.message });
    }
});

/**
 * 🔹 Remove teacher from a course (Admin Only)
 * Method: DELETE
 * Route: /api/admin/remove-teacher
 */
router.delete('/remove-teacher', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    const { teacherId, courseUuid } = req.body;

    try {
        await removeTeacherFromCourse(teacherId, courseUuid);
        res.json({ message: 'Teacher removed from course' });
    } catch (error) {
        logger.error(`Error removing teacher: ${error.message}`);
        res.status(500).json({ message: 'Error removing teacher', error: error.message });
    }
});

/**
 * 🔹 Get All Teachers for a Course (Admin Only)
 * Method: GET
 * Route: /api/admin/course/:courseUuid/teachers
 */
router.get('/course/:courseUuid/teachers', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    const { courseUuid } = req.params;

    try {
        const teachers = await getTeachersByCourse(courseUuid);
        res.json(teachers);
    } catch (error) {
        logger.error(`Error fetching teachers for course ${courseUuid}: ${error.message}`);
        res.status(500).json({ message: 'Error fetching teachers', error: error.message });
    }
});

router.post('/enroll-student', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    const { studentId, courseId } = req.body;

    if (!studentId || !courseId) {
        return res.status(400).json({ message: 'Missing studentId or courseId' });
    }

    try {
        const student = await findUserById(studentId);
        if (!student || student.role !== 'student') {
            return res.status(400).json({ message: 'Invalid student ID or user is not a student' });
        }

        const course = await getCourseById(courseId);
        if (!course) {
            return res.status(404).json({ message: 'Course not found' });
        }

        const enrollment = await enrollStudent(studentId, courseId);
        res.status(201).json({ message: 'Student enrolled successfully', enrollment });
    } catch (error) {
        logger.error(`Admin error enrolling student: ${error.message}`);
        res.status(500).json({ message: 'Error enrolling student', error: error.message });
    }
});

/**
 * 🔹 Get All Students Enrolled in a Course (Admin Only)
 * Method: GET
 * Route: /api/admin/course/:id/students
 */
router.get('/course/:id/students', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    const courseId = req.params.id;

    try {
        const result = await pool.query(`
            SELECT u.id, u.name, u.email
            FROM enrollments e
            JOIN users u ON e.user_id = u.id
            WHERE e.course_id = $1
        `, [courseId]);

        res.json(result.rows);
    } catch (error) {
        logger.error(`Error fetching students for course ${courseId}: ${error.message}`);
        res.status(500).json({ message: 'Error fetching enrolled students', error: error.message });
    }
});

/**
 * 🔹 Unenroll a Student from a Course (Admin Only)
 * Method: DELETE
 * Route: /api/admin/unenroll-student
 * Body: { studentId, courseId }
 */
router.delete('/unenroll-student', authenticateToken, authorizeRoles('admin'), async (req, res) => {
    const { studentId, courseId } = req.body;

    if (!studentId || !courseId) {
        return res.status(400).json({ message: 'Missing studentId or courseId' });
    }

    try {
        const result = await unenrollStudent(studentId, courseId);
        if (!result) {
            return res.status(400).json({ message: 'Student was not enrolled in this course' });
        }

        res.json({ message: 'Student unenrolled successfully' });
    } catch (error) {
        logger.error(`Error unenrolling student: ${error.message}`);
        res.status(500).json({ message: 'Error unenrolling student', error: error.message });
    }
});

module.exports = router;
