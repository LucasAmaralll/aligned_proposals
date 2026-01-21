const express = require('express');
const quoteController = require('../controllers/quote.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

// Rota pública para visualizar orçamento
router.get('/public/:token', quoteController.getByToken);

// Rotas protegidas
router.use(authMiddleware);

router.post('/', quoteController.create);
router.get('/', quoteController.list);
router.get('/:id', quoteController.getById);
router.put('/:id', quoteController.update);
router.delete('/:id', quoteController.delete);
router.get('/:id/pdf', quoteController.generatePDF);
router.post('/:id/send-email', quoteController.sendEmail);

module.exports = router;
