const model = require('./products.model');

const ALLOWED_CATEGORIES = [
  'clothing', 'watches', 'bags', 'shoes', 'belts',
  'socks', 'spectacles', 'skincare', 'fragrance', 'hair'
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
    const products = await model.getAllProducts(req.query.category);
    res.json(products);
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