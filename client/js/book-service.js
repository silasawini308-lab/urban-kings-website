const API_URL = 'http://localhost:5000/api';
const token = localStorage.getItem('token');

const specialtyButtons = document.querySelectorAll('.filter-btn');
const workerGrid = document.getElementById('worker-grid');
const workerStatus = document.getElementById('worker-status');
const bookingPanel = document.getElementById('booking-panel');
const bookingWorkerName = document.getElementById('booking-worker-name');
const locationButtons = document.querySelectorAll('.loc-btn');
const addressInput = document.getElementById('booking-address');
const datetimeInput = document.getElementById('booking-datetime');
const bookingMsg = document.getElementById('booking-msg');
const confirmBtn = document.getElementById('confirm-booking-btn');

let selectedWorkerId = null;
let selectedLocation = 'in_shop';
let currentSpecialty = 'barbering';

async function loadWorkers(specialty) {
  workerStatus.textContent = 'Loading...';
  workerGrid.replaceChildren();
  bookingPanel.style.display = 'none';

  try {
    const res = await fetch(`${API_URL}/workers/specialty/${specialty}`);
    const workers = await res.json();

    if (workers.length === 0) {
      workerStatus.textContent = 'No workers available for this service yet.';
      return;
    }
    workerStatus.textContent = '';

    workers.forEach(worker => {
      const card = document.createElement('article');
      card.className = 'card';

      const img = document.createElement('img');
      img.className = 'card-image';
      img.alt = worker.full_name;
      if (worker.photo_url && worker.photo_url.startsWith('https://')) img.src = worker.photo_url;
      img.onerror = function () { this.onerror = null; this.removeAttribute('src'); };

      const body = document.createElement('div');
      body.className = 'card-body';

      const name = document.createElement('h3');
      name.className = 'card-name';
      name.textContent = worker.full_name;

      const bio = document.createElement('p');
      bio.className = 'card-stock';
      bio.textContent = worker.bio || '';

      const hours = document.createElement('p');
      hours.className = 'card-stock';
      hours.textContent = `Available ${worker.work_start_hour}:00 – ${worker.work_end_hour}:00`;

      const selectBtn = document.createElement('button');
      selectBtn.className = 'btn-add-cart';
      selectBtn.textContent = 'Select this worker';
      selectBtn.addEventListener('click', () => selectWorker(worker));

      body.append(name, bio, hours, selectBtn);
      card.appendChild(body);
      workerGrid.appendChild(card);
    });
  } catch (err) {
    workerStatus.textContent = 'Could not load workers.';
  }
}

function selectWorker(worker) {
  selectedWorkerId = worker.user_id;
  bookingWorkerName.textContent = `Booking with ${worker.full_name}`;
  bookingPanel.style.display = 'block';
  bookingMsg.textContent = '';
  bookingPanel.scrollIntoView({ behavior: 'smooth' });
}

specialtyButtons.forEach(button => {
  button.addEventListener('click', () => {
    specialtyButtons.forEach(b => b.classList.remove('active'));
    button.classList.add('active');
    currentSpecialty = button.dataset.specialty;
    loadWorkers(currentSpecialty);
  });
});

locationButtons.forEach(button => {
  button.addEventListener('click', () => {
    locationButtons.forEach(b => b.classList.remove('active'));
    button.classList.add('active');
    selectedLocation = button.dataset.location;
    addressInput.style.display = selectedLocation === 'home' ? 'block' : 'none';
  });
});

confirmBtn.addEventListener('click', async () => {
  bookingMsg.style.color = '';
  bookingMsg.textContent = '';

  if (!token) {
    window.location.href = 'login.html';
    return;
  }
  if (!datetimeInput.value) {
    bookingMsg.textContent = 'Please choose a date and time.';
    return;
  }
  if (selectedLocation === 'home' && !addressInput.value.trim()) {
    bookingMsg.textContent = 'Please enter your home address.';
    return;
  }

  try {
    const res = await fetch(`${API_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        workerId: selectedWorkerId,
        serviceType: currentSpecialty,
        locationType: selectedLocation,
        address: addressInput.value.trim(),
        scheduledAt: datetimeInput.value
      })
    });
    const data = await res.json();

    if (!res.ok) {
      bookingMsg.textContent = data.error || 'Could not create booking.';
      return;
    }

    bookingMsg.style.color = 'green';
    bookingMsg.textContent = 'Booking confirmed! You can view it under My Bookings.';
  } catch (err) {
    bookingMsg.textContent = 'Could not reach the server.';
  }
});

loadWorkers(currentSpecialty);