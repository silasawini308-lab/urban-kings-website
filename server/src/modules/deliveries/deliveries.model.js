const pool = require('../../config/db');

async function createDelivery(orderId, riderId, region, fee) {
  const result = await pool.query(
    `INSERT INTO deliveries (order_id, rider_id, region, delivery_fee)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [orderId, riderId, region, fee]
  );
  return result.rows[0];
}

async function getDeliveriesForRider(riderId) {
  const result = await pool.query(
    `SELECT d.*, o.delivery_address, o.total_amount, u.full_name AS customer_name
     FROM deliveries d
     JOIN orders o ON o.id = d.order_id
     JOIN users u ON u.id = o.user_id
     WHERE d.rider_id = $1
     ORDER BY d.created_at DESC`,
    [riderId]
  );
  return result.rows;
}

async function updateDeliveryStatus(deliveryId, status, riderId) {
  const result = await pool.query(
    `UPDATE deliveries SET status = $1 WHERE id = $2 AND rider_id = $3 RETURNING *`,
    [status, deliveryId, riderId]
  );
  return result.rows[0];
}

async function getAllRiders() {
  const result = await pool.query(`SELECT id, full_name, email FROM users WHERE role = 'rider'`);
  return result.rows;
}

module.exports = { createDelivery, getDeliveriesForRider, updateDeliveryStatus, getAllRiders };