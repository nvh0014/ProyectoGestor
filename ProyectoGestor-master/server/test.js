// test-connection.js - Crear este archivo para probar conexiones

// Función para probar el backend directamente
async function testBackend() {
  const baseURL = 'https://gestorcerronegrobacked.up.railway.app'; // Usa la URL correcta
  
  console.log('🔧 Probando conexión al backend...');
  
  try {
    // Test 1: Ruta básica
    console.log('\n1. Probando ruta básica...');
    const response1 = await fetch(`${baseURL}/`);
    const data1 = await response1.json();
    console.log('✅ Ruta básica:', data1);
    
    // Test 2: Ruta de test
    console.log('\n2. Probando ruta /test...');
    const response2 = await fetch(`${baseURL}/test`);
    const data2 = await response2.json();
    console.log('✅ Ruta test:', data2);
    
    // Test 3: Ruta de health
    console.log('\n3. Probando ruta /api/health...');
    const response3 = await fetch(`${baseURL}/api/health`);
    const data3 = await response3.json();
    console.log('✅ Health check:', data3);
    
    // Test 4: Prueba de CORS
    console.log('\n4. Probando CORS...');
    const response4 = await fetch(`${baseURL}/api/cors-test`, {
      method: 'GET',
      headers: {
        'Origin': 'https://gestorcerronegro.vercel.app',
        'Content-Type': 'application/json'
      }
    });
    const data4 = await response4.json();
    console.log('✅ CORS test:', data4);
    
    // Test 5: Prueba de base de datos
    console.log('\n5. Probando base de datos...');
    const response5 = await fetch(`${baseURL}/api/test-db`);
    const data5 = await response5.json();
    console.log('✅ DB test:', data5);
    
    console.log('\n🎉 Todas las pruebas pasaron exitosamente!');
    
  } catch (error) {
    console.error('❌ Error en las pruebas:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Función para probar login
async function testLogin() {
  const baseURL = 'https://gestorcerronegrobacked.up.railway.app';
  
  console.log('\n🔐 Probando login...');
  
  try {
    const response = await fetch(`${baseURL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://gestorcerronegro.vercel.app'
      },
      body: JSON.stringify({
        NombreUsuario: 'test',
        Password: 'test123'
      })
    });
    
    const data = await response.json();
    console.log('📊 Respuesta login:', data);
    
    if (response.ok) {
      console.log('✅ Login exitoso');
    } else {
      console.log('⚠️ Login falló (normal si no existe el usuario)');
    }
    
  } catch (error) {
    console.error('❌ Error en login:', error.message);
  }
}

// Ejecutar pruebas
async function runAllTests() {
  await testBackend();
  await testLogin();
}

// Ejecutar si se llama directamente
if (typeof window === 'undefined') {
  // Node.js environment
  runAllTests();
} else {
  // Browser environment
  window.testBackend = testBackend;
  window.testLogin = testLogin;
  window.runAllTests = runAllTests;
}