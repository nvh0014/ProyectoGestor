// Script para verificar usuario en Railway
const axios = require('axios');

async function checkRailwayUser() {
  try {
    console.log('🌐 Verificando usuario Rodrigo en Railway...');
    
    // Probar login en Railway
    const response = await axios.post('https://gestorcerronegrobackend.up.railway.app/auth/login', {
      NombreUsuario: 'Rodrigo',
      Password: '123456' // Ajusta según la contraseña real
    });
    
    console.log('✅ Respuesta de Railway:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.user) {
      console.log(`\n🔍 RolAdmin en Railway: ${response.data.user.RolAdmin}`);
      console.log(`🔍 Es administrador: ${response.data.user.RolAdmin === 1 ? 'SÍ' : 'NO'}`);
    }
    
  } catch (error) {
    console.error('❌ Error al conectar con Railway:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

checkRailwayUser();
