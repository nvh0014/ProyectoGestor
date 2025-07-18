import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import api from '../config/api';
import Swal from 'sweetalert2';
import Autocomplete from '../components/Autocomplete';
import './GenerarBoleta.css';

function GenerarBoleta() {
  const navigate = useNavigate();
  
  // Estados para el header
  const [isLoading, setIsLoading] = useState(false);
  const [usuario, setUsuario] = useState('');

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

  // Estados para crear nueva boleta
  const [clientes, setClientes] = useState([]);
  const [productos, setProductos] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  
  // Estados del formulario de boleta
  const [boletaForm, setBoletaForm] = useState({
    CodigoCliente: '',
    CodigoUsuario: '',
    MedioPago: 'Efectivo',
    Observaciones: ''
  });
  
  // Estados para la información del cliente seleccionado
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  
  // Estados para los productos de la boleta
  const [productosBoleta, setProductosBoleta] = useState([]);
  const [productoForm, setProductoForm] = useState({
    CodigoProducto: '',
    Cantidad: 1,
    TipoPrecio: 'PrecioUnitario', // 'PrecioUnitario' para Precio Sala, 'PrecioDescuento' para Precio con Descuento
    PrecioUnitario: 0,
    DescripcionProducto: '' // Nueva descripción personalizada
  });
  
  // Estados para totales
  const [totales, setTotales] = useState({
    subtotalNeto: 0,
    totalImpuestos: 0,
    totalBruto: 0
  });
  
  const [loading, setLoading] = useState(true);

  // Función para calcular totales
  const calcularTotales = useCallback(() => {
    const subtotalNeto = productosBoleta.reduce((sum, item) => sum + item.SubtotalNeto, 0);
    
    setTotales({
      subtotalNeto,
      totalImpuestos: 0, // Ya no calculamos IVA
      totalBruto: subtotalNeto // Total es igual al subtotal
    });
  }, [productosBoleta]);

  // Cargar datos iniciales
  useEffect(() => {
    const usuarioLogueado = getCookie('usuario');
    if (usuarioLogueado) {
      setUsuario(usuarioLogueado);
    }
    cargarDatosIniciales();
  }, []);

  // Recalcular totales cuando cambien los productos
  useEffect(() => {
    calcularTotales();
  }, [productosBoleta, calcularTotales]);

  const cargarDatosIniciales = async () => {
    try {
      setLoading(true);
      const [clientesRes, productosRes, usuariosRes] = await Promise.all([
        api.get('/clientes'),
        api.get('/articulos'),
        api.get('/usuarios')
      ]);
      
      // El backend ya filtra solo clientes activos
      setClientes(clientesRes.data);
      console.log('Clientes cargados:', clientesRes.data.length, 'clientes');
      console.log('Estructura de cliente ejemplo:', clientesRes.data[0]);
      
      const productosActivos = productosRes.data.filter(producto => 
        producto.ArticuloActivo === true || producto.ArticuloActivo === 1
      );
      setProductos(productosActivos);
      console.log('Productos activos:', productosActivos.length, 'productos');
      
      setUsuarios(usuariosRes.data);
      console.log('Usuarios cargados:', usuariosRes.data.length, 'usuarios');
      
      if (usuariosRes.data.length > 0) {
        setBoletaForm(prev => ({
          ...prev,
          CodigoUsuario: usuariosRes.data[0].CodigoUsuario
        }));
      }
      
      // Agregar tiempo de carga para asegurar que los datos se carguen correctamente
      setTimeout(() => {
        setLoading(false);
      }, 1500);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error de Conectividad',
        text: 'No se pudo establecer conexión con el servidor para cargar los datos requeridos.',
        confirmButtonText: 'Entendido'
      });
      // Agregar tiempo de carga para el manejo de errores
      setTimeout(() => {
        setLoading(false);
      }, 1500);
    }
  };

  const handleClienteChange = async (codigoCliente) => {
    setBoletaForm({ ...boletaForm, CodigoCliente: codigoCliente });
    
    if (codigoCliente) {
      try {
        const response = await api.get(`/clientes/${codigoCliente}`);
        console.log('Datos del cliente seleccionado:', response.data);
        setClienteSeleccionado(response.data);
      } catch (error) {
        console.error('Error al obtener cliente:', error);
        setClienteSeleccionado(null);
      }
    } else {
      setClienteSeleccionado(null);
    }
  };

  const handleProductoChange = (codigoProducto) => {
    const producto = productos.find(p => p.CodigoArticulo === codigoProducto);
    if (producto) {
      const precioSeleccionado = productoForm.TipoPrecio === 'PrecioUnitario' 
        ? parseFloat(producto.PrecioUnitario || 0)
        : parseFloat(producto.PrecioDescuento || 0);
        
      setProductoForm({
        ...productoForm,
        CodigoProducto: codigoProducto,
        PrecioUnitario: precioSeleccionado
      });
    }
  };

  const handleTipoPrecioChange = (tipoPrecio) => {
    setProductoForm(prev => {
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

  const agregarProducto = () => {
    if (!productoForm.CodigoProducto || productoForm.Cantidad <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Datos Incompletos',
        text: 'Por favor, seleccione un producto y especifique una cantidad válida.',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    const producto = productos.find(p => p.CodigoArticulo === productoForm.CodigoProducto);
    const subtotalNeto = productoForm.Cantidad * productoForm.PrecioUnitario;
    
    const nuevoProducto = {
      CodigoProducto: productoForm.CodigoProducto,
      NombreProducto: producto.NombreArticulo || producto.Descripcion || 'Sin descripción',
      Cantidad: productoForm.Cantidad,
      PrecioNetoUnitario: productoForm.PrecioUnitario,
      SubtotalNeto: subtotalNeto,
      ImpuestoLinea: 0, // Ya no hay IVA
      TotalLinea: subtotalNeto, // Total es igual al subtotal
      DescripcionProducto: productoForm.DescripcionProducto // Nueva descripción personalizada
    };

    setProductosBoleta([...productosBoleta, nuevoProducto]);
    setProductoForm({
      CodigoProducto: '',
      Cantidad: 1,
      TipoPrecio: 'PrecioUnitario',
      PrecioUnitario: 0,
      DescripcionProducto: ''
    });
  };

  const eliminarProducto = (index) => {
    const nuevosProductos = productosBoleta.filter((_, i) => i !== index);
    setProductosBoleta(nuevosProductos);
  };

  const crearBoleta = async () => {
    if (!boletaForm.CodigoCliente || !boletaForm.CodigoUsuario || productosBoleta.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Datos Incompletos',
        text: 'Por favor, complete todos los campos requeridos: cliente, usuario y al menos un producto.',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    try {
      const fechaBoleta = new Date().toISOString().split('T')[0];
      const fechaVencimiento = new Date();
      fechaVencimiento.setDate(fechaVencimiento.getDate() + 30);
      
      const detalles = productosBoleta.map(producto => ({
        CodigoProducto: producto.CodigoProducto,
        Cantidad: producto.Cantidad,
        PrecioUnitario: producto.PrecioNetoUnitario,
        Subtotal: producto.SubtotalNeto,
        DescripcionProducto: producto.DescripcionProducto || ''
      }));

      const boletaData = {
        CodigoCliente: boletaForm.CodigoCliente,
        FechaBoleta: fechaBoleta,
        FechaVencimiento: fechaVencimiento.toISOString().split('T')[0],
        TotalBoleta: totales.subtotalNeto,
        Observaciones: boletaForm.Observaciones || '',
        detalles: detalles
      };

      const boletaResponse = await api.post('/boletas', boletaData);
      const numeroBoleta = boletaResponse.data.NumeroBoleta;

      Swal.fire({
        icon: 'success',
        title: 'Boleta Generada',
        text: `La boleta N° ${numeroBoleta} ha sido generada exitosamente.`,
        confirmButtonText: 'Continuar'
      });

      generarPDF(numeroBoleta);
      limpiarFormulario();

    } catch (error) {
      console.error('Error al crear boleta:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error al Generar Boleta',
        text: 'No se pudo generar la boleta. Verifique los datos e intente nuevamente.',
        confirmButtonText: 'Entendido'
      });
    }
  };

  const generarPDF = async (numeroBoleta) => {
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

    } catch (error) {
      console.error('Error al generar PDF:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error al Generar PDF',
        text: 'La boleta fue creada pero no se pudo generar el documento PDF.',
        confirmButtonText: 'Entendido'
      });
    }
  };

  const limpiarFormulario = () => {
    setBoletaForm({
      CodigoCliente: '',
      CodigoUsuario: usuarios.length > 0 ? usuarios[0].CodigoUsuario : '',
      MedioPago: 'Efectivo',
      Observaciones: ''
    });
    setClienteSeleccionado(null);
    setProductosBoleta([]);
    setProductoForm({
      CodigoProducto: '',
      Cantidad: 1,
      TipoPrecio: 'PrecioUnitario',
      PrecioUnitario: 0
    });
  };

  if (loading) {
    return (
      <div className="generar-boleta-container">
        <div className="gb-loading-container">
          <div className="gb-loading-spinner">
            <div className="gb-spinner"></div>
            <span>Cargando...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="generar-boleta-container">
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
                        <h1 className="clientes-header-title">Generar Boleta</h1>
                        <p className="clientes-header-subtitle">Crea PDF´s de venta</p>
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

      <main className="gb-main-content">

        {/* Contenido principal */}
        <div className="gb-form-container">
          <div className="gb-form-grid">
            {/* Columna izquierda - Información de la Boleta */}
            <div className="gb-form-section">
              <div className="gb-form-card">
                <div className="gb-card-header">
                  <h3 className="gb-card-title">Información de la Boleta</h3>
                </div>
                <div className="gb-card-body">
                  <div className="gb-form-row">
                    <div className="gb-form-group">
                      <label className="gb-form-label">Cliente *</label>
                      {/* Versión con Autocomplete mejorado */}
                      <Autocomplete
                        options={clientes.map(cliente => ({
                          value: cliente.CodigoCliente,
                          name: `${cliente.CodigoCliente} - ${cliente.NombreCliente || cliente.RazonSocial || 'Sin nombre'}`,
                          subtitle: cliente.Giro || null
                        }))}
                        value={boletaForm.CodigoCliente}
                        onChange={(codigoCliente) => handleClienteChange(codigoCliente)}
                        placeholder="Buscar cliente..."
                        className="gb-form-input"
                        displayKey="name"
                        valueKey="value"
                        searchKeys={["name"]}
                        required
                      />
                      
                      {/* Versión con select - comentada pero disponible si necesitas */}
                      {/*
                      <select
                        className="gb-form-input"
                        value={boletaForm.CodigoCliente}
                        onChange={(e) => handleClienteChange(e.target.value)}
                        required
                      >
                        <option value="">Seleccione un cliente</option>
                        {clientes.map(cliente => (
                          <option key={cliente.CodigoCliente} value={cliente.CodigoCliente}>
                            {cliente.CodigoCliente} - {cliente.NombreCliente || cliente.RazonSocial || 'Sin nombre'}
                          </option>
                        ))}
                      </select>
                      */}
                    </div>
                    
                    <div className="gb-form-group">
                      <label className="gb-form-label">Vendedor *</label>
                      <select
                        className="gb-form-input"
                        value={boletaForm.CodigoUsuario}
                        onChange={(e) => setBoletaForm({ ...boletaForm, CodigoUsuario: e.target.value })}
                      >
                        <option value="">Seleccione un usuario</option>
                        {usuarios.map((usuario) => (
                          <option key={usuario.CodigoUsuario} value={usuario.CodigoUsuario}>
                            {usuario.CodigoUsuario} - {usuario.NombreUsuario}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="form-row">
                  {/* Eliminado campo de descripción personalizada de la sección de clientes */}
                    <div className="form-group">
                      <label className="form-label">Medio de Pago</label>
                      <select
                        className="form-input"
                        value={boletaForm.MedioPago}
                        onChange={(e) => setBoletaForm({ ...boletaForm, MedioPago: e.target.value })}
                      >
                        <option value="Efectivo">Efectivo</option>
                        <option value="Transferencia">Transferencia</option>
                      </select>
                    </div>
                  </div>

                  {/* Información del Cliente Seleccionado */}
                  {clienteSeleccionado && (
                    <div className="client-info">
                      <h4>Información del Cliente</h4>
                      <div className="client-details">
                        <div className="client-detail">
                          <span className="detail-label">RUT:</span>
                          <span className="detail-value">
                            {clienteSeleccionado.RUT || clienteSeleccionado.Rut || clienteSeleccionado.rut || 'N/A'}
                          </span>
                        </div>
                        <div className="client-detail">
                          <span className="detail-label">Teléfono:</span>
                          <span className="detail-value">{clienteSeleccionado.Telefono || 'N/A'}</span>
                        </div>
                        <div className="client-detail">
                          <span className="detail-label">Dirección:</span>
                          <span className="detail-value">{clienteSeleccionado.Direccion || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Agregar Productos */}
              <div className="form-card">
                <div className="card-header">
                  <h3 className="gb-card-title">Agregar Productos</h3>
                </div>
                <div className="card-body">
                  <div className="form-row">
                    <div className="form-group full-width">
                      <label className="form-label">Producto *</label>
                      <Autocomplete
                        options={productos.map(producto => ({
                          value: producto.CodigoArticulo,
                          name: `${producto.CodigoArticulo} - ${producto.NombreArticulo || producto.Descripcion || 'Sin descripción'}`,
                          subtitle: `Sala: $${parseFloat(producto.PrecioUnitario || 0).toLocaleString('es-CL')} | Descuento: $${parseFloat(producto.PrecioDescuento || 0).toLocaleString('es-CL')} | Stock: ${producto.Stock || 'N/A'}`
                        }))}
                        value={productoForm.CodigoProducto}
                        onChange={(codigoProducto) => handleProductoChange(codigoProducto)}
                        placeholder="Buscar producto..."
                        className="form-input"
                        displayKey="name"
                        valueKey="value"
                        searchKeys={["name"]}
                        maxResults={10}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group full-width">
                      <label className="form-label">Descripción personalizada (opcional)</label>
                      <input
                        type="text"
                        className="form-input"
                        value={productoForm.DescripcionProducto}
                        onChange={e => setProductoForm({ ...productoForm, DescripcionProducto: e.target.value })}
                        placeholder="Ej: Detalle especial para este producto en la boleta"
                        maxLength={200}
                      />
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Cantidad</label>
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        className="form-input"
                        value={productoForm.Cantidad}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          if (value >= 0) {
                            setProductoForm({ ...productoForm, Cantidad: value });
                          }
                        }}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Tipo de Precio</label>
                      <select
                        className="form-input"
                        value={productoForm.TipoPrecio}
                        onChange={(e) => handleTipoPrecioChange(e.target.value)}
                        disabled={!productoForm.CodigoProducto}
                      >
                        <option value="PrecioUnitario">Precio Sala</option>
                        <option value="PrecioDescuento">Precio con Descuento</option>
                      </select>
                    </div>
                  </div>
                  
                  {/* Mostrar el precio seleccionado */}
                  {productoForm.CodigoProducto && (
                    <div className="form-row">
                      <div className="form-group full-width">
                        <div className="precio-seleccionado">
                          <span className="precio-label">
                            Precio {productoForm.TipoPrecio === 'PrecioUnitario' ? 'Sala' : 'con Descuento'}:
                          </span>
                          <span className="precio-valor">
                            ${productoForm.PrecioUnitario.toLocaleString('es-CL')}
                          </span>
                          {productoForm.Cantidad > 0 && (
                            <span className="precio-total">
                              | Total: ${(productoForm.PrecioUnitario * productoForm.Cantidad).toLocaleString('es-CL')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="form-actions">
                    <button onClick={agregarProducto} className="generar-boleta-button primary">
                      ➕ Agregar Producto
                    </button>
                  </div>
                </div>
              </div>

              {/* Panel de Observaciones */}
              <div className="form-card">
                <div className="card-header">
                  <h3 className="gb-card-title">Observaciones</h3>
                </div>
                <div className="card-body">
                  <div className="form-group">
                    <label className="form-label">Observaciones de la Boleta</label>
                    <textarea
                      className="form-input"
                      value={boletaForm.Observaciones}
                      onChange={(e) => setBoletaForm({ ...boletaForm, Observaciones: e.target.value })}
                      placeholder="Ingrese observaciones adicionales para la boleta..."
                      rows="3"
                      maxLength="200"
                    />
                    <small className="form-help-text">
                      Máximo 200 caracteres. Estas observaciones aparecerán en el PDF de la boleta.
                    </small>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna derecha - Lista de Productos y Resumen */}
            <div className="form-section">
              {/* Lista de Productos */}
              {productosBoleta.length > 0 && (
                <div className="form-card">
                  <div className="card-header">
                    <h3 className="gb-card-title">Productos en la Boleta ({productosBoleta.length})</h3>
                  </div>
                  <div className="card-body">
                    <div className="articles-list">
                      {productosBoleta.map((producto, index) => (
                        <div key={index} className="article-item">
                          <div className="article-info">
                            <div className="article-name">{producto.NombreProducto}</div>
                            <div className="article-code">Código: {producto.CodigoProducto}</div>
                          </div>
                          <div className="article-details">
                            <div className="article-quantity">Cant: {producto.Cantidad % 1 === 0 ? producto.Cantidad : producto.Cantidad.toFixed(1)}</div>
                            <div className="article-price">${producto.PrecioNetoUnitario.toLocaleString('es-CL')}</div>
                            <div className="article-total">${producto.TotalLinea.toLocaleString('es-CL')}</div>
                          </div>
                          <button
                            onClick={() => eliminarProducto(index)}
                            className="generar-boleta-action-button delete"
                            aria-label="Eliminar producto"
                          >
                            🗑️
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Resumen de Totales */}
              {productosBoleta.length > 0 && (
                <div className="form-card">
                  <div className="card-header">
                    <h3 className="gb-card-title">Resumen de la Boleta</h3>
                    <div className="total-row total-final">
                      <span className="total-label">TOTAL:</span>
                      <span className="total-value">${totales.totalBruto.toLocaleString('es-CL')}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Botones de Acción */}
              <div className="form-card">
                <div className="card-body">
                  <div className="action-buttons">
                    <button
                      onClick={crearBoleta}
                      disabled={!boletaForm.CodigoCliente || !boletaForm.CodigoUsuario || productosBoleta.length === 0}
                      className="generar-boleta-button success"
                    >
                      📄 Crear Boleta y Generar PDF
                    </button>
                    
                    <button 
                      onClick={limpiarFormulario} 
                      className="generar-boleta-button secondary"
                    >
                      🧹 Limpiar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default GenerarBoleta;
