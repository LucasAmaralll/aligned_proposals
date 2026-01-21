const express = require('express');
const planController = require('../controllers/plan.controller');

const router = express.Router();

router.get('/', planController.list);
router.get('/seed', planController.seed); // Rota para criar planos iniciais
router.get('/:id', planController.getById);

module.exports = router;
