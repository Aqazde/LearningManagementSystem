// public/scripts/quiz-preview.js

document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const quizId = params.get("id");
    const token = localStorage.getItem("accessToken");

    if (!quizId || !token) {
        window.location.href = "index.html";
        return;
    }

    const message = document.getElementById("message");
    const quizDetails = document.getElementById("quizDetails");
    const confirmBox = document.getElementById("confirmBox");

    try {
        const res = await fetch(`/api/quizzes/${quizId}/metadata`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const quiz = await res.json();

        if (!res.ok) throw new Error(quiz.message);

        document.getElementById("quizTitle").textContent = quiz.title;
        document.getElementById("quizDescription").textContent = quiz.description || "No description provided.";
        document.getElementById("quizTime").textContent = quiz.time_limit || "Unlimited";
        document.getElementById("quizDueDate").textContent = new Date(quiz.due_date).toLocaleDateString();
        document.getElementById("quizAttempts").textContent = quiz.allow_multiple_attempts ? "Multiple" : "One";

        quizDetails.classList.remove("hidden");

        document.getElementById("startQuizBtn").onclick = () => {
            document.getElementById("confirmModal").classList.remove("hidden");
        };

        document.getElementById("cancelBtn").onclick = () => {
            document.getElementById("confirmModal").classList.add("hidden");
        };

        document.getElementById("confirmStartBtn").onclick = () => {
            window.location.href = `quiz-take.html?id=${quizId}`;
        };

    } catch (err) {
        message.textContent = "⚠️ " + err.message;
    }
});
