const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');

// Obtener todos los clientes activos
router.get('/', clienteController.getClientes);

// Obtener cliente por ID
router.get('/:id', clienteController.getClienteById);

// Crear nuevo cliente
router.post('/', clienteController.createCliente);

// Actualizar cliente
router.put('/:id', clienteController.updateCliente);

// Eliminar cliente (soft delete)
router.delete('/:id', clienteController.deleteCliente);

module.exports = router;
