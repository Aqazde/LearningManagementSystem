-- Enable uuid-ossp extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop tables in reverse order of dependencies
DROP TABLE IF EXISTS quiz_answers;
DROP TABLE IF EXISTS quiz_submissions;
DROP TABLE IF EXISTS quiz_questions;
DROP TABLE IF EXISTS quizzes;
DROP TABLE IF EXISTS assignment_submissions;
DROP TABLE IF EXISTS assignments;
DROP TABLE IF EXISTS course_content;
DROP TABLE IF EXISTS course_teachers;
DROP TABLE IF EXISTS enrollments;
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS reset_tokens;
DROP TABLE IF EXISTS courses;
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role VARCHAR(50) DEFAULT 'guest',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create courses table
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uuid UUID DEFAULT uuid_generate_v4() UNIQUE
);

-- Create refresh_tokens table
CREATE TABLE refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create reset_tokens table
CREATE TABLE reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '1 hour')
);

-- Create enrollments table
CREATE TABLE enrollments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, course_id)
);

-- Create course_teachers table
CREATE TABLE course_teachers (
    id SERIAL PRIMARY KEY,
    teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_uuid UUID NOT NULL REFERENCES courses(uuid) ON DELETE CASCADE,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (teacher_id, course_uuid)
);

-- Create course_content table
CREATE TABLE course_content (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    content_url TEXT,
    description TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create assignments table
CREATE TABLE assignments (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    due_date TIMESTAMP NOT NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    week_label VARCHAR(50),
    allow_file BOOLEAN DEFAULT FALSE,
    allow_text BOOLEAN DEFAULT FALSE,
    file_required BOOLEAN DEFAULT FALSE,
    text_required BOOLEAN DEFAULT FALSE
);

-- Create assignment_submissions table
CREATE TABLE assignment_submissions (
    id SERIAL PRIMARY KEY,
    assignment_id INTEGER REFERENCES assignments(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    submission_text TEXT NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    grade INTEGER CHECK (grade >= 0 AND grade <= 100),
    feedback TEXT,
    file_url TEXT
);

-- Create quizzes table
CREATE TABLE quizzes (
    id SERIAL PRIMARY KEY,
    course_id INTEGER REFERENCES courses(id),
    title VARCHAR(255),
    description TEXT,
    week_label VARCHAR(50),
    due_date TIMESTAMP,
    allow_multiple_attempts BOOLEAN DEFAULT FALSE,
    time_limit INTEGER,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create quiz_questions table
CREATE TABLE quiz_questions (
    id SERIAL PRIMARY KEY,
    quiz_id INTEGER REFERENCES quizzes(id),
    question_text TEXT,
    question_type VARCHAR(50),
    options TEXT[],
    correct_answer TEXT,
    points INTEGER DEFAULT 1
);

-- Create quiz_submissions table
CREATE TABLE quiz_submissions (
    id SERIAL PRIMARY KEY,
    quiz_id INTEGER REFERENCES quizzes(id),
    student_id INTEGER REFERENCES users(id),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    score INTEGER,
    graded BOOLEAN DEFAULT FALSE,
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    attempt_number INTEGER DEFAULT 1
);

-- Create quiz_answers table
CREATE TABLE quiz_answers (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER REFERENCES quiz_submissions(id),
    question_id INTEGER REFERENCES quiz_questions(id),
    student_answer TEXT,
    is_correct BOOLEAN,
    points_awarded INTEGER DEFAULT 0
);