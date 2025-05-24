document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const quizId = params.get("id");
    const token = localStorage.getItem("accessToken");
    const tableBody = document.getElementById("submissionsTableBody");
    const message = document.getElementById("message");
    const quizTitle = document.getElementById("quizTitle");

    if (!quizId || !token) {
        window.location.href = "index.html";
        return;
    }

    try {
        // Fetch quiz title
        const quizMetaRes = await fetch(`/api/quizzes/${quizId}/metadata`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const quizMeta = await quizMetaRes.json();
        quizTitle.textContent = `Quiz: ${quizMeta.title}`;

        // Fetch submissions
        const res = await fetch(`/api/quizzes/${quizId}/submissions`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const submissions = await res.json();
        if (!res.ok) throw new Error(submissions.message || "Failed to load submissions");

        if (submissions.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6">No submissions yet.</td></tr>`;
            return;
        }

        submissions.forEach(sub => {
            const row = document.createElement("tr");
            row.innerHTML = `
        <td>${sub.student_name}</td>
        <td>${sub.attempt_number}</td>
        <td>${sub.score ?? "Pending"}</td>
        <td>${formatDate(sub.start_time)}</td>
        <td>${sub.submitted_at ? formatDate(sub.submitted_at) : "In progress"}</td>
        <td>
          <a href="quiz-submission-details.html?id=${sub.id}" class="text-blue-600">View</a>
        </td>
      `;
            tableBody.appendChild(row);
        });

    } catch (err) {
        message.textContent = "Error: " + err.message;
    }
});

function formatDate(isoString) {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleString();
}
