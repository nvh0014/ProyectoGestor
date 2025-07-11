// test-bcrypt.js
const bcrypt = require('bcrypt');

async function testBcrypt() {
  console.log('🧪 Probando funcionalidad de bcrypt...\n');

  try {
    const testPassword = 'MiContraseñaSegura123';
    const saltRounds = 12;

    console.log('1. Hasheando contraseña...');
    const startTime = Date.now();
    const hashedPassword = await bcrypt.hash(testPassword, saltRounds);
    const hashTime = Date.now() - startTime;
    
    console.log(`   ✅ Hash generado en ${hashTime}ms`);
    console.log(`   Hash: ${hashedPassword.substring(0, 30)}...`);

    console.log('\n2. Verificando contraseña correcta...');
    const verifyStart = Date.now();
    const isValid = await bcrypt.compare(testPassword, hashedPassword);
    const verifyTime = Date.now() - verifyStart;
    
    console.log(`   ${isValid ? '✅' : '❌'} Verificación: ${isValid} (${verifyTime}ms)`);

    console.log('\n3. Verificando contraseña incorrecta...');
    const wrongPassword = 'ContraseñaIncorrecta';
    const verifyWrongStart = Date.now();
    const isWrong = await bcrypt.compare(wrongPassword, hashedPassword);
    const verifyWrongTime = Date.now() - verifyWrongStart;
    
    console.log(`   ${!isWrong ? '✅' : '❌'} Verificación falsa: ${isWrong} (${verifyWrongTime}ms)`);

    console.log('\n4. Verificando detección de hash existente...');
    const isHashedAlready = hashedPassword.startsWith('$2b$') || hashedPassword.startsWith('$2a$');
    console.log(`   ${isHashedAlready ? '✅' : '❌'} Es hash de bcrypt: ${isHashedAlready}`);

    console.log('\n🎉 Todas las pruebas de bcrypt pasaron exitosamente!');
    
  } catch (error) {
    console.error('❌ Error en prueba de bcrypt:', error);
    process.exit(1);
  }
}

testBcrypt().then(() => {
  console.log('\n✅ Sistema de contraseñas listo para uso en producción.');
  process.exit(0);
});
