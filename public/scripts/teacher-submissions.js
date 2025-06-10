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
                        const filePart = sub.file_url ? `<a href="/${sub.file_url}" class="underline text-blue-600" target="_blank">Download</a>` : "No file";
                        const gradePart = sub.grade ? `Grade: ${sub.grade}` : "Ungraded";

                        const li = document.createElement("li");
                        li.innerHTML = `
                            <div class="p-2 border rounded">
                                <div class="font-semibold">${sub.student_name}</div>
                                <div>${filePart} | ${gradePart}</div>
                                ${sub.feedback ? `<div class="text-sm italic mt-1">📝 ${sub.feedback}</div>` : ""}
                                <button onclick="checkPlagiarism('${sub.id}')" class="text-blue-600 hover:underline mt-2">Check Plagiarism</button>
                                <div id="plagiarismResult_${sub.id}" class="text-sm text-gray-600 mt-1"></div>
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

function logout() {
    localStorage.clear();
    window.location.href = "index.html";
}
