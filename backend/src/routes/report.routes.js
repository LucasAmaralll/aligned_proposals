const express = require('express');
const reportController = require('../controllers/report.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { tenantMiddleware } = require('../middlewares/tenant.middleware');
const { requireAnyPermission } = require('../middlewares/permission.middleware');

const router = express.Router();

router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(requireAnyPermission(['reports.read', 'dashboard.read']));

router.get('/dashboard', reportController.dashboard);
router.get('/options', reportController.options);
router.get('/sales/export', reportController.exportSales);
router.get('/sales', reportController.sales);
router.get('/clients/export', reportController.exportClients);
router.get('/clients', reportController.clients);
router.get('/products/export', reportController.exportProducts);
router.get('/products', reportController.products);
router.get('/stock/export', reportController.exportStock);
router.get('/stock', reportController.stock);
router.get('/sellers/export', reportController.exportSellers);
router.get('/sellers', reportController.sellers);
router.get('/cash/export', reportController.exportCash);
router.get('/cash', reportController.cash);

module.exports = router;
