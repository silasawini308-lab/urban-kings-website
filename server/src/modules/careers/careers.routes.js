const express = require('express');
const router = express.Router();
const requireAuth = require('../../middleware/requireAuth');
const requireRole = require('../../middleware/requireRole');
const controller = require('./careers.controller');

router.get('/jobs', controller.listOpenJobs);
router.get('/jobs/all', requireAuth, requireRole('hr', 'admin'), controller.listAllJobs);
router.post('/jobs', requireAuth, requireRole('hr', 'admin'), controller.postJob);
router.put('/jobs/:id/close', requireAuth, requireRole('hr', 'admin'), controller.closeJobPosting);

router.post('/jobs/:jobId/apply', requireAuth, controller.apply);
router.get('/jobs/:jobId/applications', requireAuth, requireRole('hr', 'admin'), controller.listApplications);
router.put('/applications/:id/status', requireAuth, requireRole('hr', 'admin'), controller.changeApplicationStatus);

module.exports = router;