const bcrypt = require('bcrypt');
const pool = require('../config/database');

const SALT_ROUNDS = 12;

const authController = {
  // Registrar usuario
  register: async (req, res) => {
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
  },

  // Login usuario
  login: async (req, res) => {
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
  },

  // Obtener usuarios
  getUsers: async (req, res) => {
    try {
      const query = 'SELECT CodigoUsuario, NombreUsuario FROM usuario ORDER BY CodigoUsuario';
      const [results] = await pool.execute(query);
      res.json(results);
    } catch (err) {
      console.error('Error al obtener usuarios:', err);
      res.status(500).json({ error: 'Error al obtener usuarios' });
    }
  }
};

module.exports = authController;