const express = require('express');
const router = express.Router();
const boletaController = require('../controllers/boletaController');

// Obtener reporte de ventas (debe ir antes de las rutas con parámetros)
router.get('/reporte', boletaController.getReporteVentas);

// Obtener todas las boletas
router.get('/', boletaController.getBoletas);

// Obtener boleta por número con detalles
router.get('/:numero', boletaController.getBoletaById);

// Crear nueva boleta con detalles
router.post('/', boletaController.createBoleta);

// Actualizar estado de múltiples boletas (debe ir ANTES de rutas con parámetros)
router.patch('/completada/multiple', boletaController.updateCompletadaMultiple);

// Actualizar boleta existente
router.put('/:numero', boletaController.updateBoleta);

// Actualizar estado de completada de una boleta
router.patch('/:numero/completada', boletaController.updateCompletada);

// Eliminar boleta por NumeroBoleta
router.delete('/:numero', boletaController.deleteBoleta);

module.exports = router;
