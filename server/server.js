// server.js
require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors({
  origin: [
    'https://gestorcn.vercel.app', // Tu dominio de Vercel
    'http://localhost:3000'      // Para desarrollo local
  ],
  credentials: true
}));
app.use(express.json());

// Configuración de la base de datos usando variables de entorno
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

// Conectar a la base de datos
db.connect((err) => {
  if (err) {
    console.error('Error conectando a la base de datos:', err);
    return;
  }
  console.log('Conectado a la base de datos MySQL');
});

// Rutas de tu API aquí
app.get('/api/test', (req, res) => {
  res.json({ message: 'Servidor funcionando correctamente' });
});
  
  console.log('Conectado exitosamente a la base de datos MySQL');
  console.log('Host:', process.env.DB_HOST);
  console.log('Database:', process.env.DB_NAME);

    // Verificar si existe al menos un usuario, si no, crear uno por defecto
    const checkUserQuery = 'SELECT COUNT(*) as count FROM usuario';
    db.query(checkUserQuery, (err, results) => {
      if (err) {
        console.error('Error al verificar usuarios:', err);
        return;
      }
      
      console.log('Base de datos verificada correctamente');
    });

// Ruta para registrar usuario
app.post('/register', (req, res) => {
  const { NombreUsuario, Password } = req.body;

  const query = 'INSERT INTO usuario (NombreUsuario, Password) VALUES (?, ?)';
  db.query(query, [NombreUsuario, Password], (err, result) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({ message: 'El nombre de usuario ya está en uso.' });
      }
      console.error('Error al registrar usuario:', err);
      return res.status(500).json({ error: 'Error al registrar el usuario en la base de datos.' });
    }

    res.status(201).json({ message: 'Usuario registrado exitosamente.' });
  });
});

// Ruta para el login del usuario
app.post('/login', (req, res) => {
  const { NombreUsuario, Password } = req.body;
  
  const query = 'SELECT * FROM usuario WHERE NombreUsuario = ? AND Password = ?';
  db.query(query, [NombreUsuario, Password], (err, data) => {
    if (err) {
      return res.status(500).json({ error: 'Error al iniciar sesión' });
    }
    
    if (data.length > 0) {
      return res.status(200).json({ status: 'success', message: 'Inicio de sesión exitoso' });
    } else {
      return res.status(401).json({ status: 'fail', error: 'Credenciales incorrectas' });
    }
  });
});

// Ruta para verificar la conexión
app.get('/test', (req, res) => {
  res.status(200).json({ message: 'Servidor funcionando correctamente' });
});

// Ruta para obtener todos los usuarios
app.get('/usuarios', (req, res) => {
  const query = 'SELECT CodigoUsuario, NombreUsuario FROM usuario ORDER BY CodigoUsuario';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener usuarios:', err);
      return res.status(500).json({ 
        error: 'Error al obtener usuarios',
        details: err.message 
      });
    }
    res.json(results);
  });
});

// ========== RUTAS PARA CLIENTES ==========

// Obtener todos los clientes activos
app.get('/clientes', (req, res) => {
  const query = 'SELECT * FROM cliente WHERE ClienteActivo = 1 ORDER BY CodigoCliente';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener clientes:', err);
      return res.status(500).json({ error: 'Error al obtener clientes' });
    }
    res.json(results);
  });
});

// Obtener cliente por ID
app.get('/clientes/:id', (req, res) => {
  const { id } = req.params;
  const query = 'SELECT * FROM cliente WHERE CodigoCliente = ?';
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('Error al obtener cliente:', err);
      return res.status(500).json({ error: 'Error al obtener cliente' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    res.json(results[0]);
  });
});

// Solución alternativa: Generar CodigoCliente automáticamente en el servidor
// Reemplaza la ruta POST /clientes en server.js con este código:

app.post('/clientes', (req, res) => {
  const { Rut, RazonSocial, Telefono, Direccion, Comuna, Giro, ClienteActivo = 1 } = req.body;
  
  // Primero, obtener el próximo código disponible
  const getNextCodeQuery = 'SELECT COALESCE(MAX(CodigoCliente), 0) + 1 AS nextCode FROM cliente';
  
  db.query(getNextCodeQuery, (err, results) => {
    if (err) {
      console.error('Error al obtener próximo código:', err);
      return res.status(500).json({ error: 'Error al generar código de cliente' });
    }
    
    const nextCode = results[0].nextCode;
    
    // Ahora insertar el cliente con el código generado
    const insertQuery = 'INSERT INTO cliente (CodigoCliente, Rut, RazonSocial, Telefono, Direccion, Comuna, Giro, ClienteActivo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
    
    db.query(insertQuery, [nextCode, Rut, RazonSocial, Telefono, Direccion, Comuna, Giro, ClienteActivo], (err, result) => {
      if (err) {
        console.error('Error al crear cliente:', err);
        return res.status(500).json({ error: 'Error al crear cliente' });
      }
      
      res.status(201).json({ 
        message: 'Cliente creado exitosamente',
        CodigoCliente: nextCode
      });
    });
  });
});


