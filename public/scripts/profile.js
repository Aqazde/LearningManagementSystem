document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("accessToken");
  const content = document.getElementById("profileContent");
  const message = document.getElementById("message");

  if (!token) {
    window.location.href = "index.html";
    return;
  }

  try {
    const res = await fetch("/api/transcript", {
      headers: { Authorization: `Bearer ${token}` }
    });

    const transcript = await res.json();
    if (!res.ok) throw new Error(transcript.message || "Failed to load transcript");

    if (transcript.length === 0) {
      content.innerHTML = `<p class="text-gray-600">You are not enrolled in any courses yet.</p>`;
      return;
    }

    transcript.forEach(course => {
      const courseBlock = document.createElement("div");
      courseBlock.className = "bg-white shadow-md rounded-lg p-6";

      courseBlock.innerHTML = `
        <h2 class="text-xl font-semibold text-gray-800 mb-4">${course.courseTitle}</h2>

        <div class="mb-4">
          <h3 class="text-lg font-medium text-gray-700">Assignments</h3>
          <ul class="list-disc pl-6 mt-2 space-y-1">
            ${
              course.assignments.length > 0
                ? course.assignments.map(a =>
                    `<li>${a.status} ${a.title} — <span class="text-gray-600">${a.grade !== null ? a.grade + "/100" : "Not graded"}</span></li>`
                  ).join("")
                : `<li class="text-gray-500">No assignments</li>`
            }
          </ul>
        </div>

        <div>
          <h3 class="text-lg font-medium text-gray-700">Quizzes</h3>
          <ul class="list-disc pl-6 mt-2 space-y-1">
            ${
              course.quizzes.length > 0
                ? course.quizzes.map(q =>
                    `<li>${q.status} ${q.title} — <span class="text-gray-600">${q.score !== null ? q.score + " points" : "Not taken"}</span></li>`
                  ).join("")
                : `<li class="text-gray-500">No quizzes</li>`
            }
          </ul>
        </div>
      `;

      content.appendChild(courseBlock);
    });

  } catch (err) {
    console.error(err);
    message.textContent = "⚠️ " + err.message;
  }
});
