// Script simple para verificar usuarios
const pool = require('./config/database');

async function simpleCheck() {
  try {
    console.log('Conectando a la base de datos...');
    
    // Verificar usuarios
    const [users] = await pool.execute('SELECT CodigoUsuario, NombreUsuario, RolAdmin FROM usuario ORDER BY CodigoUsuario');
    
    console.log('\n=== USUARIOS EN EL SISTEMA ===');
    if (users.length === 0) {
      console.log('❌ No hay usuarios en el sistema');
    } else {
      users.forEach(user => {
        const rolText = user.RolAdmin === 1 ? '👑 ADMIN' : '👤 NORMAL';
        console.log(`${user.CodigoUsuario}. ${user.NombreUsuario} - ${rolText}`);
      });
    }
    
    // Contar administradores
    const adminCount = users.filter(u => u.RolAdmin === 1).length;
    console.log(`\n📊 Total usuarios: ${users.length}`);
    console.log(`👑 Administradores: ${adminCount}`);
    console.log(`👤 Usuarios normales: ${users.length - adminCount}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

simpleCheck();
