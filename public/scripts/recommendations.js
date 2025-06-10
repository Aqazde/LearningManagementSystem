document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("accessToken");
    const params = new URLSearchParams(window.location.search);
    const quizId = params.get("quizId");
    const courseId = params.get("courseId");

    const messageDiv = document.getElementById("recommendationMessage");
    const loadingDiv = document.getElementById("loading");

    if (!token) {
        return window.location.href = "index.html";
    }

    if (!quizId && !courseId) {
        messageDiv.textContent = "❌ Invalid request. Missing quizId or courseId.";
        return;
    }

    loadingDiv.textContent = "⏳ Generating your personalized recommendation...";

    try {
        let url = "";
        if (quizId) {
            url = `/api/recommendation/quiz/${quizId}`;
        } else {
            url = `/api/recommendation/course/${courseId}`;
        }

        const res = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await res.json();
        loadingDiv.textContent = "";

        if (!res.ok) {
            messageDiv.textContent = `❌ ${data.message || "Failed to fetch recommendation."}`;
            return;
        }

        const resultBlock = document.getElementById("recommendationResult");
        resultBlock.innerHTML = `
            <h2 class="text-xl font-bold mb-2">🎓 Your Personalized Recommendation</h2>
            <div class="bg-gray-100 p-4 rounded border">${data.recommendation.replace(/\n/g, "<br>")}</div>
        `;

    } catch (err) {
        console.error(err);
        loadingDiv.textContent = "";
        messageDiv.textContent = "❌ Error fetching recommendation.";
    }
});
