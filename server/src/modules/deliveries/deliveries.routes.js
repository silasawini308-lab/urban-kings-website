const express = require('express');
const router = express.Router();
const requireAuth = require('../../middleware/requireAuth');
const requireRole = require('../../middleware/requireRole');
const controller = require('./deliveries.controller');

router.post('/', requireAuth, requireRole('manager', 'admin'), controller.assignDelivery);
router.get('/riders', requireAuth, requireRole('manager', 'admin'), controller.listRiders);
router.get('/my-deliveries', requireAuth, controller.myDeliveries);
router.put('/:id/status', requireAuth, controller.changeStatus);

module.exports = router;