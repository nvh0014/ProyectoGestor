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

    // Función para cerrar sesión
    const cerrarSesion = async () => {
        const result = await Swal.fire({
            title: '¿Cerrar sesión?',
            text: '¿Estás seguro de que deseas cerrar sesión?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, cerrar sesión',
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
                    title: '¡Hasta luego!',
                    text: 'Sesión cerrada exitosamente.',
                    confirmButtonText: 'Entendido',
                    timer: 2000
                });

                navigate('/login', { replace: true });
            } catch (error) {
                console.error('Error al cerrar sesión:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Error al cerrar sesión. Inténtalo de nuevo.',
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
                title: 'Error de Conexión',
                html: `
                    <p>No se pudieron cargar los clientes.</p>
                    <p><strong>Error:</strong> ${error.message}</p>
                    <p><strong>Estado:</strong> ${error.response?.status || 'Sin respuesta'}</p>
                    <hr>
                    <small>Verifique que el servidor backend esté ejecutándose en el puerto 3001</small>
                `,
                confirmButtonText: 'OK',
                footer: '<small>Revise la consola del navegador para más detalles</small>'
            });
        } finally {
            setLoading(false);
        }
    };

    const crearCliente = async () => {
        try {
            if (!clienteForm.Rut || !clienteForm.RazonSocial) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Campos requeridos',
                    text: 'RUT y Razón Social son obligatorios',
                    confirmButtonText: 'OK'
                });
                return;
            }

            await api.post('/clientes', clienteForm);
            Swal.fire({
                icon: 'success',
                title: 'Cliente creado',
                text: 'El cliente se creó exitosamente',
                confirmButtonText: 'OK'
            });
            
            setModalIsOpen(false);
            limpiarFormulario();
            obtenerClientes();
        } catch (error) {
            console.error('Error al crear cliente:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al crear el cliente',
                confirmButtonText: 'OK'
            });
        }
    };

    const actualizarCliente = async () => {
        try {
            if (!clienteForm.Rut || !clienteForm.RazonSocial) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Campos requeridos',
                    text: 'RUT y Razón Social son obligatorios',
                    confirmButtonText: 'OK'
                });
                return;
            }

            await api.put(`/clientes/${editingCliente.CodigoCliente}`, clienteForm);
            Swal.fire({
                icon: 'success',
                title: 'Cliente actualizado',
                text: 'El cliente se actualizó exitosamente',
                confirmButtonText: 'OK'
            });
            
            setModalIsOpen(false);
            setEditingCliente(null);
            limpiarFormulario();
            obtenerClientes();
        } catch (error) {
            console.error('Error al actualizar cliente:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al actualizar el cliente',
                confirmButtonText: 'OK'
            });
        }
    };

    const eliminarCliente = async (cliente) => {
        const result = await Swal.fire({
            title: '¿Desactivar cliente?',
            text: `¿Estás seguro de que deseas desactivar a ${cliente.RazonSocial}? El cliente se marcará como inactivo.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, desactivar',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                // Soft delete: marcar como inactivo en lugar de eliminar
                await api.put(`/clientes/${cliente.CodigoCliente}`, {
                    ...cliente,
                    ClienteActivo: false
                });
                Swal.fire({
                    icon: 'success',
                    title: 'Cliente desactivado',
                    text: 'El cliente se desactivó exitosamente',
                    confirmButtonText: 'OK'
                });
                obtenerClientes();
            } catch (error) {
                console.error('Error al desactivar cliente:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Error al desactivar el cliente',
                    confirmButtonText: 'OK'
                });
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
            [name]: type === 'checkbox' ? checked : value
        }));
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
        {
            accessorKey: 'ClienteActivo',
            header: 'Estado',
            cell: ({ getValue }) => (
                <span className={`clientes-status-badge ${getValue() ? 'active' : 'inactive'}`}>
                    {getValue() ? 'Activo' : 'Inactivo'}
                </span>
            )
        },
        {
            id: 'acciones',
            header: 'Acciones',
            cell: ({ row }) => (
                <div className="clientes-table-actions">
                    <button
                        className="clientes-action-button edit"
                        onClick={() => abrirModalEditar(row.original)}
                        title="Editar"
                    >
                        <i className="fas fa-edit"></i>
                    </button>
                    <button
                        className="clientes-action-button delete"
                        onClick={() => eliminarCliente(row.original)}
                        title="Desactivar"
                    >
                        <i className="fas fa-ban"></i>
                    </button>
                </div>
            )
        }
    ], []);

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
        console.log('🚀 Componente Clientes montado, cargando datos...');
        const usuarioLogueado = getCookie('usuario');
        if (usuarioLogueado) {
            console.log('👤 Usuario logueado encontrado:', usuarioLogueado);
            setUsuario(usuarioLogueado);
        } else {
            console.warn('⚠️ No se encontró usuario logueado');
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
                            aria-label="Ir al inicio"
                        >
                            <i className="fas fa-users" style={{ fontSize: '2rem', color: 'var(--primary-blue)' }}></i>
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
                                            <div style={{ color: 'var(--medium-gray)' }}>
                                                <i className="fas fa-users" style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}></i>
                                                <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No hay clientes registrados</p>
                                                <p style={{ fontSize: '0.9rem' }}>Haz clic en "Nuevo Cliente" para agregar el primero</p>
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
                                className="clientes-form-input"
                                name="Rut"
                                value={clienteForm.Rut}
                                onChange={handleInputChange}
                                required
                                placeholder="12345678-9"
                            />
                        </div>

                        <div className="clientes-form-group">
                            <label className="clientes-form-label">Razón Social *</label>
                            <input
                                type="text"
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
                                type="text"
                                className="clientes-form-input"
                                name="Telefono"
                                value={clienteForm.Telefono}
                                onChange={handleInputChange}
                                placeholder="+56 9 1234 5678"
                            />
                        </div>

                        <div className="clientes-form-group">
                            <label className="clientes-form-label">Dirección</label>
                            <input
                                type="text"
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
                                className="clientes-form-input"
                                name="Giro"
                                value={clienteForm.Giro}
                                onChange={handleInputChange}
                                placeholder="Giro comercial de la empresa"
                            />
                        </div>

                        <div className="clientes-form-group">
                            <div className="clientes-form-checkbox-group">
                                <input
                                    type="checkbox"
                                    className="clientes-form-checkbox"
                                    name="ClienteActivo"
                                    checked={clienteForm.ClienteActivo}
                                    onChange={handleInputChange}
                                />
                                <label className="clientes-form-label">Cliente Activo</label>
                            </div>
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
