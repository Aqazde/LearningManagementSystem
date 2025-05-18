// public/scripts/index.js

const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const message = document.getElementById('message');

// Toggle between tabs
loginTab.onclick = () => {
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    loginForm.classList.remove('hidden');
    registerForm.classList.add('hidden');
    message.textContent = '';
};

registerTab.onclick = () => {
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    registerForm.classList.remove('hidden');
    loginForm.classList.add('hidden');
    message.textContent = '';
};

// Login function
async function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        // Store token and redirect
        localStorage.setItem('accessToken', data.accessToken);
        localStorage.setItem('role', data.role);

        redirectToDashboard(data.role);
    } catch (err) {
        message.textContent = err.message;
    }
}

// Register function
async function register() {
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;

    try {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        message.textContent = 'Registration successful. Please log in.';
        registerTab.classList.remove('active');
        loginTab.classList.add('active');
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
    } catch (err) {
        message.textContent = err.message;
    }
}

// Redirect based on role
function redirectToDashboard(role) {
    if (role === 'student') {
        window.location.href = 'student-dashboard.html';
    } else if (role === 'teacher') {
        window.location.href = 'teacher-dashboard.html';
    } else if (role === 'admin') {
        window.location.href = 'admin-dashboard.html';
    } else {
        window.location.href = 'guest-dashboard.html';
    }
}
