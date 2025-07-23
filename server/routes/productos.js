const express = require('express');
const router = express.Router();
const productoController = require('../controllers/productoController');
const pool = require('../config/database');

// Obtener todos los productos activos
router.get('/', productoController.getProductos);

// Obtener producto por ID
router.get('/:id', productoController.getProductoById);

// Crear nuevo producto
router.post('/', productoController.createProducto);

// Actualizar producto
router.put('/:id', productoController.updateProducto);

// DELETE - Eliminar producto (con soft delete si tiene boletas)
router.delete('/:id', async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const productoId = req.params.id;
        
        // Verificar si el producto existe
        const [productoExiste] = await connection.execute(
            'SELECT CodigoProducto, Descripcion FROM producto WHERE CodigoProducto = ?',
            [productoId]
        );
        
        if (productoExiste.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        
        // Verificar si el producto tiene detalles de boletas asociadas
        const [detallesAsociados] = await connection.execute(
            `SELECT COUNT(*) as count 
             FROM detallesboleta db 
             INNER JOIN boleta b ON db.NumeroBoleta = b.NumeroBoleta 
             WHERE db.CodigoProducto = ?`,
            [productoId]
        );
        
        if (detallesAsociados[0].count > 0) {
            // Soft delete: desactivar producto
            await connection.execute(
                'UPDATE producto SET ProductoActivo = 0 WHERE CodigoProducto = ?',
                [productoId]
            );
            
            await connection.commit();
            
            res.json({
                message: 'Producto desactivado exitosamente (soft delete)',
                tipo: 'soft_delete',
                producto: productoExiste[0],
                boletasAsociadas: detallesAsociados[0].count
            });
        } else {
            // Hard delete: eliminar completamente
            await connection.execute(
                'DELETE FROM producto WHERE CodigoProducto = ?',
                [productoId]
            );
            
            await connection.commit();
            
            res.json({
                message: 'Producto eliminado exitosamente (hard delete)',
                tipo: 'hard_delete',
                producto: productoExiste[0]
            });
        }
        
    } catch (error) {
        await connection.rollback();
        console.error('Error al eliminar producto:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor al eliminar producto',
            details: error.message 
        });
    } finally {
        connection.release();
    }
});

module.exports = router;
