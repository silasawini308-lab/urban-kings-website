const API_URL = 'http://localhost:5000/api';
const token = localStorage.getItem('token');

const statusMsg = document.getElementById('careers-status');
const jobsList = document.getElementById('jobs-list');
const applyPanel = document.getElementById('apply-panel');
const applyJobTitle = document.getElementById('apply-job-title');
const cvUrlInput = document.getElementById('cv-url-input');
const applyMsg = document.getElementById('apply-msg');
const submitBtn = document.getElementById('submit-application-btn');

let selectedJobId = null;

async function loadJobs() {
  statusMsg.textContent = 'Loading...';
  jobsList.replaceChildren();

  try {
    const res = await fetch(`${API_URL}/careers/jobs`);
    const jobs = await res.json();

    if (jobs.length === 0) {
      statusMsg.textContent = 'No open positions right now. Check back soon.';
      return;
    }
    statusMsg.textContent = '';

    jobs.forEach(job => {
      const card = document.createElement('div');
      card.className = 'booking-panel';
      card.style.marginBottom = '20px';

      const title = document.createElement('h3');
      title.textContent = job.title;

      const desc = document.createElement('p');
      desc.className = 'card-stock';
      desc.textContent = job.description;

      const applyBtn = document.createElement('button');
      applyBtn.className = 'btn-gold';
      applyBtn.textContent = 'Apply';
      applyBtn.style.marginTop = '12px';
      applyBtn.addEventListener('click', () => openApplyPanel(job));

      card.append(title, desc, applyBtn);
      jobsList.appendChild(card);
    });
  } catch (err) {
    statusMsg.textContent = 'Could not load job postings.';
  }
}

function openApplyPanel(job) {
  selectedJobId = job.id;
  applyJobTitle.textContent = `Apply — ${job.title}`;
  applyPanel.style.display = 'block';
  applyMsg.textContent = '';
  cvUrlInput.value = '';
  applyPanel.scrollIntoView({ behavior: 'smooth' });
}

submitBtn.addEventListener('click', async () => {
  applyMsg.style.color = '';
  applyMsg.textContent = '';

  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  const cvUrl = cvUrlInput.value.trim();
  if (!cvUrl.startsWith('https://')) {
    applyMsg.textContent = 'Please enter a valid link starting with https://';
    return;
  }

  try {
    const res = await fetch(`${API_URL}/careers/jobs/${selectedJobId}/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ cvUrl })
    });
    const data = await res.json();

    if (!res.ok) {
      applyMsg.textContent = data.error || 'Could not submit application.';
      return;
    }

    applyMsg.style.color = 'green';
    applyMsg.textContent = 'Application submitted! We will be in touch.';
  } catch (err) {
    applyMsg.textContent = 'Could not reach the server.';
  }
});

loadJobs();