const axios = require('axios');
const pool = require('../../config/db');
const model = require('./payments.model');
const ordersModel = require('../orders/orders.model');

const PAYSTACK_BASE = 'https://api.paystack.co';

async function initializePayment(req, res) {
  try {
    const { orderId } = req.body;
    if (!orderId) return res.status(400).json({ error: 'orderId is required.' });

    const order = await model.getOrderById(orderId, req.user.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });
    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'This order has already been paid or cancelled.' });
    }

    const userResult = await pool.query('SELECT email FROM users WHERE id = $1', [req.user.id]);
    const email = userResult.rows[0].email;
    const amountInPesewas = Math.round(Number(order.total_amount) * 100);

    const paystackRes = await axios.post(
      `${PAYSTACK_BASE}/transaction/initialize`,
      {
        email,
        amount: amountInPesewas,
        currency: 'GHS',
        callback_url: `${process.env.CLIENT_URL}/payment-callback.html`,
        metadata: { orderId: order.id }
      },
      { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } }
    );

    const { authorization_url, reference } = paystackRes.data.data;
    await model.createPayment(order.id, 'paystack', reference, order.total_amount);

    res.json({ authorization_url, reference });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'Could not start payment.' });
  }
}

async function verifyPayment(req, res) {
  try {
    const { reference } = req.params;

    if (
      typeof reference !== 'string' ||
      reference.length === 0 ||
      reference.length > 150
    ) {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment reference.'
      });
    }

    // Ask Paystack to verify the transaction.
    const paystackRes = await axios.get(
      `${PAYSTACK_BASE}/transaction/verify/${encodeURIComponent(reference)}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`
        }
      }
    );

    const data = paystackRes.data?.data;

    if (!data) {
      return res.status(502).json({
        success: false,
        error: 'Paystack returned an invalid verification response.'
      });
    }

    // Find the payment record associated with this reference.
    const paymentResult = await pool.query(
      `SELECT *
       FROM payments
       WHERE provider_reference = $1`,
      [reference]
    );

    const payment = paymentResult.rows[0];

if (!payment) {
  return res.status(404).json({
    success: false,
    error: 'No payment record was found for this reference.'
  });
}

// Confirm that the logged-in customer owns this order.
const orderResult = await pool.query(
  `SELECT id, user_id
   FROM orders
   WHERE id = $1`,
  [payment.order_id]
);

const order = orderResult.rows[0];

if (!order) {
  return res.status(404).json({
    success: false,
    error: 'The associated order was not found.'
  });
}

if (Number(order.user_id) !== Number(req.user.id)) {
  return res.status(403).json({
    success: false,
    error: 'You are not authorized to verify this payment.'
  });
}

    // A reference must match the transaction Paystack verified.
    if (data.reference !== reference) {
      return res.status(400).json({
        success: false,
        error: 'The verified transaction reference does not match.'
      });
    }

    // Do not accept unsuccessful transactions.
    if (data.status !== 'success') {
      return res.status(400).json({
        success: false,
        message: 'Payment has not been confirmed as successful.'
      });
    }

    // Paystack reports amounts in the smallest currency unit:
    // pesewas for Ghanaian cedi transactions.
    const storedAmount = Number(payment.amount);

if (
  !Number.isFinite(storedAmount) ||
  storedAmount <= 0 ||
  !Number.isSafeInteger(Math.round(storedAmount * 100))
) {
  return res.status(400).json({
    success: false,
    error: 'The stored payment amount is invalid.'
  });
}

const expectedAmount = Math.round(storedAmount * 100);

    if (
      !Number.isSafeInteger(expectedAmount) ||
      Number(data.amount) !== expectedAmount
    ) {
      console.error('Payment amount mismatch:', {
        reference,
        expectedAmount,
        receivedAmount: data.amount
      });

      return res.status(400).json({
        success: false,
        error: 'The verified payment amount does not match the order payment.'
      });
    }

    if (data.currency !== 'GHS') {
      return res.status(400).json({
        success: false,
        error: 'The payment currency does not match GHS.'
      });
    }

    // Process the verified payment atomically.
    // This function prevents duplicate stock deductions.
    const result = await model.processVerifiedPayment(reference);

    return res.json({
      success: true,
      message: result.alreadyProcessed
        ? 'Payment was already verified.'
        : 'Payment verified successfully.',
      alreadyProcessed: result.alreadyProcessed
    });
  } catch (err) {
    console.error(
      'Payment verification error:',
      err.response?.data || err.message
    );

    if (err.message === 'PAYMENT_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        error: 'Payment record not found.'
      });
    }

    if (err.message === 'ORDER_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        error: 'The associated order was not found.'
      });
    }

    if (
      err.message === 'ORDER_NOT_PENDING' ||
      err.message === 'ORDER_PAYMENT_STATE_INCONSISTENT'
    ) {
      return res.status(409).json({
        success: false,
        error: 'The order status is inconsistent with this payment.'
      });
    }

    if (
      err.message === 'ORDER_HAS_NO_ITEMS' ||
      err.message === 'INVALID_ORDER_QUANTITY' ||
      String(err.message || '').startsWith('INSUFFICIENT_STOCK:')
    ) {
      return res.status(409).json({
        success: false,
        error: err.message.startsWith('INSUFFICIENT_STOCK:')
          ? `Insufficient stock for ${err.message.split(':')[1]}. Please contact support.`
          : 'The order cannot be processed because its items or quantities are invalid.'
      });
    }

    return res.status(500).json({
      success: false,
      error: 'Could not verify and process the payment.'
    });
  }
}

module.exports = { initializePayment, verifyPayment };