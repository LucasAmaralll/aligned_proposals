const express = require('express');
const teamController = require('../controllers/team.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { tenantMiddleware } = require('../middlewares/tenant.middleware');
const { requirePermission } = require('../middlewares/permission.middleware');

const router = express.Router();

router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(requirePermission('users.manage'));

router.get('/', teamController.list);
router.post('/', teamController.create);
router.put('/:id', teamController.update);

module.exports = router;
