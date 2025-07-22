const express = require('express');
const router = express.Router();
const pool = require('../config/database');

// Endpoint para verificar estructura de tablas
router.get('/verify-tables', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    
    // Verificar tabla boleta
    const [boletaStructure] = await connection.execute('DESCRIBE boleta');
    
    // Verificar tabla detallesboleta
    const [detallesStructure] = await connection.execute('DESCRIBE detallesboleta');
    
    // Verificar que hay clientes
    const [clientesCount] = await connection.execute('SELECT COUNT(*) as count FROM cliente');
    
    // Verificar que hay productos
    const [productosCount] = await connection.execute('SELECT COUNT(*) as count FROM producto');
    
    connection.release();
    
    res.json({
      status: 'OK',
      tables: {
        boleta: boletaStructure.map(col => ({
          field: col.Field,
          type: col.Type,
          null: col.Null === 'YES',
          key: col.Key
        })),
        detallesboleta: detallesStructure.map(col => ({
          field: col.Field,
          type: col.Type,
          null: col.Null === 'YES',
          key: col.Key
        }))
      },
      counts: {
        clientes: clientesCount[0].count,
        productos: productosCount[0].count
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error verificando tablas',
      message: error.message,
      code: error.code
    });
  }
});

module.exports = router;
