const pool = require('./config/database');

async function checkUsuarioTable() {
  try {
    console.log('📊 Verificando estructura de la tabla usuario...');
    
    // Verificar estructura actual
    const [columns] = await pool.execute('DESCRIBE usuario');
    console.log('\n🏗️ Estructura actual:');
    columns.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type} (${col.Null === 'YES' ? 'NULL' : 'NOT NULL'})`);
    });
    
    // Verificar si existe RolAdmin
    const hasRolAdmin = columns.some(col => col.Field === 'RolAdmin');
    console.log(`\n🔍 Campo RolAdmin: ${hasRolAdmin ? '✅ Existe' : '❌ No existe'}`);
    
    if (!hasRolAdmin) {
      console.log('\n🛠️ Agregando campo RolAdmin...');
      await pool.execute('ALTER TABLE usuario ADD COLUMN RolAdmin TINYINT(1) DEFAULT 0');
      console.log('✅ Campo RolAdmin agregado exitosamente');
    }
    
    // Verificar usuarios existentes
    const [users] = await pool.execute('SELECT CodigoUsuario, NombreUsuario, RolAdmin FROM usuario');
    console.log('\n👥 Usuarios existentes:');
    users.forEach(user => {
      console.log(`- ${user.NombreUsuario} (ID: ${user.CodigoUsuario}, Admin: ${user.RolAdmin ? 'Sí' : 'No'})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
}

checkUsuarioTable();
