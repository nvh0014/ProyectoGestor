const pool = require('../config/database');

const clienteController = {
  // Obtener todos los clientes activos
  getClientes: async (req, res) => {
    try {
      const query = 'SELECT * FROM cliente WHERE ClienteActivo = 1 ORDER BY CodigoCliente';
      const [results] = await pool.execute(query);
      res.json(results);
    } catch (err) {
      console.error('Error al obtener clientes:', err);
      res.status(500).json({ error: 'Error al obtener clientes' });
    }
  },

  // Obtener cliente por ID
  getClienteById: async (req, res) => {
    const { id } = req.params;
    try {
      const query = 'SELECT * FROM cliente WHERE CodigoCliente = ?';
      const [results] = await pool.execute(query, [id]);
      
      if (results.length === 0) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }
      res.json(results[0]);
    } catch (err) {
      console.error('Error al obtener cliente:', err);
      res.status(500).json({ error: 'Error al obtener cliente' });
    }
  },

  // Crear nuevo cliente
  createCliente: async (req, res) => {
    const { Rut, RazonSocial, Telefono, Direccion, Comuna, Giro, ClienteActivo = 1 } = req.body;
    
    try {
      // Obtener el próximo código disponible
      const [nextCodeResult] = await pool.execute('SELECT COALESCE(MAX(CodigoCliente), 0) + 1 AS nextCode FROM cliente');
      const nextCode = nextCodeResult[0].nextCode;
      
      // Insertar el cliente
      const query = 'INSERT INTO cliente (CodigoCliente, Rut, RazonSocial, Telefono, Direccion, Comuna, Giro, ClienteActivo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
      await pool.execute(query, [nextCode, Rut, RazonSocial, Telefono, Direccion, Comuna, Giro, ClienteActivo]);
      
      res.status(201).json({ 
        message: 'Cliente creado exitosamente',
        CodigoCliente: nextCode
      });
    } catch (err) {
      console.error('Error al crear cliente:', err);
      res.status(500).json({ error: 'Error al crear cliente' });
    }
  },

  // Actualizar cliente
  updateCliente: async (req, res) => {
    const { id } = req.params;
    const { Rut, RazonSocial, Telefono, Direccion, Comuna, Giro, ClienteActivo } = req.body;
    
    try {
      const query = 'UPDATE cliente SET Rut = ?, RazonSocial = ?, Telefono = ?, Direccion = ?, Comuna = ?, Giro = ?, ClienteActivo = ? WHERE CodigoCliente = ?';
      const [result] = await pool.execute(query, [Rut, RazonSocial, Telefono, Direccion, Comuna, Giro, ClienteActivo, id]);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }
      res.json({ message: 'Cliente actualizado exitosamente' });
    } catch (err) {
      console.error('Error al actualizar cliente:', err);
      res.status(500).json({ error: 'Error al actualizar cliente' });
    }
  },

  // Eliminar cliente (soft delete)
  deleteCliente: async (req, res) => {
    const { id } = req.params;
    
    try {
      const query = 'UPDATE cliente SET ClienteActivo = 0 WHERE CodigoCliente = ?';
      const [result] = await pool.execute(query, [id]);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }
      res.json({ message: 'Cliente eliminado exitosamente' });
    } catch (err) {
      console.error('Error al eliminar cliente:', err);
      res.status(500).json({ error: 'Error al eliminar cliente' });
    }
  }
};

module.exports = clienteController;
