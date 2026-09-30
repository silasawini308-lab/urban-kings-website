const pool = require('../../config/db');

async function getAllProducts(category) {
  if (category) {
    const result = await pool.query(
      'SELECT * FROM products WHERE category = $1 ORDER BY created_at DESC',
      [category]
    );
    return result.rows;
  }
  const result = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
  return result.rows;
}

async function getProductById(id) {
  const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
  return result.rows[0];
}

async function createProduct({ name, description, category, price, stock, imageUrl }, userId) {
  const result = await pool.query(
    `INSERT INTO products (name, description, category, price, stock, image_url, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [name, description, category, price, stock, imageUrl, userId]
  );
  return result.rows[0];
}

async function updateProduct(id, { name, description, category, price, stock, imageUrl }) {
  const result = await pool.query(
    `UPDATE products
     SET name = $1, description = $2, category = $3, price = $4, stock = $5, image_url = $6
     WHERE id = $7
     RETURNING *`,
    [name, description, category, price, stock, imageUrl, id]
  );
  return result.rows[0];
}

async function deleteProduct(id) {
  const result = await pool.query(
    'DELETE FROM products WHERE id = $1 RETURNING id',
    [id]
  );
  return result.rows[0];
}

module.exports = { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct };