// public/scripts/quiz-create.js

document.addEventListener("DOMContentLoaded", () => {
    const manualTab = document.getElementById("manualTab");
    const aiTab = document.getElementById("aiTab");
    const manualSection = document.getElementById("manualSection");
    const aiSection = document.getElementById("aiSection");
    const message = document.getElementById("message");
    const addQuestionBtn = document.getElementById("addQuestionBtn");
    const questionsContainer = document.getElementById("questionsContainer");
    const form = document.getElementById("quizForm");
    const token = localStorage.getItem("accessToken");

    let questionCount = 0;

    manualTab.onclick = () => {
        manualTab.classList.add("active");
        aiTab.classList.remove("active");
        manualSection.classList.remove("hidden");
        aiSection.classList.add("hidden");
        message.textContent = "";
    };

    aiTab.onclick = () => {
        aiTab.classList.add("active");
        manualTab.classList.remove("active");
        aiSection.classList.remove("hidden");
        manualSection.classList.add("hidden");
        message.textContent = "";
    };

    addQuestionBtn.onclick = () => {
        const q = document.createElement("div");
        q.classList.add("question-block");
        q.innerHTML = `
      <input type="text" placeholder="Question Text" class="q-text" required>
      <input type="text" placeholder="Option A" class="opt">
      <input type="text" placeholder="Option B" class="opt">
      <input type="text" placeholder="Option C" class="opt">
      <input type="text" placeholder="Option D" class="opt">
      <input type="text" placeholder="Correct Answer (A/B/C/D)" class="correct">
      <input type="number" placeholder="Points" class="points" value="1">
      <button type="button" class="remove-btn">Remove</button>
    `;
        questionsContainer.appendChild(q);

        q.querySelector(".remove-btn").onclick = () => q.remove();
    };

    form.onsubmit = async (e) => {
        e.preventDefault();
        message.textContent = "";

        const payload = {
            courseId: document.getElementById("courseSelect").value,
            title: document.getElementById("title").value,
            description: document.getElementById("description").value,
            weekLabel: document.getElementById("weekLabel").value,
            dueDate: document.getElementById("dueDate").value,
            timeLimit: parseInt(document.getElementById("timeLimit").value),
            allowMultipleAttempts: document.getElementById("allowMultipleAttempts").checked
        };

        let endpoint = "/api/quizzes/create";

        if (aiTab.classList.contains("active")) {
            payload.topic = document.getElementById("topic").value;
            payload.numQuestions = parseInt(document.getElementById("numQuestions").value);
            payload.questionType = document.getElementById("questionType").value;
            payload.difficulty = document.getElementById("difficulty").value;
            endpoint = "/api/quizzes/create-with-ai";
        } else {
            payload.questions = Array.from(document.querySelectorAll(".question-block")).map(block => ({
                questionText: block.querySelector(".q-text").value,
                questionType: "multiple_choice",
                options: [
                    block.querySelectorAll(".opt")[0].value,
                    block.querySelectorAll(".opt")[1].value,
                    block.querySelectorAll(".opt")[2].value,
                    block.querySelectorAll(".opt")[3].value
                ],
                correctAnswer: block.querySelector(".correct").value,
                points: parseInt(block.querySelector(".points").value)
            }));
        }

        try {
            const res = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to create quiz");

            message.textContent = "✅ Quiz created successfully!";
            form.reset();
            questionsContainer.innerHTML = "";
        } catch (err) {
            message.textContent = `❌ ${err.message}`;
        }
    };

    // Load teacher's courses
    async function loadCourses() {
        try {
            const res = await fetch("/api/teacher/courses", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const courses = await res.json();
            const select = document.getElementById("courseSelect");
            courses.forEach(c => {
                const opt = document.createElement("option");
                opt.value = c.id;
                opt.textContent = c.title;
                select.appendChild(opt);
            });
        } catch (err) {
            message.textContent = "Error loading courses";
        }
    }

    loadCourses();
});
