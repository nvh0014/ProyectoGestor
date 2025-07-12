// server.js
require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');

const app = express();

// Configuración para bcrypt
const SALT_ROUNDS = 12; // Número de rondas de salt (más alto = más seguro pero más lento)

// Configuración de la base de datos usando variables de entorno
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '141205',
  database: process.env.DB_NAME || 'gestor',
  port: process.env.DB_PORT || 3001
});

// Conectar a la base de datos
db.connect((err) => {
  if (err) {
    console.error('Error conectando a la base de datos:', err);
    console.error('Configuración de conexión:');
    console.error('- Host:', process.env.DB_HOST);
    console.error('- Puerto:', process.env.DB_PORT);
    console.error('- Base de datos:', process.env.DB_NAME);
    console.error('- Usuario:', process.env.DB_USER);
    return;
  }
  console.log('✅ Conectado exitosamente a la base de datos MySQL');
  console.log('🔌 Host:', process.env.DB_HOST);
  console.log('📊 Base de datos:', process.env.DB_NAME);

  // Verificar si existe al menos un usuario
  const checkUserQuery = 'SELECT COUNT(*) as count FROM usuario';
  db.query(checkUserQuery, (err, results) => {
    if (err) {
      console.error('Error al verificar usuarios:', err);
      return;
    }
    console.log('Base de datos verificada correctamente');
  });
});

// Middleware
app.use(cors({
  origin: [
    'https://gestorcerronegro.vercel.app',
    'http://localhost:3000'
  ],
  credentials: true
}));
app.use(express.json());

