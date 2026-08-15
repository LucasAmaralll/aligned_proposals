const express = require('express');
const storefrontController = require('../controllers/storefront.controller');
const storefrontAuth = require('../middlewares/storefrontAuth.middleware');

const router = express.Router();

router.use(storefrontAuth);

router.get('/catalog', storefrontController.catalog);
router.post('/orders', storefrontController.createOrder);

module.exports = router;
