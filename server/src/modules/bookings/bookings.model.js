const pool = require('../../config/db');

async function createBooking({ customerId, workerId, serviceType, locationType, address, scheduledAt }) {
  const result = await pool.query(
    `INSERT INTO bookings (customer_id, worker_id, service_type, location_type, address, scheduled_at)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [customerId, workerId, serviceType, locationType, address, scheduledAt]
  );
  return result.rows[0];
}

async function getWorkerBookingsOnDate(workerId, dateStart, dateEnd) {
  const result = await pool.query(
    `SELECT scheduled_at FROM bookings
     WHERE worker_id = $1 AND scheduled_at BETWEEN $2 AND $3
     AND status != 'cancelled'`,
    [workerId, dateStart, dateEnd]
  );
  return result.rows;
}

async function getBookingsForWorker(workerId) {
  const result = await pool.query(
    `SELECT b.*, u.full_name AS customer_name, u.email AS customer_email
     FROM bookings b
     JOIN users u ON u.id = b.customer_id
     WHERE b.worker_id = $1
     ORDER BY b.scheduled_at`,
    [workerId]
  );
  return result.rows;
}

async function getBookingsForCustomer(customerId) {
  const result = await pool.query(
    `SELECT b.*, u.full_name AS worker_name
     FROM bookings b
     JOIN workers w ON w.user_id = b.worker_id
     JOIN users u ON u.id = w.user_id
     WHERE b.customer_id = $1
     ORDER BY b.scheduled_at DESC`,
    [customerId]
  );
  return result.rows;
}

async function updateBookingStatus(bookingId, status, workerId) {
  const result = await pool.query(
    `UPDATE bookings SET status = $1 WHERE id = $2 AND worker_id = $3 RETURNING *`,
    [status, bookingId, workerId]
  );
  return result.rows[0];
}

module.exports = {
  createBooking,
  getWorkerBookingsOnDate,
  getBookingsForWorker,
  getBookingsForCustomer,
  updateBookingStatus
};