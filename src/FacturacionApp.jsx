import React, { useState, useEffect } from "react";
import axios from "axios";
// Agrega estos imports al inicio de tu archivo
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const FacturacionApp = () => {
  // Estados generales
  const [activeTab, setActiveTab] = useState("facturas");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estados para facturas
  const [facturas, setFacturas] = useState([]);
  const [generandoPDF, setGenerandoPDF] = useState(false);

  const [facturaDetalle, setFacturaDetalle] = useState(null);
  const [nuevaFactura, setNuevaFactura] = useState({
    clienteId: "",
    impuestoId: null,
    items: [], // Esto ya está bien
  });
  const [itemFactura, setItemFactura] = useState({
    productoId: "",
    cantidad: 1,
  });
  const [filtroFacturas, setFiltroFacturas] = useState({
    fechaDesde: "",
    fechaHasta: "",
    clienteId: "",
  });

  // Estados para clientes
  const [clientes, setClientes] = useState([]);
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: "",
    apellido: "",
    telefono: "",
    documento: "",
    direccion: {
      calle: "",
      ciudad: "",
      provincia: "",
      codigoPostal: "",
      pais: "",
    },
  });

  // Estados para productos
  const [productos, setProductos] = useState([]);
  const [nuevoProducto, setNuevoProducto] = useState({
    nombre: "",
    descripcion: "",
    precio: 0,
    stock: 0,
    codigoBarras: "",
    categoria: "",
  });

  // Estados para impuestos
  const [impuestos, setImpuestos] = useState([]);
  const [nuevoImpuesto, setNuevoImpuesto] = useState({
    nombre: "",
    porcentaje: 0,
  });

  // API base URL
  const API_URL = "https://vigilant-smile-production-efb9.up.railway.app/api";

  // Función para cargar facturas con filtros
  const cargarFacturas = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/facturas`);
      setFacturas(response.data);
    } catch (err) {
      setError(`Error al cargar facturas: ${err.message}`);
      setFacturas([]);
    } finally {
      setLoading(false);
    }
  };

  // Función para ver detalle de factura
  const verDetalleFactura = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_URL}/facturas/${id}`);
      setFacturaDetalle(response.data);
    } catch (err) {
      setError(`Error al cargar detalle: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Función para cargar clientes
  const cargarClientes = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/clientes`);
      if (Array.isArray(response.data)) {
        setClientes(response.data);
      } else {
        throw new Error("La respuesta no es un array");
      }
    } catch (err) {
      setError(`Error al cargar clientes: ${err.message}`);
      setClientes([]);
    } finally {
      setLoading(false);
    }
  };

  // Función para cargar productos
  const cargarProductos = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/productos`);
      if (Array.isArray(response.data)) {
        setProductos(response.data);
      } else {
        throw new Error("La respuesta no es un array");
      }
    } catch (err) {
      setError(`Error al cargar productos: ${err.message}`);
      setProductos([]);
    } finally {
      setLoading(false);
    }
  };

  // Función para cargar impuestos
  const cargarImpuestos = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/impuestos`);
      if (Array.isArray(response.data)) {
        setImpuestos(response.data);
      } else {
        throw new Error("La respuesta no es un array");
      }
    } catch (err) {
      setError(`Error al cargar impuestos: ${err.message}`);
      setImpuestos([]);
    } finally {
      setLoading(false);
    }
  };

  // Función para generar PDF
  const generarPDF = async () => {
    try {
      if (!facturaDetalle) {
        throw new Error("No hay datos de factura cargados");
      }

      const input = document.getElementById(`factura-${facturaDetalle.id}`);

      if (!input) {
        throw new Error("No se encontró el contenido de la factura");
      }

      // Añade un spinner o indicador de carga
      setGenerandoPDF(true);

      const canvas = await html2canvas(input, {
        scale: 2,
        logging: true,
        useCORS: true,
        scrollY: -window.scrollY, // Corrige problemas de desplazamiento
        windowWidth: document.documentElement.offsetWidth,
        windowHeight: document.documentElement.offsetHeight,
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = pdf.internal.pageSize.getWidth() - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
      pdf.save(`factura-${facturaDetalle.id}.pdf`);
    } catch (error) {
      console.error("Error al generar PDF:", error);
      alert("Error al generar PDF: " + error.message);
    } finally {
      setGenerandoPDF(false);
    }
  };

  const generarXML = (factura) => {
    // Crear estructura XML básica para una factura
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<FacturaElectronica xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
  <ID>${factura.id}</ID>
  <FechaEmision>${new Date(factura.fechaCreacion).toISOString()}</FechaEmision>
  <Cliente>
    <Nombre>${factura.cliente.nombre} ${factura.cliente.apellido}</Nombre>
    <Documento>${factura.cliente.documento}</Documento>
  </Cliente>
  <Items>`;

    // Agregar items
    factura.items.forEach((item) => {
      xml += `
    <Item>
      <Producto>${item.producto.nombre}</Producto>
      <Cantidad>${item.cantidad}</Cantidad>
      <PrecioUnitario>${item.precioUnitario}</PrecioUnitario>
      <Subtotal>${item.subtotal}</Subtotal>
    </Item>`;
    });

    // Cerrar estructura XML
    xml += `
  </Items>
  <Total>${factura.total}</Total>
</FacturaElectronica>`;

    // Crear y descargar archivo
    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `factura-${factura.id}.xml`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Cargar datos cuando cambia la pestaña activa
  useEffect(() => {
    if (activeTab === "facturas") {
      cargarFacturas();
      cargarClientes(); // Necesario para los filtros
      cargarProductos();
      cargarImpuestos();
    } else if (activeTab === "clientes") {
      cargarClientes();
    } else if (activeTab === "productos") {
      cargarProductos();
    } else if (activeTab === "impuestos") {
      cargarImpuestos();
    }
  }, [activeTab]);

  // Función para agregar item a factura
  const handleAddItemFactura = async () => {
    try {
      const producto = productos.find((p) => p.id == itemFactura.productoId);
      if (!producto) throw new Error("Producto no encontrado");
      if (producto.stock < itemFactura.cantidad)
        throw new Error("Stock insuficiente");

      const nuevoItem = {
        productoId: itemFactura.productoId,
        cantidad: itemFactura.cantidad,
        precioUnitario: producto.precio,
        subtotal: producto.precio * itemFactura.cantidad,
      };

      setNuevaFactura({
        ...nuevaFactura,
        items: [...nuevaFactura.items, nuevoItem],
      });

      setItemFactura({
        productoId: "",
        cantidad: 1,
      });
    } catch (err) {
      setError(err.message);
    }
  };

  // Función para crear una nueva factura
  const handleCrearFactura = async () => {
    try {
      if (!nuevaFactura.clienteId) throw new Error("Seleccione un cliente");
      if (nuevaFactura.items.length === 0)
        throw new Error("Agregue al menos un item");

      const facturaData = {
        clienteId: parseInt(nuevaFactura.clienteId),
        impuestoId: nuevaFactura.impuestoId
          ? parseInt(nuevaFactura.impuestoId)
          : null,
        items: nuevaFactura.items.map((item) => ({
          productoId: parseInt(item.productoId),
          cantidad: parseInt(item.cantidad),
        })),
      };

      const response = await axios.post(`${API_URL}/facturas`, facturaData);
      setFacturas([...facturas, response.data]);

      // Resetear formulario
      setNuevaFactura({
        clienteId: "",
        impuestoId: null,
        items: [],
      });

      alert("Factura creada exitosamente");
      cargarFacturas(); // Recargar la lista de facturas
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };
  // Funciones para otras entidades (clientes, productos, impuestos)
  const handleCrearCliente = async () => {
    try {
      const response = await axios.post(`${API_URL}/clientes`, nuevoCliente);
      setClientes([...clientes, response.data]);
      setNuevoCliente({
        nombre: "",
        apellido: "",
        telefono: "",
        documento: "",
        direccion: {
          calle: "",
          ciudad: "",
          provincia: "",
          codigoPostal: "",
          pais: "",
        },
      });
      alert("Cliente creado exitosamente");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCrearProducto = async () => {
    try {
      const response = await axios.post(`${API_URL}/productos`, nuevoProducto);
      setProductos([...productos, response.data]);
      setNuevoProducto({
        nombre: "",
        descripcion: "",
        precio: 0,
        stock: 0,
        codigoBarras: "",
        categoria: "",
      });
      alert("Producto creado exitosamente");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCrearImpuesto = async () => {
    try {
      const response = await axios.post(`${API_URL}/impuestos`, nuevoImpuesto);
      setImpuestos([...impuestos, response.data]);
      setNuevoImpuesto({
        nombre: "",
        porcentaje: 0,
      });
      alert("Impuesto creado exitosamente");
    } catch (err) {
      setError(err.message);
    }
  };

  // Render
  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">Sistema de Facturación</h1>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
          <button
            type="button"
            className="close"
            onClick={() => setError(null)}
          >
            <span>&times;</span>
          </button>
        </div>
      )}

      <ul className="nav nav-tabs">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "facturas" ? "active" : ""}`}
            onClick={() => setActiveTab("facturas")}
          >
            Facturas
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "clientes" ? "active" : ""}`}
            onClick={() => setActiveTab("clientes")}
          >
            Clientes
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "productos" ? "active" : ""}`}
            onClick={() => setActiveTab("productos")}
          >
            Productos
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === "impuestos" ? "active" : ""}`}
            onClick={() => setActiveTab("impuestos")}
          >
            Impuestos
          </button>
        </li>
      </ul>

      <div className="tab-content p-3 border border-top-0 rounded-bottom">
        {loading ? (
          <div className="text-center">
            <div className="spinner-border" role="status">
              <span className="sr-only">Cargando...</span>
            </div>
          </div>
        ) : (
          <>
            {/* Pestaña de Facturas */}
            {activeTab === "facturas" && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <h2>Gestión de Facturas</h2>
                  <div>
                    <button
                      className="btn btn-primary mr-2"
                      onClick={() => setFacturaDetalle(null)}
                    >
                      <i className="fas fa-plus"></i> Nueva Factura
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={cargarFacturas}
                    >
                      <i className="fas fa-sync-alt"></i> Actualizar
                    </button>
                  </div>
                </div>

                {facturaDetalle ? (
                  <div
                    className="card mb-4"
                    id={`factura-${facturaDetalle.id}`}
                  >
                    <div className="card-header bg-primary text-white">
                      <div className="d-flex justify-content-between align-items-center">
                        <h3 className="mb-0">Factura #{facturaDetalle.id}</h3>
                        <span className="badge bg-light text-dark">
                          {new Date(
                            facturaDetalle.fechaCreacion
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="card-body">
                      <div className="row mb-4">
                        <div className="col-md-6">
                          <h5>Información del Cliente</h5>
                          <div className="border p-3 rounded">
                            <p className="mb-1">
                              <strong>Nombre:</strong>{" "}
                              {facturaDetalle.cliente?.nombre}{" "}
                              {facturaDetalle.cliente?.apellido}
                            </p>
                            <p className="mb-1">
                              <strong>Documento:</strong>{" "}
                              {facturaDetalle.cliente?.documento}
                            </p>
                            <p className="mb-1">
                              <strong>Teléfono:</strong>{" "}
                              {facturaDetalle.cliente?.telefono}
                            </p>
                            <p className="mb-0">
                              <strong>Dirección:</strong>{" "}
                              {facturaDetalle.cliente?.direccion?.calle},{" "}
                              {facturaDetalle.cliente?.direccion?.ciudad}
                            </p>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <h5>Detalles de Factura</h5>
                          <div className="border p-3 rounded">
                            {facturaDetalle.impuesto && (
                              <p className="mb-1">
                                <strong>Impuesto:</strong>{" "}
                                {facturaDetalle.impuesto.nombre} (
                                {facturaDetalle.impuesto.porcentaje}%)
                              </p>
                            )}
                            <p className="mb-1">
                              <strong>Fecha:</strong>{" "}
                              {new Date(
                                facturaDetalle.fechaCreacion
                              ).toLocaleDateString()}
                            </p>
                            <p className="mb-0">
                              <strong>Estado:</strong>{" "}
                              <span className="badge bg-success">Pagada</span>
                            </p>
                          </div>
                        </div>
                      </div>

                      <h5 className="mt-4">Detalle de Productos</h5>
                      <table className="table table-bordered">
                        <thead className="table-dark">
                          <tr>
                            <th>Producto</th>
                            <th className="text-center">Precio Unitario</th>
                            <th className="text-center">Cantidad</th>
                            <th className="text-center">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {facturaDetalle.items?.map((item, index) => (
                            <tr key={index}>
                              <td>
                                <strong>{item.producto?.nombre}</strong>
                                <br />
                                <small className="text-muted">
                                  {item.producto?.descripcion}
                                </small>
                              </td>
                              <td className="text-end">
                                ${item.precioUnitario?.toFixed(2)}
                              </td>
                              <td className="text-center">{item.cantidad}</td>
                              <td className="text-end">
                                ${item.subtotal?.toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr>
                            <td colSpan="3" className="text-end">
                              <strong>Subtotal:</strong>
                            </td>
                            <td className="text-end">
                              $
                              {facturaDetalle.items
                                ?.reduce((sum, item) => sum + item.subtotal, 0)
                                ?.toFixed(2)}
                            </td>
                          </tr>
                          {facturaDetalle.impuesto && (
                            <tr>
                              <td colSpan="3" className="text-end">
                                <strong>
                                  Impuesto ({facturaDetalle.impuesto.nombre}):
                                </strong>
                              </td>
                              <td className="text-end">
                                $
                                {(
                                  (facturaDetalle.items?.reduce(
                                    (sum, item) => sum + item.subtotal,
                                    0
                                  ) *
                                    facturaDetalle.impuesto.porcentaje) /
                                  100
                                )?.toFixed(2)}
                              </td>
                            </tr>
                          )}
                          <tr className="table-active">
                            <td colSpan="3" className="text-end">
                              <strong>Total:</strong>
                            </td>
                            <td className="text-end">
                              <h5 className="mb-0">
                                ${facturaDetalle.total?.toFixed(2)}
                              </h5>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                      <div className="d-print-none">
                        {" "}
                        {/* Esta clase es clave */}
                        <div className="d-flex justify-content-between mt-4">
                          <button className="btn btn-outline-secondary">
                            <i className="fas fa-arrow-left"></i> Volver
                          </button>
                          <div>
                            <button
                              className="btn btn-primary mr-2"
                              onClick={generarPDF}
                            >
                              <i className="fas fa-file-pdf"></i> PDF
                            </button>
                            <button
                              className="btn btn-secondary"
                              onClick={() => generarXML(facturaDetalle)}
                            >
                              <i className="fas fa-file-code"></i> XML
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="card mb-4">
                      <div className="card-header">
                        <h4>Filtros de Búsqueda</h4>
                      </div>
                      <div className="card-body">
                        <div className="row">
                          <div className="col-md-3">
                            <label>Fecha Desde</label>
                            <input
                              type="date"
                              className="form-control"
                              value={filtroFacturas.fechaDesde}
                              onChange={(e) =>
                                setFiltroFacturas({
                                  ...filtroFacturas,
                                  fechaDesde: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="col-md-3">
                            <label>Fecha Hasta</label>
                            <input
                              type="date"
                              className="form-control"
                              value={filtroFacturas.fechaHasta}
                              onChange={(e) =>
                                setFiltroFacturas({
                                  ...filtroFacturas,
                                  fechaHasta: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div className="col-md-4">
                            <label>Cliente</label>
                            <select
                              className="form-control"
                              value={filtroFacturas.clienteId}
                              onChange={(e) =>
                                setFiltroFacturas({
                                  ...filtroFacturas,
                                  clienteId: e.target.value,
                                })
                              }
                            >
                              <option value="">Todos los clientes</option>
                              {clientes.map((cliente) => (
                                <option key={cliente.id} value={cliente.id}>
                                  {cliente.nombre} {cliente.apellido}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="col-md-2 d-flex align-items-end">
                            <button
                              className="btn btn-primary w-100"
                              onClick={cargarFacturas}
                            >
                              <i className="fas fa-filter"></i> Filtrar
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="card mb-4">
                      <div className="card-header">
                        <h4>Nueva Factura</h4>
                      </div>
                      <div className="card-body">
                        <div className="row mb-3">
                          <div className="col-md-6">
                            <label>Cliente</label>
                            <select
                              className="form-control"
                              value={nuevaFactura.clienteId}
                              onChange={(e) =>
                                setNuevaFactura({
                                  ...nuevaFactura,
                                  clienteId: e.target.value,
                                })
                              }
                              required
                            >
                              <option value="">Seleccione un cliente</option>
                              {clientes.map((cliente) => (
                                <option key={cliente.id} value={cliente.id}>
                                  {cliente.nombre} {cliente.apellido} -{" "}
                                  {cliente.documento}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="col-md-6">
                            <label>Impuesto (Opcional)</label>
                            <select
                              className="form-control"
                              value={nuevaFactura.impuestoId || ""}
                              onChange={(e) =>
                                setNuevaFactura({
                                  ...nuevaFactura,
                                  impuestoId: e.target.value || null,
                                })
                              }
                            >
                              <option value="">Sin impuesto</option>
                              {impuestos.map((impuesto) => (
                                <option key={impuesto.id} value={impuesto.id}>
                                  {impuesto.nombre} ({impuesto.porcentaje}%)
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <h5>Items de Factura</h5>
                        <div className="row mb-3">
                          <div className="col-md-5">
                            <label>Producto</label>
                            <select
                              className="form-control"
                              value={itemFactura.productoId}
                              onChange={(e) =>
                                setItemFactura({
                                  ...itemFactura,
                                  productoId: e.target.value,
                                })
                              }
                            >
                              <option value="">Seleccione un producto</option>
                              {productos.map((producto) => (
                                <option key={producto.id} value={producto.id}>
                                  {producto.nombre} - ${producto.precio} (Stock:{" "}
                                  {producto.stock})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="col-md-3">
                            <label>Cantidad</label>
                            <input
                              type="number"
                              className="form-control"
                              min="1"
                              value={itemFactura.cantidad}
                              onChange={(e) =>
                                setItemFactura({
                                  ...itemFactura,
                                  cantidad: parseInt(e.target.value) || 1,
                                })
                              }
                            />
                          </div>
                          <div className="col-md-4 d-flex align-items-end">
                            <button
                              className="btn btn-primary"
                              onClick={handleAddItemFactura}
                              disabled={!itemFactura.productoId}
                            >
                              Agregar Item
                            </button>
                          </div>
                        </div>

                        {nuevaFactura.items.length > 0 && (
                          <div className="mb-3">
                            <h5>Items Agregados</h5>
                            <table className="table">
                              <thead>
                                <tr>
                                  <th>Producto</th>
                                  <th>Cantidad</th>
                                  <th>Precio Unitario</th>
                                  <th>Subtotal</th>
                                  <th>Acciones</th>
                                </tr>
                              </thead>
                              <tbody>
                                {nuevaFactura.items.map((item, index) => {
                                  const producto = productos.find(
                                    (p) => p.id == item.productoId
                                  );
                                  return (
                                    <tr key={index}>
                                      <td>
                                        {producto
                                          ? producto.nombre
                                          : "Producto no encontrado"}
                                      </td>
                                      <td>{item.cantidad}</td>
                                      <td>
                                        ${item.precioUnitario?.toFixed(2)}
                                      </td>
                                      <td>${item.subtotal?.toFixed(2)}</td>
                                      <td>
                                        <button
                                          className="btn btn-danger btn-sm"
                                          onClick={() => {
                                            const nuevosItems = [
                                              ...nuevaFactura.items,
                                            ];
                                            nuevosItems.splice(index, 1);
                                            setNuevaFactura({
                                              ...nuevaFactura,
                                              items: nuevosItems,
                                            });
                                          }}
                                        >
                                          Eliminar
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                              <tfoot>
                                <tr>
                                  <td colSpan="3" className="text-end">
                                    <strong>Total:</strong>
                                  </td>
                                  <td>
                                    $
                                    {nuevaFactura.items
                                      .reduce(
                                        (sum, item) => sum + item.subtotal,
                                        0
                                      )
                                      ?.toFixed(2)}
                                  </td>
                                  <td></td>
                                </tr>
                              </tfoot>
                            </table>

                            <div className="text-right">
                              <button
                                className="btn btn-success"
                                onClick={handleCrearFactura}
                                disabled={
                                  !nuevaFactura.clienteId ||
                                  nuevaFactura.items.length === 0
                                }
                              >
                                Crear Factura
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="card">
                      <div className="card-header">
                        <h4>Listado de Facturas</h4>
                      </div>
                      <div className="card-body">
                        <div className="table-responsive">
                          <table className="table table-hover">
                            <thead>
                              <tr>
                                <th>N° Factura</th>
                                <th>Fecha</th>
                                <th>Cliente</th>
                                <th className="text-end">Total</th>
                                <th>Acciones</th>
                              </tr>
                            </thead>
                            <tbody>
                              {facturas.length > 0 ? (
                                facturas.map((factura) => (
                                  <tr
                                    key={factura.id}
                                    className="cursor-pointer"
                                    onClick={() =>
                                      verDetalleFactura(factura.id)
                                    }
                                  >
                                    <td>
                                      #{factura.id.toString().padStart(6, "0")}
                                    </td>
                                    <td>
                                      {new Date(
                                        factura.fechaCreacion
                                      ).toLocaleDateString()}
                                    </td>
                                    <td>
                                      <strong>
                                        {factura.cliente?.nombre}{" "}
                                        {factura.cliente?.apellido}
                                      </strong>
                                      <br />
                                      <small className="text-muted">
                                        {factura.cliente?.documento}
                                      </small>
                                    </td>
                                    <td className="text-end">
                                      ${factura.total?.toFixed(2)}
                                    </td>
                                    <td>
                                      <button
                                        className="btn btn-sm btn-outline-info mr-2"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          verDetalleFactura(factura.id);
                                        }}
                                      >
                                        <i className="fas fa-eye"></i> Ver
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td
                                    colSpan="5"
                                    className="text-center text-muted py-4"
                                  >
                                    No hay facturas registradas
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Pestaña de Clientes */}
            {activeTab === "clientes" && (
              <div>
                <h2>Clientes</h2>
                <div className="card mb-4">
                  <div className="card-header">
                    <h3>Nuevo Cliente</h3>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group">
                          <label>Nombre</label>
                          <input
                            type="text"
                            className="form-control"
                            value={nuevoCliente.nombre}
                            onChange={(e) =>
                              setNuevoCliente({
                                ...nuevoCliente,
                                nombre: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="form-group">
                          <label>Apellido</label>
                          <input
                            type="text"
                            className="form-control"
                            value={nuevoCliente.apellido}
                            onChange={(e) =>
                              setNuevoCliente({
                                ...nuevoCliente,
                                apellido: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="form-group">
                          <label>Teléfono</label>
                          <input
                            type="text"
                            className="form-control"
                            value={nuevoCliente.telefono}
                            onChange={(e) =>
                              setNuevoCliente({
                                ...nuevoCliente,
                                telefono: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="form-group">
                          <label>Documento</label>
                          <input
                            type="text"
                            className="form-control"
                            value={nuevoCliente.documento}
                            onChange={(e) =>
                              setNuevoCliente({
                                ...nuevoCliente,
                                documento: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <h4>Dirección</h4>
                        <div className="form-group">
                          <label>Calle</label>
                          <input
                            type="text"
                            className="form-control"
                            value={nuevoCliente.direccion.calle}
                            onChange={(e) =>
                              setNuevoCliente({
                                ...nuevoCliente,
                                direccion: {
                                  ...nuevoCliente.direccion,
                                  calle: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                        <div className="form-group">
                          <label>Ciudad</label>
                          <input
                            type="text"
                            className="form-control"
                            value={nuevoCliente.direccion.ciudad}
                            onChange={(e) =>
                              setNuevoCliente({
                                ...nuevoCliente,
                                direccion: {
                                  ...nuevoCliente.direccion,
                                  ciudad: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                        <div className="form-group">
                          <label>Provincia</label>
                          <input
                            type="text"
                            className="form-control"
                            value={nuevoCliente.direccion.provincia}
                            onChange={(e) =>
                              setNuevoCliente({
                                ...nuevoCliente,
                                direccion: {
                                  ...nuevoCliente.direccion,
                                  provincia: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                        <div className="form-group">
                          <label>Código Postal</label>
                          <input
                            type="text"
                            className="form-control"
                            value={nuevoCliente.direccion.codigoPostal}
                            onChange={(e) =>
                              setNuevoCliente({
                                ...nuevoCliente,
                                direccion: {
                                  ...nuevoCliente.direccion,
                                  codigoPostal: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                        <div className="form-group">
                          <label>País</label>
                          <input
                            type="text"
                            className="form-control"
                            value={nuevoCliente.direccion.pais}
                            onChange={(e) =>
                              setNuevoCliente({
                                ...nuevoCliente,
                                direccion: {
                                  ...nuevoCliente.direccion,
                                  pais: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={handleCrearCliente}
                      disabled={
                        !nuevoCliente.nombre ||
                        !nuevoCliente.apellido ||
                        !nuevoCliente.documento
                      }
                    >
                      Guardar Cliente
                    </button>
                  </div>
                </div>

                <h3>Lista de Clientes</h3>
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nombre</th>
                      <th>Apellido</th>
                      <th>Documento</th>
                      <th>Teléfono</th>
                      <th>Dirección</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientes.map((cliente) => (
                      <tr key={cliente.id}>
                        <td>{cliente.id}</td>
                        <td>{cliente.nombre}</td>
                        <td>{cliente.apellido}</td>
                        <td>{cliente.documento}</td>
                        <td>{cliente.telefono}</td>
                        <td>
                          {cliente.direccion.calle}, {cliente.direccion.ciudad},{" "}
                          {cliente.direccion.provincia}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pestaña de Productos */}
            {activeTab === "productos" && (
              <div>
                <h2>Productos</h2>
                <div className="card mb-4">
                  <div className="card-header">
                    <h3>Nuevo Producto</h3>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group">
                          <label>Nombre</label>
                          <input
                            type="text"
                            className="form-control"
                            value={nuevoProducto.nombre}
                            onChange={(e) =>
                              setNuevoProducto({
                                ...nuevoProducto,
                                nombre: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="form-group">
                          <label>Descripción</label>
                          <textarea
                            className="form-control"
                            value={nuevoProducto.descripcion}
                            onChange={(e) =>
                              setNuevoProducto({
                                ...nuevoProducto,
                                descripcion: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div className="form-group">
                          <label>Categoría</label>
                          <input
                            type="text"
                            className="form-control"
                            value={nuevoProducto.categoria}
                            onChange={(e) =>
                              setNuevoProducto({
                                ...nuevoProducto,
                                categoria: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label>Precio</label>
                          <input
                            type="number"
                            className="form-control"
                            min="0"
                            step="0.01"
                            value={nuevoProducto.precio}
                            onChange={(e) =>
                              setNuevoProducto({
                                ...nuevoProducto,
                                precio: parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                        <div className="form-group">
                          <label>Stock</label>
                          <input
                            type="number"
                            className="form-control"
                            min="0"
                            value={nuevoProducto.stock}
                            onChange={(e) =>
                              setNuevoProducto({
                                ...nuevoProducto,
                                stock: parseInt(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                        <div className="form-group">
                          <label>Código de Barras</label>
                          <input
                            type="text"
                            className="form-control"
                            value={nuevoProducto.codigoBarras}
                            onChange={(e) =>
                              setNuevoProducto({
                                ...nuevoProducto,
                                codigoBarras: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={handleCrearProducto}
                      disabled={
                        !nuevoProducto.nombre || nuevoProducto.precio <= 0
                      }
                    >
                      Guardar Producto
                    </button>
                  </div>
                </div>

                <h3>Lista de Productos</h3>
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nombre</th>
                      <th>Descripción</th>
                      <th>Precio</th>
                      <th>Stock</th>
                      <th>Categoría</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productos.map((producto) => (
                      <tr key={producto.id}>
                        <td>{producto.id}</td>
                        <td>{producto.nombre}</td>
                        <td>{producto.descripcion}</td>
                        <td>${producto.precio}</td>
                        <td>{producto.stock}</td>
                        <td>{producto.categoria}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pestaña de Impuestos */}
            {activeTab === "impuestos" && (
              <div>
                <h2>Impuestos</h2>
                <div className="card mb-4">
                  <div className="card-header">
                    <h3>Nuevo Impuesto</h3>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group">
                          <label>Nombre</label>
                          <input
                            type="text"
                            className="form-control"
                            value={nuevoImpuesto.nombre}
                            onChange={(e) =>
                              setNuevoImpuesto({
                                ...nuevoImpuesto,
                                nombre: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label>Porcentaje</label>
                          <input
                            type="number"
                            className="form-control"
                            min="0"
                            max="100"
                            step="0.01"
                            value={nuevoImpuesto.porcentaje}
                            onChange={(e) =>
                              setNuevoImpuesto({
                                ...nuevoImpuesto,
                                porcentaje: parseFloat(e.target.value) || 0,
                              })
                            }
                          />
                        </div>
                      </div>
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={handleCrearImpuesto}
                      disabled={
                        !nuevoImpuesto.nombre || nuevoImpuesto.porcentaje <= 0
                      }
                    >
                      Guardar Impuesto
                    </button>
                  </div>
                </div>

                <h3>Lista de Impuestos</h3>
                <table className="table table-striped">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Nombre</th>
                      <th>Porcentaje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {impuestos.map((impuesto) => (
                      <tr key={impuesto.id}>
                        <td>{impuesto.id}</td>
                        <td>{impuesto.nombre}</td>
                        <td>{impuesto.porcentaje}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default FacturacionApp;
