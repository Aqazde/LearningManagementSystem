document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("accessToken");
    const form = document.getElementById("assignmentForm");
    const message = document.getElementById("formMessage");
    const courseSelect = document.getElementById("courseSelect");

    if (!token) return window.location.href = "index.html";

    // Load courses for dropdown
    fetch("/api/courses/my-teacher-courses", {
        headers: { Authorization: `Bearer ${token}` }
    })
        .then(res => res.json())
        .then(courses => {
            courses.forEach(course => {
                const opt = document.createElement("option");
                opt.value = course.id;
                opt.textContent = course.title;
                courseSelect.appendChild(opt);
            });
        })
        .catch(() => {
            message.textContent = "❌ Failed to load courses";
        });

    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        message.textContent = "";

        const payload = {
            courseId: courseSelect.value,
            title: document.getElementById("title").value,
            description: document.getElementById("description").value,
            dueDate: document.getElementById("dueDate").value,
            weekLabel: parseInt(document.getElementById("weekLabel").value),
            allowFile: document.getElementById("allowFile").checked,
            fileRequired: document.getElementById("fileRequired").checked,
            allowText: document.getElementById("allowText").checked,
            textRequired: document.getElementById("textRequired").checked
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
            message.textContent = "✅ Assignment created successfully!";
            form.reset();
        } catch (err) {
            message.textContent = `❌ ${err.message}`;
        }
    });
});

function logout() {
    localStorage.clear();
    window.location.href = "index.html";
}
