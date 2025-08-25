const bcrypt = require('bcrypt');
const pool = require('./config/database');

async function createAdmin() {
  try {
    console.log('🔧 Verificando y creando usuario administrador...');
    
    // Verificar usuarios existentes
    const [users] = await pool.execute('SELECT CodigoUsuario, NombreUsuario, RolAdmin FROM usuario');
    console.log('\n👥 Usuarios existentes:');
    users.forEach(user => {
      console.log(`- ${user.NombreUsuario} (ID: ${user.CodigoUsuario}, Admin: ${user.RolAdmin ? 'Sí' : 'No'})`);
    });
    
    // Verificar si ya existe un administrador
    const [admins] = await pool.execute('SELECT COUNT(*) as count FROM usuario WHERE RolAdmin = 1');
    const adminCount = admins[0].count;
    
    console.log(`\n🔍 Administradores existentes: ${adminCount}`);
    
    if (adminCount === 0) {
      console.log('\n⚠️ No hay administradores en el sistema!');
      console.log('🛠️ Creando usuario administrador por defecto...');
      
      // Crear usuario admin por defecto
      const defaultAdmin = {
        usuario: 'admin',
        password: 'admin123'
      };
      
      const hashedPassword = await bcrypt.hash(defaultAdmin.password, 12);
      
      await pool.execute(
        'INSERT INTO usuario (NombreUsuario, Password, RolAdmin) VALUES (?, ?, ?)',
        [defaultAdmin.usuario, hashedPassword, 1]
      );
      
      console.log('✅ Usuario administrador creado:');
      console.log(`   Usuario: ${defaultAdmin.usuario}`);
      console.log(`   Contraseña: ${defaultAdmin.password}`);
      console.log('   ⚠️ IMPORTANTE: Cambia esta contraseña después del primer login');
      
    } else {
      console.log('✅ Ya existe al menos un administrador en el sistema');
    }
    
    // Mostrar usuarios finales
    const [finalUsers] = await pool.execute('SELECT CodigoUsuario, NombreUsuario, RolAdmin FROM usuario');
    console.log('\n📋 Estado final de usuarios:');
    finalUsers.forEach(user => {
      console.log(`- ${user.NombreUsuario} (ID: ${user.CodigoUsuario}, Admin: ${user.RolAdmin ? 'Sí' : 'No'})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

createAdmin();
