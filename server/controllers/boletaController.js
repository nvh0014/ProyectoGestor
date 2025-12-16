const pool = require('../config/database');

const boletaController = {
  // Obtener todas las boletas (filtradas por usuario si no es admin)
  getBoletas: async (req, res) => {
    try {
      const { userId, isAdmin, fechaInicio, fechaFin, usuarioFiltro } = req.query;
      
      let query = `
        SELECT 
          b.NumeroBoleta,
          b.CodigoCliente,
          c.RazonSocial,
          b.FechaBoleta,
          b.FechaVencimiento,
          b.TotalBoleta,
          b.CodigoUsuario,
          b.Completada,
          u.NombreUsuario as VendedorNombre
        FROM boleta b
        INNER JOIN cliente c ON b.CodigoCliente = c.CodigoCliente
        LEFT JOIN usuario u ON b.CodigoUsuario = u.CodigoUsuario
        WHERE 1=1
      `;
      
      const params = [];
      
      // Si no es admin, solo mostrar sus boletas
      if (isAdmin === 'false' || isAdmin === '0') {
        query += ` AND b.CodigoUsuario = ?`;
        params.push(userId);
      } else if (usuarioFiltro) {
        // Si es admin y hay filtro de usuario específico
        query += ` AND b.CodigoUsuario = ?`;
        params.push(usuarioFiltro);
      }
      
      // Filtros de fecha
      if (fechaInicio) {
        query += ` AND b.FechaBoleta >= ?`;
        params.push(fechaInicio);
      }
      if (fechaFin) {
        query += ` AND b.FechaBoleta <= ?`;
        params.push(fechaFin);
      }
      
      query += ` ORDER BY b.NumeroBoleta DESC`;
      
      const [results] = await pool.execute(query, params);
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
          b.Observaciones,
          b.CodigoUsuario,
          u.NombreUsuario as VendedorNombre
        FROM boleta b
        INNER JOIN cliente c ON b.CodigoCliente = c.CodigoCliente
        LEFT JOIN usuario u ON b.CodigoUsuario = u.CodigoUsuario
        WHERE b.NumeroBoleta = ?
      `;

      const queryDetalles = `
        SELECT 
          db.IdDetalle as IdDetalleBoleta,
          db.CodigoProducto,
          p.Descripcion,
          db.Cantidad,
          db.PrecioUnitario,
          db.Subtotal,
          db.DescripcionProducto
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
    let { CodigoCliente, CodigoUsuario, FechaBoleta, FechaVencimiento, TotalBoleta, Observaciones, detalles } = req.body;

    // Limpiar strings vacíos
    CodigoCliente = CodigoCliente && CodigoCliente.toString().trim() !== '' ? CodigoCliente : null;
    CodigoUsuario = CodigoUsuario && CodigoUsuario.toString().trim() !== '' ? CodigoUsuario : null;

    // Log para debugging - ver qué se recibe
    console.log('🔍 Datos recibidos en createBoleta:', {
      CodigoCliente: CodigoCliente,
      CodigoUsuario: CodigoUsuario,
      CodigoUsuarioType: typeof CodigoUsuario,
      CodigoUsuarioNull: CodigoUsuario === null,
      CodigoUsuarioUndef: CodigoUsuario === undefined,
      CodigoUsuarioEmpty: CodigoUsuario === '',
      FechaBoleta: FechaBoleta,
      TotalBoleta: TotalBoleta,
      bodyKeys: Object.keys(req.body)
    });

    // Validación de datos requeridos
    if (!CodigoCliente || !CodigoUsuario || !FechaBoleta || !FechaVencimiento || !TotalBoleta) {
      console.log('❌ Validación fallida:', {
        CodigoCliente: !!CodigoCliente,
        CodigoUsuario: !!CodigoUsuario,
        FechaBoleta: !!FechaBoleta,
        FechaVencimiento: !!FechaVencimiento,
        TotalBoleta: !!TotalBoleta
      });
      return res.status(400).json({
        error: 'Datos requeridos faltantes',
        details: {
          CodigoCliente: !CodigoCliente ? 'Cliente es requerido' : 'OK',
          CodigoUsuario: !CodigoUsuario ? 'Vendedor es requerido' : 'OK',
          FechaBoleta: !FechaBoleta ? 'Fecha de boleta es requerida' : 'OK',
          FechaVencimiento: !FechaVencimiento ? 'Fecha de vencimiento es requerida' : 'OK',
          TotalBoleta: !TotalBoleta ? 'Total de boleta es requerido' : 'OK'
        }
      });
    }

    console.log('📝 Creando boleta con datos:', {
      CodigoCliente,
      CodigoUsuario,
      FechaBoleta,
      FechaVencimiento,
      TotalBoleta,
      Observaciones: Observaciones || '',
      detalles: detalles?.length || 0
    });

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Insertar boleta
      const queryBoleta = 'INSERT INTO boleta (CodigoCliente, CodigoUsuario, FechaBoleta, FechaVencimiento, TotalBoleta, Observaciones) VALUES (?, ?, ?, ?, ?, ?)';
      const [result] = await connection.execute(queryBoleta, [CodigoCliente, CodigoUsuario, FechaBoleta, FechaVencimiento, TotalBoleta, Observaciones || '']);

      const numeroBoleta = result.insertId;
      console.log('✅ Boleta creada con ID:', numeroBoleta);

      // Insertar detalles si existen
      if (detalles && detalles.length > 0) {
        const queryDetalle = 'INSERT INTO detallesboleta (NumeroBoleta, CodigoProducto, Cantidad, PrecioUnitario, Subtotal, DescripcionProducto) VALUES (?, ?, ?, ?, ?, ?)';

        for (const detalle of detalles) {
          console.log('📦 Insertando detalle:', detalle);
          await connection.execute(queryDetalle, [
            numeroBoleta,
            detalle.CodigoProducto,
            detalle.Cantidad,
            detalle.PrecioUnitario,
            detalle.Subtotal,
            detalle.DescripcionProducto || null
          ]);
        }
        console.log('✅ Detalles insertados:', detalles.length);
      }

      await connection.commit();
      console.log('✅ Transacción completada');

      res.status(201).json({
        message: 'Boleta creada exitosamente',
        NumeroBoleta: numeroBoleta
      });

    } catch (err) {
      await connection.rollback();
      console.error('❌ Error al crear boleta:', err);
      console.error('❌ Error code:', err.code);
      console.error('❌ Error errno:', err.errno);
      console.error('❌ SQL State:', err.sqlState);

      // Enviar error más específico
      let errorMessage = 'Error al crear boleta';
      if (err.code === 'ER_NO_SUCH_TABLE') {
        errorMessage = 'Tabla no encontrada en la base de datos';
      } else if (err.code === 'ER_BAD_FIELD_ERROR') {
        errorMessage = 'Campo no válido en la tabla';
      } else if (err.code === 'ER_DUP_ENTRY') {
        errorMessage = 'Datos duplicados';
      }

      res.status(500).json({
        error: errorMessage,
        details: err.message,
        code: err.code
      });
    } finally {
      connection.release();
    }
  },
// Eliminar boleta - versión mejorada con mejor manejo de errores
deleteBoleta: async (req, res) => {
  const { numero } = req.params;
  
  // Convertir a número para asegurar tipo correcto
  const numeroBoleta = parseInt(numero);
  
  if (isNaN(numeroBoleta)) {
    return res.status(400).json({ 
      error: 'Número de boleta inválido',
      details: 'El número debe ser un número válido'
    });
  }

  console.log('🔍 Iniciando eliminación de boleta ID:', numeroBoleta);
  
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Verificar que la boleta existe
    const checkQuery = 'SELECT NumeroBoleta FROM boleta WHERE NumeroBoleta = ?';
    const [checkResult] = await connection.execute(checkQuery, [numeroBoleta]);
    console.log('🔍 Resultado de verificación:', checkResult);

    if (checkResult.length === 0) {
      await connection.rollback();
      console.log('❌ Boleta no encontrada con ID:', numeroBoleta);
      return res.status(404).json({ error: 'Boleta no encontrada' });
    }

    console.log('✅ Boleta encontrada, procediendo con eliminación');

    // Verificar si existen detalles antes de eliminar
    const checkDetallesQuery = 'SELECT COUNT(*) as count FROM detallesboleta WHERE NumeroBoleta = ?';
    const [detallesCount] = await connection.execute(checkDetallesQuery, [numeroBoleta]);
    console.log('📦 Detalles encontrados:', detallesCount[0].count);

    // Eliminar detalles de la boleta primero
    if (detallesCount[0].count > 0) {
      const deleteDetallesQuery = 'DELETE FROM detallesboleta WHERE NumeroBoleta = ?';
      const [detallesResult] = await connection.execute(deleteDetallesQuery, [numeroBoleta]);
      console.log('✅ Detalles eliminados. Filas afectadas:', detallesResult.affectedRows);
    }

    // Eliminar la boleta principal
    const deleteBoletaQuery = 'DELETE FROM boleta WHERE NumeroBoleta = ?';
    const [boletaResult] = await connection.execute(deleteBoletaQuery, [numeroBoleta]);
    console.log('✅ Boleta eliminada. Filas afectadas:', boletaResult.affectedRows);

    if (boletaResult.affectedRows === 0) {
      await connection.rollback();
      console.log('❌ No se pudo eliminar la boleta - 0 filas afectadas');
      return res.status(500).json({ 
        error: 'No se pudo eliminar la boleta',
        details: 'La boleta existe pero no se pudo eliminar'
      });
    }

    await connection.commit();
    console.log('✅ Transacción completada exitosamente para boleta:', numeroBoleta);

    res.json({ 
      message: 'Boleta eliminada exitosamente',
      NumeroBoleta: numeroBoleta,
      detallesEliminados: detallesCount[0].count
    });

  } catch (err) {
    await connection.rollback();
    console.error('❌ Error al eliminar boleta:', err);
    console.error('❌ Error code:', err.code);
    console.error('❌ Error errno:', err.errno);
    console.error('❌ SQL State:', err.sqlState);
    console.error('❌ SQL Message:', err.sqlMessage);

    // Manejo específico de errores comunes
    let errorMessage = 'Error al eliminar boleta';
    let statusCode = 500;

    switch (err.code) {
      case 'ER_ROW_IS_REFERENCED_2':
        errorMessage = 'No se puede eliminar: la boleta tiene referencias en otras tablas';
        statusCode = 409; // Conflict
        break;
      case 'ER_NO_REFERENCED_ROW_2':
        errorMessage = 'Error de referencia en base de datos';
        statusCode = 409;
        break;
      case 'ER_LOCK_WAIT_TIMEOUT':
        errorMessage = 'Timeout en base de datos. Intente nuevamente';
        statusCode = 503; // Service Unavailable
        break;
      case 'ER_LOCK_DEADLOCK':
        errorMessage = 'Conflicto en base de datos. Intente nuevamente';
        statusCode = 503;
        break;
      default:
        errorMessage = 'Error interno del servidor';
    }

    res.status(statusCode).json({ 
      error: errorMessage,
      details: err.message,
      code: err.code,
      numeroBoleta: numeroBoleta
    });
  } finally {
    connection.release();
    console.log('🔒 Conexión a la base de datos liberada');
  }
},

  // Actualizar boleta (implementación completa)
  updateBoleta: async (req, res) => {
    const { numero } = req.params;
    const { detalles, totalBoleta, observaciones } = req.body;
    
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Verificar que la boleta existe
      const checkQuery = 'SELECT NumeroBoleta FROM boleta WHERE NumeroBoleta = ?';
      const [checkResult] = await connection.execute(checkQuery, [numero]);

      if (checkResult.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: 'Boleta no encontrada' });
      }

      // Actualizar boleta con nuevo total y observaciones
      const updateBoletaQuery = `
        UPDATE boleta 
        SET TotalBoleta = ?, Observaciones = ? 
        WHERE NumeroBoleta = ?
      `;
      
      await connection.execute(updateBoletaQuery, [
        totalBoleta, 
        observaciones || '', 
        numero
      ]);

      // Actualizar detalles si se proporcionan
      if (detalles && detalles.length > 0) {
        // Primero, obtener los detalles existentes para saber cuáles eliminar
        const getExistingQuery = 'SELECT IdDetalle FROM detallesboleta WHERE NumeroBoleta = ?';
        const [existingDetalles] = await connection.execute(getExistingQuery, [numero]);
        const existingIds = existingDetalles.map(d => d.IdDetalle);
        
        // IDs de detalles que se mantienen o actualizan
        const keepIds = detalles.filter(d => d.IdDetalleBoleta && !d.esNuevo).map(d => d.IdDetalleBoleta);
        
        // Eliminar detalles que ya no están en la lista
        const idsToDelete = existingIds.filter(id => !keepIds.includes(id));
        if (idsToDelete.length > 0) {
          const deleteQuery = `DELETE FROM detallesboleta WHERE IdDetalle IN (${idsToDelete.map(() => '?').join(',')}) AND NumeroBoleta = ?`;
          await connection.execute(deleteQuery, [...idsToDelete, numero]);
        }

        // Actualizar detalles existentes y agregar nuevos
        const updateDetalleQuery = `
          UPDATE detallesboleta 
          SET Cantidad = ?, PrecioUnitario = ?, Subtotal = ?, DescripcionProducto = ?
          WHERE IdDetalle = ? AND NumeroBoleta = ?
        `;

        const insertDetalleQuery = `
          INSERT INTO detallesboleta 
          (NumeroBoleta, CodigoProducto, Cantidad, PrecioUnitario, Subtotal, DescripcionProducto) 
          VALUES (?, ?, ?, ?, ?, ?)
        `;

        for (const detalle of detalles) {
          if (detalle.esNuevo || !detalle.IdDetalleBoleta) {
            // Insertar nuevo detalle
            await connection.execute(insertDetalleQuery, [
              numero,
              detalle.CodigoProducto,
              detalle.Cantidad,
              detalle.PrecioUnitario,
              detalle.Subtotal,
              detalle.DescripcionProducto || null
            ]);
          } else {
            // Actualizar detalle existente
            await connection.execute(updateDetalleQuery, [
              detalle.Cantidad,
              detalle.PrecioUnitario,
              detalle.Subtotal,
              detalle.DescripcionProducto || null,
              detalle.IdDetalleBoleta,
              numero
            ]);
          }
        }
      }

      await connection.commit();
      console.log('✅ Boleta actualizada con número:', numero);

      res.json({ 
        message: 'Boleta actualizada exitosamente',
        NumeroBoleta: numero
      });

    } catch (err) {
      await connection.rollback();
      console.error('Error al actualizar boleta:', err);
      res.status(500).json({ 
        error: 'Error al actualizar boleta',
        details: err.message
      });
    } finally {
      connection.release();
    }
  },

  // Obtener reporte de ventas por usuario y período
  getReporteVentas: async (req, res) => {
    try {
      const { userId, fechaInicio, fechaFin } = req.query;
      
      if (!userId || !fechaInicio || !fechaFin) {
        return res.status(400).json({ 
          error: 'Se requieren userId, fechaInicio y fechaFin' 
        });
      }
      
      const query = `
        SELECT 
          COUNT(b.NumeroBoleta) as TotalBoletas,
          SUM(b.TotalBoleta) as TotalVentas,
          AVG(b.TotalBoleta) as PromedioVenta,
          MIN(b.TotalBoleta) as VentaMinima,
          MAX(b.TotalBoleta) as VentaMaxima,
          u.NombreUsuario as Vendedor
        FROM boleta b
        LEFT JOIN usuario u ON b.CodigoUsuario = u.CodigoUsuario
        WHERE b.CodigoUsuario = ?
          AND b.FechaBoleta >= ?
          AND b.FechaBoleta <= ?
        GROUP BY b.CodigoUsuario, u.NombreUsuario
      `;
      
      const [results] = await pool.execute(query, [userId, fechaInicio, fechaFin]);
      
      if (results.length === 0) {
        return res.json({
          TotalBoletas: 0,
          TotalVentas: 0,
          PromedioVenta: 0,
          VentaMinima: 0,
          VentaMaxima: 0,
          Vendedor: 'Sin ventas en este período'
        });
      }
      
      res.json(results[0]);
    } catch (err) {
      console.error('Error al obtener reporte:', err);
      res.status(500).json({ error: 'Error al obtener reporte de ventas' });
    }
  },

  // Actualizar estado de completada de una boleta
  updateCompletada: async (req, res) => {
    const { numero } = req.params;
    const { completada } = req.body;

    try {
      const query = `UPDATE boleta SET Completada = ? WHERE NumeroBoleta = ?`;
      const [result] = await pool.execute(query, [completada ? 1 : 0, numero]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Boleta no encontrada' });
      }

      res.json({ 
        message: 'Estado actualizado correctamente',
        completada: completada ? 1 : 0
      });
    } catch (err) {
      console.error('Error al actualizar estado:', err);
      res.status(500).json({ error: 'Error al actualizar estado de la boleta' });
    }
  },

  // Actualizar estado de múltiples boletas
  updateCompletadaMultiple: async (req, res) => {
    const { boletas, completada } = req.body;

    try {
      if (!Array.isArray(boletas) || boletas.length === 0) {
        return res.status(400).json({ error: 'Se requiere un array de números de boleta' });
      }

      const placeholders = boletas.map(() => '?').join(',');
      const query = `UPDATE boleta SET Completada = ? WHERE NumeroBoleta IN (${placeholders})`;
      const params = [completada ? 1 : 0, ...boletas];
      
      const [result] = await pool.execute(query, params);

      res.json({ 
        message: `${result.affectedRows} boletas actualizadas correctamente`,
        actualizadas: result.affectedRows
      });
    } catch (err) {
      console.error('Error al actualizar estados:', err);
      res.status(500).json({ error: 'Error al actualizar estados de las boletas' });
    }
  }
};

module.exports = boletaController;
