// public/scripts/teacher-submissions.js
document.addEventListener("DOMContentLoaded", () => {
    const token = localStorage.getItem("accessToken");
    const msg = document.getElementById("resultsMessage");

    if (!token) return window.location.href = "index.html";

    const quizContainer = document.getElementById("quizResultsContainer");
    const assignmentContainer = document.getElementById("assignmentResultsContainer");

    loadQuizSubmissions();
    loadAssignmentSubmissions();

    async function loadQuizSubmissions() {
        try {
            const res = await fetch("/api/courses/my-teacher-courses", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const courses = await res.json();

            for (const course of courses) {
                const quizRes = await fetch(`/api/quizzes/course/${course.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const quizzes = await quizRes.json();

                for (const quiz of quizzes) {
                    const submissionRes = await fetch(`/api/quizzes/${quiz.id}/submissions`, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    const submissions = await submissionRes.json();

                    if (submissions.length === 0) continue;

                    const section = document.createElement("div");
                    section.classList.add("mb-4");
                    section.innerHTML = `<h3 class="font-bold mb-2">${quiz.title} (${course.title})</h3>`;

                    const list = document.createElement("ul");
                    list.classList.add("space-y-1");

                    submissions.forEach(sub => {
                        const li = document.createElement("li");
                        li.innerHTML = `
                            <div class="p-2 border rounded flex justify-between">
                                <span>${sub.student_name} | Score: ${sub.score ?? "N/A"}</span>
                                <small>${new Date(sub.submitted_at).toLocaleString()}</small>
                            </div>
                        `;
                        list.appendChild(li);
                    });

                    section.appendChild(list);
                    quizContainer.appendChild(section);
                }
            }
        } catch (err) {
            msg.textContent = "❌ Failed to load quiz submissions.";
            console.error(err);
        }
    }

    async function loadAssignmentSubmissions() {
    try {
        const res = await fetch("/api/courses/my-teacher-courses", {
            headers: { Authorization: `Bearer ${token}` }
        });
        const courses = await res.json();

        for (const course of courses) {
            const assgnRes = await fetch(`/api/assignments/course/${course.id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const assignments = await assgnRes.json();

            for (const ass of assignments) {
                const submissionRes = await fetch(`/api/assignments/${ass.id}/submissions`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const submissions = await submissionRes.json();

                if (submissions.length === 0) continue;

                const section = document.createElement("div");
                section.classList.add("mb-4");
                section.innerHTML = `<h3 class="font-bold mb-2">${ass.title} (${course.title})</h3>`;

                const list = document.createElement("ul");
                list.classList.add("space-y-1");

                submissions.forEach(sub => {
                    const filePart = sub.file_url
                        ? `<a href="/${sub.file_url}" class="underline text-blue-600" target="_blank">Download</a>`
                        : "No file";
                    const gradePart = sub.grade ? `Grade: ${sub.grade}` : "Ungraded";

                    const submittedAt = new Date(sub.submitted_at);
                    const dueDate = new Date(ass.due_date);
                    const isLate = submittedAt > dueDate;
                    const lateLabel = isLate ? `<span class="text-red-600 font-bold ml-2">⏰ Late</span>` : "";

                    const li = document.createElement("li");
                    li.innerHTML = `
                        <div class="p-2 border rounded space-y-2">
                            <div class="font-semibold">${sub.student_name}${lateLabel}</div>
                            <div>${filePart} | ${gradePart}</div>
                            ${sub.feedback ? `<div class="text-sm italic">📝 ${sub.feedback}</div>` : ""}
    
                            <div class="flex gap-2 items-center">
                                <input type="number" min="0" max="100" placeholder="Grade" class="border px-2 py-1 w-24"
                                    id="grade_${sub.id}" value="${sub.grade ?? ''}" />
                                <input type="text" placeholder="Feedback" class="border px-2 py-1 flex-1"
                                    id="feedback_${sub.id}" value="${sub.feedback ?? ''}" />
                                <button class="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                                    onclick="submitGrade(${sub.id})">Submit Grade</button>
                             </div>
    
                            <button onclick="checkPlagiarism('${sub.id}')" class="text-blue-600 hover:underline">Check Plagiarism</button>
                            <div id="plagiarismResult_${sub.id}" class="text-sm text-gray-600"></div>
                            <div id="gradeMsg_${sub.id}" class="text-sm text-green-600 mt-1"></div>
                        </div>
                    `;
                    list.appendChild(li);
                });

                section.appendChild(list);
                assignmentContainer.appendChild(section);
            }
        }
    } catch (err) {
        msg.textContent = "❌ Failed to load assignment submissions.";
        console.error(err);
    }
}
});

async function checkPlagiarism(submissionId) {
    const token = localStorage.getItem('accessToken');
    const resultDiv = document.getElementById(`plagiarismResult_${submissionId}`);
    resultDiv.textContent = "🔍 Checking for plagiarism...";

    try {
        const response = await fetch(`/api/plagiarism/check/${submissionId}`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            const msg = data.message || 'Unknown error';
            resultDiv.textContent = `❌ Error: ${msg}`;

            if (msg.includes('no readable text')) {
                resultDiv.textContent += ' 🧐 Make sure the file is not empty and contains readable text.';
            }

            return;
        }

        const matches = data.matches;

        if (!Array.isArray(matches) || matches.length === 0) {
            resultDiv.textContent = "✅ No similar submissions found.";
            return;
        }

        resultDiv.innerHTML = matches.map(match => {
            const similarityPercent = (match.similarity * 100).toFixed(1);
            let level;

            if (match.similarity >= 0.85) level = "🔴 High";
            else if (match.similarity >= 0.6) level = "🟠 Medium";
            else level = "🟢 Low";

            return `👤 Student ID: ${match.studentId} — Similarity: ${similarityPercent}% (${level})`;
        }).join('<br>');

    } catch (err) {
        console.error(err);
        resultDiv.textContent = '❌ Failed to fetch results';
    }
}

async function submitGrade(submissionId) {
    const token = localStorage.getItem("accessToken");
    const gradeInput = document.getElementById(`grade_${submissionId}`);
    const feedbackInput = document.getElementById(`feedback_${submissionId}`);
    const messageDiv = document.getElementById(`gradeMsg_${submissionId}`);

    const grade = gradeInput.value.trim();
    const feedback = feedbackInput.value.trim();

    if (grade === "" && feedback === "") {
        messageDiv.textContent = "Please provide a grade or feedback.";
        return;
    }

    try {
        const res = await fetch(`/api/assignments/submissions/${submissionId}/grade`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ grade, feedback })
        });

        const data = await res.json();

        if (!res.ok) {
            messageDiv.textContent = `❌ ${data.message || "Failed to update."}`;
            return;
        }

        messageDiv.textContent = "✅ Grade updated.";
    } catch (err) {
        console.error(err);
        messageDiv.textContent = "❌ Error occurred while submitting grade.";
    }
}

function logout() {
    localStorage.clear();
    window.location.href = "index.html";
}
