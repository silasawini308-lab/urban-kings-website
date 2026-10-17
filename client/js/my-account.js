const API_URL = 'http://localhost:5000/api';
const token = localStorage.getItem('token');

const ordersStatus = document.getElementById('orders-status');
const ordersList = document.getElementById('orders-list');
const bookingsStatus = document.getElementById('bookings-status');
const bookingsList = document.getElementById('bookings-list');

if (!token) {
  window.location.href = 'login.html';
}

async function loadMyOrders() {
  ordersStatus.textContent = 'Loading...';
  ordersList.replaceChildren();

  try {
    const res = await fetch(`${API_URL}/orders/my-orders`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const orders = await res.json();

    if (!res.ok) {
      ordersStatus.textContent = orders.error || 'Could not load orders.';
      return;
    }
    if (orders.length === 0) {
      ordersStatus.textContent = 'You have no orders yet.';
      return;
    }
    ordersStatus.textContent = '';

    orders.forEach(order => {
      const row = document.createElement('tr');

      const idCell = document.createElement('td');
      idCell.textContent = '#' + order.id;

      const totalCell = document.createElement('td');
      totalCell.textContent = 'GH₵ ' + Number(order.total_amount).toFixed(2);

      const deliveryCell = document.createElement('td');
      deliveryCell.textContent = `${order.delivery_region || '—'}, ${order.delivery_address || '—'}`;

      const statusCell = document.createElement('td');
      statusCell.textContent = order.status;

      const dateCell = document.createElement('td');
      dateCell.textContent = new Date(order.created_at).toLocaleDateString();

      row.append(idCell, totalCell, deliveryCell, statusCell, dateCell);
      ordersList.appendChild(row);
    });
  } catch (err) {
    ordersStatus.textContent = 'Could not reach the server.';
  }
}

async function loadMyBookings() {
  bookingsStatus.textContent = 'Loading...';
  bookingsList.replaceChildren();

  try {
    const res = await fetch(`${API_URL}/bookings/my-bookings`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const bookings = await res.json();

    if (!res.ok) {
      bookingsStatus.textContent = bookings.error || 'Could not load bookings.';
      return;
    }
    if (bookings.length === 0) {
      bookingsStatus.textContent = 'You have no bookings yet.';
      return;
    }
    bookingsStatus.textContent = '';

    bookings.forEach(booking => {
      const row = document.createElement('tr');

      const workerCell = document.createElement('td');
      workerCell.textContent = booking.worker_name;

      const serviceCell = document.createElement('td');
      serviceCell.textContent = booking.service_type;

      const locationCell = document.createElement('td');
      locationCell.textContent = booking.location_type === 'home'
        ? `Home: ${booking.address}`
        : 'In shop';

      const dateCell = document.createElement('td');
      dateCell.textContent = new Date(booking.scheduled_at).toLocaleString();

      const statusCell = document.createElement('td');
      statusCell.textContent = booking.status;

      row.append(workerCell, serviceCell, locationCell, dateCell, statusCell);
      bookingsList.appendChild(row);
    });
  } catch (err) {
    bookingsStatus.textContent = 'Could not reach the server.';
  }
}

loadMyOrders();
loadMyBookings();