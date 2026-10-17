const model = require('./reviews.model');

async function listReviews(req, res) {
  try {
    const userId = req.user ? req.user.id : null;

    const reviews = await model.getReviewsForProduct(
      req.params.productId,
      userId
    );

    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: 'Something went wrong.'
    });
  }
}

async function submitReview(req, res) {
  try {
    const { rating, comment } = req.body;
    const ratingNum = Number(rating);

    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ error: 'Rating must be a whole number from 1 to 5.' });
    }
    if (comment && comment.length > 500) {
      return res.status(400).json({ error: 'Comment is too long (max 500 characters).' });
    }

    const purchase = await model.findPurchase(req.user.id, req.params.productId);
    if (!purchase) {
      return res.status(403).json({ error: 'You can only review products you have purchased.' });
    }

    const review = await model.upsertReview(req.params.productId, req.user.id, ratingNum, comment || null, purchase.id);
    res.status(201).json(review);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
}

async function removeReview(req, res) {
  try {
    const deleted = await model.deleteReview(req.params.productId, req.user.id);
    if (!deleted) return res.status(404).json({ error: 'Review not found.' });
    res.json({ message: 'Review deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
}

async function addHelpfulVote(req, res) {
  try {
    const reviewId = Number(req.params.reviewId);

    if (!Number.isInteger(reviewId)) {
      return res.status(400).json({
        error: 'Invalid review ID.'
      });
    }

    const vote = await model.addHelpfulVote(
      reviewId,
      req.user.id
    );

    res.status(201).json({
      message: 'Review marked as helpful.',
      vote
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Something went wrong.'
    });
  }
}

async function removeHelpfulVote(req, res) {
  try {
    const reviewId = Number(req.params.reviewId);

    if (!Number.isInteger(reviewId)) {
      return res.status(400).json({
        error: 'Invalid review ID.'
      });
    }

    await model.removeHelpfulVote(
      reviewId,
      req.user.id
    );

    res.json({
      message: 'Helpful vote removed.'
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Something went wrong.'
    });
  }
}

async function createReviewReport(req, res) {
  try {
    const reviewId = Number(req.params.reviewId);
    const userId = req.user.id;

    const { reason, details } = req.body;

    if (!Number.isInteger(reviewId)) {
      return res.status(400).json({
        error: 'Invalid review ID.'
      });
    }

    const allowedReasons = [
      'inappropriate',
      'spam',
      'offensive',
      'fake_or_misleading',
      'other'
    ];

    if (!allowedReasons.includes(reason)) {
      return res.status(400).json({
        error: 'Invalid report reason.'
      });
    }

    const cleanDetails =
      typeof details === 'string'
        ? details.trim()
        : '';

    if (cleanDetails.length > 1000) {
      return res.status(400).json({
        error: 'Report details cannot exceed 1000 characters.'
      });
    }

    const report = await model.createReviewReport(
      reviewId,
      userId,
      reason,
      cleanDetails
    );

    res.status(201).json({
      message: 'Review reported successfully.',
      report
    });

  } catch (err) {
    console.error('Create review report error:', err);

    if (err.code === '23505') {
      return res.status(409).json({
        error: 'You have already reported this review.'
      });
    }

    res.status(500).json({
      error: 'Something went wrong.'
    });
  }
}

async function listReviewReports(req, res) {
  try {
    const status = req.query.status === undefined
      ? 'pending'
      : req.query.status;

    const allowedStatuses = [
      'pending',
      'reviewed',
      'resolved',
      'dismissed'
    ];

    if (
      status !== 'all' &&
      !allowedStatuses.includes(status)
    ) {
      return res.status(400).json({
        error: 'Invalid report status.'
      });
    }

    const reports = await model.getReviewReports(
      status === 'all' ? null : status
    );

    res.json(reports);
  } catch (err) {
    console.error('List review reports error:', err);

    res.status(500).json({
      error: 'Could not retrieve review reports.'
    });
  }
}

async function updateReviewReportStatus(req, res) {
  try {
    const reportId = Number(req.params.reportId);
    const { status } = req.body;

    if (!Number.isInteger(reportId) || reportId <= 0) {
      return res.status(400).json({
        error: 'Invalid report ID.'
      });
    }

    const allowedStatuses = [
      'pending',
      'reviewed',
      'resolved',
      'dismissed'
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        error: 'Invalid report status.'
      });
    }

    const report = await model.updateReviewReportStatus(
      reportId,
      status,
      req.user.id
    );

    if (!report) {
      return res.status(404).json({
        error: 'Report not found.'
      });
    }

    return res.json({
      message: 'Report status updated successfully.',
      report
    });
  } catch (err) {
    console.error('Update review report status error:', err);

    return res.status(500).json({
      error: 'Could not update report status.'
    });
  }
}

module.exports = { listReviews, submitReview, removeReview, addHelpfulVote, removeHelpfulVote, createReviewReport, listReviewReports, updateReviewReportStatus };