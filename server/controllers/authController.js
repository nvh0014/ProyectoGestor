const bcrypt = require('bcrypt');
const pool = require('../config/database');

const SALT_ROUNDS = 12;

const authController = {
  // Registrar usuario
  register: async (req, res) => {
    const { NombreUsuario, Password, RolAdmin } = req.body;

    if (!NombreUsuario || !Password) {
      return res.status(400).json({ error: 'Nombre de usuario y contraseña son requeridos.' });
    }

    if (Password.length < 6) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
    }

    try {
      const hashedPassword = await bcrypt.hash(Password, SALT_ROUNDS);
      const query = 'INSERT INTO usuario (NombreUsuario, Password, RolAdmin) VALUES (?, ?, ?)';
      await pool.execute(query, [NombreUsuario, hashedPassword, RolAdmin ? 1 : 0]);
      
      console.log(`✅ Usuario registrado: ${NombreUsuario} (Admin: ${RolAdmin ? 'Sí' : 'No'})`);
      res.status(201).json({ message: 'Usuario registrado exitosamente.' });
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ message: 'El nombre de usuario ya está en uso.' });
      }
      console.error('Error al registrar usuario:', error);
      return res.status(500).json({ error: 'Error al registrar el usuario.' });
    }
  },

  // Login usuario
  login: async (req, res) => {
    const { NombreUsuario, Password } = req.body;
    
    if (!NombreUsuario || !Password) {
      return res.status(400).json({ error: 'Nombre de usuario y contraseña son requeridos.' });
    }

    try {
      const query = 'SELECT CodigoUsuario, NombreUsuario, Password, RolAdmin FROM usuario WHERE NombreUsuario = ?';
      const [data] = await pool.execute(query, [NombreUsuario]);
      
      if (data.length === 0) {
        return res.status(401).json({ status: 'fail', error: 'Credenciales incorrectas' });
      }

      const user = data[0];
      const passwordMatch = await bcrypt.compare(Password, user.Password);
      
      if (passwordMatch) {
        console.log(`✅ Acceso autorizado: ${NombreUsuario} (Admin: ${user.RolAdmin ? 'Sí' : 'No'})`);
        return res.status(200).json({ 
          status: 'success', 
          message: 'Inicio de sesión exitoso',
          user: {
            CodigoUsuario: user.CodigoUsuario,
            NombreUsuario: user.NombreUsuario,
            RolAdmin: user.RolAdmin
          }
        });
      } else {
        return res.status(401).json({ status: 'fail', error: 'Credenciales incorrectas' });
      }
    } catch (error) {
      console.error('Error en login:', error);
      return res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Obtener usuarios (solo para administradores)
  getUsers: async (req, res) => {
    try {
      // Por ahora no tenemos middleware de autenticación, pero deberíamos verificar
      // que el usuario que hace la petición sea administrador
      console.log('📋 Solicitando lista de usuarios...');
      
      const query = `
        SELECT 
          CodigoUsuario as id,
          NombreUsuario as nombre,
          RolAdmin,
          DATE_FORMAT(DATE('2024-01-01'), '%Y-%m-%d') as fechaCreacion
        FROM usuario 
        ORDER BY CodigoUsuario
      `;
      
      const [results] = await pool.execute(query);
      
      // Formatear datos para el frontend
      const usuarios = results.map(user => ({
        id: user.id,
        nombre: user.nombre,
        email: `${user.nombre.toLowerCase()}@empresa.com`, // Email simulado
        rol: user.RolAdmin ? 'Administrador' : 'Usuario',
        rolAdmin: user.RolAdmin,
        fechaCreacion: user.fechaCreacion
      }));
      
      console.log(`✅ Enviando ${usuarios.length} usuarios`);
      res.json(usuarios);
    } catch (err) {
      console.error('❌ Error al obtener usuarios:', err);
      res.status(500).json({ error: 'Error al obtener usuarios' });
    }
  },

  // Actualizar usuario (solo para administradores)
  updateUser: async (req, res) => {
    try {
      const { id } = req.params;
      const { NombreUsuario, RolAdmin, Password } = req.body;
      
      console.log(`📝 Actualizando usuario ${id}:`, { NombreUsuario, RolAdmin, hasPassword: !!Password });
      
      let query, params;
      
      if (Password && Password.trim()) {
        // Actualizar con nueva contraseña
        if (Password.length < 6) {
          return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
        }
        
        const hashedPassword = await bcrypt.hash(Password, SALT_ROUNDS);
        query = `
          UPDATE usuario 
          SET NombreUsuario = ?, RolAdmin = ?, Password = ?
          WHERE CodigoUsuario = ?
        `;
        params = [NombreUsuario, RolAdmin ? 1 : 0, hashedPassword, id];
      } else {
        // Actualizar sin cambiar contraseña
        query = `
          UPDATE usuario 
          SET NombreUsuario = ?, RolAdmin = ?
          WHERE CodigoUsuario = ?
        `;
        params = [NombreUsuario, RolAdmin ? 1 : 0, id];
      }
      
      const [result] = await pool.execute(query, params);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      
      console.log(`✅ Usuario ${id} actualizado exitosamente`);
      res.json({ message: 'Usuario actualizado exitosamente' });
    } catch (err) {
      console.error('❌ Error al actualizar usuario:', err);
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'El nombre de usuario ya está en uso' });
      }
      res.status(500).json({ error: 'Error al actualizar usuario' });
    }
  },

  // Eliminar usuario (solo para administradores)
  deleteUser: async (req, res) => {
    try {
      const { id } = req.params;
      
      console.log(`🗑️ Eliminando usuario ${id}`);
      
      // Verificar que no sea el último administrador
      const [adminCheck] = await pool.execute(
        'SELECT COUNT(*) as adminCount FROM usuario WHERE RolAdmin = 1'
      );
      
      const [userCheck] = await pool.execute(
        'SELECT RolAdmin FROM usuario WHERE CodigoUsuario = ?',
        [id]
      );
      
      if (userCheck.length === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      
      if (userCheck[0].RolAdmin && adminCheck[0].adminCount <= 1) {
        return res.status(400).json({ 
          error: 'No se puede eliminar el último administrador del sistema' 
        });
      }
      
      const query = 'DELETE FROM usuario WHERE CodigoUsuario = ?';
      const [result] = await pool.execute(query, [id]);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      
      console.log(`✅ Usuario ${id} eliminado exitosamente`);
      res.json({ message: 'Usuario eliminado exitosamente' });
    } catch (err) {
      console.error('❌ Error al eliminar usuario:', err);
      res.status(500).json({ error: 'Error al eliminar usuario' });
    }
  }
};

module.exports = authController;
