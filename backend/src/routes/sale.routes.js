const express = require('express');
const saleController = require('../controllers/sale.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { tenantMiddleware, requireUnitAccess } = require('../middlewares/tenant.middleware');
const { requirePermission } = require('../middlewares/permission.middleware');

const router = express.Router();

router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(requireUnitAccess);
router.use(requirePermission('sales.manage'));

router.get('/', saleController.list);
router.post('/', saleController.create);
router.get('/:id', saleController.getById);
router.post('/:id/cancel', requirePermission('sales.cancel'), saleController.cancel);
router.post('/:id/returns', requirePermission('returns.manage'), saleController.createReturn);
router.post('/:id/exchanges', requirePermission('exchanges.manage'), saleController.createExchange);

module.exports = router;
