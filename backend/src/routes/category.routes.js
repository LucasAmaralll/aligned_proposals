const express = require('express');
const categoryController = require('../controllers/category.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { tenantMiddleware } = require('../middlewares/tenant.middleware');

const router = express.Router();

router.use(authMiddleware);
router.use(tenantMiddleware);

router.get('/', categoryController.list);
router.post('/', categoryController.create);
router.put('/:id', categoryController.update);

module.exports = router;
