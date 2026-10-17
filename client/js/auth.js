const API_URL = 'http://localhost:5000/api';

const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const errorMsg = document.getElementById('auth-error');

if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.textContent = '';

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (!res.ok) {
        errorMsg.textContent = data.error || 'Login failed.';
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.user.role);
      window.location.href = 'index.html';
    } catch (err) {
      errorMsg.textContent = 'Could not reach the server.';
    }
  });
}

if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.textContent = '';

    const fullName = document.getElementById('fullName').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    try {
      const res = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password })
      });
      const data = await res.json();

      if (!res.ok) {
        errorMsg.textContent = data.error || 'Signup failed.';
        return;
      }

      window.location.href = 'login.html';
    } catch (err) {
      errorMsg.textContent = 'Could not reach the server.';
    }
  });
}