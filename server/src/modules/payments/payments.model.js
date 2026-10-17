const pool = require('../../config/db');

async function createPayment(orderId, method, reference, amount) {
  const result = await pool.query(
    `INSERT INTO payments
      (order_id, method, provider_reference, amount, status)
     VALUES ($1, $2, $3, $4, 'pending')
     RETURNING *`,
    [orderId, method, reference, amount]
  );

  return result.rows[0];
}

async function updatePaymentStatus(reference, status) {
  const result = await pool.query(
    `UPDATE payments
     SET status = $1
     WHERE provider_reference = $2
     RETURNING *`,
    [status, reference]
  );

  return result.rows[0];
}

async function getOrderById(orderId, userId) {
  const result = await pool.query(
    `SELECT *
     FROM orders
     WHERE id = $1 AND user_id = $2`,
    [orderId, userId]
  );

  return result.rows[0];
}

/**
 * Process a payment that has already been verified with Paystack.
 *
 * This function must only be called after the controller has verified:
 * - Paystack transaction status
 * - Transaction reference
 * - Amount
 * - Currency
 */
async function processVerifiedPayment(reference) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Lock the payment record so concurrent requests cannot
    // process the same payment simultaneously.
    const paymentResult = await client.query(
      `SELECT *
       FROM payments
       WHERE provider_reference = $1
       FOR UPDATE`,
      [reference]
    );

    const payment = paymentResult.rows[0];

    if (!payment) {
      throw new Error('PAYMENT_NOT_FOUND');
    }

    // Lock the corresponding order.
    const orderResult = await client.query(
      `SELECT *
       FROM orders
       WHERE id = $1
       FOR UPDATE`,
      [payment.order_id]
    );

    const order = orderResult.rows[0];

    if (!order) {
      throw new Error('ORDER_NOT_FOUND');
    }

    // An already-successful payment must never deduct stock again.
    if (payment.status === 'successful') {
      if (order.status === 'pending') {
        throw new Error('ORDER_PAYMENT_STATE_INCONSISTENT');
      }

      await client.query('COMMIT');

      return {
        alreadyProcessed: true,
        payment,
        order
      };
    }

    // Do not process a new payment against an order that has
    // already moved beyond the pending state.
    if (order.status !== 'pending') {
      throw new Error('ORDER_NOT_PENDING');
    }

    // Retrieve the order items and lock their product rows.
    const itemsResult = await client.query(
      `SELECT
         oi.product_id,
         oi.quantity,
         p.name,
         p.stock
       FROM order_items oi
       JOIN products p ON p.id = oi.product_id
       WHERE oi.order_id = $1
       ORDER BY p.id
       FOR UPDATE OF p`,
      [order.id]
    );

    const items = itemsResult.rows;

    if (items.length === 0) {
      throw new Error('ORDER_HAS_NO_ITEMS');
    }

    // Verify that sufficient stock remains for every item.
    for (const item of items) {
      if (
        !Number.isInteger(Number(item.quantity)) ||
        Number(item.quantity) <= 0
      ) {
        throw new Error('INVALID_ORDER_QUANTITY');
      }

      if (Number(item.stock) < Number(item.quantity)) {
        throw new Error(`INSUFFICIENT_STOCK:${item.name}`);
      }
    }

    // Deduct stock only after all items pass validation.
    for (const item of items) {
      await client.query(
        `UPDATE products
         SET stock = stock - $1
         WHERE id = $2`,
        [item.quantity, item.product_id]
      );
    }

    // Mark the payment and order as successful/paid.
    const updatedPaymentResult = await client.query(
      `UPDATE payments
       SET status = 'successful'
       WHERE id = $1
       RETURNING *`,
      [payment.id]
    );

    const updatedOrderResult = await client.query(
      `UPDATE orders
       SET status = 'paid'
       WHERE id = $1
       RETURNING *`,
      [order.id]
    );

    await client.query('COMMIT');

    return {
      alreadyProcessed: false,
      payment: updatedPaymentResult.rows[0],
      order: updatedOrderResult.rows[0]
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function markOrderPaid(orderId) {
  await pool.query(
    `UPDATE orders
     SET status = 'paid'
     WHERE id = $1`,
    [orderId]
  );
}

module.exports = {
  createPayment,
  updatePaymentStatus,
  getOrderById,
  markOrderPaid,
  processVerifiedPayment
};