const express = require('express');
const stockController = require('../controllers/stock.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { tenantMiddleware, requireUnitAccess } = require('../middlewares/tenant.middleware');

const router = express.Router();

router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(requireUnitAccess);

router.get('/', stockController.list);
router.get('/movements', stockController.movements);
router.post('/movements', stockController.createMovement);
router.post('/transfers', stockController.createTransfer);

module.exports = router;
