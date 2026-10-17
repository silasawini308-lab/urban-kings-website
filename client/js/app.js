const API_URL = 'http://localhost:5000/api';

const grid = document.getElementById('product-grid');
const statusMsg = document.getElementById('status');
const categoryButtons = document.querySelectorAll('.category-item');
const searchInput = document.getElementById('search-input');
const paginationEl = document.getElementById('pagination');
const sortSelect = document.getElementById('sort-select');

const filterToggle = document.getElementById('filter-toggle');
const filterPanel = document.getElementById('filter-panel');
const filterClose = document.getElementById('filter-close');
const filterApply = document.getElementById('filter-apply');
const filterClear = document.getElementById('filter-clear');

const filterCategory = document.getElementById('filter-category');
const filterMinPrice = document.getElementById('filter-min-price');
const filterMaxPrice = document.getElementById('filter-max-price');
const filterInStock = document.getElementById('filter-in-stock');

let currentCategory = '';
let currentSearch = '';
let currentPage = 1;
let currentSort = 'recommended';

let currentMinPrice = '';
let currentMaxPrice = '';
let currentInStock = false;


function renderStars(avgRating, reviewCount) {
  const count = Number(reviewCount) || 0;
  const rating = Number(avgRating) || 0;

  const rounded = Math.max(0, Math.min(5, Math.round(rating)));

  const wrap = document.createElement('div');
  wrap.className = 'card-rating';

  const stars = document.createElement('span');
  stars.className = 'stars';

  if (count === 0) {
    stars.textContent = '☆☆☆☆☆';
  } else {
    stars.textContent =
      '★'.repeat(rounded) +
      '☆'.repeat(5 - rounded);
  }

  const countText = document.createElement('span');
  countText.className = 'review-count';

  if (count === 0) {
    countText.textContent = 'No reviews yet';
  } else {
    countText.textContent = `(${count})`;
  }

  wrap.append(stars, countText);

  return wrap;
}


function createCard(product) {
  const card = document.createElement('article');
  card.className = 'card';

  // Product image
  const imageWrap = document.createElement('div');
  imageWrap.className = 'card-image-wrap';

  const productLink = document.createElement('a');
  productLink.href = `product.html?id=${product.id}`;
  productLink.className = 'product-card-link';
  productLink.setAttribute('aria-label', `View ${product.name}`);

  const img = document.createElement('img');
  img.className = 'card-image';
  img.alt = product.name;
  img.loading = 'lazy';
  img.decoding = 'async';

  const placeholder = document.createElement('div');
  placeholder.className = 'card-image-placeholder';
  placeholder.textContent = 'URBAN KINGS & QUEENS';
  placeholder.setAttribute(
    'aria-label',
    `${product.name} image unavailable`
  );

  // Start with the placeholder visible.
  img.hidden = true;
  placeholder.hidden = false;

  const imageUrl =
    typeof product.image_url === 'string'
      ? product.image_url.trim()
      : '';

  if (/^https?:\/\//i.test(imageUrl)) {
    img.addEventListener('load', () => {
      img.hidden = false;
      placeholder.hidden = true;
    }, { once: true });

    img.addEventListener('error', () => {
      img.hidden = true;
      placeholder.hidden = false;
    }, { once: true });

    img.src = imageUrl;
  }

  productLink.append(img, placeholder);
  imageWrap.appendChild(productLink);
  card.appendChild(imageWrap);

  // Product information
  const body = document.createElement('div');
  body.className = 'card-body';

  const category = document.createElement('p');
  category.className = 'card-category';
  category.textContent = product.category;

  const name = document.createElement('h3');
name.className = 'card-name';

const nameLink = document.createElement('a');
nameLink.href = `product.html?id=${product.id}`;
nameLink.className = 'product-card-link';
nameLink.textContent = product.name;

name.appendChild(nameLink);

  const price = document.createElement('p');
  price.className = 'card-price';
  price.textContent = 'GH₵ ' + Number(product.price).toFixed(2);


  // Stock status
  const stock = document.createElement('p');
  stock.className = 'card-stock';

  if (product.stock === 0) {
    stock.textContent = 'Out of stock';
    stock.classList.add('out-of-stock');
  } else if (product.stock <= 5) {
    stock.textContent = `Only ${product.stock} left`;
    stock.classList.add('low-stock');
  } else {
    stock.textContent = 'In stock';
    stock.classList.add('in-stock');
  }


  // Add to cart button
  const addBtn = document.createElement('button');
  addBtn.className = 'btn-add-cart';
  addBtn.textContent = 'Add to cart';

  addBtn.addEventListener('click', () => {
    addToCart(product);
  });


  // Put everything inside the card
  body.append(
    category,
    name,
    price,
    renderStars(product.avg_rating, product.review_count),
    stock,
    addBtn
  );

  card.appendChild(body);

  return card;
}


