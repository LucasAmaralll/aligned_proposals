const express = require('express');
const reportController = require('../controllers/report.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { tenantMiddleware } = require('../middlewares/tenant.middleware');

const router = express.Router();

router.use(authMiddleware);
router.use(tenantMiddleware);

router.get('/dashboard', reportController.dashboard);

module.exports = router;
