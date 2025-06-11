// public/scripts/course.js

const token = localStorage.getItem('accessToken');
if (!token) {
    window.location.href = 'index.html';
}

const courseId = new URLSearchParams(window.location.search).get('id');
const courseTitle = document.getElementById('courseTitle');
const courseDescription = document.getElementById('courseDescription');
const contentList = document.getElementById('contentList');
const assignmentList = document.getElementById('assignmentList');
const quizList = document.getElementById('quizList');
const message = document.getElementById('courseMessage');

if (!courseId) {
    message.textContent = 'Course ID missing in URL';
} else {
    fetchCourseDetails();
    fetchCourseContent();
    fetchAssignments();
    fetchQuizzes();
}

async function fetchCourseDetails() {
    try {
        const res = await fetch(`/api/courses/${courseId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const course = await res.json();
        if (!res.ok) throw new Error(course.message);

        courseTitle.textContent = course.title;
        courseDescription.textContent = course.description;
    } catch (err) {
        message.textContent = 'Failed to load course details';
    }
}

async function fetchCourseContent() {
    try {
        const res = await fetch(`/api/content/course/${courseId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const contents = await res.json();
        if (!res.ok) throw new Error(contents.message);

        contents.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${item.title}</strong> - <a href="${item.content_url}" target="_blank" class="text-blue-600">View</a><br><small>${item.description}</small>`;
            contentList.appendChild(li);
        });
    } catch (err) {
        message.textContent = 'Failed to load course content';
    }
}

async function fetchAssignments() {
    try {
        const res = await fetch(`/api/assignments/course/${courseId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const assignments = await res.json();
        if (!res.ok) throw new Error(assignments.message);

        assignments.forEach(a => {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${a.title}</strong> - Due: ${new Date(a.due_date).toLocaleDateString()} <br>
                            <a href="assignment-submit.html?id=${a.id}" class="text-blue-600">Submit</a>`;
            assignmentList.appendChild(li);
        });
    } catch (err) {
        message.textContent = 'Failed to load assignments';
    }
}

async function fetchQuizzes() {
    try {
        const res = await fetch(`/api/quizzes/course/${courseId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const quizzes = await res.json();
        if (!res.ok) throw new Error(quizzes.message);

        let quizTaken = false;

        for (const q of quizzes) {
            const li = document.createElement('li');
            li.innerHTML = `<strong>${q.title}</strong> - Due: ${new Date(q.due_date).toLocaleDateString()} <br>
                            <a href="quiz-preview.html?id=${q.id}" class="text-blue-600">Take Quiz</a>`;
            quizList.appendChild(li);

            try {
                const subRes = await fetch(`/api/quizzes/${q.id}/my-submission`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (subRes.ok) {
                    quizTaken = true;

                    const recList = document.getElementById("quizRecommendations");
                    const item = document.createElement("li");
                    item.innerHTML = `
                        ✅ <strong>${q.title}</strong><br>
                        <a href="recommendations.html?quizId=${q.id}" class="text-blue-600">Get personalized recommendation</a>
                    `;
                    recList.appendChild(item);
                }
            } catch (err) {
                console.warn(`No submission for quiz ${q.id}`);
            }
        }

        if (quizTaken) {
            document.getElementById("recommendationSection").classList.remove("hidden");
            document.getElementById("courseRecommendationLink").href = `recommendations.html?courseId=${courseId}`;
        }

    } catch (err) {
        console.error("Failed to load quizzes", err);
        message.textContent = 'Failed to load quizzes';
    }
}


function logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('role');
    window.location.href = 'index.html';
}
