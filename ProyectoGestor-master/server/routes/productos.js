const express = require('express');
const router = express.Router();
const productoController = require('../controllers/productoController');

// Obtener todos los productos activos
router.get('/', productoController.getProductos);

// Obtener producto por ID
router.get('/:id', productoController.getProductoById);

// Crear nuevo producto
router.post('/', productoController.createProducto);

// Actualizar producto
router.put('/:id', productoController.updateProducto);

// Eliminar producto (soft delete)
router.delete('/:id', productoController.deleteProducto);

module.exports = router;
