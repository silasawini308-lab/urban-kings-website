const pool = require('../../config/db');

async function getAllProducts({ category, search, sort = 'recommended', minPrice, maxPrice, inStock = false, limit = 20, offset = 0 } = {}) {
  let orderBy = 'p.created_at DESC';
  if (sort === 'newest') {
    orderBy = 'p.created_at DESC';
  }
  if (sort === 'price-low') {
    orderBy = 'p.price ASC';
  }
  if (sort === 'price-high') {
    orderBy = 'p.price DESC';
  }

  const conditions = [];
  const values = [];
  let idx = 1;

  if (category) {
  conditions.push(`LOWER(p.category) = LOWER($${idx++})`);
  values.push(category.trim());
}
  if (search) {
    conditions.push(`(p.name ILIKE $${idx} OR p.description ILIKE $${idx})`);
    values.push(`%${search}%`);
    idx++;
  }
  if (minPrice !== undefined && minPrice !== '') {
  conditions.push(`p.price >= $${idx++}`);
  values.push(minPrice);
}

  if (maxPrice !== undefined && maxPrice !== '') {
  conditions.push(`p.price <= $${idx++}`);
  values.push(maxPrice);
}

  if (inStock === true) {
  conditions.push(`p.stock > 0`);
}

  const whereClause = conditions.length? `WHERE ${conditions.join(' AND ')}` : '';

  // Count total
  const countResult = await pool.query(
    `SELECT COUNT(*) FROM products p ${whereClause}`,
    values
  );
  const total = Number(countResult.rows[0].count);

  // Get products - NO reviews join
  const dataValues = [...values, Number(limit), Number(offset)];
  const limitParam = `$${values.length + 1}`;
  const offsetParam = `$${values.length + 2}`;

  const dataResult = await pool.query(
  `SELECT
      p.*,
      COALESCE(ROUND(AVG(r.rating), 1), 0) AS avg_rating,
      COUNT(r.id)::int AS review_count
   FROM products p
   LEFT JOIN reviews r ON r.product_id = p.id
   ${whereClause}
   GROUP BY p.id
   ORDER BY ${orderBy}
   LIMIT ${limitParam} OFFSET ${offsetParam}`,
  dataValues
);

  return { products: dataResult.rows, total };
}

async function getProductById(id) {
  const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
  return result.rows[0];
}

async function createProduct(data) {
  const { name, price, description, category, image_url, stock } = data;
  const result = await pool.query(
    `INSERT INTO products (name, price, description, category, image_url, stock) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [name, price, description, category, image_url, stock]
  );
  return result.rows[0];
}

async function updateProduct(id, data) {
  const { name, price, description, category, image_url, stock } = data;
  const result = await pool.query(
    `UPDATE products SET name=$1, price=$2, description=$3, category=$4, image_url=$5, stock=$6 WHERE id=$7 RETURNING *`,
    [name, price, description, category, image_url, stock, id]
  );
  return result.rows[0];
}

async function deleteProduct(id) {
  await pool.query('DELETE FROM products WHERE id = $1', [id]);
  return true;
}

module.exports = { getAllProducts, getProductById, createProduct, updateProduct, deleteProduct };