const pool = require('../../config/db');

async function getReviewsForProduct(productId, userId = null) {
  const result = await pool.query(
    `SELECT
       r.id,
       r.rating,
       r.comment,
       r.created_at,
       u.full_name,

       COUNT(hv.id)::integer AS helpful_count,

       CASE
         WHEN $2::integer IS NOT NULL
          AND EXISTS (
            SELECT 1
            FROM review_helpful_votes user_vote
            WHERE user_vote.review_id = r.id
              AND user_vote.user_id = $2
          )
         THEN true
         ELSE false
       END AS user_found_helpful

     FROM reviews r

     JOIN users u
       ON u.id = r.user_id

     LEFT JOIN review_helpful_votes hv
       ON hv.review_id = r.id

     WHERE r.product_id = $1

     GROUP BY
       r.id,
       r.rating,
       r.comment,
       r.created_at,
       u.full_name

     ORDER BY r.created_at DESC`,
    [productId, userId]
  );

  return result.rows;
}

async function upsertReview(productId, userId, rating, comment, orderItemId) {
  const result = await pool.query(
    `INSERT INTO reviews (product_id, user_id, rating, comment, order_item_id)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (product_id, user_id)
     DO UPDATE SET rating = $3, comment = $4, order_item_id = $5, created_at = NOW()
     RETURNING *`,
    [productId, userId, rating, comment, orderItemId]
  );
  return result.rows[0];
}

async function deleteReview(productId, userId) {
  const result = await pool.query(
   `DELETE FROM reviews WHERE product_id = $1 AND user_id = $2 RETURNING id`,
    [productId, userId]
  );
  return result.rows[0];
}

async function findPurchase(userId, productId) {
  const result = await pool.query(
    `SELECT oi.id FROM order_items oi
     JOIN orders o ON o.id = oi.order_id
     WHERE o.user_id = $1 AND oi.product_id = $2
     AND o.status IN ('paid', 'shipped', 'delivered')
     LIMIT 1`,
    [userId, productId]
  );
  return result.rows[0];
}

async function addHelpfulVote(reviewId, userId) {
  const result = await pool.query(
    `INSERT INTO review_helpful_votes (review_id, user_id)
     VALUES ($1, $2)
     ON CONFLICT (review_id, user_id)
     DO NOTHING
     RETURNING id`,
    [reviewId, userId]
  );

  return result.rows[0];
}

async function removeHelpfulVote(reviewId, userId) {
  const result = await pool.query(
    `DELETE FROM review_helpful_votes
     WHERE review_id = $1
       AND user_id = $2
     RETURNING id`,
    [reviewId, userId]
  );

  return result.rows[0];
}

async function createReviewReport(
  reviewId,
  userId,
  reason,
  details
) {
  const result = await pool.query(
    `INSERT INTO review_reports (
       review_id,
       user_id,
       reason,
       details
     )
     VALUES ($1, $2, $3, $4)
     RETURNING id, review_id, user_id, reason, details, status, created_at`,
    [
      reviewId,
      userId,
      reason,
      details || null
    ]
  );

  return result.rows[0];
}

async function getReviewReports(status = 'pending') {
  const result = await pool.query(
    `SELECT
       rr.id AS report_id,
       rr.review_id,
       rr.user_id AS reporter_id,
       reporter.full_name AS reporter_name,
       rr.reason,
       rr.details,
       rr.status,
       rr.created_at AS reported_at,
       rr.reviewed_at,
       rr.reviewed_by,

       r.rating AS review_rating,
       r.comment AS review_comment,
       r.created_at AS review_created_at,
       reviewer.full_name AS reviewer_name,

       p.name AS product_name

     FROM review_reports rr

     JOIN reviews r
       ON r.id = rr.review_id

     JOIN users reporter
       ON reporter.id = rr.user_id

     JOIN users reviewer
       ON reviewer.id = r.user_id

     JOIN products p
       ON p.id = r.product_id

     WHERE ($1::varchar IS NULL OR rr.status = $1)

     ORDER BY rr.created_at DESC`,
    [status]
  );

  return result.rows;
}

async function updateReviewReportStatus(
  reportId,
  status,
  adminId
) {
  const result = await pool.query(
    `UPDATE review_reports
     SET status = $2,
         reviewed_at = NOW(),
         reviewed_by = $3
     WHERE id = $1
     RETURNING id, review_id, reason, details, status,
               created_at, reviewed_at, reviewed_by`,
    [reportId, status, adminId]
  );

  return result.rows[0];
}

module.exports = { getReviewsForProduct, upsertReview, deleteReview, findPurchase, addHelpfulVote, removeHelpfulVote, createReviewReport, getReviewReports, updateReviewReportStatus };