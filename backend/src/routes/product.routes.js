const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middleware');
const { tenantMiddleware } = require('../middlewares/tenant.middleware');
const { canAccessPricing } = require('../middlewares/permissions.middleware');
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  calculatePrice,
} = require('../controllers/product.controller');

// Todas as rotas requerem autenticação E permissão de precificação
router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(canAccessPricing);

// Rota para calcular preço sem salvar (preview) - DEVE VIR ANTES DAS ROTAS COM :id
router.post('/calculate', calculatePrice);

// Rotas de produtos
router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;
