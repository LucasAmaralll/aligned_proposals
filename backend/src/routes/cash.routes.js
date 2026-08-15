const express = require('express');
const cashController = require('../controllers/cash.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { tenantMiddleware, requireUnitAccess } = require('../middlewares/tenant.middleware');
const { requirePermission } = require('../middlewares/permission.middleware');

const router = express.Router();

router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(requireUnitAccess);
router.use(requirePermission('cash.read'));

router.get('/registers', cashController.registers);
router.get('/sessions/current', cashController.current);
router.get('/sessions', cashController.list);
router.get('/sessions/:id/preview', cashController.preview);
router.get('/sessions/:id', cashController.getById);
router.post('/sessions/open', requirePermission('cash.open'), cashController.open);
router.post('/sessions/:id/supply', requirePermission('cash.operate'), cashController.supply);
router.post('/sessions/:id/bleed', requirePermission('cash.operate'), cashController.bleed);
router.post('/sessions/:id/close', requirePermission('cash.close'), cashController.close);

module.exports = router;
