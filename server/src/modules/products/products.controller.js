const model = require('./products.model');

const ALLOWED_CATEGORIES = [
  'clothing', 'watches', 'bags', 'shoes', 'belts',
  'socks', 'spectacles', 'skincare', 'fragrance', 'hair'
];
const ALLOWED_SORTS = [
  'recommended',
  'newest',
  'price-low',
  'price-high'
];

function validateProduct(body) {
  const { name, category, price, stock } = body;
  if (!name || !category || price === undefined || stock === undefined) {
    return 'Name, category, price and stock are required.';
  }
  if (!ALLOWED_CATEGORIES.includes(category)) {
    return 'Invalid category.';
  }
  if (isNaN(price) || Number(price) < 0) {
    return 'Price must be a number that is zero or more.';
  }
  if (!Number.isInteger(Number(stock)) || Number(stock) < 0) {
    return 'Stock must be a whole number that is zero or more.';
  }
  return null;
}

async function listProducts(req, res) {
  try {
    const {
  category,
  search,
  sort,
  minPrice,
  maxPrice,
  inStock
} = req.query;

if (sort && !ALLOWED_SORTS.includes(sort)) {
  return res.status(400).json({
    error: 'Invalid sort option.'
  });
}

const parsedMinPrice =
  minPrice !== undefined && minPrice !== ''
    ? Number(minPrice)
    : undefined;

const parsedMaxPrice =
  maxPrice !== undefined && maxPrice !== ''
    ? Number(maxPrice)
    : undefined;

if (
  parsedMinPrice !== undefined &&
  (!Number.isFinite(parsedMinPrice) || parsedMinPrice < 0)
) {
  return res.status(400).json({
    error: 'Minimum price must be a valid number that is zero or more.'
  });
}

if (
  parsedMaxPrice !== undefined &&
  (!Number.isFinite(parsedMaxPrice) || parsedMaxPrice < 0)
) {
  return res.status(400).json({
    error: 'Maximum price must be a valid number that is zero or more.'
  });
}

if (
  parsedMinPrice !== undefined &&
  parsedMaxPrice !== undefined &&
  parsedMinPrice > parsedMaxPrice
) {
  return res.status(400).json({
    error: 'Minimum price cannot be greater than maximum price.'
  });
}

/* Convert the query-string value into a real boolean */
let parsedInStock = false;

if (inStock !== undefined) {
  if (inStock !== 'true' && inStock !== 'false') {
    return res.status(400).json({
      error: 'Invalid in-stock filter.'
    });
  }

  parsedInStock = inStock === 'true';
}

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const { products, total } = await model.getAllProducts({ category, search, sort, minPrice: parsedMinPrice, maxPrice: parsedMaxPrice, inStock: parsedInStock, limit, offset });

    res.json({
      products,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
}

async function getProduct(req, res) {
  try {
    const product = await model.getProductById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found.' });
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
}

async function addProduct(req, res) {
  try {
    const problem = validateProduct(req.body);
    if (problem) return res.status(400).json({ error: problem });

    const product = await model.createProduct(req.body, req.user.id);
    res.status(201).json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
}

async function editProduct(req, res) {
  try {
    const problem = validateProduct(req.body);
    if (problem) return res.status(400).json({ error: problem });

    const product = await model.updateProduct(req.params.id, req.body);
    if (!product) return res.status(404).json({ error: 'Product not found.' });
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
}

async function removeProduct(req, res) {
  try {
    const deleted = await model.deleteProduct(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Product not found.' });
    res.json({ message: 'Product deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
}

module.exports = { listProducts, getProduct, addProduct, editProduct, removeProduct };