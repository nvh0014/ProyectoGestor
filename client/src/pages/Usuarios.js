import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import Swal from 'sweetalert2';
import Modal from 'react-modal';
import './Usuarios.css';

import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender
} from '@tanstack/react-table';

// Establecer el elemento de la aplicación para el modal
if (typeof document !== 'undefined') {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    Modal.setAppElement('#root');
  } else {
    Modal.setAppElement('body');
  }
}

function Usuarios() {
  const navigate = useNavigate();

  // Estados para el header
  const [isLoading, setIsLoading] = useState(false);
  const [usuario, setUsuario] = useState('');

  // Estados para los usuarios
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null); // Para verificar si es admin

  // Estados para modal de edición
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState(null);
  const [usuarioForm, setUsuarioForm] = useState({
    NombreUsuario: '',
    Password: '',
    RolAdmin: false
  });

  // Estados para la tabla
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Funciones para manejar cookies
  const getCookie = (name) => {
    const nameEQ = name + "=";
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === ' ') c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
  };

  const deleteCookie = (name) => {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  };

  // Función para cerrar sesión
  const cerrarSesion = async () => {
    const result = await Swal.fire({
      title: 'Confirmar Cierre de Sesión',
      text: '¿Está seguro de que desea cerrar la sesión actual?',
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
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');
        sessionStorage.clear();
        deleteCookie('usuario');
        deleteCookie('token');

        Swal.fire({
          icon: 'success',
          title: 'Sesión Cerrada',
          text: 'Su sesión ha sido cerrada exitosamente.',
          confirmButtonText: 'Continuar',
          timer: 2000
        });

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

  // Función para obtener todos los usuarios
  const obtenerUsuarios = async () => {
    try {
      console.log('🔍 Iniciando obtenerUsuarios...');
      setLoading(true);

      console.log('🚀 Haciendo petición a: /auth/usuarios');

      const response = await api.get('/auth/usuarios');

      console.log('✅ Respuesta recibida:', response);
      console.log('📊 Datos recibidos:', response.data);

      setUsuarios(response.data);
    } catch (error) {
      console.error('❌ Error al obtener usuarios:', error);
      console.error('📋 Detalles del error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url
      });

      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Error al cargar los usuarios'
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para editar usuario
  const editarUsuario = (usuario) => {
    setEditingUsuario(usuario);
    setUsuarioForm({
      NombreUsuario: usuario.nombre,
      Password: '', // No mostrar la contraseña actual
      RolAdmin: usuario.rolAdmin === 1
    });
    setModalIsOpen(true);
  };

  // Función para eliminar usuario
  const eliminarUsuario = async (usuario) => {
    const result = await Swal.fire({
      title: '¿Confirmar eliminación?',
      text: `¿Estás seguro de que deseas eliminar al usuario "${usuario.nombre}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        console.log('Eliminando usuario:', usuario.id);
        await api.delete(`/auth/usuarios/${usuario.id}`);
        
        Swal.fire({
          icon: 'success',
          title: 'Usuario eliminado',
          text: 'El usuario ha sido eliminado exitosamente.'
        });
        
        obtenerUsuarios(); // Recargar la lista
      } catch (error) {
        console.error('Error al eliminar usuario:', error);
        
        let errorMsg = 'Error al eliminar el usuario';
        if (error.response?.data?.error) {
          errorMsg = error.response.data.error;
        }
        
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: errorMsg
        });
      }
    }
  };

  // Función para guardar cambios del usuario
  const guardarUsuario = async () => {
    try {
      // Validaciones básicas
      if (!usuarioForm.NombreUsuario.trim()) {
        Swal.fire({
          icon: 'warning',
          title: 'Campo requerido',
          text: 'El nombre de usuario es requerido.'
        });
        return;
      }

      if (!editingUsuario && !usuarioForm.Password.trim()) {
        Swal.fire({
          icon: 'warning',
          title: 'Campo requerido',
          text: 'La contraseña es requerida para nuevos usuarios.'
        });
        return;
      }

      if (!editingUsuario && usuarioForm.Password.length < 6) {
        Swal.fire({
          icon: 'warning',
          title: 'Contraseña muy corta',
          text: 'La contraseña debe tener al menos 6 caracteres.'
        });
        return;
      }

      console.log('Guardando usuario:', usuarioForm);

      if (editingUsuario) {
        // Actualizar usuario existente
        const updateData = {
          NombreUsuario: usuarioForm.NombreUsuario,
          RolAdmin: usuarioForm.RolAdmin ? 1 : 0
        };
        
        // Solo incluir contraseña si se proporcionó una nueva
        if (usuarioForm.Password.trim()) {
          updateData.Password = usuarioForm.Password;
        }
        
        await api.put(`/auth/usuarios/${editingUsuario.id}`, updateData);
        
        Swal.fire({
          icon: 'success',
          title: 'Usuario actualizado',
          text: 'El usuario ha sido actualizado exitosamente.'
        });
      } else {
        // Crear nuevo usuario
        await api.post('/auth/register', {
          NombreUsuario: usuarioForm.NombreUsuario,
          Password: usuarioForm.Password,
          RolAdmin: usuarioForm.RolAdmin ? 1 : 0
        });
        
        Swal.fire({
          icon: 'success',
          title: 'Usuario creado',
          text: 'El usuario ha sido creado exitosamente.'
        });
      }
      
      setModalIsOpen(false);
      setEditingUsuario(null);
      setUsuarioForm({
        NombreUsuario: '',
        Password: '',
        RolAdmin: false
      });
      obtenerUsuarios(); // Recargar la lista
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      
      let errorMsg = 'Error al guardar el usuario';
      if (error.response?.data?.error) {
        errorMsg = error.response.data.error;
      } else if (error.response?.data?.message) {
        errorMsg = error.response.data.message;
      }
      
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMsg
      });
    }
  };

  // useEffect para cargar usuarios al montar el componente
  useEffect(() => {
    console.log('🎯 useEffect ejecutándose - montando componente Usuarios');

    // Obtener usuario de las cookies
    const usuarioLogueado = getCookie('usuario');
    if (usuarioLogueado) {
      setUsuario(usuarioLogueado);
    }

    // Verificar rol de usuario desde localStorage
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const userInfo = JSON.parse(userData);
        setUserRole(userInfo.RolAdmin);
        
        // Verificación más explícita
        if (userInfo.RolAdmin !== 1) {
          Swal.fire({
            icon: 'warning',
            title: 'Acceso Denegado',
            text: 'Solo los administradores pueden acceder a esta página.',
            confirmButtonText: 'Entendido'
          }).then(() => {
            navigate('/home');
          });
          return;
        }
      } catch (error) {
        console.error('Error al parsear userData:', error);
        navigate('/login');
        return;
      }
    } else {
      navigate('/login');
      return;
    }

    console.log('📞 Llamando a obtenerUsuarios()...');
    obtenerUsuarios();
  }, [navigate]);

  // Configuración de columnas de la tabla
  const columns = useMemo(() => [
    {
      accessorKey: 'id',
      header: 'Código Usuario',
      size: 120,
    },
    {
      accessorKey: 'nombre',
      header: 'Nombre Usuario',
      size: 200,
    },
    {
      accessorKey: 'rol',
      header: 'Es Admin',
      size: 120,
      cell: ({ row }) => (
        <span className={`rol-badge ${row.original.rol === 'Administrador' ? 'admin' : 'usuario'}`}>
          {row.original.rol === 'Administrador' ? 'SÍ' : 'NO'}
        </span>
      ),
    },
    {
      id: 'acciones',
      header: 'Acciones',
      size: 150,
      cell: ({ row }) => (
        <div className="acciones-buttons">
          <button
            className="accion-button edit-button"
            onClick={() => editarUsuario(row.original)}
            title="Editar usuario"
          >
            <i className="fas fa-edit"></i>
          </button>
          <button
            className="accion-button delete-button"
            onClick={() => eliminarUsuario(row.original)}
            title="Eliminar usuario"
          >
            <i className="fas fa-trash"></i>
          </button>
        </div>
      ),
    },
  ], []);

  // Definir las tablas
  const table = useReactTable({
    data: usuarios,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onPaginationChange: setPagination,
  });

  return (
    <div className="usuarios-container">
      {/* Header */}
      <header className="clientes-header">
        <div className="clientes-header-content">
          <div className="clientes-header-logo">
            <button
              onClick={() => navigate('/home')}
              className="clientes-logo-button"
              aria-label="Volver al home"
              title="Volver al home principal"
            >
              <img
                src="/logo512.png"
                alt="Logo Distribuidora"
                className="clientes-logo-image"
              />
            </button>
          </div>

          <div className="clientes-header-text-group">
            <h1 className="clientes-header-title">Gestión de Usuarios</h1>
            <p className="clientes-header-subtitle">Administra los usuarios del sistema</p>
          </div>

          <div className="clientes-header-actions">
            {usuario && (
              <span className="clientes-user-greeting">
                <i className="fas fa-user"></i> {usuario}
              </span>
            )}
            <button
              onClick={cerrarSesion}
              className="clientes-logout-button"
              disabled={isLoading}
              aria-label="Cerrar sesión"
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

      {/* Main Content */}
      <main className="usuarios-main-content">
        <h2 className="usuarios-title">Usuarios del Sistema</h2>

        <div className="usuarios-content-card">
          <div className="usuarios-card-header">
            <h3 className="usuarios-card-title">
              <i className="fas fa-users"></i>
              Lista de Usuarios
            </h3>
            <button
              className="usuarios-add-button"
              onClick={() => {
                setEditingUsuario(null);
                setUsuarioForm({
                  NombreUsuario: '',
                  Password: '',
                  RolAdmin: false
                });
                setModalIsOpen(true);
              }}
            >
              <i className="fas fa-plus"></i>
              Nuevo Usuario
            </button>
          </div>

          <div className="usuarios-table-container">
            {/* Controls */}
            <div className="usuarios-table-controls">
              <input
                type="text"
                className="usuarios-search-input"
                placeholder="Buscar usuarios..."
                value={table.getState().globalFilter || ''}
                onChange={(e) => table.setGlobalFilter(e.target.value)}
              />
            </div>

            {/* Table */}
            <div className="usuarios-table-wrapper">
              {loading ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: '1rem' }}></i>
                  <p>Cargando usuarios...</p>
                </div>
              ) : (
                <table className="usuarios-table">
                  <thead>
                    {table.getHeaderGroups().map(headerGroup => (
                      <tr key={headerGroup.id}>
                        {headerGroup.headers.map(header => (
                          <th
                            key={header.id}
                            className={header.column.getCanSort() ? 'sortable' : ''}
                            onClick={header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined}
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {{
                              asc: ' ↑',
                              desc: ' ↓',
                            }[header.column.getIsSorted()] ?? ''}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {table.getRowModel().rows.length === 0 ? (
                      <tr>
                        <td colSpan={table.getAllColumns().length} style={{ textAlign: 'center', padding: '2rem' }}>
                          <div>
                            <i className="fas fa-users" style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}></i>
                            <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No hay usuarios registrados</p>
                            <p style={{ fontSize: '0.9rem' }}>Haz clic en "Nuevo Usuario" para agregar el primero</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      table.getRowModel().rows.map(row => (
                        <tr key={row.id}>
                          {row.getVisibleCells().map(cell => (
                            <td key={cell.id}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {!loading && (
              <div className="usuarios-pagination">
                <div className="usuarios-pagination-info">
                  Mostrando {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} - {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length)} de {table.getFilteredRowModel().rows.length} usuarios
                </div>
                <div className="usuarios-pagination-controls">
                  <button
                    className="usuarios-pagination-button"
                    onClick={() => table.setPageIndex(0)}
                    disabled={!table.getCanPreviousPage()}
                  >
                    ««
                  </button>
                  <button
                    className="usuarios-pagination-button"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    ‹
                  </button>
                  <button
                    className="usuarios-pagination-button"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    ›
                  </button>
                  <button
                    className="usuarios-pagination-button"
                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                    disabled={!table.getCanNextPage()}
                  >
                    »»
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal para editar usuario */}
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={() => setModalIsOpen(false)}
        className="usuarios-modal"
        overlayClassName="usuarios-modal-overlay"
      >
        <div className="usuarios-modal-content">
          <div className="usuarios-modal-header">
            <h3>{editingUsuario ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
            <button
              className="usuarios-modal-close"
              onClick={() => setModalIsOpen(false)}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div className="usuarios-modal-body">
            <div className="usuarios-form-group">
              <label htmlFor="nombreUsuario">Nombre de Usuario:</label>
              <input
                id="nombreUsuario"
                type="text"
                value={usuarioForm.NombreUsuario}
                onChange={(e) => setUsuarioForm({
                  ...usuarioForm,
                  NombreUsuario: e.target.value
                })}
                className="usuarios-form-input"
                placeholder="Ingrese el nombre de usuario"
              />
            </div>

            <div className="usuarios-form-group">
              <label htmlFor="password">
                {editingUsuario ? 'Nueva Contraseña (opcional):' : 'Contraseña:'}
              </label>
              <input
                id="password"
                type="password"
                value={usuarioForm.Password}
                onChange={(e) => setUsuarioForm({
                  ...usuarioForm,
                  Password: e.target.value
                })}
                className="usuarios-form-input"
                placeholder={editingUsuario ? 'Dejar vacío para mantener la actual' : 'Ingrese la contraseña'}
              />
              {!editingUsuario && (
                <small style={{ color: '#666', fontSize: '0.8rem' }}>
                  Mínimo 6 caracteres
                </small>
              )}
            </div>

            <div className="usuarios-form-group">
              <label className="usuarios-checkbox-label">
                <input
                  type="checkbox"
                  checked={usuarioForm.RolAdmin}
                  onChange={(e) => setUsuarioForm({
                    ...usuarioForm,
                    RolAdmin: e.target.checked
                  })}
                  className="usuarios-checkbox"
                />
                <span className="usuarios-checkbox-text">Es Administrador</span>
              </label>
            </div>
          </div>

          <div className="usuarios-modal-footer">
            <button
              className="usuarios-button usuarios-button-secondary"
              onClick={() => setModalIsOpen(false)}
            >
              Cancelar
            </button>
            <button
              className="usuarios-button usuarios-button-primary"
              onClick={guardarUsuario}
            >
              Guardar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default Usuarios;