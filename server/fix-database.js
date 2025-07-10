const mysql = require('mysql2');

// Conexión a MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '141205',
  database: 'gestor',
});

db.connect((err) => {
  if (err) {
    console.error('Error al conectar con MySQL:', err);
    return;
  }
  console.log('✅ Conectado a MySQL');

  // Primero verificar la estructura actual de la tabla producto
  const describeQuery = 'DESCRIBE producto';
  db.query(describeQuery, (err, results) => {
    if (err) {
      console.error('❌ Error al describir tabla producto:', err);
      return;
    }
    
    console.log('📋 Estructura actual de la tabla producto:');
    console.table(results);
    
    // Verificar si CodigoProducto es AUTO_INCREMENT
    const codigoProductoField = results.find(field => field.Field === 'CodigoProducto');
    
    if (!codigoProductoField) {
      console.error('❌ El campo CodigoProducto no existe');
      db.end();
      return;
    }
    
    if (!codigoProductoField.Extra.includes('auto_increment')) {
      console.log('🔧 Aplicando corrección: Configurando CodigoProducto como AUTO_INCREMENT...');
      
      // Modificar la tabla para hacer CodigoProducto AUTO_INCREMENT
      const alterQuery = 'ALTER TABLE producto MODIFY COLUMN CodigoProducto INT AUTO_INCREMENT PRIMARY KEY';
      
      db.query(alterQuery, (err, results) => {
        if (err) {
          console.error('❌ Error al modificar tabla:', err);
          
          // Si el error es porque ya existe una clave primaria, intentar eliminarla primero
          if (err.code === 'ER_MULTIPLE_PRI_KEY') {
            console.log('🔄 Intentando eliminar clave primaria existente primero...');
            
            // Primero eliminar la clave primaria existente
            const dropPrimaryQuery = 'ALTER TABLE producto DROP PRIMARY KEY';
            db.query(dropPrimaryQuery, (err, results) => {
              if (err) {
                console.error('❌ Error al eliminar clave primaria:', err);
                db.end();
                return;
              }
              
              // Ahora agregar AUTO_INCREMENT y PRIMARY KEY
              const addAutoIncrementQuery = 'ALTER TABLE producto MODIFY COLUMN CodigoProducto INT AUTO_INCREMENT PRIMARY KEY';
              db.query(addAutoIncrementQuery, (err, results) => {
                if (err) {
                  console.error('❌ Error al agregar AUTO_INCREMENT:', err);
                } else {
                  console.log('✅ Tabla producto corregida exitosamente');
                  console.log('✅ CodigoProducto ahora es AUTO_INCREMENT PRIMARY KEY');
                }
                db.end();
              });
            });
          } else {
            db.end();
          }
        } else {
          console.log('✅ Tabla producto corregida exitosamente');
          console.log('✅ CodigoProducto ahora es AUTO_INCREMENT PRIMARY KEY');
          db.end();
        }
      });
    } else {
      console.log('✅ CodigoProducto ya está configurado como AUTO_INCREMENT');
      db.end();
    }
  });
});
