const API_URL = 'http://localhost:5000/api';
const token = localStorage.getItem('token');
const role = localStorage.getItem('role');

const statusMsg = document.getElementById('admin-status');
const form = document.getElementById('product-form');
const tableBody = document.getElementById('admin-product-list');
const submitBtn = document.getElementById('form-submit-btn');
const cancelBtn = document.getElementById('cancel-edit-btn');

// Guard: only managers/admins may see this page at all.
if (!token || (role !== 'manager' && role !== 'admin')) {
  window.location.href = 'index.html';
}

async function loadAdminProducts() {
  statusMsg.textContent = 'Loading...';
  tableBody.replaceChildren();

  try {
    const res = await fetch(`${API_URL}/products?limit=50`);
    const data = await res.json();

    if (data.products.length === 0) {
      statusMsg.textContent = 'No products yet.';
      return;
    }
    statusMsg.textContent = '';

    data.products.forEach(product => {
      const row = document.createElement('tr');

      const nameCell = document.createElement('td');
      nameCell.textContent = product.name;

      const categoryCell = document.createElement('td');
      categoryCell.textContent = product.category;

      const priceCell = document.createElement('td');
      priceCell.textContent = 'GH₵ ' + Number(product.price).toFixed(2);

      const stockCell = document.createElement('td');
      stockCell.textContent = product.stock;

      const actionsCell = document.createElement('td');

      const editBtn = document.createElement('button');
      editBtn.textContent = 'Edit';
      editBtn.className = 'admin-edit-btn';
      editBtn.addEventListener('click', () => fillFormForEdit(product));

      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Delete';
      deleteBtn.className = 'admin-delete-btn';
      deleteBtn.addEventListener('click', () => deleteProduct(product.id));

      actionsCell.append(editBtn, deleteBtn);
      row.append(nameCell, categoryCell, priceCell, stockCell, actionsCell);
      tableBody.appendChild(row);
    });
  } catch (err) {
    statusMsg.textContent = 'Could not load products.';
  }
}

function fillFormForEdit(product) {
  document.getElementById('product-id').value = product.id;
  document.getElementById('p-name').value = product.name;
  document.getElementById('p-category').value = product.category;
  document.getElementById('p-description').value = product.description || '';
  document.getElementById('p-price').value = product.price;
  document.getElementById('p-stock').value = product.stock;
  document.getElementById('p-image').value = product.image_url || '';
  submitBtn.textContent = 'Save changes';
  cancelBtn.style.display = 'inline-block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetForm() {
  form.reset();
  document.getElementById('product-id').value = '';
  submitBtn.textContent = 'Add product';
  cancelBtn.style.display = 'none';
}

cancelBtn.addEventListener('click', resetForm);

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = document.getElementById('product-id').value;
  const body = {
    name: document.getElementById('p-name').value.trim(),
    category: document.getElementById('p-category').value,
    description: document.getElementById('p-description').value.trim(),
    price: Number(document.getElementById('p-price').value),
    stock: Number(document.getElementById('p-stock').value),
    imageUrl: document.getElementById('p-image').value.trim()
  };

  const url = id ? `${API_URL}/products/${id}` : `${API_URL}/products`;
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body)
    });
    const data = await res.json();

    if (!res.ok) {
      statusMsg.textContent = data.error || 'Could not save product.';
      return;
    }

    statusMsg.textContent = id ? 'Product updated.' : 'Product added.';
    resetForm();
    loadAdminProducts();
  } catch (err) {
    statusMsg.textContent = 'Could not reach the server.';
  }
});

async function deleteProduct(id) {
  if (!confirm('Delete this product? This cannot be undone.')) return;

  try {
    const res = await fetch(`${API_URL}/products/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();

    if (!res.ok) {
      statusMsg.textContent = data.error || 'Could not delete product.';
      return;
    }
    loadAdminProducts();
  } catch (err) {
    statusMsg.textContent = 'Could not reach the server.';
  }
}

loadAdminProducts();