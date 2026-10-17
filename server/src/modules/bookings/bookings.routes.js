const express = require('express');
const router = express.Router();
const requireAuth = require('../../middleware/requireAuth');
const controller = require('./bookings.controller');

router.post('/', requireAuth, controller.createNewBooking);
router.get('/my-bookings', requireAuth, controller.myBookingsAsCustomer);
router.get('/worker-bookings', requireAuth, controller.myBookingsAsWorker);
router.put('/:id/status', requireAuth, controller.changeStatus);

module.exports = router;