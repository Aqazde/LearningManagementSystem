// public/scripts/quiz-submission-details.js

document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const submissionId = params.get("id");
    const token = localStorage.getItem("accessToken");

    const message = document.getElementById("message");
    const tableBody = document.getElementById("detailsTableBody");

    if (!submissionId || !token) {
        message.textContent = "Invalid access. Submission ID or token missing.";
        return;
    }

    try {
        const res = await fetch(`/api/quizzes/submissions/${submissionId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const answers = await res.json();
        if (!res.ok) throw new Error(answers.message || "Failed to load submission details");

        if (answers.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="4">No answers found.</td></tr>`;
            return;
        }

        answers.forEach(ans => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${ans.question_text}</td>
                <td>${ans.student_answer || "No answer"}</td>
                <td>${ans.is_correct === null ? "N/A" : ans.is_correct ? "✅" : "❌"}</td>
                <td>${ans.points_awarded ?? 0}</td>
            `;
            tableBody.appendChild(row);
        });
    } catch (err) {
        message.textContent = "Error: " + err.message;
    }
});
