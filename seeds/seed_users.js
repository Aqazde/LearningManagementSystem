const bcrypt = require('bcrypt');
const pool = require('../config/postgreConfig');

const seedUsers = async () => {
  const defaultPassword = process.env.SEED_DEFAULT_PASSWORD || 'Password123!';
  const saltRounds = 10;

  const users = [
    { name: 'Admin User', email: 'admin@example.com', role: 'admin' },
    { name: 'Teacher User', email: 'teacher@example.com', role: 'teacher' },
    { name: 'Student User', email: 'student@example.com', role: 'student' },
  ];

  try {
    for (const user of users) {
      // Check if user already exists
      const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [user.email]);
      if (existingUser.rows.length > 0) {
        console.log(`User ${user.email} already exists, skipping...`);
        continue;
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(defaultPassword, saltRounds);

      // Insert user
      await pool.query(
        'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)',
        [user.name, user.email, hashedPassword, user.role]
      );
      console.log(`User ${user.email} created successfully.`);
    }
    console.log('Seeding completed.');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding users:', err);
    process.exit(1);
  }
};

seedUsers();