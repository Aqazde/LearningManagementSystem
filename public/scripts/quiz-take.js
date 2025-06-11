// public/scripts/quiz-take.js

document.addEventListener("DOMContentLoaded", async () => {
    const params = new URLSearchParams(window.location.search);
    const quizId = params.get("id");
    const token = localStorage.getItem("accessToken");

    if (!quizId || !token) {
        window.location.href = "index.html";
        return;
    }

    const message = document.getElementById("message");
    const quizForm = document.getElementById("quizForm");
    const questionsContainer = document.getElementById("questionsContainer");
    const quizTitle = document.getElementById("quizTitle");

    try {
        const res = await fetch(`/api/quizzes/${quizId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        const { quiz, questions } = data;
        quizTitle.textContent = quiz.title;
        quizForm.classList.remove("hidden");

        renderQuestions(questions);
        handleTimer(quiz.time_limit);

        quizForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const answers = collectAnswers(questions);
            await submitQuiz(quizId, answers, token);
        });

    } catch (err) {
        message.textContent = "⚠️ " + err.message;
    }
});

function renderQuestions(questions) {
    const container = document.getElementById("questionsContainer");
    container.innerHTML = "";

    questions.forEach((q, index) => {
        const div = document.createElement("div");
        div.className = "question-block";

        const questionText = `<p class="font-medium text-gray-800">Question ${index + 1}: ${q.question_text}</p>`;

        const inputField = q.question_type === "multiple_choice"
            ? renderOptions(q)
            : `<textarea name="q_${q.id}" rows="4" required class="mt-2 w-full p-2 border border-gray-300 rounded"></textarea>`;

        div.innerHTML = `${questionText}${inputField}`;
        container.appendChild(div);
    });
}


function renderOptions(question) {
    const options = question.options || [];
    return options.map(opt => `
    <label>
      <input type="radio" name="q_${question.id}" value="${opt}" required>
      ${opt}
    </label><br>
  `).join("");
}

function collectAnswers(questions) {
    return questions.map(q => {
        const selected = document.querySelector(`input[name="q_${q.id}"]:checked`);
        return {
            questionId: q.id,
            studentAnswer: selected ? selected.value : null
        };
    });
}

async function submitQuiz(quizId, answers, token) {
    try {
        const res = await fetch("/api/quizzes/submit", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ quizId, answers })
        });

        const result = await res.json();
        if (!res.ok) throw new Error(result.message);

        alert("Quiz submitted successfully!");
        window.location.href = "student-dashboard.html";
    } catch (err) {
        document.getElementById("message").textContent = err.message;
    }
}

function handleTimer(minutes) {
    if (!minutes || isNaN(minutes) || Number(minutes) <= 0) return;

    const totalSeconds = minutes * 60;
    let secondsLeft = totalSeconds;
    const timerBox = document.getElementById("timerBox");
    const display = document.getElementById("timeRemaining");

    timerBox.classList.remove("hidden");

    const interval = setInterval(() => {
        const min = Math.floor(secondsLeft / 60);
        const sec = secondsLeft % 60;
        display.textContent = `${min}:${sec.toString().padStart(2, "0")}`;

        if (--secondsLeft < 0) {
            clearInterval(interval);
            alert("⏰ Time's up! Submitting quiz.");
            document.getElementById("quizForm").requestSubmit();
        }
    }, 1000);
}
