import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import Swal from 'sweetalert2';
import Modal from 'react-modal';
import { jsPDF } from 'jspdf';
import './RegistroBoletas.css';


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

function RegistroBoletas() {
    const navigate = useNavigate();
    
    // Estados para el header
    const [isLoading, setIsLoading] = useState(false);
    const [usuario, setUsuario] = useState('');

    // Estados para las boletas
    const [boletas, setBoletas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [boletaSeleccionada, setBoletaSeleccionada] = useState(null);
    const [detallesBoleta, setDetallesBoleta] = useState([]);

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

    // Funciones para obtener datos
    const obtenerBoletas = async () => {
        try {
            setLoading(true);
            const response = await api.get('/boletas');
            setBoletas(response.data);
        } catch (error) {
            console.error('Error al obtener boletas:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error de Conectividad',
                text: 'No se pudo establecer conexión con el servidor para cargar las boletas.',
                confirmButtonText: 'Entendido'
            });
        } finally {
            // Agregar tiempo de carga para asegurar que los datos se carguen correctamente
            setTimeout(() => {
                setLoading(false);
            }, 1500);
        }
    };

    const verDetalleBoleta = async (numeroBoleta) => {
        try {
            const response = await api.get(`/boletas/${numeroBoleta}`);
            setBoletaSeleccionada(response.data.boleta);
            setDetallesBoleta(response.data.detalles);
            setModalIsOpen(true);
        } catch (error) {
            console.error('Error al obtener detalle de boleta:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error de Conectividad',
                text: 'No se pudo cargar el detalle de la boleta seleccionada.',
                confirmButtonText: 'Entendido'
            });
        }
    };

    const formatearFecha = (fecha) => {
        return new Date(fecha).toLocaleDateString('es-CL');
    };

    const formatearPrecio = (precio) => {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP'
        }).format(precio);
    };

    const descargarBoleta = async (numeroBoleta) => {
        try {
            // Mostrar loading
            Swal.fire({
                title: 'Generando PDF...',
                text: 'Por favor espere mientras se genera el documento.',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            // Obtener los datos de la boleta
            const response = await api.get(`/boletas/${numeroBoleta}`);
            const { boleta, detalles } = response.data;

            console.log('Datos de la boleta para PDF:', boleta);
            console.log('Observaciones recibidas:', boleta.Observaciones);

            const doc = new jsPDF();
            
            // Agregar logo de la distribuidora en la esquina superior izquierda
            try {
                const logoImg = new Image();
                logoImg.crossOrigin = 'anonymous';
                
                await new Promise((resolve, reject) => {
                    logoImg.onload = () => {
                        try {
                            doc.addImage(logoImg, 'PNG', 10, 10, 15, 15); // Logo más pequeño
                            resolve();
                        } catch (error) {
                            console.warn('Error al agregar logo al PDF:', error);
                            resolve();
                        }
                    };
                    logoImg.onerror = () => {
                        console.warn('No se pudo cargar el logo');
                        resolve();
                    };
                    logoImg.src = '/logo512.png';
                });
            } catch (error) {
                console.warn('Error al procesar logo:', error);
            }
            
            // Título principal (más compacto)
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('TICKET DE VENTA', 105, 18, { align: 'center' });

            // Información básica de la boleta (más compacta)
            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            doc.text(`Número de boleta: ${boleta.NumeroBoleta}`, 20, 32);
            doc.text(`Fecha de creación: ${new Date(boleta.FechaBoleta).toLocaleDateString('es-CL')}`, 120, 32);
            
            // Información del cliente (más compacta)
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('DATOS DEL CLIENTE', 20, 42);

            doc.setFontSize(7);
            doc.setFont('helvetica', 'normal');
            doc.text(`RUT: ${boleta.Rut}`, 20, 48);
            doc.text(`${boleta.RazonSocial}`, 20, 52);
            if (boleta.Direccion) {
                doc.text(`Dir: ${boleta.Direccion.substring(0, 50)}`, 20, 56);
            }

            // Detalle de productos (encabezados más compactos)
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('DETALLE DE PRODUCTOS', 20, 66);

            const startY = 72;
            doc.setFontSize(7);
            doc.setFont('helvetica', 'bold');
            doc.text('Descripción', 20, startY);
            doc.text('Cant.', 120, startY);
            doc.text('Precio', 140, startY);
            doc.text('Total', 170, startY);

            doc.line(20, startY + 2, 190, startY + 2);

            doc.setFont('helvetica', 'normal');
            let yPosition = startY + 6;
            let subtotalGeneral = 0;
            const lineHeight = 6; // Altura de línea más pequeña
            const maxDescriptionLength = 35; // Máximo de caracteres para descripción

            detalles.forEach((detalle) => {
                // Verificar si necesitamos una nueva página
                if (yPosition > 260) { // Límite antes del final de la página
                    doc.addPage();
                    yPosition = 20;
                    
                    // Repetir encabezados en nueva página
                    doc.setFontSize(7);
                    doc.setFont('helvetica', 'bold');
                    doc.text('Descripción', 20, yPosition);
                    doc.text('Cant.', 120, yPosition);
                    doc.text('Precio', 140, yPosition);
                    doc.text('Total', 170, yPosition);
                    doc.line(20, yPosition + 2, 190, yPosition + 2);
                    yPosition += 6;
                    doc.setFont('helvetica', 'normal');
                }

                // Descripción del producto (truncada si es muy larga)
                const descripcion = (detalle.Descripcion || detalle.NombreProducto || '').substring(0, maxDescriptionLength);
                doc.text(descripcion, 20, yPosition);
                
                // Cantidad formateada
                const cantidadFormateada = Number(detalle.Cantidad) % 1 === 0 
                    ? Number(detalle.Cantidad).toString() 
                    : Number(detalle.Cantidad).toFixed(1);
                doc.text(cantidadFormateada, 120, yPosition);
                
                // Precio y total
                doc.text(`$${Number(detalle.PrecioUnitario).toLocaleString('es-CL')}`, 140, yPosition);
                doc.text(`$${Number(detalle.Subtotal).toLocaleString('es-CL')}`, 170, yPosition);
                
                // Descripción personalizada si existe (más compacta)
                if (detalle.DescripcionProducto && detalle.DescripcionProducto.trim() !== '') {
                    yPosition += 4;
                    doc.setFontSize(6);
                    doc.setTextColor(100);
                    const notaTexto = `Nota: ${detalle.DescripcionProducto.substring(0, 60)}`;
                    doc.text(notaTexto, 25, yPosition);
                    doc.setFontSize(7);
                    doc.setTextColor(0);
                    yPosition += 2;
                }
                
                subtotalGeneral += Number(detalle.Subtotal);
                yPosition += lineHeight;
            });

            // Verificar espacio para totales y observaciones
            if (yPosition > 240) {
                doc.addPage();
                yPosition = 20;
            }

            yPosition += 3;
            doc.line(20, yPosition, 190, yPosition);

            yPosition += 8;
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text('TOTAL:', 140, yPosition);
            doc.text(`$${subtotalGeneral.toLocaleString('es-CL')}`, 170, yPosition);

            // Observaciones (más compactas)
            const observaciones = boleta.Observaciones || boleta.observaciones || '';
            
            if (observaciones && observaciones.toString().trim() !== '') {
                yPosition += 12;
                
                // Verificar si necesitamos nueva página para observaciones
                if (yPosition > 250) {
                    doc.addPage();
                    yPosition = 20;
                }
                
                doc.setFontSize(9);
                doc.setFont('helvetica', 'bold');
                doc.text('OBSERVACIONES:', 20, yPosition);
                
                yPosition += 6;
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(7);
                
                // Dividir observaciones en líneas más cortas
                const observacionesLines = doc.splitTextToSize(observaciones.toString(), 160);
                doc.text(observacionesLines, 20, yPosition);
            }

            doc.save(`Boleta_${numeroBoleta}.pdf`);

            // Cerrar loading y mostrar éxito
            Swal.close();
            Swal.fire({
                icon: 'success',
                title: 'PDF Generado',
                text: `La boleta N° ${boleta.NumeroBoleta} ha sido descargada exitosamente.`,
                confirmButtonText: 'Entendido'
            });

        } catch (error) {
            console.error('Error al descargar boleta:', error);
            Swal.close();
            Swal.fire({
                icon: 'error',
                title: 'Error al Generar PDF',
                text: 'No se pudo generar el PDF de la boleta. Intente nuevamente.',
                confirmButtonText: 'Entendido'
            });
        }
    };

    // Configuración de columnas de la tabla
    const columns = useMemo(() => [
        {
            accessorKey: 'NumeroBoleta',
            header: 'N° Boleta',
        },
        {
            accessorKey: 'RazonSocial',
            header: 'Cliente',
        },
        {
            accessorKey: 'FechaBoleta',
            header: 'Fecha Boleta',
            cell: ({ getValue }) => formatearFecha(getValue())
        },
        {
            accessorKey: 'FechaVencimiento',
            header: 'Fecha Vencimiento',
            cell: ({ getValue }) => getValue() ? formatearFecha(getValue()) : '-'
        },
        {
            accessorKey: 'TotalBoleta',
            header: 'Total',
            cell: ({ getValue }) => formatearPrecio(getValue())
        },
        {
            id: 'acciones',
            header: 'Acciones',
            cell: ({ row }) => (
                <div className="registro-boletas-table-actions">
                    <button
                        className="registro-boletas-action-button view"
                        onClick={() => verDetalleBoleta(row.original.NumeroBoleta)}
                        title="Ver detalle"
                        aria-label="Ver detalle de la boleta"
                    >
                        👁️
                        <i className="fas fa-eye"></i>
                    </button>
                    <button
                        className="registro-boletas-action-button download"
                        onClick={() => descargarBoleta(row.original.NumeroBoleta)}
                        title="Descargar boleta"
                        aria-label="Descargar PDF de la boleta"
                    >
                        📥
                        <i className="fas fa-download"></i>
                    </button>
                </div>
            )
        }
    ], []);

    // Configuración de la tabla
    const table = useReactTable({
        data: boletas,
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
        obtenerBoletas();
    }, []);

    if (loading) {
        return (
            <div className="registro-boletas-container">
                <div className="registro-boletas-loading">
                    <div className="registro-boletas-loading-spinner"></div>
                    <div className="registro-boletas-loading-text">Cargando boletas...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="registro-boletas-container">
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
                        <h1 className="clientes-header-title">Gestión de boletas emitidas</h1>
                        <p className="clientes-header-subtitle">Administra la información de tus boletas emitidas</p>
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
            <main className="registro-boletas-main-content">
                <h2 className="registro-boletas-title">Registro de Boletas Emitidas</h2>
                
                <div className="registro-boletas-content-card">
                    <div className="registro-boletas-card-header">
                        <h3 className="registro-boletas-card-title">
                            <i className="fas fa-file-invoice"></i>
                            Lista de Boletas
                        </h3>
                        <div className="registro-boletas-stats">
                            <div className="registro-boletas-stat">
                                <div className="registro-boletas-stat-value">{boletas.length}</div>
                                <div className="registro-boletas-stat-label">PDF´s Generados</div>
                            </div>
                            <button 
                                className="clientes-add-button"
                                onClick={() => navigate('/generarboleta')}
                            >
                                <i className="fas fa-plus"></i>
                                Nueva Boleta
                            </button>
                        </div>
                    </div>
                    
                    <div className="registro-boletas-table-container">
                        {/* Controls */}
                        <div className="registro-boletas-table-controls">
                            <input
                                type="text"
                                className="registro-boletas-search-input"
                                placeholder="Buscar boletas..."
                                value={table.getState().globalFilter || ''}
                                onChange={(e) => table.setGlobalFilter(e.target.value)}
                            />
                        </div>

                        {/* Table */}
                        <div className="registro-boletas-table-wrapper">
                            <table className="registro-boletas-table">
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
                                    {table.getRowModel().rows.map(row => (
                                        <tr key={row.id}>
                                            {row.getVisibleCells().map(cell => (
                                                <td key={cell.id}>
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="registro-boletas-pagination">
                            <div className="registro-boletas-pagination-info">
                                Mostrando {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} - {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length)} de {table.getFilteredRowModel().rows.length} boletas
                            </div>
                            <div className="registro-boletas-pagination-controls">
                                <button
                                    className="registro-boletas-pagination-button"
                                    onClick={() => table.setPageIndex(0)}
                                    disabled={!table.getCanPreviousPage()}
                                >
                                    ««
                                </button>
                                <button
                                    className="registro-boletas-pagination-button"
                                    onClick={() => table.previousPage()}
                                    disabled={!table.getCanPreviousPage()}
                                >
                                    ‹
                                </button>
                                <button
                                    className="registro-boletas-pagination-button"
                                    onClick={() => table.nextPage()}
                                    disabled={!table.getCanNextPage()}
                                >
                                    ›
                                </button>
                                <button
                                    className="registro-boletas-pagination-button"
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

            {/* Modal para ver detalle de boleta */}
            <div className={`registro-boletas-modal-overlay ${modalIsOpen ? 'show' : ''}`}>
                <div className="registro-boletas-modal-content">
                    {boletaSeleccionada && (
                        <>
                            <div className="registro-boletas-modal-header">
                                <h3 className="registro-boletas-modal-title">
                                    <i className="fas fa-file-invoice"></i>
                                    Detalle Boleta N° {boletaSeleccionada.NumeroBoleta}
                                </h3>
                                <button 
                                    type="button" 
                                    className="registro-boletas-modal-close"
                                    onClick={() => setModalIsOpen(false)}
                                    aria-label="Cerrar modal"
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>

                            <div className="registro-boletas-modal-body">
                                <div className="registro-boletas-detail-grid">
                                    <div className="registro-boletas-detail-section">
                                        <h4 className="registro-boletas-detail-section-title">
                                            <i className="fas fa-user"></i>
                                            Información del Cliente
                                        </h4>
                                        <div className="registro-boletas-detail-item">
                                            <span className="registro-boletas-detail-label">RUT:</span>
                                            <span className="registro-boletas-detail-value">{boletaSeleccionada.Rut}</span>
                                        </div>
                                        <div className="registro-boletas-detail-item">
                                            <span className="registro-boletas-detail-label">Razón Social:</span>
                                            <span className="registro-boletas-detail-value">{boletaSeleccionada.RazonSocial}</span>
                                        </div>
                                        <div className="registro-boletas-detail-item">
                                            <span className="registro-boletas-detail-label">Teléfono:</span>
                                            <span className="registro-boletas-detail-value">{boletaSeleccionada.Telefono || '-'}</span>
                                        </div>
                                        <div className="registro-boletas-detail-item">
                                            <span className="registro-boletas-detail-label">Dirección:</span>
                                            <span className="registro-boletas-detail-value">{boletaSeleccionada.Direccion || '-'}</span>
                                        </div>
                                        <div className="registro-boletas-detail-item">
                                            <span className="registro-boletas-detail-label">Comuna:</span>
                                            <span className="registro-boletas-detail-value">{boletaSeleccionada.Comuna || '-'}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="registro-boletas-detail-section">
                                        <h4 className="registro-boletas-detail-section-title">
                                            <i className="fas fa-file-invoice"></i>
                                            Información de la Boleta
                                        </h4>
                                        <div className="registro-boletas-detail-item">
                                            <span className="registro-boletas-detail-label">Fecha Boleta:</span>
                                            <span className="registro-boletas-detail-value">{formatearFecha(boletaSeleccionada.FechaBoleta)}</span>
                                        </div>
                                        <div className="registro-boletas-detail-item">
                                            <span className="registro-boletas-detail-label">Fecha Vencimiento:</span>
                                            <span className="registro-boletas-detail-value">{boletaSeleccionada.FechaVencimiento ? formatearFecha(boletaSeleccionada.FechaVencimiento) : '-'}</span>
                                        </div>
                                        <div className="registro-boletas-detail-item">
                                            <span className="registro-boletas-detail-label">Total:</span>
                                            <span className="registro-boletas-detail-value registro-boletas-total-highlight">{formatearPrecio(boletaSeleccionada.TotalBoleta)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="registro-boletas-products-section">
                                    <h4 className="registro-boletas-detail-section-title">
                                        <i className="fas fa-list"></i>
                                        Detalle de Productos
                                    </h4>
                                    <div className="registro-boletas-products-table-container">
                                        <table className="registro-boletas-products-table">
                                            <thead>
                                                <tr>
                                                    <th>Descripción</th>
                                                    <th>Cantidad</th>
                                                    <th>Precio Unitario</th>
                                                    <th>Subtotal</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {detallesBoleta.map((detalle, index) => (
                                                    <tr key={index}>
                                                        <td>{detalle.Descripcion}</td>
                                                        <td>{detalle.Cantidad}</td>
                                                        <td>{formatearPrecio(detalle.PrecioUnitario)}</td>
                                                        <td>{formatearPrecio(detalle.Subtotal)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr className="registro-boletas-products-total">
                                                    <th colSpan="3">Total:</th>
                                                    <th>{formatearPrecio(boletaSeleccionada.TotalBoleta)}</th>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            <div className="registro-boletas-modal-footer">
                                <button 
                                    type="button" 
                                    className="registro-boletas-modal-button secondary"
                                    onClick={() => setModalIsOpen(false)}
                                >
                                    Cerrar
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default RegistroBoletas;
