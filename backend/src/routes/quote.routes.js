const express = require('express');
const quoteController = require('../controllers/quote.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { tenantMiddleware } = require('../middlewares/tenant.middleware');
const { checkQuoteLimit } = require('../middlewares/permissions.middleware');
const { requirePermission } = require('../middlewares/permission.middleware');

const router = express.Router();

router.get('/public/:token', quoteController.getByToken);
router.get('/pdf/public/:token', quoteController.getPDFByToken);

router.use(authMiddleware);
router.use(tenantMiddleware);
router.use(requirePermission('quotes.manage'));

router.post('/', checkQuoteLimit, quoteController.create);
router.get('/', quoteController.list);
router.get('/:id', quoteController.getById);
router.put('/:id', quoteController.update);
router.delete('/:id', quoteController.delete);
router.get('/:id/pdf', quoteController.generatePDF);
router.get('/:id/pdf-html', quoteController.generatePDFHTML);
router.post('/:id/send-email', quoteController.sendEmail);

module.exports = router;
