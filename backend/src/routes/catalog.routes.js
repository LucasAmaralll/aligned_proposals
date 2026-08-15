const express = require('express');
const catalogController = require('../controllers/catalog.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { tenantMiddleware } = require('../middlewares/tenant.middleware');
const { requirePermission, requireAnyPermission } = require('../middlewares/permission.middleware');

const router = express.Router();

router.use(authMiddleware);
router.use(tenantMiddleware);

router.get('/products', requireAnyPermission(['products.read', 'products.manage']), catalogController.list);
router.post('/products', requirePermission('products.manage'), catalogController.create);
router.get('/products/:id', requireAnyPermission(['products.read', 'products.manage']), catalogController.getById);
router.put('/products/:id', requirePermission('products.manage'), catalogController.update);
router.post('/products/:id/variants', requirePermission('products.manage'), catalogController.createVariant);
router.put('/variants/:variantId', requirePermission('products.manage'), catalogController.updateVariant);

module.exports = router;
