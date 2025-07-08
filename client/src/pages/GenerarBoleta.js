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
          title: '¡Hasta luego!',
          text: 'Sesión cerrada exitosamente.',
          confirmButtonText: 'Entendido',
          timer: 2000
        });

        // Navegar a login
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

  // Estados para crear nueva boleta
  const [clientes, setClientes] = useState([]);
  const [articulos, setArticulos] = useState([]);
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
  
  // Estados para los artículos de la boleta
  const [articulosBoleta, setArticulosBoleta] = useState([]);
  const [articuloForm, setArticuloForm] = useState({
    CodigoArticulo: '',
    Cantidad: 1,
    PrecioUnitario: 0
  });
  
  // Estados para totales
  const [totales, setTotales] = useState({
    subtotalNeto: 0,
    totalImpuestos: 0,
    totalBruto: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // Función para calcular totales
  const calcularTotales = useCallback(() => {
    const subtotalNeto = articulosBoleta.reduce((sum, item) => sum + item.SubtotalNeto, 0);
    const totalImpuestos = articulosBoleta.reduce((sum, item) => sum + item.ImpuestoLinea, 0);
    const totalBruto = subtotalNeto + totalImpuestos;

    setTotales({
      subtotalNeto,
      totalImpuestos,
      totalBruto
    });
  }, [articulosBoleta]);

  // Cargar datos iniciales
  useEffect(() => {
    const usuarioLogueado = getCookie('usuario');
    if (usuarioLogueado) {
      setUsuario(usuarioLogueado);
    }
    cargarDatosIniciales();
  }, []);

  // Recalcular totales cuando cambien los artículos
  useEffect(() => {
    calcularTotales();
  }, [articulosBoleta, calcularTotales]);

  const cargarDatosIniciales = async () => {
    try {
      setLoading(true);
      const [clientesRes, articulosRes, usuariosRes] = await Promise.all([
        api.get('/clientes'),
        api.get('/articulos'),
        api.get('/usuarios')
      ]);
      
      // El backend ya filtra solo clientes activos
      setClientes(clientesRes.data);
      console.log('Clientes cargados:', clientesRes.data.length, 'clientes');
      
      const articulosActivos = articulosRes.data.filter(articulo => 
        articulo.ArticuloActivo === true || articulo.ArticuloActivo === 1
      );
      setArticulos(articulosActivos);
      console.log('Artículos activos:', articulosActivos.length, 'artículos');
      
      setUsuarios(usuariosRes.data);
      console.log('Usuarios cargados:', usuariosRes.data.length, 'usuarios');
      
      if (usuariosRes.data.length > 0) {
        setBoletaForm(prev => ({
          ...prev,
          CodigoUsuario: usuariosRes.data[0].CodigoUsuario
        }));
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error al cargar datos:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudieron cargar los datos necesarios',
        confirmButtonText: 'OK'
      });
      setLoading(false);
    }
  };

  const handleClienteChange = async (codigoCliente) => {
    setBoletaForm({ ...boletaForm, CodigoCliente: codigoCliente });
    
    if (codigoCliente) {
      try {
        const response = await api.get(`/clientes/${codigoCliente}`);
        setClienteSeleccionado(response.data);
      } catch (error) {
        console.error('Error al obtener cliente:', error);
        setClienteSeleccionado(null);
      }
    } else {
      setClienteSeleccionado(null);
    }
  };

  const handleArticuloChange = (codigoArticulo) => {
    const articulo = articulos.find(a => a.CodigoArticulo === codigoArticulo);
    if (articulo) {
      setArticuloForm({
        ...articuloForm,
        CodigoArticulo: codigoArticulo,
        PrecioUnitario: parseFloat(articulo.PrecioNeto || 0)
      });
    }
  };

  const agregarArticulo = () => {
    if (!articuloForm.CodigoArticulo || articuloForm.Cantidad <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Datos incompletos',
        text: 'Seleccione un artículo y ingrese una cantidad válida',
        confirmButtonText: 'OK'
      });
      return;
    }

    const articulo = articulos.find(a => a.CodigoArticulo === articuloForm.CodigoArticulo);
    const subtotalNeto = articuloForm.Cantidad * articuloForm.PrecioUnitario;
    const impuestoLinea = subtotalNeto * 0.19;
    const totalLinea = subtotalNeto + impuestoLinea;

    const nuevoArticulo = {
      CodigoArticulo: articuloForm.CodigoArticulo,
      NombreArticulo: articulo.NombreArticulo || articulo.Descripcion || 'Sin descripción',
      Cantidad: articuloForm.Cantidad,
      PrecioNetoUnitario: articuloForm.PrecioUnitario,
      SubtotalNeto: subtotalNeto,
      ImpuestoLinea: impuestoLinea,
      TotalLinea: totalLinea
    };

    setArticulosBoleta([...articulosBoleta, nuevoArticulo]);
    setArticuloForm({
      CodigoArticulo: '',
      Cantidad: 1,
      PrecioUnitario: 0
    });
  };

  const eliminarArticulo = (index) => {
    const nuevosArticulos = articulosBoleta.filter((_, i) => i !== index);
    setArticulosBoleta(nuevosArticulos);
  };

  const crearBoleta = async () => {
    if (!boletaForm.CodigoCliente || !boletaForm.CodigoUsuario || articulosBoleta.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Datos incompletos',
        text: 'Seleccione un cliente, un usuario y agregue al menos un artículo',
        confirmButtonText: 'OK'
      });
      return;
    }

    try {
      const fechaBoleta = new Date().toISOString().split('T')[0];
      const fechaVencimiento = new Date();
      fechaVencimiento.setDate(fechaVencimiento.getDate() + 30);
      
      const detalles = articulosBoleta.map(articulo => ({
        CodigoProducto: articulo.CodigoArticulo,
        Cantidad: articulo.Cantidad,
        PrecioUnitario: articulo.PrecioNetoUnitario,
        Subtotal: articulo.SubtotalNeto
      }));

      const boletaData = {
        CodigoCliente: boletaForm.CodigoCliente,
        FechaBoleta: fechaBoleta,
        FechaVencimiento: fechaVencimiento.toISOString().split('T')[0],
        TotalBoleta: totales.subtotalNeto,
        detalles: detalles
      };

      const boletaResponse = await api.post('/boletas', boletaData);
      const numeroBoleta = boletaResponse.data.NumeroBoleta;

      Swal.fire({
        icon: 'success',
        title: 'Boleta creada',
        text: `Boleta #${numeroBoleta} creada exitosamente`,
        confirmButtonText: 'OK'
      });

      generarPDF(numeroBoleta);
      limpiarFormulario();

    } catch (error) {
      console.error('Error al crear boleta:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.response?.data?.error || 'No se pudo crear la boleta',
        confirmButtonText: 'OK'
      });
    }
  };

  const generarPDF = async (numeroBoleta) => {
    try {
      const response = await api.get(`/boletas/${numeroBoleta}`);
      const { boleta, detalles } = response.data;

      const doc = new jsPDF();
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('BOLETA DE VENTA', 105, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Número de Boleta: ${boleta.NumeroBoleta}`, 20, 35);
      doc.text(`Fecha: ${new Date(boleta.FechaBoleta).toLocaleDateString('es-CL')}`, 20, 45);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('INFORMACIÓN DEL CLIENTE', 20, 65);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`RUT: ${boleta.Rut}`, 20, 75);
      doc.text(`Razón Social: ${boleta.RazonSocial}`, 20, 85);

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('DETALLE DE PRODUCTOS', 20, 105);

      const startY = 115;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Descripción', 20, startY);
      doc.text('Cantidad', 100, startY);
      doc.text('Precio Unit.', 130, startY);
      doc.text('Subtotal', 170, startY);

      doc.line(20, startY + 3, 190, startY + 3);

      doc.setFont('helvetica', 'normal');
      let yPosition = startY + 10;
      let subtotalGeneral = 0;

      detalles.forEach((detalle) => {
        doc.text(detalle.Descripcion.substring(0, 30), 20, yPosition);
        doc.text(detalle.Cantidad.toString(), 100, yPosition);
        doc.text(`$${Number(detalle.PrecioUnitario).toLocaleString('es-CL')}`, 130, yPosition);
        doc.text(`$${Number(detalle.Subtotal).toLocaleString('es-CL')}`, 170, yPosition);
        
        subtotalGeneral += Number(detalle.Subtotal);
        yPosition += 10;
      });

      yPosition += 5;
      doc.line(20, yPosition, 190, yPosition);

      yPosition += 10;
      doc.setFont('helvetica', 'bold');
      doc.text('SUBTOTAL NETO:', 130, yPosition);
      doc.text(`$${subtotalGeneral.toLocaleString('es-CL')}`, 170, yPosition);

      yPosition += 10;
      const impuestos = subtotalGeneral * 0.19;
      doc.text('IVA (19%):', 130, yPosition);
      doc.text(`$${impuestos.toLocaleString('es-CL')}`, 170, yPosition);

      yPosition += 10;
      const totalBruto = subtotalGeneral + impuestos;
      doc.setFontSize(12);
      doc.text('TOTAL:', 130, yPosition);
      doc.text(`$${totalBruto.toLocaleString('es-CL')}`, 170, yPosition);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Gracias por su compra', 105, 280, { align: 'center' });

      doc.save(`Boleta_${numeroBoleta}.pdf`);

    } catch (error) {
      console.error('Error al generar PDF:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo generar el PDF',
        confirmButtonText: 'OK'
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
    setArticulosBoleta([]);
    setArticuloForm({
      CodigoArticulo: '',
      Cantidad: 1,
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
      {/* Header específico del componente */}
      <header className="gb-header">
        <div className="gb-header-content">
          {/* Logo a la izquierda */}
          <div className="gb-header-logo">
            <button
              onClick={() => navigate('/home')}
              className="gb-logo-button"
              aria-label="Volver al home"
              title="Volver al home principal"
            >
              <i className="fas fa-file-invoice-dollar" style={{ fontSize: '2rem', color: 'var(--primary-blue)' }}></i>
            </button>
          </div>

          {/* Título centrado */}
          <div className="gb-header-text-group">
            <h1 className="gb-header-title">Generar Boleta</h1>
            <p className="gb-header-subtitle">Crear nueva boleta de venta</p>
          </div>

          {/* Usuario y botón de cerrar sesión a la derecha */}
          <div className="gb-header-actions">
            {usuario && (
              <span className="gb-user-greeting">
                <i className="fas fa-user"></i> {usuario}
              </span>
            )}
            <button
              onClick={cerrarSesion}
              className="gb-logout-button"
              disabled={isLoading}
              aria-label="Cerrar sesión"
              title="Cerrar sesión del sistema"
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
                      <label className="gb-form-label">Usuario/Vendedor *</label>
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
                    <div className="form-group">
                      <label className="form-label">Medio de Pago</label>
                      <select
                        className="form-input"
                        value={boletaForm.MedioPago}
                        onChange={(e) => setBoletaForm({ ...boletaForm, MedioPago: e.target.value })}
                      >
                        <option value="Efectivo">Efectivo</option>
                        <option value="Tarjeta">Tarjeta</option>
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
                          <span className="detail-value">{clienteSeleccionado.RUT}</span>
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

              {/* Agregar Artículos */}
              <div className="form-card">
                <div className="card-header">
                  <h3 className="card-title">Agregar Artículos</h3>
                </div>
                <div className="card-body">
                  <div className="form-row">
                    <div className="form-group full-width">
                      <label className="form-label">Artículo *</label>
                      <select
                        className="form-input"
                        value={articuloForm.CodigoArticulo}
                        onChange={(e) => handleArticuloChange(e.target.value)}
                      >
                        <option value="">Seleccione un artículo</option>
                        {articulos.map((articulo) => (
                          <option key={articulo.CodigoArticulo} value={articulo.CodigoArticulo}>
                            {articulo.CodigoArticulo} - {articulo.NombreArticulo || articulo.Descripcion || 'Sin descripción'} - ${parseFloat(articulo.PrecioNeto || 0).toLocaleString('es-CL')}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Cantidad</label>
                      <input
                        type="number"
                        className="form-input"
                        min="1"
                        value={articuloForm.Cantidad}
                        onChange={(e) => setArticuloForm({ ...articuloForm, Cantidad: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label className="form-label">Precio Unitario</label>
                      <input
                        type="number"
                        className="form-input"
                        step="0.01"
                        value={articuloForm.PrecioUnitario}
                        onChange={(e) => setArticuloForm({ ...articuloForm, PrecioUnitario: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  
                  <div className="form-actions">
                    <button onClick={agregarArticulo} className="generar-boleta-button primary">
                      ➕ Agregar Artículo
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna derecha - Lista de Artículos y Resumen */}
            <div className="form-section">
              {/* Lista de Artículos */}
              {articulosBoleta.length > 0 && (
                <div className="form-card">
                  <div className="card-header">
                    <h3 className="card-title">Artículos en la Boleta ({articulosBoleta.length})</h3>
                  </div>
                  <div className="card-body">
                    <div className="articles-list">
                      {articulosBoleta.map((articulo, index) => (
                        <div key={index} className="article-item">
                          <div className="article-info">
                            <div className="article-name">{articulo.NombreArticulo}</div>
                            <div className="article-code">Código: {articulo.CodigoArticulo}</div>
                          </div>
                          <div className="article-details">
                            <div className="article-quantity">Cant: {articulo.Cantidad}</div>
                            <div className="article-price">${articulo.PrecioNetoUnitario.toLocaleString('es-CL')}</div>
                            <div className="article-total">${articulo.TotalLinea.toLocaleString('es-CL')}</div>
                          </div>
                          <button
                            onClick={() => eliminarArticulo(index)}
                            className="generar-boleta-action-button delete"
                            aria-label="Eliminar artículo"
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
              {articulosBoleta.length > 0 && (
                <div className="form-card">
                  <div className="card-header">
                    <h3 className="card-title">Resumen de la Boleta</h3>
                  </div>
                  <div className="card-body totals-summary">
                    <div className="total-row">
                      <span className="total-label">Subtotal Neto:</span>
                      <span className="total-value">${totales.subtotalNeto.toLocaleString('es-CL')}</span>
                    </div>
                    <div className="total-row">
                      <span className="total-label">IVA (19%):</span>
                      <span className="total-value">${totales.totalImpuestos.toLocaleString('es-CL')}</span>
                    </div>
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
                      disabled={!boletaForm.CodigoCliente || !boletaForm.CodigoUsuario || articulosBoleta.length === 0}
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
