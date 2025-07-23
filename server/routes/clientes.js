const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');
const pool = require('../config/database');

// Obtener todos los clientes activos
router.get('/', clienteController.getClientes);

// Obtener cliente por ID
router.get('/:id', clienteController.getClienteById);

// Crear nuevo cliente
router.post('/', clienteController.createCliente);

// Actualizar cliente
router.put('/:id', clienteController.updateCliente);

// DELETE - Eliminar cliente (con soft delete si tiene boletas)
router.delete('/:id', async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const clienteId = req.params.id;
        
        // Verificar si el cliente existe
        const [clienteExiste] = await connection.execute(
            'SELECT CodigoCliente, RazonSocial FROM cliente WHERE CodigoCliente = ?',
            [clienteId]
        );
        
        if (clienteExiste.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }
        
        // Verificar si el cliente tiene boletas asociadas
        const [boletasAsociadas] = await connection.execute(
            'SELECT COUNT(*) as count FROM boleta WHERE CodigoCliente = ?',
            [clienteId]
        );
        
        if (boletasAsociadas[0].count > 0) {
            // Soft delete: desactivar cliente
            await connection.execute(
                'UPDATE cliente SET ClienteActivo = 0 WHERE CodigoCliente = ?',
                [clienteId]
            );
            
            await connection.commit();
            
            res.json({
                message: 'Cliente desactivado exitosamente (soft delete)',
                tipo: 'soft_delete',
                cliente: clienteExiste[0],
                boletasAsociadas: boletasAsociadas[0].count
            });
        } else {
            // Hard delete: eliminar completamente
            await connection.execute(
                'DELETE FROM cliente WHERE CodigoCliente = ?',
                [clienteId]
            );
            
            await connection.commit();
            
            res.json({
                message: 'Cliente eliminado exitosamente (hard delete)',
                tipo: 'hard_delete',
                cliente: clienteExiste[0]
            });
        }
        
    } catch (error) {
        await connection.rollback();
        console.error('Error al eliminar cliente:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor al eliminar cliente',
            details: error.message 
        });
    } finally {
        connection.release();
    }
});

module.exports = router;
