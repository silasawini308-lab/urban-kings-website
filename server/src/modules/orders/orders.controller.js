const pool = require('../../config/db');
const { createOrder, getOrdersForUser, getAllOrders, updateOrderStatus } = require('./orders.model');

async function checkout(req, res) {
  try {
    const { items, deliveryRegion, deliveryAddress } = req.body;
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
// Validate the cart before querying products or creating an order.
if (!Array.isArray(items) || items.length === 0) {
  return res.status(400).json({ error: 'Cart is empty.' });
}

// Reject invalid product IDs and quantities.
for (const item of items) {
  if (
    !item ||
    !Number.isSafeInteger(Number(item.productId)) ||
    Number(item.productId) <= 0 ||
    !Number.isSafeInteger(item.quantity) ||
    item.quantity <= 0
  ) {
    return res.status(400).json({
      error: 'Each cart item must have a valid product ID and a positive whole-number quantity.'
    });
  }
}

// Prevent the same product from appearing multiple times in the cart.
const productIds = items.map(item => Number(item.productId));

if (new Set(productIds).size !== productIds.length) {
  return res.status(400).json({
    error: 'A product appears more than once in your cart. Please update your cart and try again.'
  });
}

    // Never trust prices sent by the browser — look up the real price and stock here.
    let total = 0;
    const verifiedItems = [];
    for (const item of items) {
      const result = await pool.query('SELECT * FROM products WHERE id = $1', [item.productId]);
      const product = result.rows[0];
      if (!product) return res.status(400).json({ error: `Product ${item.productId} not found.` });
      if (product.stock < item.quantity) {
        return res.status(400).json({ error:` Not enough stock for ${product.name}.` });
      }
      total += Number(product.price) * item.quantity;
      verifiedItems.push({ productId: product.id, quantity: item.quantity, price: product.price });
    }

    const order = await createOrder(req.user.id, verifiedItems, total, deliveryRegion, deliveryAddress);

    res.status(201).json({ message: 'Order placed.', order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
}

async function myOrders(req, res) {
  try {
    res.json(await getOrdersForUser(req.user.id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
}
const VALID_STATUSES = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];

async function listAllOrders(req, res) {
  try {
    const orders = await getAllOrders();
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
}

async function changeOrderStatus(req, res) {
  try {
    const { status } = req.body;
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }
    const order = await updateOrderStatus(req.params.id, status);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
}

module.exports = { checkout, myOrders, listAllOrders, changeOrderStatus };