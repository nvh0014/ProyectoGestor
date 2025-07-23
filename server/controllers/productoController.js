const pool = require('../config/database');

const productoController = {
  // Obtener todos los productos activos
  getProductos: async (req, res) => {
    try {
      const query = 'SELECT * FROM producto WHERE ProductoActivo = 1 ORDER BY CodigoProducto';
      const [results] = await pool.execute(query);
      res.json(results);
    } catch (err) {
      console.error('Error al obtener productos:', err);
      res.status(500).json({ error: 'Error al obtener productos' });
    }
  },

  // Obtener producto por ID
  getProductoById: async (req, res) => {
    const { id } = req.params;
    try {
      const query = 'SELECT * FROM producto WHERE CodigoProducto = ?';
      const [results] = await pool.execute(query, [id]);
      
      if (results.length === 0) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }
      res.json(results[0]);
    } catch (err) {
      console.error('Error al obtener producto:', err);
      res.status(500).json({ error: 'Error al obtener producto' });
    }
  },

  // Crear nuevo producto
  createProducto: async (req, res) => {
    const { Descripcion, PrecioSala, PrecioDto, ProductoActivo = 1 } = req.body;
    
    try {
      const query = 'INSERT INTO producto (Descripcion, PrecioSala, PrecioDto, ProductoActivo) VALUES (?, ?, ?, ?)';
      const [result] = await pool.execute(query, [Descripcion, PrecioSala, PrecioDto, ProductoActivo]);
      
      res.status(201).json({ 
        message: 'Producto creado exitosamente',
        CodigoProducto: result.insertId 
      });
    } catch (err) {
      console.error('Error al crear producto:', err);
      res.status(500).json({ error: 'Error al crear producto' });
    }
  },

  // Actualizar producto
  updateProducto: async (req, res) => {
    const { id } = req.params;
    const { Descripcion, PrecioSala, PrecioDto, ProductoActivo } = req.body;
    
    try {
      const query = 'UPDATE producto SET Descripcion = ?, PrecioSala = ?, PrecioDto = ?, ProductoActivo = ? WHERE CodigoProducto = ?';
      const [result] = await pool.execute(query, [Descripcion, PrecioSala, PrecioDto, ProductoActivo, id]);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }
      res.json({ message: 'Producto actualizado exitosamente' });
    } catch (err) {
      console.error('Error al actualizar producto:', err);
      res.status(500).json({ error: 'Error al actualizar producto' });
    }
  },

  // Eliminar producto
  deleteProducto: async (req, res) => {
    const { id } = req.params;
    
    try {
      const query = 'DELETE FROM producto WHERE CodigoProducto = ?';
      const [result] = await pool.execute(query, [id]);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }
      res.json({ message: 'Producto eliminado exitosamente' });
    } catch (err) {
      console.error('Error al eliminar producto:', err);
      res.status(500).json({ error: 'Error al eliminar producto' });
    }
  },

  // Obtener artículos (productos activos para boletas)
  getArticulos: async (req, res) => {
    try {
      const query = 'SELECT * FROM producto WHERE ProductoActivo = 1 ORDER BY Descripcion';
      const [results] = await pool.execute(query);
      
      // Mapear para estructura esperada en frontend
      const articulos = results.map(producto => ({
        CodigoArticulo: producto.CodigoProducto,
        Descripcion: producto.Descripcion,
        PrecioUnitario: producto.PrecioSala,
        PrecioDescuento: producto.PrecioDto,
        ArticuloActivo: producto.ProductoActivo
      }));
      
      res.json(articulos);
    } catch (err) {
      console.error('Error al obtener artículos:', err);
      res.status(500).json({ error: 'Error al obtener artículos' });
    }
  }
};

module.exports = productoController;
