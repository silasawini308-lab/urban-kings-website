const API_URL = 'http://localhost:5000/api';
const token = localStorage.getItem('token');
const role = localStorage.getItem('role');

const statusMsg = document.getElementById('hr-status');
const jobForm = document.getElementById('job-form');
const jobsContainer = document.getElementById('jobs-container');

if (!token || (role !== 'hr' && role !== 'admin')) {
  window.location.href = 'index.html';
}

const APP_STATUS_OPTIONS = ['new', 'reviewed', 'interview', 'rejected', 'hired'];

jobForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const title = document.getElementById('job-title').value.trim();
  const description = document.getElementById('job-description').value.trim();

  try {
    const res = await fetch(`${API_URL}/careers/jobs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ title, description })
    });
    const data = await res.json();

    if (!res.ok) {
      statusMsg.textContent = data.error || 'Could not post job.';
      return;
    }

    jobForm.reset();
    statusMsg.textContent = 'Job posted.';
    loadJobs();
  } catch (err) {
    statusMsg.textContent = 'Could not reach the server.';
  }
});

async function loadJobs() {
  statusMsg.textContent = 'Loading...';
  jobsContainer.replaceChildren();

  try {
    const res = await fetch(`${API_URL}/careers/jobs/all`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const jobs = await res.json();

    if (!res.ok) {
      statusMsg.textContent = jobs.error || 'Could not load jobs.';
      return;
    }
    if (jobs.length === 0) {
      statusMsg.textContent = 'No job postings yet.';
      return;
    }
    statusMsg.textContent = '';

    for (const job of jobs) {
      const section = document.createElement('div');
      section.className = 'booking-panel';
      section.style.marginBottom = '24px';

      const header = document.createElement('div');
      header.style.display = 'flex';
      header.style.justifyContent = 'space-between';
      header.style.alignItems = 'center';

      const title = document.createElement('h3');
      title.textContent = job.title + (job.is_open ? '' : ' (Closed)');

      if (job.is_open) {
        const closeBtn = document.createElement('button');
        closeBtn.className = 'admin-delete-btn';
        closeBtn.textContent = 'Close posting';
        closeBtn.addEventListener('click', () => closeJob(job.id));
        header.append(title, closeBtn);
      } else {
        header.append(title);
      }

      const desc = document.createElement('p');
      desc.className = 'card-stock';
      desc.textContent = job.description;

      const appsTable = document.createElement('table');
      appsTable.className = 'admin-table';
      appsTable.innerHTML = `
        <thead><tr><th>Applicant</th><th>CV</th><th>Status</th></tr></thead>
        <tbody id="apps-${job.id}"></tbody>
      `;

      section.append(header, desc, appsTable);
      jobsContainer.appendChild(section);

      loadApplications(job.id);
    }
  } catch (err) {
    statusMsg.textContent = 'Could not reach the server.';
  }
}

async function loadApplications(jobId) {
  const tbody = document.getElementById(`apps-${jobId}`);
  try {
    const res = await fetch(`${API_URL}/careers/jobs/${jobId}/applications`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const applications = await res.json();

    if (!res.ok || applications.length === 0) {
      tbody.innerHTML = '<tr><td colspan="3">No applicants yet.</td></tr>';
      return;
    }

    tbody.replaceChildren();
    applications.forEach(app => {
      const row = document.createElement('tr');

      const nameCell = document.createElement('td');
      nameCell.textContent = `${app.full_name} (${app.email})`;

      const cvCell = document.createElement('td');
      const link = document.createElement('a');
      link.href = app.cv_url;
      link.target = '_blank';
      link.textContent = 'View CV';
      cvCell.appendChild(link);

      const statusCell = document.createElement('td');
      const select = document.createElement('select');
      APP_STATUS_OPTIONS.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt;
        if (opt === app.status) option.selected = true;
        select.appendChild(option);
      });
      select.addEventListener('change', () => updateAppStatus(app.id, select.value));
      statusCell.appendChild(select);

      row.append(nameCell, cvCell, statusCell);
      tbody.appendChild(row);
    });
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="3">Could not load applicants.</td></tr>';
  }
}

async function updateAppStatus(appId, status) {
  try {
    await fetch(`${API_URL}/careers/applications/${appId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status })
    });
    statusMsg.textContent = 'Applicant status updated.';
  } catch (err) {
    statusMsg.textContent = 'Could not update status.';
  }
}

async function closeJob(jobId) {
  if (!confirm('Close this job posting? It will no longer appear on the Careers page.')) return;
  try {
    await fetch(`${API_URL}/careers/jobs/${jobId}/close`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    });
    loadJobs();
  } catch (err) {
    statusMsg.textContent = 'Could not close job.';
  }
}

loadJobs();