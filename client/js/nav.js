function updateNavForAuth() {
  const navLoginSlot = document.getElementById('nav-auth');
  if (!navLoginSlot) return;

  const token = localStorage.getItem('token');
  if (token) {
    navLoginSlot.textContent = 'Logout';
    navLoginSlot.href = '#';
    navLoginSlot.onclick = (e) => {
      e.preventDefault();
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      window.location.href = 'index.html';
    };
  } else {
    navLoginSlot.textContent = 'Login';
    navLoginSlot.href = 'login.html';
  }
}

updateNavForAuth();