const express = require('express');
const router = express.Router();
const requireAuth = require('../../middleware/requireAuth');
const requireRole = require('../../middleware/requireRole');
const controller = require('./workers.controller');

router.post('/', requireAuth, requireRole('admin'), controller.addWorker);
router.get('/', requireAuth, requireRole('manager', 'admin'), controller.listAll);
router.get('/specialty/:specialty', controller.listBySpecialty);
router.get('/:id', controller.getOne);

module.exports = router;