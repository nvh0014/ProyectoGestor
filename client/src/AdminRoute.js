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

const AdminRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [isAdmin, setIsAdmin] = useState(null);
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
          title: 'Acceso Restringido',
          text: 'Debe autenticarse para acceder a esta sección del sistema.',
          confirmButtonText: 'Iniciar Sesión'
        });
      }
    } else {
      setIsAuthenticated(true);
      
      // Verificar rol de administrador
      const userData = localStorage.getItem('userData');
      if (userData) {
        try {
          const userInfo = JSON.parse(userData);
          if (userInfo.RolAdmin === 1) {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
            if (!showAlert) {
              setShowAlert(true);
              Swal.fire({
                icon: 'error',
                title: 'Acceso Denegado',
                text: 'Solo los administradores pueden acceder a esta página.',
                confirmButtonText: 'Entendido'
              });
            }
          }
        } catch (error) {
          console.error('Error al parsear userData:', error);
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(false);
      }
    }
  }, [showAlert]);

  // Mientras verifica la autenticación y permisos, mostrar loading
  if (isAuthenticated === null || isAdmin === null) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.2rem',
        color: '#df9100'
      }}>
        Verificando permisos...
      </div>
    );
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si no es administrador, redirigir al home
  if (!isAdmin) {
    return <Navigate to="/home" replace />;
  }

  // Si está autenticado y es admin, mostrar el componente protegido
  return children;
};

export default AdminRoute;
