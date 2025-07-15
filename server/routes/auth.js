const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Registrar usuario
router.post('/register', authController.register);

// Login usuario
router.post('/login', authController.login);

// Obtener usuarios
router.get('/usuarios', authController.getUsers);

module.exports = router;
