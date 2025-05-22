const message = document.getElementById('adminMessage');
const token = localStorage.getItem('accessToken');
const API = '/api/admin/users';

if (!token) {
    window.location.href = 'index.html';
}

// Load users on page load
window.onload = () => {
    fetchUsers();
    fetchCourses();
};

// Fetch all users
async function fetchUsers() {
    try {
        const res = await fetch(API, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const users = await res.json();
        populateUserTable(users);
    } catch (err) {
        message.textContent = 'Error loading users';
    }
}

// Populate users in table
function populateUserTable(users) {
    const tbody = document.getElementById('userTableBody');
    tbody.innerHTML = '';

    users.forEach(user => {
        const row = document.createElement('tr');

        row.innerHTML = `
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>
                <select onchange="updateUserRole('${user.id}', this.value)">
                    <option value="guest" ${user.role === 'guest' ? 'selected' : ''}>Guest</option>
                    <option value="student" ${user.role === 'student' ? 'selected' : ''}>Student</option>
                    <option value="teacher" ${user.role === 'teacher' ? 'selected' : ''}>Teacher</option>
                    <option value="admin" ${user.role === 'admin' ? 'selected' : ''}>Admin</option>
                </select>
            </td>
            <td>
                <button onclick="deleteUser('${user.id}')">Delete</button>
            </td>
        `;

        tbody.appendChild(row);
    });
}

// Create a new user
async function createUser() {
    const name = document.getElementById('newName').value;
    const email = document.getElementById('newEmail').value;
    const password = document.getElementById('newPassword').value;
    const role = document.getElementById('newRole').value;

    try {
        const res = await fetch('/api/admin/users/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ name, email, password, role })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        message.textContent = 'User created successfully';
        fetchUsers();
    } catch (err) {
        message.textContent = err.message;
    }
}

// Update user role
async function updateUserRole(userId, newRole) {
    try {
        const res = await fetch(`/api/admin/users/${userId}/role`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ role: newRole })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        message.textContent = 'User role updated';
    } catch (err) {
        message.textContent = err.message;
    }
}

// Delete user
async function deleteUser(userId) {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
        const res = await fetch(`/api/admin/users/${userId}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        message.textContent = 'User deleted';
        fetchUsers();
    } catch (err) {
        message.textContent = err.message;
    }
}

async function fetchCourses() {
    try {
        const res = await fetch('/api/courses', {
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('accessToken') }
        });
        const courses = await res.json();
        const table = document.getElementById('courseTableBody');
        table.innerHTML = '';
        courses.forEach(course => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${course.title}</td>
                <td>${course.description}</td>
                <td>
                    <button onclick="deleteCourse(${course.id})">Delete</button>
                </td>
            `;
            table.appendChild(row);
        });
    } catch (err) {
        console.error('Error fetching courses:', err);
    }
}

async function createCourse() {
    const title = document.getElementById('courseTitle').value;
    const description = document.getElementById('courseDescription').value;

    try {
        const res = await fetch('/api/courses/create', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + localStorage.getItem('accessToken')
            },
            body: JSON.stringify({ title, description })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        alert('Course created successfully');
        document.getElementById('courseTitle').value = '';
        document.getElementById('courseDescription').value = '';
        fetchCourses();
    } catch (err) {
        console.error('Create Course Error:', err);
        alert('Failed to create course: ' + err.message);
    }
}

async function deleteCourse(courseId) {
    if (!confirm('Are you sure you want to delete this course?')) return;

    try {
        const res = await fetch(`/api/courses/${courseId}`, {
            method: 'DELETE',
            headers: { 'Authorization': 'Bearer ' + localStorage.getItem('accessToken') }
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        alert('Course deleted successfully');
        fetchCourses();
    } catch (err) {
        console.error('Delete Course Error:', err);
        alert('Failed to delete course: ' + err.message);
    }
}



// Logout
function logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('role');
    window.location.href = 'index.html';
}
