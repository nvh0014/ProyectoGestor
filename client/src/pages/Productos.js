import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import Swal from 'sweetalert2';
import Modal from 'react-modal';
import './Productos.css';


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

function Productos() {
    const navigate = useNavigate();

    // Estados para el header
    const [isLoading, setIsLoading] = useState(false);
    const [usuario, setUsuario] = useState('');

    // Estados para el CRUD de productos
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [editingProducto, setEditingProducto] = useState(null);
    const [productoForm, setProductoForm] = useState({
        Descripcion: '',
        PrecioSala: '',
        PrecioDto: '',
        ProductoActivo: true
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
    const obtenerProductos = async () => {
        try {
            setLoading(true);
            const response = await api.get('/productos');
            // El backend ya filtra solo productos activos
            setProductos(response.data);
        } catch (error) {
            console.error('Error al obtener productos:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al cargar los productos',
                confirmButtonText: 'OK'
            });
        } finally {
            setLoading(false);
        }
    };

    const crearProducto = async () => {
        try {
            if (!productoForm.Descripcion || !productoForm.PrecioSala) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Campos requeridos',
                    text: 'Descripción y Precio Sala son obligatorios',
                    confirmButtonText: 'OK'
                });
                return;
            }

            const productoData = {
                ...productoForm,
                PrecioSala: parseInt(productoForm.PrecioSala),
                PrecioDto: parseInt(productoForm.PrecioDto || 0)
            };

            await api.post('/productos', productoData);
            Swal.fire({
                icon: 'success',
                title: 'Producto creado',
                text: 'El producto se creó exitosamente',
                confirmButtonText: 'OK'
            });

            setModalIsOpen(false);
            limpiarFormulario();
            obtenerProductos();
        } catch (error) {
            console.error('Error al crear producto:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al crear el producto',
                confirmButtonText: 'OK'
            });
        }
    };

    const actualizarProducto = async () => {
        try {
            if (!productoForm.Descripcion || !productoForm.PrecioSala) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Campos requeridos',
                    text: 'Descripción y Precio Sala son obligatorios',
                    confirmButtonText: 'OK'
                });
                return;
            }

            const productoData = {
                ...productoForm,
                PrecioSala: parseInt(productoForm.PrecioSala),
                PrecioDto: parseInt(productoForm.PrecioDto || 0)
            };

            await api.put(`/productos/${editingProducto.CodigoProducto}`, productoData);
            Swal.fire({
                icon: 'success',
                title: 'Producto actualizado',
                text: 'El producto se actualizó exitosamente',
                confirmButtonText: 'OK'
            });

            setModalIsOpen(false);
            setEditingProducto(null);
            limpiarFormulario();
            obtenerProductos();
        } catch (error) {
            console.error('Error al actualizar producto:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Error al actualizar el producto',
                confirmButtonText: 'OK'
            });
        }
    };

    const eliminarProducto = async (producto) => {
        const result = await Swal.fire({
            title: '¿Desactivar producto?',
            text: `¿Estás seguro de que deseas desactivar ${producto.Descripcion}? El producto se marcará como inactivo.`,
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
                await api.put(`/productos/${producto.CodigoProducto}`, {
                    ...producto,
                    ProductoActivo: false
                });
                Swal.fire({
                    icon: 'success',
                    title: 'Producto desactivado',
                    text: 'El producto se desactivó exitosamente',
                    confirmButtonText: 'OK'
                });
                obtenerProductos();
            } catch (error) {
                console.error('Error al desactivar producto:', error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Error al desactivar el producto',
                    confirmButtonText: 'OK'
                });
            }
        }
    };

    // Funciones auxiliares
    const abrirModalCrear = () => {
        limpiarFormulario();
        setEditingProducto(null);
        setModalIsOpen(true);
    };

    const abrirModalEditar = (producto) => {
        setProductoForm({
            Descripcion: producto.Descripcion || '',
            PrecioSala: producto.PrecioSala || '',
            PrecioDto: producto.PrecioDto || '',
            ProductoActivo: producto.ProductoActivo || true
        });
        setEditingProducto(producto);
        setModalIsOpen(true);
    };

    const limpiarFormulario = () => {
        setProductoForm({
            Descripcion: '',
            PrecioSala: '',
            PrecioDto: '',
            ProductoActivo: true
        });
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        if (type === 'checkbox') {
            setProductoForm(prev => ({
                ...prev,
                [name]: checked
            }));
        } else {
            let processedValue = value;
            
            // Convert text fields to uppercase
            if (name === 'Descripcion') {
                processedValue = value.toUpperCase();
            }
            
            setProductoForm(prev => {
                const newForm = {
                    ...prev,
                    [name]: processedValue
                };
                
                // Auto-calculate discount price when PrecioSala changes
                if (name === 'PrecioSala' && processedValue) {
                    const precioSala = parseFloat(processedValue);
                    if (!isNaN(precioSala) && precioSala > 0) {
                        // Calculate 3% discount (multiply by 0.97)
                        const precioDescuento = Math.round(precioSala * 0.97);
                        newForm.PrecioDto = precioDescuento;
                    }
                }
                
                return newForm;
            });
        }
    };

    const formatearPrecio = (precio) => {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP'
        }).format(precio);
    };

    // Configuración de columnas de la tabla
    const columns = useMemo(() => [
        {
            accessorKey: 'CodigoProducto',
            header: 'Código',
        },
        {
            accessorKey: 'Descripcion',
            header: 'Descripción',
        },
        {
            accessorKey: 'PrecioSala',
            header: 'Precio Sala',
            cell: ({ getValue }) => (
                <span className="productos-price-cell productos-price-regular">
                    {formatearPrecio(getValue())}
                </span>
            )
        },
        {
            accessorKey: 'PrecioDto',
            header: 'Precio Descuento',
            cell: ({ getValue }) => getValue() ? (
                <span className="productos-price-cell productos-price-discount">
                    {formatearPrecio(getValue())}
                </span>
            ) : '-'
        },
        {
            accessorKey: 'ProductoActivo',
            header: 'Estado',
            cell: ({ getValue }) => (
                <span className={`productos-status-badge ${getValue() ? 'active' : 'inactive'}`}>
                    {getValue() ? 'Activo' : 'Inactivo'}
                </span>
            )
        },
        {
            id: 'acciones',
            header: 'Acciones',
            cell: ({ row }) => (
                <div className="productos-table-actions">
                    <button
                        className="productos-action-button edit"
                        onClick={() => abrirModalEditar(row.original)}
                        title="Editar"
                    >
                        ✏️
                        <i className="fas fa-edit"></i>
                    </button>
                    <button
                        className="productos-action-button delete"
                        onClick={() => eliminarProducto(row.original)}
                        title="Desactivar"
                    >
                        🗑️
                        <i className="fas fa-ban"></i>
                    </button>
                </div>
            )
        }
    ], []);

    // Configuración de la tabla
    const table = useReactTable({
        data: productos,
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
            setUsuario(usuarioLogueado);
        }
        obtenerProductos();
    }, []);

    if (loading) {
        return (
            <div className="productos-container">
                <div className="productos-loading">
                    <div className="productos-loading-spinner"></div>
                    <div className="productos-loading-text">Cargando productos...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="productos-container">
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
                        <h1 className="clientes-header-title">Gestión de productos</h1>
                        <p className="clientes-header-subtitle">Administra la información de tus productos</p>
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
            <main className="productos-main-content">
                <h2 className="productos-title">Catálogo de Productos</h2>

                <div className="productos-content-card">
                    <div className="productos-card-header">
                        <h3 className="productos-card-title">
                            <i className="fas fa-list"></i>
                            Lista de Productos
                        </h3>
                        <button
                            className="productos-add-button"
                            onClick={abrirModalCrear}
                        >
                            <i className="fas fa-plus"></i>
                            Nuevo Producto
                        </button>
                    </div>

                    <div className="productos-table-container">
                        {/* Controls */}
                        <div className="productos-table-controls">
                            <input
                                type="text"
                                className="productos-search-input"
                                placeholder="Buscar productos..."
                                value={table.getState().globalFilter || ''}
                                onChange={(e) => table.setGlobalFilter(e.target.value)}
                            />
                        </div>

                        {/* Table */}
                        <div className="productos-table-wrapper">
                            <table className="productos-table">
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
                                                <i className="fas fa-box" style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}></i>
                                                <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No hay productos registrados</p>
                                                <p style={{ fontSize: '0.9rem' }}>Haz clic en "Nuevo Producto" para agregar el primero</p>
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
                        </div>

                        {/* Pagination */}
                        <div className="productos-pagination">
                            <div className="productos-pagination-info">
                                Mostrando {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} - {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length)} de {table.getFilteredRowModel().rows.length} productos
                            </div>
                            <div className="productos-pagination-controls">
                                <button
                                    className="productos-pagination-button"
                                    onClick={() => table.setPageIndex(0)}
                                    disabled={!table.getCanPreviousPage()}
                                >
                                    ««
                                </button>
                                <button
                                    className="productos-pagination-button"
                                    onClick={() => table.previousPage()}
                                    disabled={!table.getCanPreviousPage()}
                                >
                                    ‹
                                </button>
                                <button
                                    className="productos-pagination-button"
                                    onClick={() => table.nextPage()}
                                    disabled={!table.getCanNextPage()}
                                >
                                    ›
                                </button>
                                <button
                                    className="productos-pagination-button"
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

            {/* Modal para crear/editar producto */}
            <Modal
                isOpen={modalIsOpen}
                onRequestClose={() => setModalIsOpen(false)}
                className="productos-modal-content"
                overlayClassName="productos-modal-overlay"
            >
                <div className="productos-modal-header">
                    <h3 className="productos-modal-title">
                        <i className={`fas ${editingProducto ? 'fa-edit' : 'fa-plus'}`}></i>
                        {editingProducto ? 'Editar Producto' : 'Nuevo Producto'}
                    </h3>
                    <button
                        type="button"
                        className="productos-modal-close"
                        onClick={() => setModalIsOpen(false)}
                    >
                        ✕
                    </button>
                </div>

                <div className="productos-modal-body">
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        editingProducto ? actualizarProducto() : crearProducto();
                    }}>
                        <div className="productos-form-group">
                            <label className="productos-form-label">Descripción *</label>
                            <input
                                type="text"
                                className="productos-form-input"
                                name="Descripcion"
                                value={productoForm.Descripcion}
                                onChange={handleInputChange}
                                required
                                placeholder="Nombre del producto"
                            />
                        </div>

                        <div className="productos-form-row">
                            <div className="productos-form-group">
                                <label className="productos-form-label">Precio Sala *</label>
                                <input
                                    type="number"
                                    className="productos-form-input price-input"
                                    name="PrecioSala"
                                    value={productoForm.PrecioSala}
                                    onChange={handleInputChange}
                                    required
                                    placeholder="$$$"
                                />
                            </div>

                            <div className="productos-form-group">
                                <label className="productos-form-label">Precio Descuento *</label>
                                <input
                                    type="number"
                                    className="productos-form-input price-input"
                                    name="PrecioDto"
                                    value={productoForm.PrecioDto}
                                    onChange={handleInputChange}
                                    placeholder="$$$"
                                />
                            </div>
                        </div>

                        <div className="productos-form-group">
                            <div className="productos-form-checkbox-group">
                                <input
                                    type="checkbox"
                                    className="productos-form-checkbox"
                                    name="ProductoActivo"
                                    checked={productoForm.ProductoActivo}
                                    onChange={handleInputChange}
                                />
                                <label className="productos-form-label">Producto Activo</label>
                            </div>
                        </div>

                        <div className="productos-modal-footer">
                            <button
                                type="button"
                                className="productos-modal-button secondary"
                                onClick={() => setModalIsOpen(false)}
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="productos-modal-button primary"
                            >
                                <i className={`fas ${editingProducto ? 'fa-save' : 'fa-plus'}`}></i>
                                {editingProducto ? 'Actualizar' : 'Crear'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
        </div>
    );
}

export default Productos;
