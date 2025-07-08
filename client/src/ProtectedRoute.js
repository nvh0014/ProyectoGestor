import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import Swal from 'sweetalert2';

// Función para obtener cookies
const getCookie = (name) => {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for(let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [showAlert, setShowAlert] = useState(false);

  useEffect(() => {
    const usuario = getCookie('usuario');
    const isLoggedIn = getCookie('isLoggedIn');
    
    if (!usuario || !isLoggedIn) {
      setIsAuthenticated(false);
      if (!showAlert) {
        setShowAlert(true);
        Swal.fire({
          icon: 'warning',
          title: 'Acceso denegado',
          text: 'Debe iniciar sesión para acceder a esta página.',
          confirmButtonText: 'Entendido'
        });
      }
    } else {
      setIsAuthenticated(true);
    }
  }, [showAlert]);

  // Mientras verifica la autenticación, mostrar loading
  if (isAuthenticated === null) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.2rem',
        color: '#df9100'
      }}>
        Verificando autenticación...
      </div>
    );
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si está autenticado, mostrar el componente protegido
  return children;
};

export default ProtectedRoute;
