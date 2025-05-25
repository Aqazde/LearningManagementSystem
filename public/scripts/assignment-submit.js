// public/scripts/assignment-submit.js

const token = localStorage.getItem('accessToken');
if (!token) window.location.href = 'index.html';

const assignmentId = new URLSearchParams(window.location.search).get('id');
const titleEl = document.getElementById('assignmentTitle');
const descEl = document.getElementById('assignmentDescription');
const dueDateEl = document.getElementById('assignmentDueDate');
const form = document.getElementById('submitForm');
const messageEl = document.getElementById('submitMessage');
const assignmentIdInput = document.getElementById('assignmentId');

if (!assignmentId) {
    titleEl.textContent = 'Assignment not found.';
} else {
    fetchAssignment();
}

async function fetchAssignment() {
    try {
        const res = await fetch(`/api/assignments/${assignmentId}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);

        titleEl.textContent = data.title;
        descEl.textContent = data.description || '';
        dueDateEl.textContent = new Date(data.due_date).toLocaleDateString();
        assignmentIdInput.value = data.id;
    } catch (err) {
        messageEl.textContent = '❌ Failed to load assignment';
    }
}

form.addEventListener('submit', async e => {
    e.preventDefault();
    messageEl.textContent = '';

    const formData = new FormData(form);
    formData.set('assignmentId', assignmentId); // Ensure assignmentId is set

    try {
        const res = await fetch('/api/assignments/submit', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`
            },
            body: formData
        });

        const result = await res.json();
        if (!res.ok) throw new Error(result.message);

        messageEl.classList.remove('text-red-600');
        messageEl.classList.add('text-green-600');
        messageEl.textContent = '✅ Submitted successfully!';
        form.reset();
    } catch (err) {
        messageEl.textContent = '❌ ' + err.message;
    }
});

function logout() {
    localStorage.clear();
    window.location.href = 'index.html';
}