// Actualizar cliente
app.put('/clientes/:id', (req, res) => {
  const { id } = req.params;
  const { Rut, RazonSocial, Telefono, Direccion, Comuna, Giro, ClienteActivo } = req.body;
  
  const query = 'UPDATE cliente SET Rut = ?, RazonSocial = ?, Telefono = ?, Direccion = ?, Comuna = ?, Giro = ?, ClienteActivo = ? WHERE CodigoCliente = ?';
  db.query(query, [Rut, RazonSocial, Telefono, Direccion, Comuna, Giro, ClienteActivo, id], (err, result) => {
    if (err) {
      console.error('Error al actualizar cliente:', err);
      return res.status(500).json({ error: 'Error al actualizar cliente' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    res.json({ message: 'Cliente actualizado exitosamente' });
  });
});

// Eliminar cliente (soft delete)
app.delete('/clientes/:id', (req, res) => {
  const { id } = req.params;
  const query = 'UPDATE cliente SET ClienteActivo = 0 WHERE CodigoCliente = ?';
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('Error al eliminar cliente:', err);
      return res.status(500).json({ error: 'Error al eliminar cliente' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    res.json({ message: 'Cliente eliminado exitosamente' });
  });
});

// ========== RUTAS PARA PRODUCTOS ==========

// Obtener todos los productos activos
app.get('/productos', (req, res) => {
  const query = 'SELECT * FROM producto WHERE ProductoActivo = 1 ORDER BY CodigoProducto';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener productos:', err);
      return res.status(500).json({ error: 'Error al obtener productos' });
    }
    res.json(results);
  });
});

// Obtener producto por ID
app.get('/productos/:id', (req, res) => {
  const { id } = req.params;
  const query = 'SELECT * FROM producto WHERE CodigoProducto = ?';
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('Error al obtener producto:', err);
      return res.status(500).json({ error: 'Error al obtener producto' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json(results[0]);
  });
});

// Crear nuevo producto
app.post('/productos', (req, res) => {
  const { Descripcion, PrecioSala, PrecioDto, ProductoActivo = 1 } = req.body;
  
  const query = 'INSERT INTO producto (Descripcion, PrecioSala, PrecioDto, ProductoActivo) VALUES (?, ?, ?, ?)';

  db.query(query, [Descripcion, PrecioSala, PrecioDto, ProductoActivo], (err, result) => {
    if (err) {
      console.error('Error al crear producto:', err);
      return res.status(500).json({ error: 'Error al crear producto' });
    }
    res.status(201).json({ 
      message: 'Producto creado exitosamente',
      CodigoProducto: result.insertId 
    });
  });
});

// Actualizar producto
app.put('/productos/:id', (req, res) => {
  const { id } = req.params;
  const { Descripcion, PrecioSala, PrecioDto, ProductoActivo } = req.body;
  
  const query = 'UPDATE producto SET Descripcion = ?, PrecioSala = ?, PrecioDto = ?, ProductoActivo = ? WHERE CodigoProducto = ?';
  db.query(query, [Descripcion, PrecioSala, PrecioDto, ProductoActivo, id], (err, result) => {
    if (err) {
      console.error('Error al actualizar producto:', err);
      return res.status(500).json({ error: 'Error al actualizar producto' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json({ message: 'Producto actualizado exitosamente' });
  });
});

// Eliminar producto (soft delete)
app.delete('/productos/:id', (req, res) => {
  const { id } = req.params;
  const query = 'UPDATE producto SET ProductoActivo = 0 WHERE CodigoProducto = ?';
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('Error al eliminar producto:', err);
      return res.status(500).json({ error: 'Error al eliminar producto' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }
    res.json({ message: 'Producto eliminado exitosamente' });
  });
});

// ========== RUTAS PARA BOLETAS ==========

// Obtener todas las boletas con información del cliente
app.get('/boletas', (req, res) => {
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
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener boletas:', err);
      return res.status(500).json({ error: 'Error al obtener boletas' });
    }
    res.json(results);
  });
});

