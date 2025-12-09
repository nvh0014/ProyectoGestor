import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import Swal from 'sweetalert2';
import Modal from 'react-modal';
import './Clientes.css';

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

function Clientes() {
    const navigate = useNavigate();

    // Estados para el header
    const [isLoading, setIsLoading] = useState(false);
    const [usuario, setUsuario] = useState('');
    const [isAdmin, setIsAdmin] = useState(false);

    // Estados para el CRUD de clientes
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [editingCliente, setEditingCliente] = useState(null);
    const [clienteForm, setClienteForm] = useState({
        Rut: '',
        RazonSocial: '',
        Telefono: '',
        Direccion: '',
        Comuna: '',
        Giro: '',
        ClienteActivo: true
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

    // Funciones CRUD
    const obtenerClientes = async () => {
        try {
            console.log('🔄 Intentando obtener clientes...');
            setLoading(true);
            const response = await api.get('/clientes');
            console.log('✅ Respuesta del servidor:', response);
            console.log('📊 Datos recibidos:', response.data);
            console.log('📈 Cantidad de clientes:', response.data.length);

            // El backend ya filtra solo clientes activos
            setClientes(response.data);
        } catch (error) {
            console.error('❌ Error al obtener clientes:', error);
            console.error('📋 Detalles del error:', {
                message: error.message,
                status: error.response?.status,
                data: error.response?.data,
                url: error.config?.url
            });

            Swal.fire({
                icon: 'error',
                title: 'Error de Conectividad',
                html: `
                    <p>No se pudo establecer conexión con el servidor para cargar los datos de clientes.</p>
                    <p><strong>Detalles:</strong> ${error.message}</p>
                    <p><strong>Estado:</strong> ${error.response?.status || 'Sin respuesta'}</p>
                    <hr>
                    <small>Verifique que el servidor esté ejecutándose correctamente</small>
                `,
                confirmButtonText: 'Entendido',
                footer: '<small>Consulte la consola del navegador para información técnica adicional</small>'
            });
        } finally {
            // Agregar tiempo de carga para asegurar que los datos se carguen correctamente
            setTimeout(() => {
                setLoading(false);
            }, 1500);
        }
    };

    const crearCliente = async () => {
        try {
            if (!clienteForm.Rut || !clienteForm.RazonSocial) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Campos Obligatorios',
                    text: 'Los campos RUT y Razón Social son obligatorios para registrar un cliente.',
                    confirmButtonText: 'Entendido'
                });
                return;
            }

            await api.post('/clientes', clienteForm);
            Swal.fire({
                icon: 'success',
                title: 'Cliente Registrado',
                text: 'El cliente ha sido registrado exitosamente en el sistema.',
                confirmButtonText: 'Continuar'
            });

            setModalIsOpen(false);
            limpiarFormulario();
            obtenerClientes();
        } catch (error) {
            console.error('Error al crear cliente:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error de Registro',
                text: 'No se pudo registrar el cliente. Verifique los datos e intente nuevamente.',
                confirmButtonText: 'Entendido'
            });
        }
    };

    const actualizarCliente = async () => {
        try {
            if (!clienteForm.Rut || !clienteForm.RazonSocial) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Campos Obligatorios',
                    text: 'Los campos RUT y Razón Social son obligatorios para actualizar un cliente.',
                    confirmButtonText: 'Entendido'
                });
                return;
            }

            await api.put(`/clientes/${editingCliente.CodigoCliente}`, clienteForm);
            Swal.fire({
                icon: 'success',
                title: 'Cliente Actualizado',
                text: 'Los datos del cliente han sido actualizados exitosamente.',
                confirmButtonText: 'Continuar'
            });

            setModalIsOpen(false);
            setEditingCliente(null);
            limpiarFormulario();
            obtenerClientes();
        } catch (error) {
            console.error('Error al actualizar cliente:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error de Actualización',
                text: 'No se pudo actualizar el cliente. Verifique los datos e intente nuevamente.',
                confirmButtonText: 'Entendido'
            });
        }
    };

    const eliminarCliente = async (cliente) => {
        const result = await Swal.fire({
            title: 'Confirmar Eliminación',
            text: `¿Está seguro de que desea eliminar el cliente ${cliente.RazonSocial}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Eliminar Cliente',
            cancelButtonText: 'Cancelar',
            footer: 'Esta acción no se puede deshacer.'
        });

        if (result.isConfirmed) {
            try {
                console.log(`🗑️ Eliminando cliente con ID: ${cliente.CodigoCliente}`);
                setLoading(true);
                
                const response = await api.delete(`/clientes/${cliente.CodigoCliente}`);
                
                // Verificar el tipo de eliminación desde la respuesta del servidor
                if (response.data.tipo === 'soft_delete') {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Cliente Desactivado',
                        text: `El cliente ${cliente.RazonSocial} tiene boletas asociadas y ha sido desactivado en lugar de eliminado completamente.`,
                        confirmButtonText: 'Entendido'
                    });
                } else {
                    Swal.fire({
                        icon: 'success',
                        title: 'Cliente Eliminado',
                        text: 'El cliente ha sido eliminado exitosamente.',
                        confirmButtonText: 'Continuar'
                    });
                }
                
                obtenerClientes();
            } catch (error) {
                console.error('Error al eliminar cliente:', error);
                
                // Manejo de errores específicos
                if (error.response?.status === 409) {
                    Swal.fire({
                        icon: 'error',
                        title: 'Cliente en Uso',
                        text: 'No se puede eliminar el cliente porque tiene boletas asociadas activas.',
                        confirmButtonText: 'Entendido'
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error de Eliminación',
                        text: 'No se pudo eliminar el cliente. Intente nuevamente.',
                        confirmButtonText: 'Entendido'
                    });
                }
            } finally {
                setLoading(false);
            }
        }
    };

    // Funciones auxiliares
    const abrirModalCrear = () => {
        limpiarFormulario();
        setEditingCliente(null);
        setModalIsOpen(true);
    };

    const abrirModalEditar = (cliente) => {
        setClienteForm({
            Rut: cliente.Rut || '',
            RazonSocial: cliente.RazonSocial || '',
            Telefono: cliente.Telefono || '',
            Direccion: cliente.Direccion || '',
            Comuna: cliente.Comuna || '',
            Giro: cliente.Giro || '',
            ClienteActivo: cliente.ClienteActivo || true
        });
        setEditingCliente(cliente);
        setModalIsOpen(true);
    };

    const limpiarFormulario = () => {
        setClienteForm({
            Rut: '',
            RazonSocial: '',
            Telefono: '',
            Direccion: '',
            Comuna: '',
            Giro: '',
            ClienteActivo: true
        });
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setClienteForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : (type === 'text' ? value.toUpperCase() : value)
        }));
    };

    // Función para manejar clic en fila de la tabla
    const handleRowClick = (event, rowId) => {
        // Evitar selección si se hace clic en un botón de acción
        if (event.target.closest('.clientes-action-button')) {
            return;
        }
        
        const row = event.currentTarget;
        
        // Remover selección anterior
        const previousSelected = document.querySelector('.clientes-table tbody tr.selected');
        if (previousSelected) {
            previousSelected.classList.remove('selected');
        }
        
        // Añadir selección a la fila actual
        row.classList.add('selected');
    };

    // Configuración de columnas de la tabla
    const columns = useMemo(() => [
        {
            accessorKey: 'CodigoCliente',
            header: 'Código',
        },
        {
            accessorKey: 'Rut',
            header: 'RUT',
        },
        {
            accessorKey: 'RazonSocial',
            header: 'Razón Social',
        },
        {
            accessorKey: 'Telefono',
            header: 'Teléfono',
            cell: ({ getValue }) => getValue() || '-'
        },
        {
            accessorKey: 'Direccion',
            header: 'Dirección',
            cell: ({ getValue }) => getValue() || '-'
        },
        {
            accessorKey: 'Comuna',
            header: 'Comuna',
            cell: ({ getValue }) => getValue() || '-'
        },
        {
            accessorKey: 'Giro',
            header: 'Giro',
            cell: ({ getValue }) => getValue() || '-'
        },
        // {
        //     accessorKey: 'ClienteActivo',
        //     header: 'Estado',
        //     cell: ({ getValue }) => (
        //         <span className={`clientes-status-badge ${getValue() ? 'active' : 'inactive'}`}>
        //             {getValue() ? 'Activo' : 'Inactivo'}
        //         </span>
        //     )
        // },
        {
            id: 'acciones',
            header: 'Acciones',
            cell: ({ row }) => (
                <div className="clientes-table-actions">
                    {isAdmin && (
                        <>
                            <button
                                className="clientes-action-button edit"
                                onClick={() => abrirModalEditar(row.original)}
                                title="Editar"
                            >
                                ✏️
                                <i className="fas fa-edit"></i>
                            </button>
                            <button
                                className="clientes-action-button delete"
                                onClick={() => eliminarCliente(row.original)}
                                title="Desactivar"
                            >
                                🗑️
                                <i className="fas fa-ban"></i>
                            </button>
                        </>
                    )}
                    {!isAdmin && (
                        <span className="clientes-no-permissions">Solo lectura</span>
                    )}
                </div>
            )
        }
    ], [isAdmin]);

    // Configuración de la tabla
    const table = useReactTable({
        data: clientes,
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

    // Efecto para cargar datos iniciales
    useEffect(() => {
        const usuarioLogueado = getCookie('usuario');
        if (usuarioLogueado) {
            console.log('👤 Usuario logueado encontrado:', usuarioLogueado);
            setUsuario(usuarioLogueado);
        } else {
            console.warn('⚠️ No se encontró usuario logueado');
        }

        // Verificar rol de administrador
        const userData = localStorage.getItem('userData');
        if (userData) {
            try {
                const userInfo = JSON.parse(userData);
                setIsAdmin(userInfo.RolAdmin === 1);
            } catch (error) {
                console.error('Error al parsear userData:', error);
                setIsAdmin(false);
            }
        }

        console.log('📞 Llamando a obtenerClientes()...');
        obtenerClientes();
    }, []);

    if (loading) {
        console.log('⏳ Componente en estado de carga...');
        return (
            <div className="clientes-container">
                <div className="clientes-loading">
                    <div className="clientes-loading-spinner"></div>
                    <div className="clientes-loading-text">Cargando clientes...</div>
                </div>
            </div>
        );
    }

    console.log('🎯 Renderizando tabla con clientes:', clientes);
    console.log('📊 Estado actual:', { loading, clientesCount: clientes.length });

    return (
        <div className="clientes-container">
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
                        <h1 className="clientes-header-title">Gestión de Clientes</h1>
                        <p className="clientes-header-subtitle">Administra la información de tus clientes</p>
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
            <main className="clientes-main-content">
                <h2 className="clientes-title">Clientes Registrados</h2>

                <div className="clientes-content-card">
                    <div className="clientes-card-header">
                        <h3 className="clientes-card-title">
                            <i className="fas fa-list"></i>
                            Lista de Clientes
                        </h3>
                        <button
                            className="clientes-add-button"
                            onClick={abrirModalCrear}
                        >
                            <i className="fas fa-plus"></i>
                            Nuevo Cliente
                        </button>
                    </div>

                    <div className="clientes-table-container">
                        {/* Controls */}
                        <div className="clientes-table-controls">
                            <input
                                type="text"
                                className="clientes-search-input"
                                placeholder="Buscar clientes..."
                                value={table.getState().globalFilter || ''}
                                onChange={(e) => table.setGlobalFilter(e.target.value)}
                            />
                        </div>

                        {/* Table */}
                        <div className="clientes-table-wrapper">
                            <table className="clientes-table">
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
                                                    <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No hay clientes registrados</p>
                                                    <p style={{ fontSize: '0.9rem' }}>Haz clic en "Nuevo Cliente" para agregar el primero</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        table.getRowModel().rows.map(row => (
                                            <tr 
                                                key={row.id}
                                                onClick={(event) => handleRowClick(event, row.id)}
                                                style={{ cursor: 'pointer' }}
                                            >
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
                        </div>

                        {/* Pagination */}
                        <div className="clientes-pagination">
                            <div className="clientes-pagination-info">
                                Mostrando {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} - {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length)} de {table.getFilteredRowModel().rows.length} clientes
                            </div>
                            <div className="clientes-pagination-controls">
                                <button
                                    className="clientes-pagination-button"
                                    onClick={() => table.setPageIndex(0)}
                                    disabled={!table.getCanPreviousPage()}
                                >
                                    ««
                                </button>
                                <button
                                    className="clientes-pagination-button"
                                    onClick={() => table.previousPage()}
                                    disabled={!table.getCanPreviousPage()}
                                >
                                    ‹
                                </button>
                                <button
                                    className="clientes-pagination-button"
                                    onClick={() => table.nextPage()}
                                    disabled={!table.getCanNextPage()}
                                >
                                    ›
                                </button>
                                <button
                                    className="clientes-pagination-button"
                                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                                    disabled={!table.getCanNextPage()}
                                >
                                    »»
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Modal para crear/editar cliente */}
            <Modal
                isOpen={modalIsOpen}
                onRequestClose={() => setModalIsOpen(false)}
                className="clientes-modal-content"
                overlayClassName="clientes-modal-overlay"
            >
                <div className="clientes-modal-header">
                    <h3 className="clientes-modal-title">
                        <i className={`fas ${editingCliente ? 'fa-edit' : 'fa-plus'}`}></i>
                        {editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
                    </h3>
                    <button
                        type="button"
                        className="clientes-modal-close"
                        onClick={() => setModalIsOpen(false)}
                    >
                        ✕
                    </button>
                </div>

                <div className="clientes-modal-body">
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        editingCliente ? actualizarCliente() : crearCliente();
                    }}>
                        <div className="clientes-form-group">
                            <label className="clientes-form-label">RUT *</label>
                            <input
                                type="text"
                                maxLength="10"
                                style={{ textTransform: 'uppercase' }}
                                className="clientes-form-input"
                                name="Rut"
                                value={clienteForm.Rut}
                                onChange={handleInputChange}
                                required
                                placeholder="Rut del cliente (sin puntos con guión)"
                            />
                        </div>

                        <div className="clientes-form-group">
                            <label className="clientes-form-label">Razón Social *</label>
                            <input
                                type="text"
                                style={{ textTransform: 'uppercase' }}
                                className="clientes-form-input"
                                name="RazonSocial"
                                value={clienteForm.RazonSocial}
                                onChange={handleInputChange}
                                required
                                placeholder="Nombre de la empresa o persona"
                            />
                        </div>

                        <div className="clientes-form-group">
                            <label className="clientes-form-label">Teléfono</label>
                            <input
                                type="number"
                                maxLength="9"
                                className="clientes-form-input"
                                name="Telefono"
                                value={clienteForm.Telefono}
                                onChange={handleInputChange}
                                placeholder="9 1234 5678"
                            />
                        </div>

                        <div className="clientes-form-group">
                            <label className="clientes-form-label">Dirección</label>
                            <input
                                type="text"
                                style={{ textTransform: 'uppercase' }}
                                className="clientes-form-input"
                                name="Direccion"
                                value={clienteForm.Direccion}
                                onChange={handleInputChange}
                                placeholder="Dirección completa"
                            />
                        </div>

                        <div className="clientes-form-group">
                            <label className="clientes-form-label">Comuna</label>
                            <input
                                type="text"
                                style={{ textTransform: 'uppercase' }}
                                className="clientes-form-input"
                                name="Comuna"
                                value={clienteForm.Comuna}
                                onChange={handleInputChange}
                                placeholder="Comuna o ciudad"
                            />
                        </div>

                        <div className="clientes-form-group">
                            <label className="clientes-form-label">Giro</label>
                            <input
                                type="text"
                                style={{ textTransform: 'uppercase' }}
                                className="clientes-form-input"
                                name="Giro"
                                value={clienteForm.Giro}
                                onChange={handleInputChange}
                                placeholder="Giro comercial de la empresa"
                            />
                        </div>

                        <div className="clientes-modal-footer">
                            <button
                                type="button"
                                className="clientes-modal-button secondary"
                                onClick={() => setModalIsOpen(false)}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="clientes-modal-button primary"
                            >
                                <i className={`fas ${editingCliente ? 'fa-save' : 'fa-plus'}`}></i>
                                {editingCliente ? 'Actualizar' : 'Crear'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </div>
    );
}

export default Clientes;
