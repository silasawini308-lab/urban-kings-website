const API_URL = 'http://localhost:5000/api';

function renderCartPage() {
  const container = document.getElementById('cart-items');
  const summary = document.getElementById('cart-summary');
  const cart = getCart();

  container.replaceChildren();

  if (cart.length === 0) {
    container.textContent = 'Your cart is empty.';
    summary.replaceChildren();
    return;
  }

  cart.forEach(item => {
    const row = document.createElement('div');
    row.className = 'cart-row';

    const img = document.createElement('img');
    img.className = 'cart-item-image';
    if (item.image_url && item.image_url.startsWith('https://')) img.src = item.image_url;
    img.onerror = function () { this.onerror = null; this.removeAttribute('src'); };

    const name = document.createElement('p');
    name.className = 'cart-item-name';
    name.textContent = item.name;

    const qty = document.createElement('input');
    qty.type = 'number';
    qty.min = '1';
    qty.value = item.quantity;
    qty.className = 'cart-qty-input';
    qty.addEventListener('change', () => {
      updateQuantity(item.productId, Number(qty.value));
      renderCartPage();
    });

    const price = document.createElement('p');
    price.className = 'cart-item-price';
    price.textContent = 'GH₵ ' + (item.price * item.quantity).toFixed(2);

    const removeBtn = document.createElement('button');
    removeBtn.className = 'cart-remove-btn';
    removeBtn.textContent = 'Remove';
    removeBtn.addEventListener('click', () => {
      removeFromCart(item.productId);
      renderCartPage();
    });

    row.append(img, name, qty, price, removeBtn);
    container.appendChild(row);
  });

  const total = getCartTotal(cart);

  const totalP = document.createElement('p');
  totalP.className = 'cart-total';
  totalP.textContent = 'Total: GH₵ ' + total.toFixed(2);

  const regionInput = document.createElement('input');
  regionInput.id = 'delivery-region';
  regionInput.placeholder = 'Delivery region (e.g. Accra)';

  const addressInput = document.createElement('input');
  addressInput.id = 'delivery-address';
  addressInput.placeholder = 'Delivery address';

  const checkoutBtn = document.createElement('button');
  checkoutBtn.className = 'btn-gold';
  checkoutBtn.textContent = 'Checkout';
  checkoutBtn.addEventListener('click', handleCheckout);

  const checkoutMsg = document.createElement('p');
  checkoutMsg.id = 'checkout-msg';
  checkoutMsg.className = 'auth-error';

  summary.replaceChildren(totalP, regionInput, addressInput, checkoutBtn, checkoutMsg);
}

async function handleCheckout() {
  const token = localStorage.getItem('token');
  const msg = document.getElementById('checkout-msg');

  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  const cart = getCart();
  const region = document.getElementById('delivery-region').value.trim();
  const address = document.getElementById('delivery-address').value.trim();

  if (!region || !address) {
    msg.textContent = 'Please enter a delivery region and address.';
    return;
  }

  try {
    const res = await fetch(`${API_URL}/orders/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        items: cart.map(item => ({ productId: item.productId, quantity: item.quantity })),
        deliveryRegion: region,
        deliveryAddress: address
      })
    });
    const data = await res.json();

    if (!res.ok) {
      msg.textContent = data.error || 'Checkout failed.';
      return;
    }

    const paymentRes = await fetch(`${API_URL}/payments/initialize`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  body: JSON.stringify({ orderId: data.order.id })
});
const paymentData = await paymentRes.json();

if (!paymentRes.ok) {
  msg.textContent = paymentData.error || 'Could not start payment.';
  return;
}

localStorage.removeItem('cart');
window.location.href = paymentData.authorization_url;
  } catch (err) {
    msg.textContent = 'Could not reach the server.';
  }
}

renderCartPage();