const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const { tenantMiddleware } = require('../middlewares/tenant.middleware');
const { requirePermission } = require('../middlewares/permission.middleware');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  calculatePrice,
} = require('../controllers/product.controller');

router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(requirePermission('products.manage'));

router.post('/calculate', calculatePrice);
router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;
