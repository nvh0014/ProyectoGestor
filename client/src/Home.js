import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { testConnection } from './config/api';
import './Home.css';


// Funciones para manejar cookies
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

const deleteCookie = (name) => {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

const Icons = {
  Package: () => (
    <div className="icon-package" role="img" aria-label="Artículos">
      📦
    </div>
  ),
  FileText: () => (
    <div className="icon-file" role="img" aria-label="Registro de boletas">
      📄
    </div>
  ),
  Users: () => (
    <div className="icon-users" role="img" aria-label="Clientes">
      👥
    </div>
  ),
  Receipt: () => (
    <div className="icon-receipt" role="img" aria-label="Generar boleta">
      🧾
    </div>
  ),
  Tag: () => (
    <div className="icon-tag" role="img" aria-label="Categorías">
      🏷️
    </div>
  ),
  Logout: () => (
    <div className="icon-logout" role="img" aria-label="Cerrar sesión">
    </div>
  ),
  User: () => (
    <div className="icon-user" role="img" aria-label="Usuarios">
      👤
    </div>
  )
};
const Home = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingCard, setLoadingCard] = useState(null);
  const [usuario, setUsuario] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  // Verificar autenticación al cargar el componente
  useEffect(() => {
    const usuarioLogueado = getCookie('usuario');
    const isLoggedIn = getCookie('isLoggedIn');
    
    if (!usuarioLogueado || !isLoggedIn) {
      // Si no hay cookies de sesión, redirigir al login
      Swal.fire({
        icon: 'warning',
        title: 'Acceso Restringido',
        text: 'Debe autenticarse para acceder a esta sección del sistema.',
        confirmButtonText: 'Iniciar Sesión'
      }).then(() => {
        navigate('/login', { replace: true });
      });
      return;
    }
    
    setUsuario(usuarioLogueado);

    // Verificar rol de administrador
    const userData = localStorage.getItem('userData');
    console.log('🔍 userData raw desde localStorage:', userData);
    if (userData) {
      try {
        const userInfo = JSON.parse(userData);
        console.log('🔍 userInfo parseado:', userInfo);
        console.log('🔍 userInfo.RolAdmin:', userInfo.RolAdmin);
        console.log('🔍 userInfo.RolAdmin === 1:', userInfo.RolAdmin === 1);
        setIsAdmin(userInfo.RolAdmin === 1);
        console.log('🔍 setIsAdmin llamado con:', userInfo.RolAdmin === 1);
      } catch (error) {
        console.error('Error al parsear userData:', error);
        setIsAdmin(false);
      }
    } else {
      console.log('❌ No se encontró userData en localStorage');
      setIsAdmin(false);
    }

    // Probar conexión con el backend
    const checkBackendConnection = async () => {
      const isConnected = await testConnection();
      if (!isConnected) {
        Swal.fire({
          icon: 'error',
          title: 'Error de Conectividad',
          text: 'No se puede establecer conexión con el servidor. Verifique el estado del servicio.',
          confirmButtonText: 'Entendido',
          footer: 'Asegúrese de que el servidor esté ejecutándose en el puerto 3001'
        });
      }
    };

    checkBackendConnection();
  }, [navigate]);

