const API_URL = 'http://localhost:5000/api';
const token = localStorage.getItem('token');
const role = localStorage.getItem('role');

const statusMsg = document.getElementById('admin-status');
const ordersList = document.getElementById('orders-list');

if (!token || (role !== 'manager' && role !== 'admin')) {
  window.location.href = 'index.html';
}

const STATUS_OPTIONS = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];

async function loadOrders() {
  statusMsg.textContent = 'Loading...';
  ordersList.replaceChildren();

  try {
    const res = await fetch(`${API_URL}/orders/all`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const orders = await res.json();

    if (!res.ok) {
      statusMsg.textContent = orders.error || 'Could not load orders.';
      return;
    }
    if (orders.length === 0) {
      statusMsg.textContent = 'No orders yet.';
      return;
    }
    statusMsg.textContent = '';

    orders.forEach(order => {
      const row = document.createElement('tr');

      const idCell = document.createElement('td');
      idCell.textContent = '#' + order.id;

      const customerCell = document.createElement('td');
      customerCell.textContent = `${order.full_name} (${order.email})`;

      const totalCell = document.createElement('td');
      totalCell.textContent = 'GH₵ ' + Number(order.total_amount).toFixed(2);

      const deliveryCell = document.createElement('td');
      deliveryCell.textContent = `${order.delivery_region || '—'}, ${order.delivery_address || '—'}`;

      const statusCell = document.createElement('td');
      const select = document.createElement('select');
      STATUS_OPTIONS.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt;
        if (opt === order.status) option.selected = true;
        select.appendChild(option);
      });
      select.addEventListener('change', () => updateStatus(order.id, select.value));
      statusCell.appendChild(select);

      const dateCell = document.createElement('td');
      dateCell.textContent = new Date(order.created_at).toLocaleDateString();

      row.append(idCell, customerCell, totalCell, deliveryCell, statusCell, dateCell);
      ordersList.appendChild(row);
    });
  } catch (err) {
    statusMsg.textContent = 'Could not reach the server.';
  }
}

async function updateStatus(orderId, newStatus) {
  try {
    const res = await fetch(`${API_URL}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: newStatus })
    });
    const data = await res.json();

    if (!res.ok) {
      statusMsg.textContent = data.error || 'Could not update status.';
      return;
    }
    statusMsg.textContent = `Order #${orderId} updated to "${newStatus}".`;
  } catch (err) {
    statusMsg.textContent = 'Could not reach the server.';
  }
}

loadOrders();