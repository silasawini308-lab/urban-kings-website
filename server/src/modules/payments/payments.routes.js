const express = require('express');
const router = express.Router();
const requireAuth = require('../../middleware/requireAuth');
const controller = require('./payments.controller');

router.post('/initialize', requireAuth, controller.initializePayment);
router.get('/verify/:reference', requireAuth, controller.verifyPayment);

module.exports = router;