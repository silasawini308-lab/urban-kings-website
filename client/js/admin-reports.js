const API_URL = 'http://localhost:5000/api';

const token = localStorage.getItem('token');
const role = localStorage.getItem('role');

const statusMsg = document.getElementById('admin-status');
const reportsList = document.getElementById('review-reports-list');
const statusFilter = document.getElementById('report-status-filter');
const refreshBtn = document.getElementById('refresh-reports-btn');

let activeRequest = 0;

// Protect the page from unauthenticated or non-admin users.
if (!token || role !== 'admin') {
  window.location.replace('index.html');
} else {
  loadReviewReports();
}

statusFilter.addEventListener('change', () => {
  loadReviewReports();
});

refreshBtn.addEventListener('click', () => {
  loadReviewReports();
});

function showMessage(message, type = 'loading') {
  statusMsg.textContent = message;
  statusMsg.className = `review-reports-message status-${type}`;
}

async function loadReviewReports(successMessage = '') {
  const requestId = ++activeRequest;

  showMessage('Loading review reports...', 'loading');
  reportsList.replaceChildren();
  refreshBtn.disabled = true;

  try {
    const selectedStatus = statusFilter.value;
    const url = new URL(`${API_URL}/admin/review-reports`);

    url.searchParams.set('status', selectedStatus);

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();

    // Ignore an older request if the filter changed while loading.
    if (requestId !== activeRequest) return;

    if (!res.ok) {
      showMessage(
        data.error || 'We could not load the reports. Please try again.',
        'error'
      );
      return;
    }

    if (!Array.isArray(data)) {
      showMessage(
        'The server returned an unexpected response. Please refresh and try again.',
        'error'
      );
      return;
    }

    if (data.length === 0) {
      showMessage(
        successMessage
          ? `${successMessage} There are no reports in this filter.`
          : 'No reports found for this status.',
        successMessage ? 'success' : 'loading'
      );
      return;
    }

    data.forEach(report => {
      const row = document.createElement('tr');

      addCell(row, `#${report.report_id}`);
      addCell(row, report.product_name || 'Unknown product');

      // Reported review
      const reviewCell = document.createElement('td');

      const rating = document.createElement('strong');
      rating.textContent = `${report.review_rating ?? '—'}/5 stars`;

      const comment = document.createElement('p');
      comment.textContent =
        report.review_comment || 'No comment provided.';

      const reviewer = document.createElement('small');
      reviewer.textContent =
        `Review by: ${report.reviewer_name || 'Unknown'}`;

      reviewCell.append(rating, comment, reviewer);
      row.appendChild(reviewCell);

      addCell(
        row,
        `${report.reporter_name || 'Unknown'} (#${report.reporter_id ?? '—'})`
      );

      addCell(row, formatReason(report.reason));
      addCell(row, report.details || 'No additional details.');
      addCell(row, formatDate(report.reported_at));

      // Status badge and status controls
      const statusCell = document.createElement('td');
      const controls = document.createElement('div');
      controls.className = 'report-status-controls';

      const badge = createStatusBadge(report.status);
      statusCell.appendChild(badge);

      const statusSelect = document.createElement('select');
      statusSelect.setAttribute(
        'aria-label',
        `Choose status for report ${report.report_id}`
      );

      const statuses = [
        'pending',
        'reviewed',
        'resolved',
        'dismissed'
      ];

      statuses.forEach(status => {
        const option = document.createElement('option');
        option.value = status;
        option.textContent = capitalize(status);
        option.selected = status === report.status;
        statusSelect.appendChild(option);
      });

      const saveBtn = document.createElement('button');
      saveBtn.type = 'button';
      saveBtn.textContent = 'Save status';
      saveBtn.className = 'btn-gold';

      saveBtn.addEventListener('click', async () => {
        if (statusSelect.value === report.status) {
          showMessage(
            `Report #${report.report_id} already has the status "${capitalize(report.status)}". No changes were needed.`,
            'loading'
          );
          return;
        }

        await updateReportStatus(
          report.report_id,
          statusSelect.value,
          saveBtn
        );
      });

      controls.append(statusSelect, saveBtn);
      statusCell.appendChild(controls);
      row.appendChild(statusCell);

      reportsList.appendChild(row);
    });

    const countMessage =
      `${data.length} report${data.length === 1 ? '' : 's'} found.`;

    showMessage(
      successMessage ? `${successMessage} ${countMessage}` : countMessage,
      successMessage ? 'success' : 'loading'
    );
  } catch (err) {
    if (requestId !== activeRequest) return;

    console.error('Load review reports error:', err);

    showMessage(
      'Could not connect to the server. Check that your backend is running, then try again.',
      'error'
    );
  } finally {
    if (requestId === activeRequest) {
      refreshBtn.disabled = false;
    }
  }
}

function addCell(row, value) {
  const cell = document.createElement('td');
  cell.textContent = value;
  row.appendChild(cell);
}

function createStatusBadge(status) {
  const badge = document.createElement('span');
  const allowedStatuses = [
    'pending',
    'reviewed',
    'resolved',
    'dismissed'
  ];

  const safeStatus = allowedStatuses.includes(status)
    ? status
    : 'pending';

  badge.className =
    `report-status-badge report-status-${safeStatus}`;

  badge.textContent = capitalize(
    allowedStatuses.includes(status) ? status : 'unknown'
  );

  return badge;
}

function capitalize(value) {
  if (!value) return 'Unknown';

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatReason(reason) {
  const labels = {
    inappropriate: 'Inappropriate content',
    spam: 'Spam',
    offensive: 'Offensive content',
    fake_or_misleading: 'Fake or misleading',
    other: 'Other'
  };

  return labels[reason] || reason || 'Not specified';
}

function formatDate(value) {
  if (!value) return '—';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Invalid date';
  }

  return date.toLocaleString();
}

async function updateReportStatus(reportId, newStatus, button) {
  const originalText = button.textContent;

  button.disabled = true;
  button.textContent = 'Saving...';

  showMessage(`Saving the status for report #${reportId}...`, 'loading');

  try {
    const res = await fetch(
      `${API_URL}/admin/review-reports/${reportId}/status`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      }
    );

    const data = await res.json();

    if (!res.ok) {
      showMessage(
        data.error || `Could not update report #${reportId}. Please try again.`,
        'error'
      );
      return;
    }

    const successMessage =
      `Success! Report #${reportId} was updated to "${capitalize(newStatus)}".`;

    // Reload the selected filter but retain the success message.
    await loadReviewReports(successMessage);
  } catch (err) {
    console.error('Update report status error:', err);

    showMessage(
      `Could not connect to the server while updating report #${reportId}. Your change may not have been saved. Refresh the reports to verify.`,
      'error'
    );
  } finally {
    button.disabled = false;
    button.textContent = originalText;
  }
}