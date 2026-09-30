const API_URL = 'http://localhost:5000/api';
const grid = document.getElementById('product-grid');
const statusEl = document.getElementById('status');
const filters = document.querySelectorAll('.filter-btn');

async function loadProducts(category) {
  if (!category) category = 'all';
  var url = API_URL + '/products';
  if (category !== 'all') url += '?category=' + category;
  const res = await fetch(url);
  const products = await res.json();
  statusEl.textContent = products.length + ' pieces found';
  grid.innerHTML = '';
  products.forEach(function(p) {
    var img = '<img class="card-image" src="' + p.image_url + '" alt="' + p.name + '" style="height:280px;width:100%;object-fit:cover" onerror="this.src=\'https://via.placeholder.com/300?text=No+Image\'">';
    grid.innerHTML += '<div class="card">' + img + '<div class="card-body"><div class="card-category">' + p.category + '</div><h3 class="card-name">' + p.name + '</h3><div class="card-price">GH₵ ' + p.price + '</div><div class="card-stock">' + p.stock + ' in stock</div></div></div>';
  });
}

filters.forEach(function(btn) {
  btn.addEventListener('click', function() {
    filters.forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    loadProducts(btn.dataset.category);
  });
});

loadProducts();