"use client";

import { useEffect, useState, Fragment, useRef, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { ShoppingCart, Loader2, Eye, Pencil, XCircle, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CheckCircle, AlertCircle } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function OrdersAdmin() {
  const [modal, setModal] = useState<{ tipo: "ver" | "editar" | "cancelar"; pedido: any } | null>(null);
  const [accionCargando, setAccionCargando] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("todos");
  const [estadoSeleccionado, setEstadoSeleccionado] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const selectRef = useRef<HTMLSelectElement>(null);
  // Paginación
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(10);
  const [totalPaginas, setTotalPaginas] = useState(1);

  // Toasts
  const [toast, setToast] = useState<{ tipo: "exito" | "error"; mensaje: string } | null>(null);
  const mostrarToast = useCallback((tipo: "exito" | "error", mensaje: string) => {
    setToast({ tipo, mensaje });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Cargar pedidos con paginación
  const fetchOrders = useCallback(async (paginaActual = pagina, cantidad = porPagina) => {
    setLoading(true);
    const desde = (paginaActual - 1) * cantidad;
    const hasta = desde + cantidad - 1;
    const { data: orders, count } = await supabase
      .from("orders")
      .select("id, order_number, total, status, created_at, user_id, address, payment_method, tracking_number", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(desde, hasta);
    let userMap: Record<string, string> = {};
    if (orders && orders.length > 0) {
      const userIds = Array.from(new Set(orders.map((o) => o.user_id)));
      const { data: users } = await supabase
        .from("users")
        .select("id, name, email")
        .in("id", userIds);
      userMap = Object.fromEntries((users || []).map((u: any) => [u.id, `${u.name} (${u.email})`]));
    }
    setOrders(
      (orders || []).map((o) => ({
        ...o,
        user_name: userMap[o.user_id] || "Usuario",
        created_at: o.created_at.slice(0, 10),
      }))
    );
    setTotalPaginas(count ? Math.ceil(count / cantidad) : 1);
    setLoading(false);
  }, [pagina, porPagina]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders, pagina, porPagina]);

  function getOrderStatusClass(status: string) {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "confirmed":
        return "bg-blue-100 text-blue-700";
      case "processing":
        return "bg-purple-100 text-purple-700";
      case "shipped":
        return "bg-green-100 text-green-700";
      case "delivered":
        return "bg-green-200 text-green-800";
      case "cancelled":
        return "bg-red-200 text-red-800";
      default:
        return "bg-slate-100 text-slate-600";
    }
  }

  // Filtro de búsqueda
  const estados = [
    { value: "", label: "Todos" },
    { value: "pending", label: "Pendiente" },
    { value: "confirmed", label: "Confirmado" },
    { value: "processing", label: "Procesando" },
    { value: "shipped", label: "Enviado" },
    { value: "delivered", label: "Entregado" },
    { value: "cancelled", label: "Cancelado" },
  ];

  function getEstadoLabel(valor: string) {
    const found = estados.find(e => e.value === valor);
    return found ? found.label : valor;
  }

  // Filtrado (en memoria sobre la página actual)
  const ordersFiltrados = orders.filter((order) => {
    if (filtro === "todos") {
      const busq = busqueda.toLowerCase();
      return (
        order.order_number.toString().toLowerCase().includes(busq) ||
        order.user_name.toLowerCase().includes(busq) ||
        order.status.toLowerCase().includes(busq)
      );
    } else if (filtro === "numero") {
      return order.order_number.toString().toLowerCase().includes(busqueda.toLowerCase());
    } else if (filtro === "usuario") {
      return order.user_name.toLowerCase().includes(busqueda.toLowerCase());
    } else if (filtro === "estado") {
      if (!estadoSeleccionado) return true;
      return order.status === estadoSeleccionado;
    }
    return true;
  });

  let content;
  if (loading) {
    content = (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="animate-spin text-slate-500" size={32} />
      </div>
    );
  } else if (orders.length === 0) {
    content = (
      <div className="text-slate-700 text-center py-8 font-semibold">
        No hay pedidos registrados aún.
      </div>
    );
  } else if (ordersFiltrados.length === 0) {
    content = (
      <div className="text-slate-700 text-center py-8 font-semibold">
        No se encontraron pedidos con ese criterio.
      </div>
    );
  } else {
    content = (
      <>
        <div className="overflow-x-auto rounded-xl shadow bg-white">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-red-200 text-red-900">
                <th className="p-2">#</th>
                <th className="p-2">Usuario</th>
                <th className="p-2">Total</th>
                <th className="p-2">Estado</th>
                <th className="p-2">Fecha</th>
                <th className="p-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ordersFiltrados.map((order) => (
                <tr key={order.id} className="border-b last:border-0 hover:bg-red-50 transition">
                  <td className="p-2 font-mono text-xs text-red-900">{order.order_number}</td>
                  <td className="p-2 text-red-900">{order.user_name}</td>
                  <td className="p-2 font-bold text-blue-700">${order.total}</td>
                  <td className="p-2">
                    <span className={
                      "px-2 py-1 rounded-full text-xs font-bold " + getOrderStatusClass(order.status)
                    }>
                      {getEstadoLabel(order.status)}
                    </span>
                  </td>
                  <td className="p-2 text-xs text-slate-500">{order.created_at}</td>
                  <td className="p-2 flex gap-2">
                    <button
                      title="Ver"
                      className="p-1 rounded hover:bg-slate-100 text-blue-700"
                      onClick={() => setModal({ tipo: "ver", pedido: order })}
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      title="Editar"
                      className="p-1 rounded hover:bg-slate-100 text-green-700"
                      onClick={() => setModal({ tipo: "editar", pedido: order })}
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      title="Cancelar"
                      className="p-1 rounded hover:bg-slate-100 text-red-700"
                      onClick={() => setModal({ tipo: "cancelar", pedido: order })}
                      disabled={order.status === "cancelled" || order.status === "delivered"}
                    >
                      <XCircle size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Paginación */}
        <div className="flex items-center justify-between mt-4 gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <button onClick={() => setPagina(1)} disabled={pagina === 1} className="p-1 rounded hover:bg-slate-100 disabled:opacity-40"><ChevronsLeft size={18} /></button>
            <button onClick={() => setPagina(pagina - 1)} disabled={pagina === 1} className="p-1 rounded hover:bg-slate-100 disabled:opacity-40"><ChevronLeft size={18} /></button>
            <span className="font-semibold">Página {pagina} de {totalPaginas}</span>
            <button onClick={() => setPagina(pagina + 1)} disabled={pagina === totalPaginas} className="p-1 rounded hover:bg-slate-100 disabled:opacity-40"><ChevronRight size={18} /></button>
            <button onClick={() => setPagina(totalPaginas)} disabled={pagina === totalPaginas} className="p-1 rounded hover:bg-slate-100 disabled:opacity-40"><ChevronsRight size={18} /></button>
          </div>
          <div className="flex items-center gap-2">
            <span>Pedidos por página:</span>
            <select value={porPagina} onChange={e => { setPorPagina(Number(e.target.value)); setPagina(1); }} className="border border-slate-300 rounded px-2 py-1">
              {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <ShoppingCart className="text-red-700" /> Órdenes
      </h1>
      <div className="mb-4 flex flex-col sm:flex-row gap-2 sm:items-center w-full max-w-2xl">
        <label htmlFor="filtro-busqueda" className="font-semibold text-slate-700 mb-1 sm:mb-0 mr-2">Filtrar por:</label>
        <div className="flex gap-2 w-full">
          <select
            id="filtro-busqueda"
            className="border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-200 min-w-[140px]"
            value={filtro}
            onChange={e => {
              setFiltro(e.target.value);
              setBusqueda("");
              setEstadoSeleccionado("");
              setTimeout(() => {
                if (e.target.value === "estado") {
                  selectRef.current?.focus();
                } else {
                  inputRef.current?.focus();
                }
              }, 50);
            }}
          >
            <option value="todos">Todos</option>
            <option value="numero">Número de pedido</option>
            <option value="usuario">Usuario</option>
            <option value="estado">Estado</option>
          </select>
          {filtro === "estado" ? (
            <select
              ref={selectRef}
              className="border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-200 min-w-[140px]"
              value={estadoSeleccionado}
              onChange={e => setEstadoSeleccionado(e.target.value)}
            >
              {estados.map(e => (
                <option key={e.value} value={e.value}>{e.label}</option>
              ))}
            </select>
          ) : (
            <div className="relative w-full">
              {/*
                Extraer el placeholder a una variable para evitar ternarios anidados
              */}
              {(() => {
                let placeholder = "";
                if (filtro === "numero") {
                  placeholder = "Buscar por número...";
                } else if (filtro === "usuario") {
                  placeholder = "Buscar por usuario...";
                } else {
                  placeholder = "Buscar por número, usuario o estado...";
                }
                return (
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder={placeholder}
                    className="border border-slate-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-red-200 pr-8"
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                    id="input-busqueda"
                  />
                );
              })()}
              {busqueda && (
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500"
                  onClick={() => setBusqueda("")}
                  tabIndex={-1}
                  aria-label="Limpiar búsqueda"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      {content}
      {/* Modal de acciones */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg relative animate-fade-in">
            <button
              className="absolute top-2 right-2 text-slate-400 hover:text-red-500"
              onClick={() => setModal(null)}
              aria-label="Cerrar"
            >
              <X size={20} />
            </button>
            {modal.tipo === "ver" && (
              <Fragment>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Eye size={20} /> Detalles del pedido
                </h2>
                <div className="space-y-2">
                  <div><span className="font-semibold">Número:</span> {modal.pedido.order_number}</div>
                  <div><span className="font-semibold">Usuario:</span> {modal.pedido.user_name}</div>
                  <div><span className="font-semibold">Total:</span> ${modal.pedido.total}</div>
                  <div><span className="font-semibold">Estado:</span> {getEstadoLabel(modal.pedido.status)}</div>
                  <div><span className="font-semibold">Fecha:</span> {modal.pedido.created_at}</div>
                  <div><span className="font-semibold">Método de pago:</span> {modal.pedido.payment_method}</div>
                  {modal.pedido.tracking_number && <div><span className="font-semibold">Tracking:</span> {modal.pedido.tracking_number}</div>}
                  {/* Dirección */}
                  {modal.pedido.address && (
                    <div className="mt-2">
                      <span className="font-semibold">Dirección de envío:</span>
                      <div className="ml-2 text-sm">
                        <div>{modal.pedido.address.name} ({modal.pedido.address.phone})</div>
                        <div>{modal.pedido.address.address}</div>
                        <div>{modal.pedido.address.city}, {modal.pedido.address.state} {modal.pedido.address.zip_code}</div>
                        <div>{modal.pedido.address.country}</div>
                      </div>
                    </div>
                  )}
                  {/* Productos */}
                  <PedidoProductos orderId={modal.pedido.id} />
                </div>
              </Fragment>
            )}
            {modal.tipo === "editar" && (
              <Fragment>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Pencil size={20} /> Editar estado del pedido
                </h2>
                <form
                  onSubmit={async e => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const estado = (form.elements.namedItem("estado") as HTMLSelectElement).value;
                    setAccionCargando(true);
                    const { error } = await supabase.from("orders").update({ status: estado }).eq("id", modal.pedido.id);
                    setModal(null);
                    setAccionCargando(false);
                    if (error) {
                      mostrarToast("error", "Error al actualizar el estado del pedido.");
                    } else {
                      mostrarToast("exito", "Estado del pedido actualizado correctamente.");
                      fetchOrders();
                    }
                  }}
                >
                  <label className="block mb-2 font-semibold" htmlFor="estado-edit">Nuevo estado:</label>
                  <select
                    id="estado-edit"
                    name="estado"
                    className="border border-slate-300 rounded px-3 py-2 w-full mb-4"
                    defaultValue={modal.pedido.status}
                    required
                  >
                    {estados.filter(e => e.value).map(e => (
                      <option key={e.value} value={e.value}>{e.label}</option>
                    ))}
                  </select>
                  <button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold w-full flex items-center justify-center gap-2 disabled:opacity-60"
                    disabled={accionCargando}
                  >
                    {accionCargando && <Loader2 className="animate-spin" size={18} />} Guardar cambios
                  </button>
                </form>
              </Fragment>
            )}
            {modal.tipo === "cancelar" && (
              <Fragment>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <XCircle size={20} /> Cancelar pedido
                </h2>
                <p className="mb-4">¿Estás seguro de que deseas cancelar este pedido? Esta acción no se puede deshacer.</p>
                <button
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-semibold w-full flex items-center justify-center gap-2 disabled:opacity-60 mb-2"
                  disabled={accionCargando}
                  onClick={async () => {
                    setAccionCargando(true);
                    const { error } = await supabase.from("orders").update({ status: "cancelled" }).eq("id", modal.pedido.id);
                    setModal(null);
                    setAccionCargando(false);
                    if (error) {
                    mostrarToast("error", "Error al cancelar el pedido.");
                  } else {
                    mostrarToast("exito", "Pedido cancelado correctamente.");
                    fetchOrders();
                  }
                }}
                >
                  {accionCargando && <Loader2 className="animate-spin" size={18} />} Sí, cancelar pedido
                </button>
                <button
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded font-semibold w-full"
                  onClick={() => setModal(null)}
                >
                  No, volver
                </button>
              </Fragment>
            )}
          </div>
        </div>
      )}
      {/* Toasts */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-white ${toast.tipo === "exito" ? "bg-green-600" : "bg-red-600"}`}>
          {toast.tipo === "exito" ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{toast.mensaje}</span>
        </div>
      )}
    </div>
  );
}

// Componente para mostrar productos del pedido
function PedidoProductos({ orderId }: { readonly orderId: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function fetchItems() {
      setLoading(true);
      const { data: items } = await supabase
        .from("order_items")
        .select("id, quantity, price, product_id, variant_id, products(name), product_variants(color, size)")
        .eq("order_id", orderId);
      setItems(items || []);
      setLoading(false);
    }
    fetchItems();
  }, [orderId]);
  if (loading) return <div className="text-slate-400 text-sm mt-2">Cargando productos...</div>;
  if (items.length === 0) return <div className="text-slate-400 text-sm mt-2">Sin productos.</div>;
  return (
    <div className="mt-2">
      <span className="font-semibold">Productos:</span>
      <ul className="ml-2 mt-1 space-y-1 text-sm">
        {items.map(item => (
          <li key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
            <span className="font-medium">{item.products?.name || 'Producto'}</span>
            <span>Cantidad: {item.quantity}</span>
            <span>Precio: ${item.price}</span>
            {item.product_variants && (
              <span>Variante: {item.product_variants.color} / {item.product_variants.size}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
