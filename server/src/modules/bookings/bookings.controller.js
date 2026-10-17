const pool = require('../../config/db');
const model = require('./bookings.model');

async function createNewBooking(req, res) {
  try {
    const { workerId, serviceType, locationType, address, scheduledAt } = req.body;

    if (!workerId || !serviceType || !locationType || !scheduledAt) {
      return res.status(400).json({ error: 'Missing required booking details.' });
    }
    if (!['in_shop', 'home'].includes(locationType)) {
      return res.status(400).json({ error: 'Invalid location type.' });
    }
    if (locationType === 'home' && !address) {
      return res.status(400).json({ error: 'Address is required for home service.' });
    }

    const workerResult = await pool.query(
      `SELECT * FROM workers WHERE user_id = $1`,
      [workerId]
    );
    const worker = workerResult.rows[0];
    if (!worker) return res.status(404).json({ error: 'Worker not found.' });

    const requestedTime = new Date(scheduledAt);
    const now = new Date();
    if (requestedTime <= now) {
      return res.status(400).json({ error: 'Booking time must be in the future.' });
    }

    const hour = requestedTime.getHours();
    if (hour < worker.work_start_hour || hour >= worker.work_end_hour) {
      return res.status(400).json({ error: `This worker is only available between ${worker.work_start_hour}:00 and ${worker.work_end_hour}:00.` });
    }

    const dayStart = new Date(requestedTime);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(requestedTime);
    dayEnd.setHours(23, 59, 59, 999);

    const existingBookings = await model.getWorkerBookingsOnDate(workerId, dayStart, dayEnd);
    const conflict = existingBookings.some(b => {
      const existingTime = new Date(b.scheduled_at).getTime();
      return Math.abs(existingTime - requestedTime.getTime()) < 60 * 60 * 1000;
    });
    if (conflict) {
      return res.status(409).json({ error: 'This time slot is already booked. Please choose another time.' });
    }

    const booking = await model.createBooking({
      customerId: req.user.id,
      workerId,
      serviceType,
      locationType,
      address: locationType === 'home' ? address : null,
      scheduledAt: requestedTime
    });

    res.status(201).json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
}

async function myBookingsAsWorker(req, res) {
  try {
    res.json(await model.getBookingsForWorker(req.user.id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
}

async function myBookingsAsCustomer(req, res) {
  try {
    res.json(await model.getBookingsForCustomer(req.user.id));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
}

async function changeStatus(req, res) {
  try {
    const { status } = req.body;
    const allowed = ['confirmed', 'in_progress', 'completed', 'cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }
    const booking = await model.updateBookingStatus(req.params.id, status, req.user.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found or not yours to update.' });
    res.json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
}

module.exports = { createNewBooking, myBookingsAsWorker, myBookingsAsCustomer, changeStatus };