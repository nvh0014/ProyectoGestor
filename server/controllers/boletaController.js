const pool = require('../config/database');

const boletaController = {
  // Obtener todas las boletas
  getBoletas: async (req, res) => {
    try {
      const query = `
        SELECT 
          b.NumeroBoleta,
          b.CodigoCliente,
          c.RazonSocial,
          b.FechaBoleta,
          b.FechaVencimiento,
          b.TotalBoleta
        FROM boleta b
        INNER JOIN cliente c ON b.CodigoCliente = c.CodigoCliente
        ORDER BY b.NumeroBoleta DESC
      `;
      const [results] = await pool.execute(query);
      res.json(results);
    } catch (err) {
      console.error('Error al obtener boletas:', err);
      res.status(500).json({ error: 'Error al obtener boletas' });
    }
  },

  // Obtener boleta por número con detalles
  getBoletaById: async (req, res) => {
    const { numero } = req.params;
    
    try {
      const queryBoleta = `
        SELECT 
          b.NumeroBoleta,
          b.CodigoCliente,
          c.Rut,
          c.RazonSocial,
          c.Telefono,
          c.Direccion,
          c.Comuna,
          b.FechaBoleta,
          b.FechaVencimiento,
          b.TotalBoleta,
          b.Observaciones
        FROM boleta b
        INNER JOIN cliente c ON b.CodigoCliente = c.CodigoCliente
        WHERE b.NumeroBoleta = ?
      `;
      
      const queryDetalles = `
        SELECT 
          db.IdDetalle,
          db.CodigoProducto,
          p.Descripcion,
          db.Cantidad,
          db.PrecioUnitario,
          db.Subtotal
        FROM detallesboleta db
        INNER JOIN producto p ON db.CodigoProducto = p.CodigoProducto
        WHERE db.NumeroBoleta = ?
      `;
      
      const [boletaResults] = await pool.execute(queryBoleta, [numero]);
      
      if (boletaResults.length === 0) {
        return res.status(404).json({ error: 'Boleta no encontrada' });
      }
      
      const [detallesResults] = await pool.execute(queryDetalles, [numero]);
      
      res.json({
        boleta: boletaResults[0],
        detalles: detallesResults
      });
    } catch (err) {
      console.error('Error al obtener boleta:', err);
      res.status(500).json({ error: 'Error al obtener boleta' });
    }
  },

  // Crear nueva boleta con detalles
  createBoleta: async (req, res) => {
    const { CodigoCliente, FechaBoleta, FechaVencimiento, TotalBoleta, Observaciones, detalles } = req.body;
    
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Insertar boleta
      const queryBoleta = 'INSERT INTO boleta (CodigoCliente, FechaBoleta, FechaVencimiento, TotalBoleta, Observaciones) VALUES (?, ?, ?, ?, ?)';
      const [result] = await connection.execute(queryBoleta, [CodigoCliente, FechaBoleta, FechaVencimiento, TotalBoleta, Observaciones || '']);
      
      const numeroBoleta = result.insertId;
      
      // Insertar detalles si existen
      if (detalles && detalles.length > 0) {
        const queryDetalle = 'INSERT INTO detallesboleta (NumeroBoleta, CodigoProducto, Cantidad, PrecioUnitario, Subtotal) VALUES (?, ?, ?, ?, ?)';
        
        for (const detalle of detalles) {
          await connection.execute(queryDetalle, [
            numeroBoleta,
            detalle.CodigoProducto,
            detalle.Cantidad,
            detalle.PrecioUnitario,
            detalle.Subtotal
          ]);
        }
      }
      
      await connection.commit();
      
      res.status(201).json({
        message: 'Boleta creada exitosamente',
        NumeroBoleta: numeroBoleta
      });
    } catch (err) {
      await connection.rollback();
      console.error('Error al crear boleta:', err);
      res.status(500).json({ error: 'Error al crear boleta' });
    } finally {
      connection.release();
    }
  }
};

module.exports = boletaController;
