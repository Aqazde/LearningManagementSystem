const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

const sendResetEmail = async (email, resetToken) => {
    const resetURL = `http://localhost:5000/api/auth/reset-password?token=${resetToken}`;

    await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Password Reset Request',
        text: `Click the link to reset your password: ${resetURL}`,
        html: `<p>Click the link to reset your password:</p><a href="${resetURL}">${resetURL}</a>`
    });
};

module.exports = { sendResetEmail };