const menuItems = [
  {
    id: 'generar-boleta',
    title: 'GENERAR BOLETA',
    icon: Icons.Receipt,
    description: 'Crear nuevas boletas de venta',
    route: '/generarBoleta'
  },
  {
    id: 'clientes',
    title: 'CLIENTES',
    icon: Icons.Users,
    description: 'Gestionar base de clientes',
    route: '/clientes'
  },
  {
    id: 'productos',
    title: 'PRODUCTOS',
    icon: Icons.Package,
    description: 'Administrar inventario de productos',
    route: '/productos'
  },
  {
    id: 'registro-boletas',
    title: 'REGISTRO DE BOLETAS',
    icon: Icons.FileText,
    description: 'Historial de ventas realizadas',
    route: '/registro-boletas'
  },
  {
    id: 'usuarios',
    title: 'USUARIOS',
    icon: Icons.User,
    description: 'Administrar usuarios del sistema',
    route: '/usuarios'
  }
];

  // Función mejorada para cerrar sesión
  const cerrarSesion = async () => {
    const result = await Swal.fire({
      title: 'Cerrar Sesión',
      text: '¿Confirma que desea cerrar la sesión actual? Los cambios no guardados se perderán.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Cerrar Sesión',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        setIsLoading(true);

        // Simular llamada a API para cerrar sesión
        await new Promise(resolve => setTimeout(resolve, 500));

        // Limpiar datos de autenticación
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        sessionStorage.clear();
        
        // Eliminar cookies de sesión
        deleteCookie('usuario');
        deleteCookie('isLoggedIn');

        // Mostrar mensaje de éxito
        await Swal.fire({
          icon: 'success',
          title: 'Sesión Cerrada',
          text: 'Su sesión ha sido cerrada exitosamente.',
          confirmButtonText: 'Continuar',
          timer: 2000
        });

        // Navegar a login
        navigate('/login', { replace: true });

      } catch (error) {
        console.error('Error al cerrar sesión:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error del Sistema',
          text: 'Ha ocurrido un error al cerrar la sesión. Intente nuevamente.',
          confirmButtonText: 'Entendido'
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Función mejorada para manejar clicks en las cards
  const handleCardClick = async (item) => {
    if (isLoading || loadingCard === item.id) return;

    try {
      setLoadingCard(item.id);

      // Navegación con estado para pasar información
      navigate(item.route, {
        state: {
          fromHome: true,
          sectionTitle: item.title,
          sectionId: item.id
        }
      });

    } catch (error) {
      console.error('Error al navegar:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error de Navegación',
        text: 'No se pudo acceder a la sección solicitada. Intente nuevamente.',
        confirmButtonText: 'Entendido'
      });
    } finally {
      setLoadingCard(null);
    }
  };

  // Función para manejar teclas (accesibilidad)
  const handleKeyPress = (event, item) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleCardClick(item);
    }
  };

  // Efecto para limpiar estados al desmontar
  useEffect(() => {
    return () => {
      setIsLoading(false);
      setLoadingCard(null);
    };
  }, []);

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="header-content">
          {/* Logo a la izquierda */}
          <div className="header-logo">
            <button
              onClick={() => navigate('/home')}
              className="logo-button"
              aria-label="Volver al home"
              title="Volver al home principal"
            >
              <img 
                src="/logo512.png" 
                alt="Logo Distribuidora" 
                className="logo-image"
              />
            </button>
          </div>

          {/* Título centrado */}
          <div className="header-text-group">
            <h1 className="header-title">DISTRIBUIDORA CERRO NEGRO</h1>
            <p className="header-subtitle">Sistema de generación de boletas</p>
          </div>

          {/* Usuario y botón de cerrar sesión a la derecha */}
          <div className="header-actions">
            {usuario && (
              <p className="user-greeting">¡¡Bienvenido {usuario}!!</p>
            )}
            <button
              onClick={cerrarSesion}
              className="logout-button"
              disabled={isLoading}
              aria-label="Cerrar sesión"
              title="Cerrar sesión del sistema"
            >
              {isLoading ? (
                <span>Cerrando...</span>
              ) : (
                <span>CERRAR SESIÓN</span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="main-content">
        <div>
          <h2 className="home-title">Panel de Control</h2>
          <p className="home-subtitle">
            Gestiona distintos aspectos de tu distribuidora desde aquí
          </p>
        </div>

        <div className="cards-grid" role="grid">
          {menuItems
            .filter(item => {
              // Solo mostrar la opción de Usuarios a los administradores
              if (item.id === 'usuarios') {
                console.log('🔍 Filtro usuarios - isAdmin:', isAdmin);
                return isAdmin;
              }
              return true;
            })
            .map((item, index) => {
            const IconComponent = item.icon;
            const isCardLoading = loadingCard === item.id;

            return (
              <div
                key={item.id}
                className={`home-card ${isCardLoading ? 'loading' : ''}`}
                onClick={() => handleCardClick(item)}
                onKeyDown={(e) => handleKeyPress(e, item)}
                role="gridcell"
                tabIndex={0}
                aria-label={`${item.title}: ${item.description}`}
                title={item.description}
                style={{
                  animationDelay: `${index * 0.1}s`
                }}
              >
                <div className="card-icon">
                  <IconComponent />
                </div>
                <h3 className="card-title">{item.title}</h3>
                {isCardLoading && (
                  <div className="loading-indicator" aria-hidden="true">
                    Cargando...
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Información adicional del sistema */}
        <div className="system-info">
          <p className="system-version">
            v4.2
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="home-footer">
        <div className="footer-content">
          <div className="footer-section">
            <img 
              src="/logo512.png" 
              alt="Logo Distribuidora" 
              className="footer-logo"
            />
            <h4>DISTRIBUIDORA CERRO NEGRO</h4>
          </div>
          
          <div className="footer-section">
            <h4>Ubicación</h4>
            <p>📍 Av. Manuel Rodríguez 3604
            </p>
            <p>📍 Av. Manuel Rodríguez 1365
            </p>
            <p>Chiguayante</p>
          </div>
          
          {/* <div className="footer-section">
            <h4>Horarios de Atención</h4>
            <p>Lunes a Sábado: 10:00 - 22:00</p>
            <p>Domingos: Cerrado</p>
          </div> */}
          
          {/* <div className="footer-section">
            <h4>Contacto</h4>
            <p>📲 +56 9 5389 6258</p>
            <p>📲 +56 9 5665 6089</p>
          </div> */}
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2025 Distribuidora Cerro Negro. Todos los derechos reservados.</p>
          <p>nvh0014</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;