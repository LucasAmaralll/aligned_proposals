const express = require('express');
const clientController = require('../controllers/client.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

router.use(authMiddleware);

router.post('/', clientController.create);
router.get('/', clientController.list);
router.get('/:id', clientController.getById);
router.put('/:id', clientController.update);
router.delete('/:id', clientController.delete);

module.exports = router;