// Obtener boleta por número con detalles
app.get('/boletas/:numero', (req, res) => {
  const { numero } = req.params;
  
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
      b.TotalBoleta
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
  
  db.query(queryBoleta, [numero], (err, boletaResults) => {
    if (err) {
      console.error('Error al obtener boleta:', err);
      return res.status(500).json({ error: 'Error al obtener boleta' });
    }
    
    if (boletaResults.length === 0) {
      return res.status(404).json({ error: 'Boleta no encontrada' });
    }
    
    db.query(queryDetalles, [numero], (err, detallesResults) => {
      if (err) {
        console.error('Error al obtener detalles:', err);
        return res.status(500).json({ error: 'Error al obtener detalles de la boleta' });
      }
      
      res.json({
        boleta: boletaResults[0],
        detalles: detallesResults
      });
    });
  });
});

// Crear nueva boleta con detalles
app.post('/boletas', (req, res) => {
  const { CodigoCliente, FechaBoleta, FechaVencimiento, TotalBoleta, detalles } = req.body;
  
  // Iniciar transacción
  db.beginTransaction((err) => {
    if (err) {
      console.error('Error al iniciar transacción:', err);
      return res.status(500).json({ error: 'Error al crear boleta' });
    }
    
    // Insertar boleta
    const queryBoleta = 'INSERT INTO boleta (CodigoCliente, FechaBoleta, FechaVencimiento, TotalBoleta) VALUES (?, ?, ?, ?)';
    db.query(queryBoleta, [CodigoCliente, FechaBoleta, FechaVencimiento, TotalBoleta], (err, result) => {
      if (err) {
        return db.rollback(() => {
          console.error('Error al crear boleta:', err);
          res.status(500).json({ error: 'Error al crear boleta' });
        });
      }
      
      const numeroBoleta = result.insertId;
      
      // Insertar detalles
      if (detalles && detalles.length > 0) {
        const queryDetalle = 'INSERT INTO detallesboleta (NumeroBoleta, CodigoProducto, Cantidad, PrecioUnitario, Subtotal) VALUES ?';
        const detallesData = detalles.map(detalle => [
          numeroBoleta,
          detalle.CodigoProducto,
          detalle.Cantidad,
          detalle.PrecioUnitario,
          detalle.Subtotal
        ]);
        
        db.query(queryDetalle, [detallesData], (err) => {
          if (err) {
            return db.rollback(() => {
              console.error('Error al crear detalles:', err);
              res.status(500).json({ error: 'Error al crear detalles de la boleta' });
            });
          }
          
          // Confirmar transacción
          db.commit((err) => {
            if (err) {
              return db.rollback(() => {
                console.error('Error al confirmar transacción:', err);
                res.status(500).json({ error: 'Error al crear boleta' });
              });
            }
            
            res.status(201).json({
              message: 'Boleta creada exitosamente',
              NumeroBoleta: numeroBoleta
            });
          });
        });
      } else {
        // Si no hay detalles, solo confirmar la boleta
        db.commit((err) => {
          if (err) {
            return db.rollback(() => {
              console.error('Error al confirmar transacción:', err);
              res.status(500).json({ error: 'Error al crear boleta' });
            });
          }
          
          res.status(201).json({
            message: 'Boleta creada exitosamente',
            NumeroBoleta: numeroBoleta
          });
        });
      }
    });
  });
});

// ========== RUTA AUXILIAR PARA ARTÍCULOS (PRODUCTOS ACTIVOS) ==========

// Obtener productos activos para generar boletas
app.get('/articulos', (req, res) => {
  const query = 'SELECT * FROM producto WHERE ProductoActivo = 1 ORDER BY Descripcion';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error al obtener artículos:', err);
      return res.status(500).json({ error: 'Error al obtener artículos' });
    }
    
    // Mapear para que coincida con la estructura esperada en el frontend
    const articulos = results.map(producto => ({
      CodigoArticulo: producto.CodigoProducto,
      Descripcion: producto.Descripcion,
      PrecioUnitario: producto.PrecioSala,
      PrecioDescuento: producto.PrecioDto,
      ArticuloActivo: producto.ProductoActivo
    }));
    
    res.json(articulos);
  });
});

// El puerto ahora viene de las variables de entorno
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});