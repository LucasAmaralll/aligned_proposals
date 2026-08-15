const express = require('express');
const companyController = require('../controllers/company.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { tenantMiddleware } = require('../middlewares/tenant.middleware');
const { requirePermission } = require('../middlewares/permission.middleware');

const router = express.Router();

router.use(authMiddleware);
router.use(tenantMiddleware);

router.get('/me', companyController.me);
router.patch('/me', requirePermission('units.manage'), companyController.update);
router.get('/me/units', companyController.listUnits);
router.post('/me/units', requirePermission('units.manage'), companyController.createUnit);
router.put('/me/units/:id', requirePermission('units.manage'), companyController.updateUnit);
router.delete('/me/units/:id', requirePermission('units.manage'), companyController.deactivateUnit);
router.get('/me/api-keys', requirePermission('units.manage'), companyController.listApiKeys);
router.post('/me/api-keys', requirePermission('units.manage'), companyController.createApiKey);
router.delete('/me/api-keys/:id', requirePermission('units.manage'), companyController.revokeApiKey);

module.exports = router;
