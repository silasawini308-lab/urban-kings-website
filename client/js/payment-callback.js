const API_URL = 'http://localhost:5000/api';

async function checkPayment() {
  const params = new URLSearchParams(window.location.search);
  const reference = params.get('reference') || params.get('trxref');

  const title = document.getElementById('status-title');
  const message = document.getElementById('status-message');

  const token = localStorage.getItem('token');

  if (!reference) {
    title.textContent = 'Payment reference missing';
    message.textContent =
      'We could not find your payment reference. Please check your order.';
    return;
  }

  if (!token) {
    title.textContent = 'Please log in';
    message.textContent =
      'We could not verify your payment because your login session was not found. Log in and check your order status before trying to pay again.';
    return;
  }

  title.textContent = 'Verifying your payment...';
  message.textContent = 'Please wait while we confirm your transaction securely.';

  try {
    const res = await fetch(
      `${API_URL}/payments/verify/${encodeURIComponent(reference)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    const data = await res.json();

    if (!res.ok) {
      console.error('Payment verification failed:', res.status, data);

      title.textContent = 'Payment verification incomplete';
      message.textContent =
        data.error ||
        'We could not confirm your payment. Please check your order before trying to pay again.';
      return;
    }

    if (data.success) {
      title.textContent = 'Payment successful';
      message.textContent =
        'Thank you! Your payment has been verified and your order confirmed.';
    } else {
      title.textContent = 'Payment not confirmed';
      message.textContent =
        data.message ||
        'We could not confirm a successful payment. Please check your order status before trying again.';
    }
  } catch (err) {
    console.error('Payment verification request failed:', err);

    title.textContent = 'Unable to verify payment';
    message.textContent =
      'We could not reach the payment verification service. Your payment status is not yet confirmed. Please check your order before making another payment.';
  }
}

checkPayment();