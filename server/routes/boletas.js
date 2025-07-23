const express = require('express');
const router = express.Router();
const boletaController = require('../controllers/boletaController');

// Obtener todas las boletas
router.get('/', boletaController.getBoletas);

// Obtener boleta por número con detalles
router.get('/:numero', boletaController.getBoletaById);

// Crear nueva boleta con detalles
router.post('/', boletaController.createBoleta);

// Eliminar boleta por NumeroBoleta
router.delete('/:numero', boletaController.deleteBoleta);

module.exports = router;
