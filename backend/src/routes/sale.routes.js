const express = require('express');
const saleController = require('../controllers/sale.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { tenantMiddleware, requireUnitAccess } = require('../middlewares/tenant.middleware');

const router = express.Router();

router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(requireUnitAccess);

router.get('/', saleController.list);
router.post('/', saleController.create);
router.get('/:id', saleController.getById);
router.post('/:id/returns', saleController.createReturn);
router.post('/:id/exchanges', saleController.createExchange);

module.exports = router;
