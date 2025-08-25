// Test de login directo
const bcrypt = require('bcrypt');
const pool = require('./config/database');

async function testLogin() {
  try {
    console.log('🧪 Probando login del usuario Rodrigo...');
    
    // Obtener datos del usuario
    const [data] = await pool.execute(
      'SELECT CodigoUsuario, NombreUsuario, Password, RolAdmin FROM usuario WHERE NombreUsuario = ?',
      ['Rodrigo']
    );
    
    if (data.length === 0) {
      console.log('❌ Usuario no encontrado');
      return;
    }
    
    const user = data[0];
    console.log('📋 Datos del usuario encontrado:');
    console.log(`   ID: ${user.CodigoUsuario}`);
    console.log(`   Nombre: ${user.NombreUsuario}`);
    console.log(`   RolAdmin: ${user.RolAdmin}`);
    console.log(`   Password Hash: ${user.Password.substring(0, 20)}...`);
    
    // Simular respuesta del login (como lo haría el controlador)
    const loginResponse = {
      status: 'success',
      message: 'Inicio de sesión exitoso',
      user: {
        CodigoUsuario: user.CodigoUsuario,
        NombreUsuario: user.NombreUsuario,
        RolAdmin: user.RolAdmin
      }
    };
    
    console.log('\n✅ Respuesta que debería recibir el frontend:');
    console.log(JSON.stringify(loginResponse, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testLogin();
