const express = require('express');
const router = express.Router({ mergeParams: true });
const requireAuth = require('../../middleware/requireAuth');
const controller = require('./reviews.controller');

router.get('/', controller.listReviews);
router.post('/', requireAuth, controller.submitReview);
router.delete('/', requireAuth, controller.removeReview);

router.post(
  '/:reviewId/helpful',
  requireAuth,
  controller.addHelpfulVote
);

router.delete(
  '/:reviewId/helpful',
  requireAuth,
  controller.removeHelpfulVote
);

router.post(
  '/:reviewId/report',
  requireAuth,
  controller.createReviewReport
);

module.exports = router;