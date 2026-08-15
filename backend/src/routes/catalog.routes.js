const express = require('express');
const catalogController = require('../controllers/catalog.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { tenantMiddleware } = require('../middlewares/tenant.middleware');

const router = express.Router();

router.use(authMiddleware);
router.use(tenantMiddleware);

router.get('/products', catalogController.list);
router.post('/products', catalogController.create);
router.get('/products/:id', catalogController.getById);
router.put('/products/:id', catalogController.update);
router.post('/products/:id/variants', catalogController.createVariant);
router.put('/variants/:variantId', catalogController.updateVariant);

module.exports = router;
