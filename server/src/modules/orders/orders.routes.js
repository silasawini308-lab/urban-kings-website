const express = require('express');
const router = express.Router();
const requireAuth = require('../../middleware/requireAuth');
const requireRole = require('../../middleware/requireRole');
const controller = require('./orders.controller');

router.post('/checkout', requireAuth, controller.checkout);
router.get('/my-orders', requireAuth, controller.myOrders);

router.get('/all', requireAuth, requireRole('manager', 'admin'), controller.listAllOrders);
router.put('/:id/status', requireAuth, requireRole('manager', 'admin'), controller.changeOrderStatus);
module.exports = router;