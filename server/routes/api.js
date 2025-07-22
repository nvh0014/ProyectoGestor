const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const productoController = require('../controllers/productoController');

// Ruta de prueba CORS
router.get('/cors-test', (req, res) => {
  res.json({ 
    message: 'CORS funcionando correctamente',
    origin: req.headers.origin || 'No origin header',
    timestamp: new Date().toISOString()
  });
});

// Ruta de prueba de base de datos
router.get('/test-db', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT 1 + 1 AS solution');
    res.json({ 
      status: 'success',
      message: 'Conexión a la BD funcionando',
      data: rows[0].solution
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Error al conectar a la BD',
      error: err.message
    });
  }
});

// Health check
router.get('/health', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    connection.release();
    res.json({ 
      status: 'OK',
      database: 'connected'
    });
  } catch (error) {
    res.json({ 
      status: 'OK',
      database: 'disconnected'
    });
  }
});

// Obtener artículos (productos activos para boletas)
router.get('/articulos', productoController.getArticulos);

module.exports = router;
