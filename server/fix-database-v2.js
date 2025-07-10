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

  // Verificar las constraintes de clave foránea
  const showForeignKeysQuery = `
    SELECT 
      TABLE_NAME, COLUMN_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
    FROM 
      INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
    WHERE 
      REFERENCED_TABLE_SCHEMA = 'gestor' 
      AND REFERENCED_TABLE_NAME = 'producto'
  `;

  db.query(showForeignKeysQuery, (err, results) => {
    if (err) {
      console.error('❌ Error al consultar claves foráneas:', err);
      db.end();
      return;
    }

    console.log('🔗 Claves foráneas que referencian la tabla producto:');
    if (results.length > 0) {
      console.table(results);
      
      // Necesitamos deshabilitar temporalmente las claves foráneas
      console.log('🔧 Deshabilitando verificación de claves foráneas temporalmente...');
      
      db.query('SET FOREIGN_KEY_CHECKS = 0', (err) => {
        if (err) {
          console.error('❌ Error al deshabilitar claves foráneas:', err);
          db.end();
          return;
        }
        
        // Ahora modificar la columna para agregar AUTO_INCREMENT
        const alterQuery = 'ALTER TABLE producto MODIFY COLUMN CodigoProducto INT AUTO_INCREMENT';
        
        db.query(alterQuery, (err, results) => {
          if (err) {
            console.error('❌ Error al agregar AUTO_INCREMENT:', err);
          } else {
            console.log('✅ AUTO_INCREMENT agregado exitosamente a CodigoProducto');
          }
          
          // Reactivar las claves foráneas
          db.query('SET FOREIGN_KEY_CHECKS = 1', (err) => {
            if (err) {
              console.error('❌ Error al reactivar claves foráneas:', err);
            } else {
              console.log('✅ Claves foráneas reactivadas');
            }
            
            // Verificar la estructura final
            db.query('DESCRIBE producto', (err, results) => {
              if (err) {
                console.error('❌ Error al verificar estructura final:', err);
              } else {
                console.log('📋 Estructura final de la tabla producto:');
                console.table(results);
              }
              db.end();
            });
          });
        });
      });
      
    } else {
      console.log('ℹ️  No hay claves foráneas que referencien la tabla producto');
      
      // Intentar agregar AUTO_INCREMENT directamente
      const alterQuery = 'ALTER TABLE producto MODIFY COLUMN CodigoProducto INT AUTO_INCREMENT';
      
      db.query(alterQuery, (err, results) => {
        if (err) {
          console.error('❌ Error al agregar AUTO_INCREMENT:', err);
        } else {
          console.log('✅ AUTO_INCREMENT agregado exitosamente a CodigoProducto');
        }
        
        // Verificar la estructura final
        db.query('DESCRIBE producto', (err, results) => {
          if (err) {
            console.error('❌ Error al verificar estructura final:', err);
          } else {
            console.log('📋 Estructura final de la tabla producto:');
            console.table(results);
          }
          db.end();
        });
      });
    }
  });
});