function renderPagination(pagination) {
  paginationEl.replaceChildren();

  if (pagination.totalPages <= 1) {
    return;
  }

  for (let i = 1; i <= pagination.totalPages; i++) {
    const btn = document.createElement('button');

    btn.textContent = i;
    btn.className = 'page-btn' +
      (i === pagination.page ? ' active' : '');

    btn.addEventListener('click', () => {
      currentPage = i;
      loadProducts();
    });

    paginationEl.appendChild(btn);
  }
}


async function loadProducts() {
  statusMsg.textContent = 'Loading...';
  grid.replaceChildren();

  const params = new
  URLSearchParams({
    page: currentPage,
    limit: 20,
    sort: currentSort
  });

  if (currentCategory) {
    params.set('category', currentCategory);
  }

  if (currentSearch) {
    params.set('search', currentSearch);
  }

  if (currentMinPrice) {
    params.set('minPrice', currentMinPrice);
  }
   if (currentMaxPrice) {
    params.set('maxPrice', currentMaxPrice);
   }
   if (currentInStock) {
    params.set('inStock', 'true');
   }


  try {
    const response = await fetch(
      `${API_URL}/products?${params}`
    );

    if (!response.ok) {
      throw new Error('Request failed');
    }

    const data = await response.json();


    if (data.products.length === 0) {
      statusMsg.textContent = 'No products found.';
      paginationEl.replaceChildren();
      return;
    }


    statusMsg.textContent =
      `${data.pagination.total} pieces found`;

    data.products.forEach(product => {
      grid.appendChild(createCard(product));
    });

    renderPagination(data.pagination);

  } catch (error) {
    console.error('Product loading error:', error);

    statusMsg.textContent =
      'Could not load products. Please try again.';
  }
}


// Category buttons
categoryButtons.forEach(button => {

  button.addEventListener('click', () => {

    categoryButtons.forEach(b => {
      b.classList.remove('active');
    });

    button.classList.add('active');

    currentCategory = button.dataset.category;
    filterCategory.value = currentCategory;

    currentPage = 1;

    loadProducts();
  });

});


// Search
let debounceTimer;

searchInput.addEventListener('input', () => {

  clearTimeout(debounceTimer);

  debounceTimer = setTimeout(() => {

    currentSearch = searchInput.value.trim();

    currentPage = 1;

    loadProducts();

  }, 300);

});

sortSelect.addEventListener('change', () => {
  currentSort = sortSelect.value;
  currentPage = 1;
  loadProducts();
});

filterToggle.addEventListener('click', () => {
  filterPanel.classList.toggle('open');
});

filterClose.addEventListener('click', () => {
  filterPanel.classList.remove('open');
});

filterClear.addEventListener('click', () => {
  filterCategory.value = '';
  filterMinPrice.value = '';
  filterMaxPrice.value = '';
  filterInStock.checked = false;

  currentCategory = '';
  currentMinPrice = '';
  currentMaxPrice = '';
  currentInStock = false;

  currentPage = 1;

  categoryButtons.forEach(button => {
    button.classList.remove('active');
  });

  const allCategoryButton = document.querySelector(
    '.category-item[data-category=""]'
  );

  if (allCategoryButton) {
    allCategoryButton.classList.add('active');
  }

  loadProducts();
});

filterApply.addEventListener('click', () => {
  currentMinPrice = filterMinPrice.value.trim();
  currentMaxPrice = filterMaxPrice.value.trim();
  currentInStock = filterInStock.checked;

  currentCategory = filterCategory.value;

  categoryButtons.forEach(button => {
    button.classList.toggle(
      'active',
      button.dataset.category ===
      currentCategory
    );
  });

  currentPage = 1;

  filterPanel.classList.remove('open');

  loadProducts();
});

// Initial product loading
loadProducts();