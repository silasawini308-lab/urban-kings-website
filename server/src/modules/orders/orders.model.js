const pool = require('../../config/db');

async function createOrder(userId, items, totalAmount, deliveryRegion, deliveryAddress) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const orderResult = await client.query(
      `INSERT INTO orders (user_id, total_amount, delivery_region, delivery_address)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, totalAmount, deliveryRegion, deliveryAddress]
    );

    const order = orderResult.rows[0];

    for (const item of items) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
         VALUES ($1, $2, $3, $4)`,
        [order.id, item.productId, item.quantity, item.price]
      );
    }

    await client.query('COMMIT');

    return order;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function getOrdersForUser(userId) {
  const result = await pool.query(
    `SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC`,
    [userId]
  );
  return result.rows;
}
async function getOrderItems(orderId) {
  const result = await pool.query(`SELECT * FROM order_items WHERE order_id = $1`, [orderId]);
  return result.rows;
}
async function getAllOrders() {
  const result = await pool.query(
    `SELECT o.*, u.full_name, u.email
     FROM orders o
     JOIN users u ON u.id = o.user_id
     ORDER BY o.created_at DESC`
  );
  return result.rows;
}

async function updateOrderStatus(orderId, status) {
  const result = await pool.query(
    `UPDATE orders SET status = $1 WHERE id = $2 RETURNING *`,
    [status, orderId]
  );
  return result.rows[0];
}

module.exports = { createOrder, getOrdersForUser, getOrderItems, getAllOrders, updateOrderStatus };