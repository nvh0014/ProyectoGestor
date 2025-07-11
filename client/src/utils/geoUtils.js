// Ejemplo de uso del sistema de geobloqueo desde el frontend
// Puedes agregar esto a tus componentes de React

// Función para verificar el estado de geolocalización
export const checkGeoStatus = async () => {
  try {
    const response = await fetch('/api/geo-status');
    const data = await response.json();
    
    console.log('Estado de geolocalización:', data);
    
    return data;
  } catch (error) {
    console.error('Error verificando geolocalización:', error);
    return null;
  }
};

// Función para obtener estadísticas de administración (solo admin)
export const getGeoAdminStats = async () => {
  try {
    const response = await fetch('/api/geo-admin');
    const data = await response.json();
    
    console.log('Estadísticas de geobloqueo:', data);
    
    return data;
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return null;
  }
};

// Función para limpiar cache (solo admin)
export const clearGeoCache = async () => {
  try {
    const response = await fetch('/api/geo-admin/clear-cache', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('Cache limpiado:', data);
    
    return data;
  } catch (error) {
    console.error('Error limpiando cache:', error);
    return null;
  }
};

// Función para cambiar contraseña
export const changePassword = async (NombreUsuario, CurrentPassword, NewPassword) => {
  try {
    const response = await fetch('/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        NombreUsuario,
        CurrentPassword,
        NewPassword
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Contraseña cambiada exitosamente');
      return { success: true, data };
    } else {
      console.error('❌ Error cambiando contraseña:', data.error);
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.error('Error en solicitud de cambio de contraseña:', error);
    return { success: false, error: 'Error de conexión' };
  }
};

// Función para migrar contraseñas (solo admin)
export const migratePasswords = async (adminKey) => {
  try {
    const response = await fetch('/admin/migrate-passwords', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ adminKey })
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Migración completada:', data);
      return { success: true, data };
    } else {
      console.error('❌ Error en migración:', data.error);
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.error('Error en migración:', error);
    return { success: false, error: 'Error de conexión' };
  }
};

// Función para validar fortaleza de contraseña
export const validatePasswordStrength = (password) => {
  const validations = {
    length: password.length >= 6,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumbers: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };

  const score = Object.values(validations).filter(Boolean).length;
  
  let strength = 'Muy débil';
  if (score >= 4) strength = 'Fuerte';
  else if (score >= 3) strength = 'Moderada';
  else if (score >= 2) strength = 'Débil';

  return {
    score,
    strength,
    validations,
    isValid: validations.length && score >= 2
  };
};

// Componente de React de ejemplo para mostrar estado de geolocalización
/*
import React, { useState, useEffect } from 'react';

const GeoStatus = () => {
  const [geoData, setGeoData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGeoStatus = async () => {
      const data = await checkGeoStatus();
      setGeoData(data);
      setLoading(false);
    };

    fetchGeoStatus();
  }, []);

  if (loading) {
    return <div>Verificando geolocalización...</div>;
  }

  if (!geoData) {
    return <div>Error verificando geolocalización</div>;
  }

  return (
    <div style={{
      padding: '10px',
      margin: '10px',
      border: `2px solid ${geoData.allowed ? 'green' : 'red'}`,
      borderRadius: '5px'
    }}>
      <h3>Estado de Geolocalización</h3>
      <p><strong>País:</strong> {geoData.country}</p>
      <p><strong>Acceso:</strong> {geoData.allowed ? '✅ Permitido' : '❌ Bloqueado'}</p>
      <p><strong>Fuente:</strong> {geoData.source}</p>
      {geoData.developmentMode && (
        <p style={{ color: 'orange' }}>
          ⚠️ Modo desarrollo activo
        </p>
      )}
    </div>
  );
};

export default GeoStatus;
*/

// Componente de React para cambiar contraseña
/*
import React, { useState } from 'react';

const ChangePasswordForm = ({ currentUser, onPasswordChanged }) => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Validar que las contraseñas coincidan
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage('Las nuevas contraseñas no coinciden');
      setLoading(false);
      return;
    }

    // Validar fortaleza de contraseña
    const passwordValidation = validatePasswordStrength(formData.newPassword);
    if (!passwordValidation.isValid) {
      setMessage('La nueva contraseña es muy débil. Debe tener al menos 6 caracteres.');
      setLoading(false);
      return;
    }

    try {
      const result = await changePassword(
        currentUser.NombreUsuario,
        formData.currentPassword,
        formData.newPassword
      );

      if (result.success) {
        setMessage('✅ Contraseña cambiada exitosamente');
        setFormData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        if (onPasswordChanged) onPasswordChanged();
      } else {
        setMessage(`❌ Error: ${result.error}`);
      }
    } catch (error) {
      setMessage('❌ Error de conexión');
    }

    setLoading(false);
  };

  const passwordStrength = validatePasswordStrength(formData.newPassword);

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
      <h3>Cambiar Contraseña</h3>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label>Contraseña Actual:</label>
          <input
            type="password"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Nueva Contraseña:</label>
          <input
            type="password"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
          {formData.newPassword && (
            <div style={{ marginTop: '5px', fontSize: '12px' }}>
              <strong>Fortaleza:</strong> {passwordStrength.strength}
              <ul style={{ margin: '5px 0', paddingLeft: '20px' }}>
                <li style={{ color: passwordStrength.validations.length ? 'green' : 'red' }}>
                  {passwordStrength.validations.length ? '✅' : '❌'} Al menos 6 caracteres
                </li>
              </ul>
            </div>
          )}
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Confirmar Nueva Contraseña:</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !formData.currentPassword || !formData.newPassword || !formData.confirmPassword}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Cambiando...' : 'Cambiar Contraseña'}
        </button>
      </form>

      {message && (
        <div style={{
          marginTop: '15px',
          padding: '10px',
          borderRadius: '4px',
          backgroundColor: message.includes('✅') ? '#d4edda' : '#f8d7da',
          color: message.includes('✅') ? '#155724' : '#721c24',
          border: `1px solid ${message.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`
        }}>
          {message}
        </div>
      )}
    </div>
  );
};

export default ChangePasswordForm;
*/
