const express = require('express');
const planController = require('../controllers/plan.controller');

const router = express.Router();

router.get('/', planController.list);
router.get('/:id', planController.getById);

module.exports = router;
