const API_URL = 'http://localhost:5000/api';
const token = localStorage.getItem('token');
const role = localStorage.getItem('role');

const statusMsg = document.getElementById('rider-status');
const deliveriesList = document.getElementById('deliveries-list');

if (!token || role !== 'rider') {
  window.location.href = 'index.html';
}

const STATUS_OPTIONS = ['assigned', 'picked_up', 'en_route', 'delivered'];

async function loadDeliveries() {
  statusMsg.textContent = 'Loading...';
  deliveriesList.replaceChildren();

  try {
    const res = await fetch(`${API_URL}/deliveries/my-deliveries`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const deliveries = await res.json();

    if (!res.ok) {
      statusMsg.textContent = deliveries.error || 'Could not load deliveries.';
      return;
    }
    if (deliveries.length === 0) {
      statusMsg.textContent = 'No deliveries assigned yet.';
      return;
    }
    statusMsg.textContent = '';

    deliveries.forEach(delivery => {
      const row = document.createElement('tr');

      const orderCell = document.createElement('td');
      orderCell.textContent = '#' + delivery.order_id;

      const customerCell = document.createElement('td');
      customerCell.textContent = delivery.customer_name;

      const addressCell = document.createElement('td');
      addressCell.textContent = delivery.delivery_address || '—';

      const regionCell = document.createElement('td');
      regionCell.textContent = delivery.region;

      const feeCell = document.createElement('td');
      feeCell.textContent = 'GH₵ ' + Number(delivery.delivery_fee).toFixed(2);

      const statusCell = document.createElement('td');
      const select = document.createElement('select');
      STATUS_OPTIONS.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt;
        if (opt === delivery.status) option.selected = true;
        select.appendChild(option);
      });
      select.addEventListener('change', () => updateStatus(delivery.id, select.value));
      statusCell.appendChild(select);

      row.append(orderCell, customerCell, addressCell, regionCell, feeCell, statusCell);
      deliveriesList.appendChild(row);
    });
  } catch (err) {
    statusMsg.textContent = 'Could not reach the server.';
  }
}

async function updateStatus(deliveryId, newStatus) {
  try {
    const res = await fetch(`${API_URL}/deliveries/${deliveryId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: newStatus })
    });
    const data = await res.json();

    if (!res.ok) {
      statusMsg.textContent = data.error || 'Could not update status.';
      return;
    }
    statusMsg.textContent = `Delivery updated to "${newStatus}".`;
  } catch (err) {
    statusMsg.textContent = 'Could not reach the server.';
  }
}

loadDeliveries();