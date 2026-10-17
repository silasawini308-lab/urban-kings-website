const model = require('./careers.model');

async function postJob(req, res) {
  try {
    const { title, description } = req.body;
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description are required.' });
    }
    const job = await model.createJobPosting(title, description, req.user.id);
    res.status(201).json(job);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
}

async function listOpenJobs(req, res) {
  try {
    res.json(await model.getOpenJobs());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
}

async function listAllJobs(req, res) {
  try {
    res.json(await model.getAllJobs());
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
}

async function closeJobPosting(req, res) {
  try {
    const job = await model.closeJob(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found.' });
    res.json(job);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
}

async function apply(req, res) {
  try {
    const { cvUrl } = req.body;
    if (!cvUrl || !cvUrl.startsWith('https://')) {
      return res.status(400).json({ error: 'A valid CV link (starting with https://) is required.' });
    }
    const application = await model.createApplication(req.params.jobId, req.user.id, cvUrl);
    res.status(201).json(application);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
}

async function listApplications(req, res) {
  try {
    res.json(await model.getApplicationsForJob(req.params.jobId));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
}

async function changeApplicationStatus(req, res) {
  try {
    const { status } = req.body;
    const allowed = ['new', 'reviewed', 'interview', 'rejected', 'hired'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }
    const application = await model.updateApplicationStatus(req.params.id, status);
    if (!application) return res.status(404).json({ error: 'Application not found.' });
    res.json(application);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
}

module.exports = { postJob, listOpenJobs, listAllJobs, closeJobPosting, apply, listApplications, changeApplicationStatus };