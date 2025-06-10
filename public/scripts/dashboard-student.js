// public/scripts/dashboard-student.js

document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return (window.location.href = "index.html");

    fetchStudentProfile(token);
    fetchEnrolledCourses(token);
    fetchUpcomingAssignments(token);
});

function logout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("role");
    window.location.href = "index.html";
}

async function fetchStudentProfile(token) {
    try {
        const res = await fetch("/api/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        document.getElementById("studentName").textContent = `Welcome, ${data.name}`;
    } catch (err) {
        console.error("Failed to load profile");
    }
}

async function fetchEnrolledCourses(token) {
    try {
        const res = await fetch("/api/enrollments/my-courses", {
            headers: { Authorization: `Bearer ${token}` },
        });
        const courses = await res.json();
        renderCourses(courses);
    } catch (err) {
        console.error("Failed to fetch courses", err);
        document.getElementById("dashboardMessage").textContent = "Could not load courses.";
    }
}

function renderCourses(courses) {
    const container = document.getElementById("coursesContainer");
    container.innerHTML = "";

    courses.forEach((course) => {
        const card = document.createElement("div");
        card.className = "bg-white p-6 rounded-lg shadow-md";
        card.innerHTML = `
            <h2 class="text-xl font-semibold">${course.title}</h2>
            <p class="text-sm text-gray-600 mt-2">${course.description || "No description provided."}</p>
            <div class="flex justify-between mt-4">
                <a href="course-detail.html?id=${course.id}" class="text-blue-500 font-medium">View Course</a>
                <span class="text-sm text-gray-500">ID: ${course.id}</span>
            </div>
        `;
        container.appendChild(card);
    });
}

async function fetchUpcomingAssignments(token) {
    try {
        const res = await fetch("/api/dashboard/student", {
            headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        renderAssignments(data.assignments || []);
    } catch (err) {
        console.error("Failed to fetch assignments", err);
    }
}

function renderAssignments(assignments) {
    const container = document.getElementById("assignmentsContainer");
    container.innerHTML = "";

    if (!assignments.length) {
        container.innerHTML = `<p class="text-gray-600">No upcoming assignments.</p>`;
        return;
    }

    assignments.forEach((a) => {
        const card = document.createElement("div");
        card.className = "bg-white p-4 rounded-lg shadow-md";
        card.innerHTML = `
            <h3 class="font-medium">${a.title}</h3>
            <p class="text-sm text-gray-600">Due: ${new Date(a.due_date).toLocaleDateString()}</p>
            <a href="assignment.html?id=${a.id}" class="inline-block mt-2 text-blue-500">Submit</a>
        `;
        container.appendChild(card);
    });
}
