// password-config.js
// Configuración para el sistema de contraseñas

module.exports = {
  // Configuración de bcrypt
  bcrypt: {
    saltRounds: 12, // Número de rondas de salt (10-12 recomendado para producción)
    // Más rondas = más seguro pero más lento
    // 10 = ~100ms, 12 = ~300ms, 15 = ~3s
  },

  // Validaciones de contraseña
  validation: {
    minLength: 6,
    maxLength: 128,
    requireUppercase: false,    // Cambiar a true para requerir mayúsculas
    requireLowercase: false,    // Cambiar a true para requerir minúsculas
    requireNumbers: false,      // Cambiar a true para requerir números
    requireSpecialChars: false, // Cambiar a true para requerir caracteres especiales
    
    // Caracteres especiales permitidos
    specialChars: '!@#$%^&*(),.?":{}|<>[]_-+=',
    
    // Palabras prohibidas (contraseñas comunes)
    forbiddenPasswords: [
      'password',
      'password123',
      '123456',
      '123456789',
      'qwerty',
      'abc123',
      'password1',
      'admin',
      'administrator',
      'root',
      'user',
      'guest',
      'test'
    ]
  },

  // Configuración de seguridad
  security: {
    // Número máximo de intentos de login fallidos antes de bloquear temporalmente
    maxLoginAttempts: 5,
    
    // Tiempo de bloqueo en minutos después de exceder intentos
    lockoutDuration: 15,
    
    // Tiempo de expiración de contraseña en días (0 = nunca expira)
    passwordExpireDays: 0,
    
    // Historial de contraseñas (no permitir reusar las últimas N contraseñas)
    passwordHistory: 0,
    
    // Requerir cambio de contraseña en primer login
    requirePasswordChangeOnFirstLogin: false
  },

  // Configuración de respuestas
  responses: {
    // Mensajes de error generales (no específicos para evitar enumeration attacks)
    genericLoginError: 'Credenciales incorrectas',
    genericRegistrationError: 'Error en el registro',
    
    // Mensajes específicos para validación de contraseñas
    passwordTooShort: 'La contraseña debe tener al menos {minLength} caracteres',
    passwordTooLong: 'La contraseña no puede tener más de {maxLength} caracteres',
    passwordRequireUppercase: 'La contraseña debe contener al menos una letra mayúscula',
    passwordRequireLowercase: 'La contraseña debe contener al menos una letra minúscula',
    passwordRequireNumbers: 'La contraseña debe contener al menos un número',
    passwordRequireSpecialChars: 'La contraseña debe contener al menos un carácter especial',
    passwordForbidden: 'Esta contraseña es muy común, por favor elige una más segura'
  },

  // Configuración de logging
  logging: {
    logSuccessfulLogins: true,
    logFailedLogins: true,
    logPasswordChanges: true,
    logPasswordMigrations: true,
    
    // No loggear contraseñas reales (siempre debe ser false)
    logPasswords: false
  }
};
