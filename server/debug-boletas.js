#!/usr/bin/env node

// Script para debuggear el problema de crear boletas
require('dotenv').config();
process.env.RAILWAY_ENVIRONMENT = 'true';
process.env.NODE_ENV = 'production';

const pool = require('./config/database');

async function debugBoletas() {
  try {
    console.log('🔍 DEBUGGING CREAR BOLETAS');
    console.log('==========================');
    
    const connection = await pool.getConnection();
    
    // 1. Verificar estructura de tabla boleta
    console.log('\n📋 ESTRUCTURA TABLA BOLETA:');
    const [boletaStructure] = await connection.execute('DESCRIBE boleta');
    boletaStructure.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type} ${col.Null === 'NO' ? '(NOT NULL)' : '(NULL)'} ${col.Key ? `(${col.Key})` : ''}`);
    });
    
    // 2. Verificar estructura de tabla detallesboleta
    console.log('\n📋 ESTRUCTURA TABLA DETALLESBOLETA:');
    const [detallesStructure] = await connection.execute('DESCRIBE detallesboleta');
    detallesStructure.forEach(col => {
      console.log(`- ${col.Field}: ${col.Type} ${col.Null === 'NO' ? '(NOT NULL)' : '(NULL)'} ${col.Key ? `(${col.Key})` : ''}`);
    });
    
    // 3. Verificar si hay clientes
    console.log('\n👥 CLIENTES DISPONIBLES:');
    const [clientes] = await connection.execute('SELECT CodigoCliente, RazonSocial FROM cliente LIMIT 5');
    clientes.forEach(cliente => {
      console.log(`- ${cliente.CodigoCliente}: ${cliente.RazonSocial}`);
    });
    
    // 4. Verificar si hay productos
    console.log('\n📦 PRODUCTOS DISPONIBLES:');
    const [productos] = await connection.execute('SELECT CodigoProducto, Descripcion FROM producto LIMIT 5');
    productos.forEach(producto => {
      console.log(`- ${producto.CodigoProducto}: ${producto.Descripcion}`);
    });
    
    // 5. Intentar crear una boleta de prueba
    console.log('\n🧪 CREANDO BOLETA DE PRUEBA:');
    
    const testBoleta = {
      CodigoCliente: clientes[0]?.CodigoCliente || 1,
      FechaBoleta: new Date().toISOString().split('T')[0],
      FechaVencimiento: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
      TotalBoleta: 1000,
      Observaciones: 'Boleta de prueba'
    };
    
    console.log('Datos de boleta:', testBoleta);
    
    await connection.beginTransaction();
    
    const queryBoleta = 'INSERT INTO boleta (CodigoCliente, FechaBoleta, FechaVencimiento, TotalBoleta, Observaciones) VALUES (?, ?, ?, ?, ?)';
    const [result] = await connection.execute(queryBoleta, [
      testBoleta.CodigoCliente,
      testBoleta.FechaBoleta,
      testBoleta.FechaVencimiento,
      testBoleta.TotalBoleta,
      testBoleta.Observaciones
    ]);
    
    console.log('✅ Boleta creada con ID:', result.insertId);
    
    // Crear detalle de prueba
    if (productos[0]) {
      const queryDetalle = 'INSERT INTO detallesboleta (NumeroBoleta, CodigoProducto, Cantidad, PrecioUnitario, Subtotal) VALUES (?, ?, ?, ?, ?)';
      await connection.execute(queryDetalle, [
        result.insertId,
        productos[0].CodigoProducto,
        1,
        1000,
        1000
      ]);
      console.log('✅ Detalle de boleta creado');
    }
    
    await connection.commit();
    console.log('✅ Transacción completada exitosamente');
    
    connection.release();
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
  
  process.exit(0);
}

debugBoletas();
