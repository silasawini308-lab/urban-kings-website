const express = require('express');
const router = express.Router();

const requireAuth = require('../../middleware/requireAuth');
const requireRole = require('../../middleware/requireRole');
const controller = require('./reviews.controller');

// List reports — administrators only.
router.get(
  '/',
  requireAuth,
  requireRole('admin'),
  controller.listReviewReports
);

// Update report status — administrators only.
router.put(
  '/:reportId/status',
  requireAuth,
  requireRole('admin'),
  controller.updateReviewReportStatus
);

module.exports = router;