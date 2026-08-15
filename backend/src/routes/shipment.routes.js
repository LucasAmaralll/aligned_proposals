const express = require('express');
const shipmentController = require('../controllers/shipment.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { tenantMiddleware, requireUnitAccess } = require('../middlewares/tenant.middleware');
const { requirePermission } = require('../middlewares/permission.middleware');

const router = express.Router();

router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(requireUnitAccess);
router.use(requirePermission('sales.manage'));

router.get('/', shipmentController.list);
router.post('/', shipmentController.create);
router.get('/:id', shipmentController.getById);
router.put('/:id', shipmentController.update);
router.post('/:id/ship', shipmentController.ship);
router.post('/:id/cancel', shipmentController.cancel);

module.exports = router;
