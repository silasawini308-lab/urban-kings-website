const pool = require('../../config/db');

async function createJobPosting(title, description, postedBy) {
  const result = await pool.query(
    `INSERT INTO job_postings (title, description, posted_by)
     VALUES ($1, $2, $3) RETURNING *`,
    [title, description, postedBy]
  );
  return result.rows[0];
}

async function getOpenJobs() {
  const result = await pool.query(
    `SELECT * FROM job_postings WHERE is_open = TRUE ORDER BY created_at DESC`
  );
  return result.rows;
}

async function getAllJobs() {
  const result = await pool.query(`SELECT * FROM job_postings ORDER BY created_at DESC`);
  return result.rows;
}

async function closeJob(jobId) {
  const result = await pool.query(
    `UPDATE job_postings SET is_open = FALSE WHERE id = $1 RETURNING *`,
    [jobId]
  );
  return result.rows[0];
}

async function createApplication(jobId, applicantId, cvUrl) {
  const result = await pool.query(
    `INSERT INTO applications (job_posting_id, applicant_id, cv_url)
     VALUES ($1, $2, $3) RETURNING *`,
    [jobId, applicantId, cvUrl]
  );
  return result.rows[0];
}

async function getApplicationsForJob(jobId) {
  const result = await pool.query(
    `SELECT a.*, u.full_name, u.email
     FROM applications a
     JOIN users u ON u.id = a.applicant_id
     WHERE a.job_posting_id = $1
     ORDER BY a.created_at DESC`,
    [jobId]
  );
  return result.rows;
}

async function updateApplicationStatus(applicationId, status) {
  const result = await pool.query(
    `UPDATE applications SET status = $1 WHERE id = $2 RETURNING *`,
    [status, applicationId]
  );
  return result.rows[0];
}

module.exports = {
  createJobPosting, getOpenJobs, getAllJobs, closeJob,
  createApplication, getApplicationsForJob, updateApplicationStatus
};