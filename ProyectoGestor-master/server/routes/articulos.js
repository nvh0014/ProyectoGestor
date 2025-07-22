const express = require('express');
const router = express.Router();
const productoController = require('../controllers/productoController');

// Obtener artículos (productos activos para boletas)
router.get('/', productoController.getArticulos);

module.exports = router;
