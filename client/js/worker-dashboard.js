const API_URL = 'http://localhost:5000/api';
const token = localStorage.getItem('token');
const role = localStorage.getItem('role');

const statusMsg = document.getElementById('worker-status');
const bookingsList = document.getElementById('bookings-list');

if (!token || role !== 'worker') {
  window.location.href = 'index.html';
}

const STATUS_OPTIONS = ['requested', 'confirmed', 'in_progress', 'completed', 'cancelled'];

async function loadBookings() {
  statusMsg.textContent = 'Loading...';
  bookingsList.replaceChildren();

  try {
    const res = await fetch(`${API_URL}/bookings/worker-bookings`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const bookings = await res.json();

    if (!res.ok) {
      statusMsg.textContent = bookings.error || 'Could not load bookings.';
      return;
    }
    if (bookings.length === 0) {
      statusMsg.textContent = 'No bookings yet.';
      return;
    }
    statusMsg.textContent = '';

    bookings.forEach(booking => {
      const row = document.createElement('tr');

      const customerCell = document.createElement('td');
      customerCell.textContent = `${booking.customer_name} (${booking.customer_email})`;

      const serviceCell = document.createElement('td');
      serviceCell.textContent = booking.service_type;

      const locationCell = document.createElement('td');
      locationCell.textContent = booking.location_type === 'home'
        ? `Home: ${booking.address}`
        : 'In shop';

      const dateCell = document.createElement('td');
      dateCell.textContent = new Date(booking.scheduled_at).toLocaleString();

      const statusCell = document.createElement('td');
      const select = document.createElement('select');
      STATUS_OPTIONS.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt;
        if (opt === booking.status) option.selected = true;
        select.appendChild(option);
      });
      select.addEventListener('change', () => updateStatus(booking.id, select.value));
      statusCell.appendChild(select);

      row.append(customerCell, serviceCell, locationCell, dateCell, statusCell);
      bookingsList.appendChild(row);
    });
  } catch (err) {
    statusMsg.textContent = 'Could not reach the server.';
  }
}

async function updateStatus(bookingId, newStatus) {
  try {
    const res = await fetch(`${API_URL}/bookings/${bookingId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: newStatus })
    });
    const data = await res.json();

    if (!res.ok) {
      statusMsg.textContent = data.error || 'Could not update status.';
      return;
    }
    statusMsg.textContent =` Booking updated to "${newStatus}".`;
  } catch (err) {
    statusMsg.textContent = 'Could not reach the server.';
  }
}

loadBookings();