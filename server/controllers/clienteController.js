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
    
    console.log('🔍 Datos recibidos para crear cliente:', {
      Rut, RazonSocial, Telefono, Direccion, Comuna, Giro, ClienteActivo
    });
    
    // Validación de campos requeridos
    if (!Rut || !RazonSocial) {
      return res.status(400).json({ 
        error: 'Datos requeridos faltantes',
        details: {
          Rut: !Rut ? 'RUT es requerido' : 'OK',
          RazonSocial: !RazonSocial ? 'Razón Social es requerida' : 'OK'
        }
      });
    }
    
    try {
      // Obtener el próximo código disponible
      const [nextCodeResult] = await pool.execute('SELECT COALESCE(MAX(CodigoCliente), 0) + 1 AS nextCode FROM cliente');
      const nextCode = nextCodeResult[0].nextCode;
      console.log('📝 Próximo código de cliente:', nextCode);
      
      // Insertar el cliente
      const query = 'INSERT INTO cliente (CodigoCliente, Rut, RazonSocial, Telefono, Direccion, Comuna, Giro, ClienteActivo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
      const [result] = await pool.execute(query, [nextCode, Rut, RazonSocial, Telefono, Direccion, Comuna, Giro, ClienteActivo]);
      
      console.log('✅ Cliente creado exitosamente con código:', nextCode);
      
      res.status(201).json({ 
        message: 'Cliente creado exitosamente',
        CodigoCliente: nextCode
      });
    } catch (err) {
      console.error('❌ Error al crear cliente:', err);
      console.error('❌ Error code:', err.code);
      console.error('❌ Error errno:', err.errno);
      console.error('❌ SQL State:', err.sqlState);

      // Manejo específico de errores comunes
      let errorMessage = 'Error al crear cliente';
      let statusCode = 500;

      switch (err.code) {
        case 'ER_DUP_ENTRY':
          errorMessage = 'Ya existe un cliente con este RUT';
          statusCode = 409; // Conflict
          break;
        case 'ER_NO_SUCH_TABLE':
          errorMessage = 'Tabla de clientes no encontrada en la base de datos';
          statusCode = 500;
          break;
        case 'ER_BAD_FIELD_ERROR':
          errorMessage = 'Campo no válido en la tabla de clientes';
          statusCode = 400;
          break;
        case 'ER_DATA_TOO_LONG':
          errorMessage = 'Uno de los campos excede la longitud máxima permitida';
          statusCode = 400;
          break;
        default:
          errorMessage = 'Error interno del servidor';
      }

      res.status(statusCode).json({ 
        error: errorMessage,
        details: err.message,
        code: err.code
      });
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

  // Eliminar cliente
  deleteCliente: async (req, res) => {
    const { id } = req.params;
    
    try {
      const query = 'DELETE FROM cliente WHERE CodigoCliente = ?';
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
