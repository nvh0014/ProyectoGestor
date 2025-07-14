import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';
import api from './config/api';
import Swal from 'sweetalert2';
import './Login.css'; // Importar los estilos modulares

// Función para manejar cookies
const setCookie = (name, value, days) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
};

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

function Login() {
    const [NombreUsuario, setNombreUsuario] = useState("");
    const [Password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const Navigate = useNavigate();

    // Verificar si ya está logueado al cargar el componente
    useEffect(() => {
        const usuario = getCookie('usuario');
        if (usuario) {
            Navigate('/home');
        }
    }, [Navigate]);

    const loginUser = () => {
        // Eliminar espacios en blanco al inicio y final
        const usuarioLimpio = NombreUsuario.trim();
        const passwordLimpio = Password.trim();
        
        if (!usuarioLimpio || !passwordLimpio) {
            Swal.fire({
                icon: 'warning',
                title: 'Campos Requeridos',
                text: 'Por favor, complete todos los campos del formulario para continuar.',
                confirmButtonText: 'Entendido'
            });
            return;
        }

        setIsLoading(true);

        api.post('/login', {
            NombreUsuario: usuarioLimpio,
            Password: passwordLimpio
        })
            .then((res) => {
                if (res.data.status === 'success') {
                    // Guardar el usuario en una cookie por 7 días (sin espacios)
                    setCookie('usuario', usuarioLimpio, 7);
                    setCookie('isLoggedIn', 'true', 7);
                    
                    Swal.fire({
                        icon: 'success',
                        title: 'Inicio de Sesión Exitoso',
                        text: 'Bienvenido al sistema de gestión empresarial.',
                        confirmButtonText: 'Continuar'
                    }).then(() => {
                        Navigate('/home');
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Credenciales Incorrectas',
                        text: 'Los datos de acceso ingresados no son válidos. Verifique su usuario y contraseña.',
                        confirmButtonText: 'Reintentar'
                    });
                }
            })
            .catch((error) => {
                let errorMessage = 'Error de conexión desconocido.';
                
                if (error.response) {
                    // El servidor respondió con un error
                    errorMessage = error.response.data?.error || `Error ${error.response.status}: ${error.response.statusText}`;
                } else if (error.request) {
                    // La petición se hizo pero no hubo respuesta
                    errorMessage = 'No se recibió respuesta del servidor. Verifique que el servidor esté ejecutándose en puerto 3001.';
                } else {
                    // Error en la configuración de la petición
                    errorMessage = `Error de configuración: ${error.message}`;
                }
                
                Swal.fire({
                    icon: 'error',
                    title: 'Error de Conexión',
                    text: errorMessage,
                    confirmButtonText: 'Reintentar'
                });
            })
            .finally(() => {
                setIsLoading(false);
            });
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            loginUser();
        }
    };

    return (
        <div className="login-container">
            {/* Tarjeta de login */}
            <div className="login-card">
                <h1>Iniciar Sesión</h1>

                <div className="form-group">
                    <label htmlFor="NombreUsuario">Nombre de usuario</label>
                    <input
                        type="text"
                        id="NombreUsuario"
                        name="NombreUsuario"
                        placeholder="Ingrese su nombre de usuario"
                        value={NombreUsuario}
                        onChange={(e) => setNombreUsuario(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isLoading}
                        required
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
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={isLoading}
                        required
                    />
                </div>

                <button 
                    onClick={loginUser} 
                    disabled={isLoading}
                >
                    {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </button>

                <p>
                    ¿Aún no te has registrado? 
                    <a href="/register"> Regístrate</a>
                </p>
            </div>
        </div>
    )
}

export default Login;