const express = require('express');
const stockController = require('../controllers/stock.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { tenantMiddleware, requireUnitAccess } = require('../middlewares/tenant.middleware');
const { requirePermission, requireAnyPermission } = require('../middlewares/permission.middleware');

const router = express.Router();

router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(requireUnitAccess);

router.get('/', requireAnyPermission(['sales.manage', 'stock.manage']), stockController.list);
router.get('/movements', requirePermission('stock.manage'), stockController.movements);
router.post('/movements', stockController.createMovement);
router.post('/transfers', requirePermission('stock.manage'), stockController.createTransfer);

module.exports = router;