// Ruta para registrar usuario
app.post('/register', async (req, res) => {
  const { NombreUsuario, Password } = req.body;

  // Validar que se proporcionen los datos necesarios
  if (!NombreUsuario || !Password) {
    return res.status(400).json({ error: 'Nombre de usuario y contraseña son requeridos.' });
  }

  // Validar longitud mínima de contraseña
  if (Password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
  }

  try {
    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(Password, SALT_ROUNDS);
    
    const query = 'INSERT INTO usuario (NombreUsuario, Password) VALUES (?, ?)';
    db.query(query, [NombreUsuario, hashedPassword], (err, result) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(409).json({ message: 'El nombre de usuario ya está en uso.' });
        }
        console.error('Error al registrar usuario:', err);
        return res.status(500).json({ error: 'Error al registrar el usuario en la base de datos.' });
      }

      console.log(`✅ Usuario registrado: ${NombreUsuario}`);
      res.status(201).json({ message: 'Usuario registrado exitosamente.' });
    });
  } catch (error) {
    console.error('Error al hashear contraseña:', error);
    return res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// Ruta para el login del usuario
app.post('/login', async (req, res) => {
  const { NombreUsuario, Password } = req.body;
  
  // Validar que se proporcionen los datos necesarios
  if (!NombreUsuario || !Password) {
    return res.status(400).json({ error: 'Nombre de usuario y contraseña son requeridos.' });
  }

  try {
    // Buscar usuario en la base de datos
    const query = 'SELECT CodigoUsuario, NombreUsuario, Password FROM usuario WHERE NombreUsuario = ?';
    db.query(query, [NombreUsuario], async (err, data) => {
      if (err) {
        console.error('Error en consulta de login:', err);
        return res.status(500).json({ error: 'Error al iniciar sesión' });
      }
      
      if (data.length === 0) {
        console.log(`❌ Intento de login fallido: Usuario '${NombreUsuario}' no encontrado`);
        return res.status(401).json({ status: 'fail', error: 'Credenciales incorrectas' });
      }

      const user = data[0];
      
      // Verificar contraseña
      const passwordMatch = await bcrypt.compare(Password, user.Password);
      
      if (passwordMatch) {
        console.log(`✅ Login exitoso: ${NombreUsuario}`);
        return res.status(200).json({ 
          status: 'success', 
          message: 'Inicio de sesión exitoso',
          user: {
            CodigoUsuario: user.CodigoUsuario,
            NombreUsuario: user.NombreUsuario
          }
        });
      } else {
        console.log(`❌ Intento de login fallido: Contraseña incorrecta para '${NombreUsuario}'`);
        return res.status(401).json({ status: 'fail', error: 'Credenciales incorrectas' });
      }
    });
  } catch (error) {
    console.error('Error en proceso de login:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Ruta para migrar contraseñas existentes a hash (solo usar una vez)
app.post('/admin/migrate-passwords', async (req, res) => {
  const { adminKey } = req.body;
  
  // Clave simple para proteger esta función crítica
  if (adminKey !== process.env.ADMIN_MIGRATION_KEY && adminKey !== 'MIGRATE_PASSWORDS_2025') {
    return res.status(403).json({ error: 'Clave de administrador incorrecta' });
  }

  try {
    // Obtener todos los usuarios con contraseñas no hasheadas
    const query = 'SELECT CodigoUsuario, NombreUsuario, Password FROM usuario';
    db.query(query, async (err, users) => {
      if (err) {
        console.error('Error obteniendo usuarios:', err);
        return res.status(500).json({ error: 'Error obteniendo usuarios' });
      }

      let migratedCount = 0;
      let errors = 0;

      for (const user of users) {
        try {
          // Verificar si la contraseña ya está hasheada
          const isHashed = user.Password.startsWith('$2b$') || user.Password.startsWith('$2a$');
          
          if (!isHashed) {
            // Hashear la contraseña actual
            const hashedPassword = await bcrypt.hash(user.Password, SALT_ROUNDS);
            
            // Actualizar en la base de datos
            const updateQuery = 'UPDATE usuario SET Password = ? WHERE CodigoUsuario = ?';
            await new Promise((resolve, reject) => {
              db.query(updateQuery, [hashedPassword, user.CodigoUsuario], (updateErr) => {
                if (updateErr) reject(updateErr);
                else resolve();
              });
            });
            
            migratedCount++;
            console.log(`✅ Migrada contraseña para usuario: ${user.NombreUsuario}`);
          }
        } catch (userError) {
          console.error(`❌ Error migrando usuario ${user.NombreUsuario}:`, userError);
          errors++;
        }
      }

      res.json({
        message: 'Migración completada',
        totalUsers: users.length,
        migratedPasswords: migratedCount,
        errors: errors,
        timestamp: new Date().toISOString()
      });
    });
  } catch (error) {
    console.error('Error en migración de contraseñas:', error);
    res.status(500).json({ error: 'Error en migración de contraseñas' });
  }
});

// Ruta para cambiar contraseña de usuario
app.post('/change-password', async (req, res) => {
  const { NombreUsuario, CurrentPassword, NewPassword } = req.body;

  // Validar que se proporcionen todos los datos
  if (!NombreUsuario || !CurrentPassword || !NewPassword) {
    return res.status(400).json({ error: 'Todos los campos son requeridos.' });
  }

  // Validar longitud mínima de nueva contraseña
  if (NewPassword.length < 6) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres.' });
  }

  try {
    // Buscar usuario y verificar contraseña actual
    const query = 'SELECT CodigoUsuario, Password FROM usuario WHERE NombreUsuario = ?';
    db.query(query, [NombreUsuario], async (err, data) => {
      if (err) {
        console.error('Error buscando usuario:', err);
        return res.status(500).json({ error: 'Error interno del servidor' });
      }

      if (data.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const user = data[0];

      // Verificar contraseña actual
      const passwordMatch = await bcrypt.compare(CurrentPassword, user.Password);
      
      if (!passwordMatch) {
        console.log(`❌ Intento de cambio de contraseña fallido: Contraseña actual incorrecta para '${NombreUsuario}'`);
        return res.status(401).json({ error: 'Contraseña actual incorrecta' });
      }

      // Hashear nueva contraseña
      const hashedNewPassword = await bcrypt.hash(NewPassword, SALT_ROUNDS);

      // Actualizar contraseña en la base de datos
      const updateQuery = 'UPDATE usuario SET Password = ? WHERE CodigoUsuario = ?';
      db.query(updateQuery, [hashedNewPassword, user.CodigoUsuario], (updateErr) => {
        if (updateErr) {
          console.error('Error actualizando contraseña:', updateErr);
          return res.status(500).json({ error: 'Error al actualizar contraseña' });
        }

        console.log(`✅ Contraseña cambiada exitosamente para: ${NombreUsuario}`);
        res.json({ message: 'Contraseña cambiada exitosamente' });
      });
    });
  } catch (error) {
    console.error('Error en cambio de contraseña:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
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

// Función para verificar y agregar la columna Observaciones si no existe
function verificarColumnaObservaciones() {
  const checkQuery = `
    SELECT COLUMN_NAME 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'boleta' AND COLUMN_NAME = 'Observaciones'
  `;
  
  db.query(checkQuery, (err, results) => {
    if (err) {
      console.error('Error al verificar columna Observaciones:', err);
      return;
    }
    
    if (results.length === 0) {
      // La columna no existe, agregarla
      const addColumnQuery = 'ALTER TABLE boleta ADD COLUMN Observaciones TEXT';
      db.query(addColumnQuery, (err) => {
        if (err) {
          console.error('Error al agregar columna Observaciones:', err);
        } else {
          console.log('Columna Observaciones agregada exitosamente a la tabla boleta');
        }
      });
    } else {
      console.log('La columna Observaciones ya existe en la tabla boleta');
    }
  });
}

// Ejecutar la verificación al iniciar el servidor
verificarColumnaObservaciones();

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
  const { CodigoCliente, FechaBoleta, FechaVencimiento, TotalBoleta, Observaciones, detalles } = req.body;
  
  // Iniciar transacción
  db.beginTransaction((err) => {
    if (err) {
      console.error('Error al iniciar transacción:', err);
      return res.status(500).json({ error: 'Error al crear boleta' });
    }
    
    // Insertar boleta (incluyendo observaciones)
    const queryBoleta = 'INSERT INTO boleta (CodigoCliente, FechaBoleta, FechaVencimiento, TotalBoleta, Observaciones) VALUES (?, ?, ?, ?, ?)';
    db.query(queryBoleta, [CodigoCliente, FechaBoleta, FechaVencimiento, TotalBoleta, Observaciones || ''], (err, result) => {
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