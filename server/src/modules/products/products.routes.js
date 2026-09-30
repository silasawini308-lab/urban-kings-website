const express = require('express');
const router = express.Router();
const requireAuth = require('../../middleware/requireAuth');
const requireRole = require('../../middleware/requireRole');
const controller = require('./products.controller');

// Public: anyone can browse
router.get('/', controller.listProducts);
router.get('/:id', controller.getProduct);

// Protected: only managers and admins can change products
router.post('/', requireAuth, requireRole('manager', 'admin'), controller.addProduct);
router.put('/:id', requireAuth, requireRole('manager', 'admin'), controller.editProduct);
router.delete('/:id', requireAuth, requireRole('manager', 'admin'), controller.removeProduct);

module.exports = router;