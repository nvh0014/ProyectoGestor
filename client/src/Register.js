import React, { useEffect } from 'react'
import api from './config/api'
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { validarRegistro } from './components/Validaciones.js';
import './Register.css'; // Importar los estilos modulares

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

function Register() {
  const [NombreUsuario, setNombreUsuario] = React.useState('');
  const [Password, setPassword] = React.useState('');
  const [Password2, setPassword2] = React.useState('');
  const navigate = useNavigate();

  // Verificar si ya está logueado al cargar el componente
  useEffect(() => {
    const usuario = getCookie('usuario');
    const isLoggedIn = getCookie('isLoggedIn');
    
    if (usuario && isLoggedIn) {
      navigate('/home');
    }
  }, [navigate]);

    //FUNCION PARA LIMPIAR EL FORMULARIO
  const limpiarFormulario = () => {
    setNombreUsuario('');
    setPassword('');
    setPassword2('');
  };

  const addUser = () => {
    // Eliminar espacios en blanco al inicio y final
    const usuarioLimpio = NombreUsuario.trim();
    const passwordLimpio = Password.trim();
    const password2Limpio = Password2.trim();
    
    const errores = validarRegistro(usuarioLimpio, passwordLimpio, password2Limpio);

    if (errores.length > 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Validación de Datos',
        html: errores.map(error => `• ${error}`).join('<br>'),
        confirmButtonText: 'Corregir'
      });
      return;
    }

    api.post('/register', {
      NombreUsuario: usuarioLimpio,
      Password: passwordLimpio
    })
      .then((response) => {
        Swal.fire({
          icon: 'success',
          title: 'Registro Completado',
          text: 'Su cuenta ha sido creada exitosamente. Ahora puede iniciar sesión.',
          confirmButtonText: 'Continuar'
        }).then(() => {
          navigate('/login');
          limpiarFormulario(); // Limpiar el formulario después del registro exitoso
        });
      })
      .catch((error) => {
        if (error.response) {
          Swal.fire({
            icon: 'error',
            title: 'Error de Servidor',
            text: 'El servidor ha devuelto un error. Intente nuevamente.',
            confirmButtonText: 'Entendido'
          });
        } else if (error.request) {
          Swal.fire({
            icon: 'error',
            title: 'Error de Conexión',
            text: 'No se pudo establecer conexión con el servidor. Verifique su conexión e intente nuevamente.',
            confirmButtonText: 'Reintentar'
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error Inesperado',
            text: 'Ha ocurrido un error inesperado. Contacte al administrador del sistema.',
            confirmButtonText: 'Entendido'
          });
        }
      });
  }

  return (
    <div className="register-container">
      <div className="register-card">
        <h1>Registro de usuario</h1>

        <div className="form-group">
          <label htmlFor="NombreUsuario">Nombre de usuario</label>
          <input
            type="text"
            id="NombreUsuario"
            name="NombreUsuario"
            placeholder="Ingrese su nombre de usuario"
            value={NombreUsuario}
            required
            onChange={(e) => setNombreUsuario(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="Password">Contraseña</label>
          <input
            type="password"
            id="Password"
            name="Password"
            placeholder="Ingrese su contraseña"
            value={Password}
            required
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="Password2">Confirme su contraseña</label>
          <input
            type="password"
            id="Password2"
            name="Password2"
            placeholder="Confirme su contraseña"
            value={Password2}
            required
            onChange={(e) => setPassword2(e.target.value)}
          />
        </div>

        <button onClick={addUser}>Registrarse</button>

        <p>¿Ya estás registrado? <a href="/login">Inicia sesión</a></p>
      </div>
    </div>
  )

}

export default Register;