document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("accessToken");
    if (!token) return window.location.href = "index.html";

    const courseSelect = document.getElementById("courseSelect");
    const assignmentForm = document.getElementById("assignmentForm");
    const assignmentList = document.getElementById("assignmentList");
    const assignmentMessage = document.getElementById("assignmentMessage");

    let teacherCourses = [];

    loadCourses();

    async function loadCourses() {
        try {
            const res = await fetch("/api/courses/my-teacher-courses", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const courses = await res.json();
            teacherCourses = courses;

            courseSelect.innerHTML = `<option value="">-- Select Course --</option>`;
            courses.forEach(c => {
                const opt = document.createElement("option");
                opt.value = c.id;
                opt.textContent = c.title;
                courseSelect.appendChild(opt);
            });

            if (courses.length > 0) loadAssignments(courses[0].id);
        } catch (err) {
            assignmentMessage.textContent = "❌ Failed to load courses.";
        }
    }

    assignmentForm.addEventListener("submit", async e => {
        e.preventDefault();
        assignmentMessage.textContent = "";

        const payload = {
            courseId: courseSelect.value,
            title: document.getElementById("title").value,
            description: document.getElementById("description").value,
            dueDate: document.getElementById("dueDate").value,
            weekLabel: parseInt(document.getElementById("weekLabel").value),
            allowFile: document.getElementById("allowFile").checked,
            allowText: document.getElementById("allowText").checked,
            fileRequired: document.getElementById("fileRequired").checked,
            textRequired: document.getElementById("textRequired").checked,
        };

        try {
            const res = await fetch("/api/assignments/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.message);
            assignmentMessage.textContent = "✅ Created successfully!";
            assignmentForm.reset();
            loadAssignments(payload.courseId);
        } catch (err) {
            assignmentMessage.textContent = "❌ " + err.message;
        }
    });

    async function loadAssignments(courseId) {
        assignmentList.innerHTML = "Loading...";
        try {
            const res = await fetch(`/api/assignments/course/${courseId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            renderAssignments(data);
        } catch (err) {
            assignmentList.innerHTML = "<p class='text-red-600'>❌ Failed to load assignments</p>";
        }
    }

    function renderAssignments(assignments) {
        assignmentList.innerHTML = "";

        if (!assignments.length) {
            assignmentList.innerHTML = "<p class='text-gray-600'>No assignments yet.</p>";
            return;
        }

        assignments.forEach(a => {
            const div = document.createElement("div");
            div.className = "bg-white p-4 rounded shadow";

            div.innerHTML = `
        <h3 class="text-lg font-bold">${a.title}</h3>
        <p class="text-sm text-gray-600">${a.description || "No description"}</p>
        <p class="text-sm">Due: ${a.due_date?.split("T")[0] || "-"}</p>
        <p class="text-sm">Week: ${a.week_label}</p>
        <div class="mt-2">
          <a href="teacher-submissions.html?assignmentId=${a.id}" class="text-blue-600 hover:underline">📥 View Submissions</a>
        </div>
      `;

            assignmentList.appendChild(div);
        });
    }
});

function logout() {
    localStorage.clear();
    window.location.href = "index.html";
}
