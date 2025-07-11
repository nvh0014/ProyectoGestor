// test-dependencies.js
console.log('Verificando dependencias...');

try {
  require('./geo-config');
  console.log('✅ geo-config OK');
  
  require('ipaddr.js');
  console.log('✅ ipaddr.js OK');
  
  require('node-cache');
  console.log('✅ node-cache OK');
  
  require('express');
  console.log('✅ express OK');
  
  require('mysql2');
  console.log('✅ mysql2 OK');
  
  console.log('✅ Todas las dependencias están disponibles');
  process.exit(0);
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
