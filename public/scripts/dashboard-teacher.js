document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("accessToken");
    const teacherName = localStorage.getItem("name") || "Teacher";
    document.getElementById("teacherName").textContent = `Welcome, ${teacherName}`;

    if (!token) window.location.href = "index.html";

    const coursesContainer = document.getElementById("coursesContainer");
    const courseSelect = document.getElementById("courseSelect");
    const contentForm = document.getElementById("contentForm");
    const contentMessage = document.getElementById("contentMessage");
    const dashboardMessage = document.getElementById("dashboardMessage");

    loadCourses();

    // Load teacher's own courses
    async function loadCourses() {
        try {
            const res = await fetch("/api/courses/my-teacher-courses", {
                headers: { Authorization: `Bearer ${token}` }
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to fetch courses");

            coursesContainer.innerHTML = "";
            courseSelect.innerHTML = `<option value="">-- Select Course --</option>`;

            data.forEach(course => {
                // Course Card
                const div = document.createElement("div");
                div.className = "bg-white p-4 rounded shadow";
                div.innerHTML = `
          <h3 class="text-lg font-bold mb-1">${course.title}</h3>
          <p class="text-sm text-gray-600 mb-2">${course.description || "No description"}</p>
          <p class="text-sm text-blue-600 italic">Management features coming soon</p>
        `;
                coursesContainer.appendChild(div);

                // Course Select Option
                const opt = document.createElement("option");
                opt.value = course.id;
                opt.textContent = course.title;
                courseSelect.appendChild(opt);
            });

        } catch (err) {
            dashboardMessage.textContent = `❌ ${err.message}`;
        }
    }

    // Content Form Submit
    contentForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        contentMessage.textContent = "";

        const payload = {
            courseId: courseSelect.value,
            title: document.getElementById("title").value,
            description: document.getElementById("description").value,
            contentUrl: document.getElementById("contentUrl").value,
            contentType: "link"  // You can update this later to support other types
        };

        try {
            const res = await fetch("/api/content/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.message);

            contentMessage.textContent = "✅ Content created successfully!";
            contentForm.reset();
        } catch (err) {
            contentMessage.textContent = `❌ ${err.message}`;
        }
    });
});

function logout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("role");
    localStorage.removeItem("name");
    window.location.href = "index.html";
}
