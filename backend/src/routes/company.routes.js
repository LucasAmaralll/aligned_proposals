const express = require('express');
const companyController = require('../controllers/company.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { tenantMiddleware } = require('../middlewares/tenant.middleware');

const router = express.Router();

router.use(authMiddleware);
router.use(tenantMiddleware);

router.get('/me', companyController.me);
router.get('/me/units', companyController.listUnits);

module.exports = router;
