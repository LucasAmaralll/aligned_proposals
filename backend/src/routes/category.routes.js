const express = require('express');
const categoryController = require('../controllers/category.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { tenantMiddleware } = require('../middlewares/tenant.middleware');
const { requirePermission, requireAnyPermission } = require('../middlewares/permission.middleware');

const router = express.Router();

router.use(authMiddleware);
router.use(tenantMiddleware);

router.get('/', requireAnyPermission(['products.read', 'products.manage']), categoryController.list);
router.post('/', requirePermission('products.manage'), categoryController.create);
router.put('/:id', requirePermission('products.manage'), categoryController.update);

module.exports = router;
