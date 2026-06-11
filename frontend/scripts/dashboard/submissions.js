
function isAuthenticated() {
  return localStorage.getItem('algoforge-auth') === 'true';
}

if (!isAuthenticated()) {
  window.location.href = 'login.html';
}

initAppNav();

const verdictFilter = document.getElementById('verdictFilter');
const submissionsBody = document.getElementById('submissionsBody');

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatDate(value) {
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function verdictClass(verdict) {
  return verdict.toLowerCase().replace(/\s+/g, '-');
}

function renderSubmissions(submissions) {
  if (!submissions.length) {
    submissionsBody.innerHTML = '<tr><td colspan="6">No submissions found.</td></tr>';
    return;
  }

  submissionsBody.innerHTML = submissions.map((submission) => `
    <tr>
      <td>${escapeHtml(submission.problemTitle)}</td>
      <td>${escapeHtml(submission.language)}</td>
      <td><span class="verdict ${verdictClass(submission.verdict)}">${escapeHtml(submission.verdict)}</span></td>
      <td>${submission.runtime != null ? `${submission.runtime}s` : '-'}</td>
      <td>${submission.memory != null ? `${submission.memory} KB` : '-'}</td>
      <td>${formatDate(submission.submittedAt)}</td>
    </tr>
  `).join('');
}

async function loadSubmissions() {
  submissionsBody.innerHTML = '<tr><td colspan="6">Loading submissions...</td></tr>';

  try {
    const verdict = verdictFilter.value;
    const query = verdict !== 'All' ? `?verdict=${encodeURIComponent(verdict)}` : '';
    const response = await fetch(`${API_BASE_URL}/profile/submissions${query}`, {
      headers: getAuthHeaders()
    });
    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(data.message || 'Failed to load submissions');
    }

    renderSubmissions(data.submissions);
  } catch (error) {
    submissionsBody.innerHTML = '<tr><td colspan="6">Could not load submissions.</td></tr>';
    console.log(error);
  }
}

verdictFilter.addEventListener('change', loadSubmissions);
loadSubmissions();
