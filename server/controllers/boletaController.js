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
          db.IdDetalle,
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
  // Eliminar boleta (optimizada)
  deleteBoleta: async (req, res) => {
    const { id } = req.params;
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Primero verificar que la boleta existe
      const checkQuery = 'SELECT NumeroBoleta FROM boleta WHERE NumeroBoleta = ?';
      const [checkResult] = await connection.execute(checkQuery, [id]);

      if (checkResult.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: 'Boleta no encontrada' });
      }

      // Eliminar detalles de la boleta (claves foráneas)
      const queryDetalles = 'DELETE FROM detallesboleta WHERE NumeroBoleta = ?';
      await connection.execute(queryDetalles, [id]);
      console.log('✅ Detalles de boleta eliminados para el número:', id);

      // Eliminar la boleta
      const queryBoleta = 'DELETE FROM boleta WHERE NumeroBoleta = ?';
      const [result] = await connection.execute(queryBoleta, [id]);
      console.log('✅ Boleta eliminada con número:', id);

      await connection.commit();
      res.json({ 
        message: 'Boleta eliminada exitosamente',
        NumeroBoleta: id
      });

    } catch (err) {
      await connection.rollback();
      console.error('Error al eliminar boleta:', err);
      res.status(500).json({ 
        error: 'Error al eliminar boleta',
        details: err.message
      });
    } finally {
      connection.release();
    }
  },

  // Actualizar boleta (implementación completa)
  // updateBoleta: async (req, res) => {
  //   const { id } = req.params;
  //   const { CodigoCliente, CodigoUsuario, FechaBoleta, FechaVencimiento, TotalBoleta, Observaciones, detalles } = req.body;
    
  //   const connection = await pool.getConnection();

  //   try {
  //     await connection.beginTransaction();

  //     // Verificar que la boleta existe
  //     const checkQuery = 'SELECT NumeroBoleta FROM boleta WHERE NumeroBoleta = ?';
  //     const [checkResult] = await connection.execute(checkQuery, [id]);

  //     if (checkResult.length === 0) {
  //       await connection.rollback();
  //       return res.status(404).json({ error: 'Boleta no encontrada' });
  //     }

  //     // Actualizar boleta
  //     const updateBoletaQuery = `
  //       UPDATE boleta 
  //       SET CodigoCliente = ?, CodigoUsuario = ?, FechaBoleta = ?, 
  //           FechaVencimiento = ?, TotalBoleta = ?, Observaciones = ? 
  //       WHERE NumeroBoleta = ?
  //     `;
      
  //     await connection.execute(updateBoletaQuery, [
  //       CodigoCliente, 
  //       CodigoUsuario, 
  //       FechaBoleta, 
  //       FechaVencimiento, 
  //       TotalBoleta, 
  //       Observaciones || '', 
  //       id
  //     ]);

  //     // Si se proporcionan detalles, actualizar también
  //     if (detalles && detalles.length > 0) {
  //       // Eliminar detalles existentes
  //       const deleteDetallesQuery = 'DELETE FROM detallesboleta WHERE NumeroBoleta = ?';
  //       await connection.execute(deleteDetallesQuery, [id]);

  //       // Insertar nuevos detalles
  //       const insertDetalleQuery = `
  //         INSERT INTO detallesboleta 
  //         (NumeroBoleta, CodigoProducto, Cantidad, PrecioUnitario, Subtotal, DescripcionProducto) 
  //         VALUES (?, ?, ?, ?, ?, ?)
  //       `;

  //       for (const detalle of detalles) {
  //         await connection.execute(insertDetalleQuery, [
  //           id,
  //           detalle.CodigoProducto,
  //           detalle.Cantidad,
  //           detalle.PrecioUnitario,
  //           detalle.Subtotal,
  //           detalle.DescripcionProducto || null
  //         ]);
  //       }
  //     }

  //     await connection.commit();
  //     console.log('✅ Boleta actualizada con número:', id);

  //     res.json({ 
  //       message: 'Boleta actualizada exitosamente',
  //       NumeroBoleta: id
  //     });

  //   } catch (err) {
  //     await connection.rollback();
  //     console.error('Error al actualizar boleta:', err);
  //     res.status(500).json({ 
  //       error: 'Error al actualizar boleta',
  //       details: err.message
  //     });
  //   } finally {
  //     connection.release();
  //   }
  // }
};

module.exports = boletaController;
