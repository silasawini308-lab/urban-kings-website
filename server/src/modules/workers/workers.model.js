const pool = require('../../config/db');

async function createWorkerProfile(userId, { specialty, bio, photoUrl }) {
  const result = await pool.query(
    `INSERT INTO workers (user_id, specialty, bio, photo_url)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, specialty, bio, photoUrl]
  );
  return result.rows[0];
}

async function getWorkersBySpecialty(specialty) {
  const result = await pool.query(
    `SELECT w.*, u.full_name
     FROM workers w
     JOIN users u ON u.id = w.user_id
     WHERE w.specialty = $1`,
    [specialty]
  );
  return result.rows;
}

async function getWorkerById(userId) {
  const result = await pool.query(
    `SELECT w.*, u.full_name
     FROM workers w
     JOIN users u ON u.id = w.user_id
     WHERE w.user_id = $1`,
    [userId]
  );
  return result.rows[0];
}

async function getAllWorkers() {
  const result = await pool.query(
    `SELECT w.*, u.full_name, u.email
     FROM workers w
     JOIN users u ON u.id = w.user_id
     ORDER BY u.full_name`
  );
  return result.rows;
}

module.exports = { createWorkerProfile, getWorkersBySpecialty, getWorkerById, getAllWorkers };