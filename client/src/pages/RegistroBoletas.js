import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../config/api';
import Swal from 'sweetalert2';
import Modal from 'react-modal';
import { jsPDF } from 'jspdf';
import './RegistroBoletas.css';
import Autocomplete from '../components/Autocomplete';



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
    // Estado para el modal para editar boleta
    const [modalEditarIsOpen, setModalEditarIsOpen] = useState(false);
    const [editingBoleta, setEditingBoleta] = useState(null);
    const [editingDetalles, setEditingDetalles] = useState([]);
    const [observacionesGenerales, setObservacionesGenerales] = useState('');
    const [productos, setProductos] = useState([]); // Para cargar precios de productos

    // Estados para agregar nuevos productos en edición
    const [nuevoProductoForm, setNuevoProductoForm] = useState({
        CodigoProducto: '',
        Cantidad: 1,
        TipoPrecio: 'PrecioUnitario',
        PrecioUnitario: 0,
        DescripcionProducto: ''
    });

    // Estado para el modal de confirmación de eliminación
    const [modalEliminarIsOpen, setModalEliminarIsOpen] = useState(false);


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
    // Función para ver detalle de boleta
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

    // const handleTipoPrecioChange = (tipoPrecio) => {
    //     setProductoForm(prev => {
    //         const producto = productos.find(p => p.CodigoArticulo === prev.CodigoProducto);
    //         let nuevoPrecio = 0;

    //         if (producto) {
    //             nuevoPrecio = tipoPrecio === 'PrecioUnitario'
    //                 ? parseFloat(producto.PrecioUnitario || 0)
    //                 : parseFloat(producto.PrecioDescuento || 0);
    //         }

    //         return {
    //             ...prev,
    //             TipoPrecio: tipoPrecio,
    //             PrecioUnitario: nuevoPrecio
    //         };
    //     });
    // };
    // Función para editar boleta
    const editarBoleta = async (numeroBoleta) => {
        try {
            // Cargar datos de la boleta y productos en paralelo
            const [boletaResponse, productosResponse] = await Promise.all([
                api.get(`/boletas/${numeroBoleta}`),
                api.get('/articulos')
            ]);

            setEditingBoleta(boletaResponse.data.boleta);
            setEditingDetalles(boletaResponse.data.detalles || []);
            setObservacionesGenerales(boletaResponse.data.boleta.Observaciones || '');

            // Filtrar solo productos activos
            const productosActivos = productosResponse.data.filter(producto =>
                producto.ArticuloActivo === true || producto.ArticuloActivo === 1
            );
            setProductos(productosActivos);

            setModalEditarIsOpen(true);
        } catch (error) {
            console.error('Error al obtener boleta para editar:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error al Cargar Boleta',
                text: 'No se pudo cargar la boleta para editar.',
                confirmButtonText: 'Entendido'
            });
        }
    };

    // Función para actualizar un detalle específico
    const actualizarDetalle = (index, campo, valor) => {
        const nuevosDetalles = [...editingDetalles];

        // Asegurar que el detalle tenga TipoPrecio inicializado
        if (!nuevosDetalles[index].TipoPrecio) {
            nuevosDetalles[index].TipoPrecio = 'PrecioUnitario';
        }

        nuevosDetalles[index] = {
            ...nuevosDetalles[index],
            [campo]: valor
        };

        // Recalcular subtotal si se cambió cantidad o precio
        if (campo === 'Cantidad' || campo === 'PrecioUnitario') {
            const cantidad = campo === 'Cantidad' ? parseFloat(valor) || 0 : parseFloat(nuevosDetalles[index].Cantidad) || 0;
            const precio = campo === 'PrecioUnitario' ? parseFloat(valor) || 0 : parseFloat(nuevosDetalles[index].PrecioUnitario) || 0;
            nuevosDetalles[index].Subtotal = cantidad * precio;
        }

        setEditingDetalles(nuevosDetalles);
    };

    // Función para manejar cambio de tipo de precio
    const handleTipoPrecioCambio = (index, tipoPrecio) => {
        const nuevosDetalles = [...editingDetalles];
        const detalle = nuevosDetalles[index];

        // Buscar el producto en la lista de productos para obtener los precios
        const producto = productos.find(p => p.CodigoArticulo === detalle.CodigoProducto);

        if (producto) {
            const nuevoPrecio = tipoPrecio === 'PrecioUnitario'
                ? parseFloat(producto.PrecioUnitario || 0)
                : parseFloat(producto.PrecioDescuento || 0);

            nuevosDetalles[index] = {
                ...detalle,
                PrecioUnitario: nuevoPrecio,
                Subtotal: parseFloat(detalle.Cantidad || 0) * nuevoPrecio,
                TipoPrecio: tipoPrecio // Guardar el tipo de precio seleccionado
            };

            setEditingDetalles(nuevosDetalles);
        }
    };

    // Función para manejar cambio de producto en el formulario de agregar
    const handleNuevoProductoChange = (campo, valor) => {
        if (campo === 'producto') {
            const producto = productos.find(p => p.CodigoArticulo === valor);
            if (producto) {
                const precioSeleccionado = nuevoProductoForm.TipoPrecio === 'PrecioUnitario'
                    ? parseFloat(producto.PrecioUnitario || 0)
                    : parseFloat(producto.PrecioDescuento || 0);

                setNuevoProductoForm({
                    ...nuevoProductoForm,
                    CodigoProducto: valor,
                    PrecioUnitario: precioSeleccionado
                });
            }
        } else {
            // Para otros campos (cantidad, observaciones, etc.)
            setNuevoProductoForm(prev => ({
                ...prev,
                [campo]: valor
            }));
        }
    };

    // Función para manejar cambio de tipo de precio en el formulario de agregar
    const handleNuevoTipoPrecioCambio = (tipoPrecio) => {
        setNuevoProductoForm(prev => {
            const producto = productos.find(p => p.CodigoArticulo === prev.CodigoProducto);
            let nuevoPrecio = 0;

            if (producto) {
                nuevoPrecio = tipoPrecio === 'PrecioUnitario'
                    ? parseFloat(producto.PrecioUnitario || 0)
                    : parseFloat(producto.PrecioDescuento || 0);
            }

            return {
                ...prev,
                TipoPrecio: tipoPrecio,
                PrecioUnitario: nuevoPrecio
            };
        });
    };

    // Función para agregar nuevo producto a la boleta
    const agregarNuevoProducto = () => {
        if (!nuevoProductoForm.CodigoProducto || nuevoProductoForm.Cantidad <= 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Datos Incompletos',
                text: 'Por favor, seleccione un producto y especifique una cantidad válida.',
                confirmButtonText: 'Entendido'
            });
            return;
        }

        const producto = productos.find(p => p.CodigoArticulo === nuevoProductoForm.CodigoProducto);

        // Verificar si el producto ya existe en la boleta
        const productoExistente = editingDetalles.find(detalle => detalle.CodigoProducto === nuevoProductoForm.CodigoProducto);
        if (productoExistente) {
            Swal.fire({
                icon: 'warning',
                title: 'Producto Duplicado',
                text: 'Este producto ya existe en la boleta. Puede editar la cantidad directamente en la tabla.',
                confirmButtonText: 'Entendido'
            });
            return;
        }

        const subtotal = nuevoProductoForm.Cantidad * nuevoProductoForm.PrecioUnitario;

        const nuevoDetalle = {
            IdDetalleBoleta: `nuevo_${Date.now()}`, // ID temporal para productos nuevos
            CodigoProducto: nuevoProductoForm.CodigoProducto,
            Descripcion: producto.NombreArticulo || producto.Descripcion || 'Sin descripción',
            Cantidad: nuevoProductoForm.Cantidad,
            PrecioUnitario: nuevoProductoForm.PrecioUnitario,
            Subtotal: subtotal,
            DescripcionProducto: nuevoProductoForm.DescripcionProducto,
            TipoPrecio: nuevoProductoForm.TipoPrecio,
            esNuevo: true // Marcar como producto nuevo
        };

        setEditingDetalles([...editingDetalles, nuevoDetalle]);

        // Limpiar formulario
        setNuevoProductoForm({
            CodigoProducto: '',
            Cantidad: 1,
            TipoPrecio: 'PrecioUnitario',
            PrecioUnitario: 0,
            DescripcionProducto: ''
        });
    };

    // Función para eliminar producto de la boleta
    const eliminarProductoDeBoleta = (index) => {
        Swal.fire({
            title: 'Confirmar Eliminación',
            text: '¿Está seguro de que desea eliminar este producto de la boleta?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Eliminar',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                const nuevosDetalles = editingDetalles.filter((_, i) => i !== index);
                setEditingDetalles(nuevosDetalles);
            }
        });
    };

    // Función para calcular total de la boleta
    const calcularTotalBoleta = () => {
        return editingDetalles.reduce((total, detalle) => total + (parseFloat(detalle.Subtotal) || 0), 0);
    };

    // Función para guardar cambios en la boleta
    const guardarCambiosBoleta = async () => {
        try {
            // Validar que todos los campos requeridos estén completos
            const detallesValidos = editingDetalles.every(detalle =>
                detalle.Cantidad > 0 && detalle.PrecioUnitario > 0
            );

            if (!detallesValidos) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Datos Incompletos',
                    text: 'Todos los productos deben tener cantidad y precio mayor a 0.',
                    confirmButtonText: 'Entendido'
                });
                return;
            }

            const totalCalculado = calcularTotalBoleta();

            const datosActualizados = {
                numeroBoleta: editingBoleta.NumeroBoleta,
                detalles: editingDetalles.map(detalle => ({
                    IdDetalleBoleta: detalle.esNuevo ? null : detalle.IdDetalleBoleta, // null para productos nuevos
                    CodigoProducto: detalle.CodigoProducto,
                    Cantidad: parseFloat(detalle.Cantidad),
                    PrecioUnitario: parseFloat(detalle.PrecioUnitario),
                    Subtotal: parseFloat(detalle.Subtotal),
                    DescripcionProducto: detalle.DescripcionProducto || '',
                    esNuevo: detalle.esNuevo || false
                })),
                totalBoleta: totalCalculado,
                observaciones: observacionesGenerales
            };

            const response = await api.put(`/boletas/${editingBoleta.NumeroBoleta}`, datosActualizados);

            Swal.fire({
                icon: 'success',
                title: 'Boleta Actualizada',
                text: 'Los cambios han sido guardados exitosamente.',
                confirmButtonText: 'Continuar'
            });

            setModalEditarIsOpen(false);
            obtenerBoletas(); // Recargar la lista de boletas

        } catch (error) {
            console.error('Error al actualizar boleta:', error);
            const errorMsg = error.response?.data?.error || 'No se pudo actualizar la boleta';

            Swal.fire({
                icon: 'error',
                title: 'Error al Actualizar',
                text: errorMsg,
                confirmButtonText: 'Entendido'
            });
        }
    };

    const eliminarBoleta = async (numeroBoleta) => {
        const result = await Swal.fire({
            title: 'Confirmar Eliminación',
            text: `¿Está seguro de que desea eliminar la boleta N° ${numeroBoleta}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Eliminar Boleta',
            cancelButtonText: 'Cancelar',
            footer: 'Esta acción no se puede deshacer.'
        });

        if (result.isConfirmed) {
            try {
                console.log('🔍 Eliminando boleta:', numeroBoleta, 'Tipo:', typeof numeroBoleta);

                const response = await api.delete(`/boletas/${numeroBoleta}`);
                console.log('✅ Respuesta del servidor:', response);

                Swal.fire({
                    icon: 'success',
                    title: 'Boleta Eliminada',
                    text: `La boleta ${numeroBoleta} ha sido eliminada exitosamente.`,
                    confirmButtonText: 'Continuar'
                });
                obtenerBoletas();
            } catch (error) {
                console.error('❌ Error completo:', error);
                console.error('❌ Error response:', error.response?.data);
                console.error('❌ Error status:', error.response?.status);

                const errorMsg = error.response?.data?.error || 'No se pudo eliminar la boleta';
                const errorDetails = error.response?.data?.details || error.message;

                Swal.fire({
                    icon: 'error',
                    title: 'Error de Eliminación',
                    text: errorMsg,
                    footer: `Detalles: ${errorDetails}`,
                    confirmButtonText: 'Entendido'
                });
            }
        }
    };

    // Función para formatear fecha correctamente (corregir línea 152)
    const formatearFecha = (fechaString) => {
        if (!fechaString) return 'N/A';

        // Si la fecha ya está en formato DD/MM/YYYY, la devolvemos tal como está
        if (fechaString.includes('/')) {
            return fechaString;
        }

        // Si la fecha está en formato ISO (YYYY-MM-DD), la convertimos evitando el problema de zona horaria
        const [year, month, day] = fechaString.split('T')[0].split('-');
        return `${day}/${month}/${year}`;
    };

    const formatearPrecio = (precio) => {
        return new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP'
        }).format(precio);
    };

    const descargarBoleta = async (numeroBoleta) => {
        try {
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

            // Título principal más el número de boleta
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('TICKET DE VENTA', 105, 18, { align: 'center' });
            doc.text(`N°: ${boleta.NumeroBoleta}`, 190, 18, { align: 'right' });

            // Información básica de la boleta
            // Primero la fecha de creación (corregir línea 195)
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Fecha de creación: ${formatearFecha(boleta.FechaBoleta)}`, 20, 32);
            // Luego el usuario/vendedor que se selecciona en el formulario
            doc.text(`Vendedor: ${boleta.VendedorNombre || 'Vendedor N/A'}`, 125, 32, { align: 'center' });


            // Información del cliente
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('DATOS DEL CLIENTE', 20, 40);

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`RUT: ${boleta.Rut}`, 20, 46);
            doc.text(`NOMBRE: ${boleta.RazonSocial}`, 20, 52);
            if (boleta.Direccion) {
                doc.text(`DIRECCIÓN: ${boleta.Direccion.substring(0, 50)}`, 20, 58);
            }

            // Detalle de productos
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('DETALLE DE PRODUCTOS', 20, 70);

            const startY = 80; // Posición inicial para los detalles
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('Descripción', 20, startY);
            doc.text('Cant.', 120, startY);
            doc.text('Subtotal', 170, startY);

            doc.line(20, startY + 2, 190, startY + 2); // Línea horizontal debajo de los encabezados

            doc.setFont('helvetica', 'normal'); // Cambiar a fuente normal para los detalles
            let yPosition = startY + 6; // Posición inicial para los detalles de productos
            let subtotalGeneral = 0; // Inicializar subtotal general
            const lineHeight = 6; // Altura de línea más pequeña
            const maxDescriptionLength = 35; // Máximo de caracteres para descripción

            detalles.forEach((detalle) => {
                // Verificar si necesitamos una nueva página
                if (yPosition > 260) { // Límite antes del final de la página
                    doc.addPage();
                    yPosition = 20;

                    // Repetir encabezados en nueva página
                    doc.setFontSize(12);
                    doc.setFont('helvetica', 'bold');
                    doc.text('Descripción', 20, yPosition);
                    doc.text('Cant.', 120, yPosition);
                    doc.text('Subtotal', 170, yPosition);
                    doc.line(20, yPosition + 2, 190, yPosition + 2);
                    yPosition += 6;
                    doc.setFont('helvetica', 'normal');
                }

                // Descripción del producto
                const descripcion = (detalle.Descripcion || detalle.NombreProducto || '');
                doc.text(descripcion, 20, yPosition);

                // Cantidad formateada
                const cantidadFormateada = Number(detalle.Cantidad) % 1 === 0
                    ? Number(detalle.Cantidad).toString()
                    : Number(detalle.Cantidad).toFixed(1);
                doc.text(cantidadFormateada, 120, yPosition);

                // Subtotal
                doc.text(`$${Number(detalle.Subtotal).toLocaleString('es-CL')}`, 170, yPosition);

                // Descripción personalizada si existe
                if (detalle.DescripcionProducto && detalle.DescripcionProducto.trim() !== '') { // Aumentar la posición para la nota
                    yPosition += 4; // Aumentar la posición para la nota
                    doc.setFontSize(9); // Tamaño de fuente más pequeño para la nota
                    doc.setFont('helvetica', 'bold'); // Fuente en negrita para la nota
                    const notaTexto = `Nota: ${detalle.DescripcionProducto.substring(0, 60)}`; // Limitar a 60 caracteres
                    doc.text(notaTexto, 25, yPosition); // Aumentar la posición para la nota

                    doc.setFontSize(10); // Restablecer tamaño de fuente
                    doc.setFont('helvetica', 'normal'); // Restablecer fuente

                    yPosition += 2; // Aumentar la posición después de la nota
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
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('TOTAL:', 140, yPosition);
            doc.text(`$${subtotalGeneral.toLocaleString('es-CL')}`, 170, yPosition);

            // Observaciones
            const observaciones = boleta.Observaciones || boleta.observaciones || '';

            if (observaciones && observaciones.toString().trim() !== '') {
                yPosition += 12;

                // Verificar si necesitamos nueva página para observaciones
                if (yPosition > 250) {
                    doc.addPage();
                    yPosition = 20;
                }

                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text('OBSERVACIONES:', 20, yPosition);

                yPosition += 6;
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(10);

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
                    <button
                        className="registro-boletas-action-button edit"
                        onClick={() => editarBoleta(row.original.NumeroBoleta)}
                        title="Editar boleta"
                        aria-label="Editar boleta"
                    >
                        ✏️
                        <i className="fas fa-edit"></i>
                    </button>
                    <button
                        className="registro-boletas-action-button delete"
                        onClick={() => eliminarBoleta(row.original.NumeroBoleta)}
                        title="Eliminar boleta"
                        aria-label="Eliminar boleta"
                    >
                        🗑️
                        <i className="fas fa-delete"></i>
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
            {/* Modal para editar boleta */}
            <div className={`registro-boletas-modal-overlay ${modalEditarIsOpen ? 'show' : ''}`}>
                <div className="registro-boletas-modal-content">
                    {editingBoleta && (
                        <>
                            <div className="registro-boletas-modal-header">
                                <h3 className="registro-boletas-modal-title">
                                    <i className="fas fa-edit"></i>
                                    Editar Boleta N° {editingBoleta.NumeroBoleta}
                                </h3>
                                <button
                                    type="button"
                                    className="registro-boletas-modal-close"
                                    onClick={() => setModalEditarIsOpen(false)}
                                    aria-label="Cerrar modal"
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>

                            <div className="registro-boletas-modal-body">
                                {/* Información del cliente (solo lectura) */}
                                <div className="registro-boletas-edit-section">
                                    <h4 className="registro-boletas-detail-section-title">
                                        <i className="fas fa-user"></i>
                                        Información del Cliente (Solo lectura)
                                    </h4>
                                    <div className="registro-boletas-client-info">
                                        <div className="registro-boletas-detail-item">
                                            <span className="registro-boletas-detail-label">RUT:</span>
                                            <span className="registro-boletas-detail-value">{editingBoleta.Rut}</span>
                                        </div>
                                        <div className="registro-boletas-detail-item">
                                            <span className="registro-boletas-detail-label">Razón Social:</span>
                                            <span className="registro-boletas-detail-value">{editingBoleta.RazonSocial}</span>
                                        </div>
                                        <div className="registro-boletas-detail-item">
                                            <span className="registro-boletas-detail-label">Fecha Boleta:</span>
                                            <span className="registro-boletas-detail-value">{formatearFecha(editingBoleta.FechaBoleta)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Edición de productos */}
                                <div className="registro-boletas-edit-section">
                                    <h4 className="registro-boletas-detail-section-title">
                                        <i className="fas fa-list"></i>
                                        Editar Productos
                                    </h4>
                                    <div className="registro-boletas-edit-products-container">
                                        <table className="registro-boletas-edit-products-table">
                                            <thead>
                                                <tr>
                                                    <th>Descripción</th>
                                                    <th>Cantidad</th>
                                                    <th>Tipo Precio</th>
                                                    <th>Subtotal</th>
                                                    <th>Observaciones</th>
                                                    <th>Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {editingDetalles.map((detalle, index) => {
                                                    const producto = productos.find(p => p.CodigoArticulo === detalle.CodigoProducto);
                                                    const tipoPrecioActual = detalle.TipoPrecio || 'PrecioUnitario';

                                                    return (
                                                        <tr key={index}>
                                                            <td className="registro-boletas-product-description">
                                                                {detalle.Descripcion || detalle.NombreProducto}
                                                            </td>
                                                            <td>
                                                                <input
                                                                    type="number"
                                                                    step="0.5"
                                                                    min="0.5"
                                                                    value={detalle.Cantidad || ''}
                                                                    onChange={(e) => actualizarDetalle(index, 'Cantidad', e.target.value)}
                                                                    className="registro-boletas-edit-input cantidad"
                                                                />
                                                            </td>
                                                            <td>
                                                                <select
                                                                    value={tipoPrecioActual}
                                                                    onChange={(e) => handleTipoPrecioCambio(index, e.target.value)}
                                                                    className="registro-boletas-edit-input tipo-precio"
                                                                    disabled={!producto}
                                                                >
                                                                    <option value="PrecioUnitario">Precio Sala</option>
                                                                    <option value="PrecioDescuento">Precio Dsto.</option>
                                                                </select>
                                                                {producto && (
                                                                    <div className="registro-boletas-precios-info">
                                                                        <small>
                                                                            Actual: ${parseFloat(detalle.PrecioUnitario || 0).toLocaleString('es-CL')}
                                                                        </small>
                                                                        <small>
                                                                            Sala: ${parseFloat(producto.PrecioUnitario || 0).toLocaleString('es-CL')} |
                                                                            Dsto: ${parseFloat(producto.PrecioDescuento || 0).toLocaleString('es-CL')}
                                                                        </small>
                                                                    </div>
                                                                )}
                                                            </td>
                                                            <td className="registro-boletas-subtotal">
                                                                {formatearPrecio(detalle.Subtotal || 0)}
                                                            </td>
                                                            <td>
                                                                <textarea
                                                                    value={detalle.DescripcionProducto || ''}
                                                                    onChange={(e) => actualizarDetalle(index, 'DescripcionProducto', e.target.value)}
                                                                    className="registro-boletas-edit-textarea"
                                                                    placeholder="Observaciones del producto..."
                                                                    rows="2"
                                                                />
                                                            </td>
                                                            <td className="registro-boletas-actions">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => eliminarProductoDeBoleta(index)}
                                                                    className="registro-boletas-btn-delete"
                                                                    title="Eliminar producto"
                                                                >
                                                                    <i className="fas fa-trash"></i>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                            <tfoot>
                                                <tr className="registro-boletas-edit-total">
                                                    <th colSpan="3">Total General:</th>
                                                    <th>{formatearPrecio(calcularTotalBoleta())}</th>
                                                    <th></th>
                                                    <th></th>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>

                                {/* Agregar nuevo producto */}
                                <div className="registro-boletas-edit-section">
                                    <h4 className="registro-boletas-detail-section-title">
                                        <i className="fas fa-plus"></i>
                                        Agregar Nuevo Producto
                                    </h4>
                                    <div className="registro-boletas-nuevo-producto-form">
                                        <div className="registro-boletas-form-row">
                                            <div className="registro-boletas-form-group">
                                                <label className="form-label">Producto *</label>
                                                <Autocomplete
                                                    options={productos.map(producto => ({
                                                        value: producto.CodigoArticulo,
                                                        name: `${producto.CodigoArticulo} - ${producto.NombreArticulo || producto.Descripcion || 'Sin descripción'}`,
                                                        subtitle: `Sala: $${parseFloat(producto.PrecioUnitario || 0).toLocaleString('es-CL')} | Descuento: $${parseFloat(producto.PrecioDescuento || 0).toLocaleString('es-CL')} | Stock: ${producto.Stock || 'N/A'}`
                                                    }))}
                                                    value={nuevoProductoForm.CodigoProducto}
                                                    onChange={(codigoProducto) => handleNuevoProductoChange('producto', codigoProducto)}
                                                    placeholder="Buscar producto..."
                                                    className="form-input"
                                                    displayKey="name"
                                                    valueKey="value"
                                                    searchKeys={["name"]}
                                                    maxResults={10}
                                                    required
                                                />
                                            </div>
                                            <div className="registro-boletas-form-group">
                                                <label>Cantidad:</label>
                                                <input
                                                    type="number"
                                                    step="0.5"
                                                    min="0.5"
                                                    value={nuevoProductoForm.Cantidad}
                                                    onChange={(e) => handleNuevoProductoChange('Cantidad', e.target.value)}
                                                    className="registro-boletas-edit-input"
                                                />
                                            </div>
                                            <div className="registro-boletas-form-group">
                                                <label>Tipo Precio:</label>
                                                <select
                                                    value={nuevoProductoForm.TipoPrecio}
                                                    onChange={(e) => handleNuevoTipoPrecioCambio(e.target.value)}
                                                    className="registro-boletas-edit-input"
                                                    disabled={!nuevoProductoForm.CodigoProducto}
                                                >
                                                    <option value="PrecioUnitario">Precio Sala</option>
                                                    <option value="PrecioDescuento">Precio con Descuento</option>
                                                </select>
                                                {nuevoProductoForm.CodigoProducto && (() => {
                                                    const productoSeleccionado = productos.find(p => p.CodigoArticulo === nuevoProductoForm.CodigoProducto);
                                                    return productoSeleccionado ? (
                                                        <div className="registro-boletas-precios-info">
                                                            <small>
                                                                Precio Actual: ${parseFloat(nuevoProductoForm.PrecioUnitario || 0).toLocaleString('es-CL')}
                                                            </small>
                                                            <small>
                                                                Sala: ${parseFloat(productoSeleccionado.PrecioUnitario || 0).toLocaleString('es-CL')} | 
                                                                Dsto: ${parseFloat(productoSeleccionado.PrecioDescuento || 0).toLocaleString('es-CL')}
                                                            </small>
                                                        </div>
                                                    ) : null;
                                                })()}
                                            </div>
                                            <div className="registro-boletas-form-group">
                                                <label>Observaciones:</label>
                                                <input
                                                    type="text"
                                                    value={nuevoProductoForm.DescripcionProducto}
                                                    onChange={(e) => handleNuevoProductoChange('DescripcionProducto', e.target.value)}
                                                    className="registro-boletas-edit-input"
                                                    placeholder="Observaciones del producto..."
                                                />
                                            </div>
                                            <div className="registro-boletas-form-group">
                                                <button
                                                    type="button"
                                                    onClick={agregarNuevoProducto}
                                                    className="registro-boletas-btn-add"
                                                    disabled={!nuevoProductoForm.CodigoProducto || !nuevoProductoForm.Cantidad}
                                                >
                                                    <i className="fas fa-plus"></i>
                                                    Agregar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Observaciones generales */}
                                <div className="registro-boletas-edit-section">
                                    <h4 className="registro-boletas-detail-section-title">
                                        <i className="fas fa-comment"></i>
                                        Observaciones Generales
                                    </h4>
                                    <textarea
                                        value={observacionesGenerales}
                                        onChange={(e) => setObservacionesGenerales(e.target.value)}
                                        className="registro-boletas-edit-observaciones"
                                        placeholder="Observaciones generales de la boleta..."
                                        rows="3"
                                    />
                                </div>
                            </div>

                            <div className="registro-boletas-modal-footer">
                                <button
                                    type="button"
                                    className="registro-boletas-modal-button secondary"
                                    onClick={() => setModalEditarIsOpen(false)}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    className="registro-boletas-modal-button secondary"
                                    onClick={() => descargarBoleta(editingBoleta.NumeroBoleta)}
                                    title="Descargar PDF con datos actuales"
                                >
                                    <i className="fas fa-download"></i>
                                    Descargar PDF
                                </button>
                                <button
                                    type="button"
                                    className="registro-boletas-modal-button primary"
                                    onClick={guardarCambiosBoleta}
                                >
                                    <i className="fas fa-save"></i>
                                    Guardar Cambios
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
            {/* Modal para eliminar boletas */}
            <div className={`registro-boletas-modal-overlay ${modalEliminarIsOpen ? 'show' : ''}`}>
                <div className="registro-boletas-modal-content">
                    <div className="registro-boletas-modal-header">
                        <h3 className="registro-boletas-modal-title">
                            <i className="fas fa-trash"></i>
                            Eliminar Boleta
                        </h3>
                        <button
                            type="button"
                            className="registro-boletas-modal-close"
                            onClick={() => setModalEliminarIsOpen(false)}
                            aria-label="Cerrar modal"
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    </div>

                    <div className="registro-boletas-modal-body">
                        <p>¿Estás seguro de que deseas eliminar la boleta N° {boletaSeleccionada?.NumeroBoleta}?</p>
                    </div>

                    <div className="registro-boletas-modal-footer">
                        <button
                            type="button"
                            className="registro-boletas-modal-button secondary"
                            onClick={() => setModalEliminarIsOpen(false)}
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            className="registro-boletas-modal-button danger"
                            onClick={() => eliminarBoleta(boletaSeleccionada?.NumeroBoleta)}
                        >
                            Eliminar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default RegistroBoletas;
