const pool = require('../../config/db');
const model = require('./workers.model');

const VALID_SPECIALTIES = ['barbering', 'hairdressing', 'nails', 'lashes', 'tailoring'];

async function addWorker(req, res) {
  try {
    const { email, specialty, bio, photoUrl } = req.body;

    if (!email || !specialty) {
      return res.status(400).json({ error: 'Email and specialty are required.' });
    }
    if (!VALID_SPECIALTIES.includes(specialty)) {
      return res.status(400).json({ error: 'Invalid specialty.' });
    }

    const userResult = await pool.query('SELECT id, role FROM users WHERE email = $1', [email]);
    const user = userResult.rows[0];
    if (!user) {
      return res.status(404).json({ error: 'No account found with that email. The person must sign up first.' });
    }

    await pool.query(`UPDATE users SET role = 'worker' WHERE id = $1`, [user.id]);
    const profile = await model.createWorkerProfile(user.id, { specialty, bio, photoUrl });

    res.status(201).json(profile);
  } catch (err) {
    console.error(err);
    if (err.code === '23505') {
      return res.status(409).json({ error: 'This person already has a worker profile.' });
    }
    res.status(500).json({ error: 'Something went wrong.' });
  }
}

async function listBySpecialty(req, res) {
  try {
    const { specialty } = req.params;
    if (!VALID_SPECIALTIES.includes(specialty)) {
      return res.status(400).json({ error: 'Invalid specialty.' });
    }
    res.json(await model.getWorkersBySpecialty(specialty));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
}

async function getOne(req, res) {
  try {
    const worker = await model.getWorkerById(req.params.id);
    if (!worker) return res.status(404).json({ error: 'Worker not found.' });
    res.json(worker);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
}

async function listAll(req, res) {
  try {
    res.json(await model.getAllWorkers());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
}

module.exports = { addWorker, listBySpecialty, getOne, listAll };