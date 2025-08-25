const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Registrar usuario
router.post('/register', authController.register);

// Login usuario
router.post('/login', authController.login);

// Obtener usuarios
router.get('/usuarios', authController.getUsers);

// Actualizar usuario
router.put('/usuarios/:id', authController.updateUser);

// Eliminar usuario
router.delete('/usuarios/:id', authController.deleteUser);

module.exports = router;
