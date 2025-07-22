import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Register from './Register';
import Login from './Login';
import ProtectedRoute from './ProtectedRoute';

import GenerarBoleta from './pages/GenerarBoleta';
import Clientes from './pages/Clientes';
import Productos from './pages/Productos';
import RegistroBoletas from './pages/RegistroBoletas';
import Home from './Home';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Rutas protegidas */}
        <Route path="/home" element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        } />

        <Route path="/generarBoleta" element={
          <ProtectedRoute>
            <GenerarBoleta />
          </ProtectedRoute>
        } />
        
        <Route path="/clientes" element={
          <ProtectedRoute>
            <Clientes />
          </ProtectedRoute>
        } />
        
        <Route path="/productos" element={
          <ProtectedRoute>
            <Productos />
          </ProtectedRoute>
        } />
        
        <Route path="/registro-boletas" element={
          <ProtectedRoute>
            <RegistroBoletas />
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;