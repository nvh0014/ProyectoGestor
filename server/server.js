require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./config/database');
const logger = require('./config/logger');
const bcrypt = require('bcrypt');

const app = express();

// =============================================
// 1. Configuración Básica
// =============================================
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://gestorcerronegro.up.railway.app';

// =============================================
// 2. Middlewares
// =============================================
app.use(cors({
  origin: [
    'https://gestorcerronegro.up.railway.app',
    'http://localhost:3000',
    'https://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));

app.use(express.json());

// Logger de solicitudes
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// =============================================
// 3. Conexión a la Base de Datos
// =============================================
async function initializeDatabase() {
  try {
    const connection = await pool.getConnection();
    connection.release();
    console.log('✅ Base de datos conectada');
  } catch (error) {
    console.error('❌ Fallo al conectar a la base de datos:', error);
    process.exit(1);
  }
}

// =============================================
// 4. Rutas Básicas
// =============================================

// Ruta de prueba básica
app.get('/test', (req, res) => {
  res.json({ message: 'Servidor funcionando correctamente' });
});

// Ruta de prueba CORS
app.get('/api/cors-test', (req, res) => {
  res.json({ 
    message: 'CORS funcionando correctamente',
    origin: req.headers.origin || 'No origin header',
    timestamp: new Date().toISOString()
  });
});

// Ruta de prueba de base de datos
app.get('/api/test-db', async (req, res) => {
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
app.get('/api/health', async (req, res) => {
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

// =============================================
// 5. Rutas de Usuarios
// =============================================

// Configuración para bcrypt
const SALT_ROUNDS = 12;

// Registrar usuario
app.post('/register', async (req, res) => {
  const { NombreUsuario, Password } = req.body;

  if (!NombreUsuario || !Password) {
    return res.status(400).json({ error: 'Nombre de usuario y contraseña son requeridos.' });
  }

  if (Password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
  }

  try {
    const hashedPassword = await bcrypt.hash(Password, SALT_ROUNDS);
    const query = 'INSERT INTO usuario (NombreUsuario, Password) VALUES (?, ?)';
    await pool.execute(query, [NombreUsuario, hashedPassword]);
    
    console.log(`✅ Usuario registrado: ${NombreUsuario}`);
    res.status(201).json({ message: 'Usuario registrado exitosamente.' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'El nombre de usuario ya está en uso.' });
    }
    console.error('Error al registrar usuario:', error);
    return res.status(500).json({ error: 'Error al registrar el usuario.' });
  }
});

// Login usuario
app.post('/login', async (req, res) => {
  const { NombreUsuario, Password } = req.body;
  
  if (!NombreUsuario || !Password) {
    return res.status(400).json({ error: 'Nombre de usuario y contraseña son requeridos.' });
  }

  try {
    const query = 'SELECT CodigoUsuario, NombreUsuario, Password FROM usuario WHERE NombreUsuario = ?';
    const [data] = await pool.execute(query, [NombreUsuario]);
    
    if (data.length === 0) {
      return res.status(401).json({ status: 'fail', error: 'Credenciales incorrectas' });
    }

    const user = data[0];
    const passwordMatch = await bcrypt.compare(Password, user.Password);
    
    if (passwordMatch) {
      console.log(`✅ Acceso autorizado: ${NombreUsuario}`);
      return res.status(200).json({ 
        status: 'success', 
        message: 'Inicio de sesión exitoso',
        user: {
          CodigoUsuario: user.CodigoUsuario,
          NombreUsuario: user.NombreUsuario
        }
      });
    } else {
      return res.status(401).json({ status: 'fail', error: 'Credenciales incorrectas' });
    }
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Obtener usuarios
app.get('/usuarios', async (req, res) => {
  try {
    const query = 'SELECT CodigoUsuario, NombreUsuario FROM usuario ORDER BY CodigoUsuario';
    const [results] = await pool.execute(query);
    res.json(results);
  } catch (err) {
    console.error('Error al obtener usuarios:', err);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

// =============================================
// 6. Rutas de Clientes
// =============================================

// Obtener todos los clientes activos
app.get('/clientes', async (req, res) => {
  try {
    const query = 'SELECT * FROM cliente WHERE ClienteActivo = 1 ORDER BY CodigoCliente';
    const [results] = await pool.execute(query);
    res.json(results);
  } catch (err) {
    console.error('Error al obtener clientes:', err);
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
});

// Obtener cliente por ID
app.get('/clientes/:id', async (req, res) => {
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
});

// Crear nuevo cliente
app.post('/clientes', async (req, res) => {
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
});

// Actualizar cliente
app.put('/clientes/:id', async (req, res) => {
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
});

// Eliminar cliente (soft delete)
app.delete('/clientes/:id', async (req, res) => {
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
});

// =============================================
// 7. Rutas de Productos
// =============================================

// Obtener todos los productos activos
app.get('/productos', async (req, res) => {
  try {
    const query = 'SELECT * FROM producto WHERE ProductoActivo = 1 ORDER BY CodigoProducto';
    const [results] = await pool.execute(query);
    res.json(results);
  } catch (err) {
    console.error('Error al obtener productos:', err);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

// Obtener producto por ID
app.get('/productos/:id', async (req, res) => {
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
});

// Crear nuevo producto
app.post('/productos', async (req, res) => {
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
});

// Actualizar producto
app.put('/productos/:id', async (req, res) => {
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
});

// Eliminar producto (soft delete)
app.delete('/productos/:id', async (req, res) => {
  const { id } = req.params;
  
  try {
    const query = 'UPDATE producto SET ProductoActivo = 0 WHERE CodigoProducto = ?';
    const [result] = await pool.execute(query, [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json({ message: 'Producto eliminado exitosamente' });
  } catch (err) {
    console.error('Error al eliminar producto:', err);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});

// =============================================
// 8. Rutas de Boletas
// =============================================

// Obtener todas las boletas
app.get('/boletas', async (req, res) => {
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
});

// Obtener boleta por número con detalles
app.get('/boletas/:numero', async (req, res) => {
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
});

// Crear nueva boleta con detalles
app.post('/boletas', async (req, res) => {
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
});

// =============================================
// 9. Rutas Auxiliares
// =============================================

// Obtener artículos (productos activos para boletas)
app.get('/articulos', async (req, res) => {
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
});

// =============================================
// 10. Manejo de Errores
// =============================================
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err.stack);
  res.status(500).json({ error: 'Algo salió mal' });
});

// =============================================
// 11. Inicialización del Servidor
// =============================================
async function startServer() {
  await initializeDatabase();
  
  app.listen(PORT, () => {
    console.log(`🚀 Servidor escuchando en puerto ${PORT}`);
    console.log(`🔗 Frontend permitido: ${FRONTEND_URL}`);
  });
}

startServer();
