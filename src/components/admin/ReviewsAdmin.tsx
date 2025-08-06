"use client";

import { useEffect, useState, Fragment } from "react";
import { createClient } from "@supabase/supabase-js";
import { Star, Trash2, Loader2, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight, X, CheckCircle, AlertCircle, Eye, Check } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ReviewsAdmin() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(10);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [filtro, setFiltro] = useState({ producto: "", usuario: "", calificacion: "", comentario: "", estado: "" });
  const [modal, setModal] = useState<any>(null);
  const [toast, setToast] = useState<{ tipo: "exito" | "error"; mensaje: string } | null>(null);
  const [accionCargando, setAccionCargando] = useState(false);

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line
  }, [pagina, porPagina, filtro]);

  async function fetchReviews() {
    setLoading(true);
    let query = supabase
      .from("reviews")
      .select("id, rating, comment, created_at, user_id, product_id, approved, users(name, email), products(name)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((pagina - 1) * porPagina, pagina * porPagina - 1);
    if (filtro.producto) query = query.eq("product_id", filtro.producto);
    if (filtro.usuario) query = query.eq("user_id", filtro.usuario);
    if (filtro.calificacion) query = query.eq("rating", filtro.calificacion);
    if (filtro.estado !== "") query = query.eq("approved", filtro.estado === "true");
    const { data, count } = await query;
    // Filtro por comentario (en memoria)
    let filtradas = (data || []);
    if (filtro.comentario) {
      const texto = filtro.comentario.toLowerCase();
      filtradas = filtradas.filter(r => (r.comment || "").toLowerCase().includes(texto));
    }
    setReviews(filtradas);
    setTotalPaginas(count ? Math.ceil(count / porPagina) : 1);
    setLoading(false);
  }

  function mostrarToast(tipo: "exito" | "error", mensaje: string) {
    setToast({ tipo, mensaje });
    setTimeout(() => setToast(null), 3500);
  }

  async function eliminarReview(id: string) {
    setAccionCargando(true);
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    setAccionCargando(false);
    setModal(null);
    if (error) {
      mostrarToast("error", "Error al eliminar la reseña.");
    } else {
      mostrarToast("exito", "Reseña eliminada correctamente.");
      fetchReviews();
    }
  }

  async function aprobarReview(id: string) {
    setAccionCargando(true);
    const { error } = await supabase.from("reviews").update({ approved: true }).eq("id", id);
    setAccionCargando(false);
    setModal(null);
    if (error) {
      mostrarToast("error", "Error al aprobar la reseña.");
    } else {
      mostrarToast("exito", "Reseña aprobada correctamente.");
      fetchReviews();
    }
  }

  async function rechazarReview(id: string) {
    setAccionCargando(true);
    const { error } = await supabase.from("reviews").update({ approved: false }).eq("id", id);
    setAccionCargando(false);
    setModal(null);
    if (error) {
      mostrarToast("error", "Error al rechazar la reseña.");
    } else {
      mostrarToast("exito", "Reseña rechazada correctamente.");
      fetchReviews();
    }
  }

  // Para filtros dinámicos
  const [productos, setProductos] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("products").select("id, name").then(({ data }) => setProductos(data || []));
    supabase.from("users").select("id, name, email").then(({ data }) => setUsuarios(data || []));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Star className="text-yellow-500" /> Reseñas
      </h1>
      {/* Filtros */}
      <div className="mb-4 flex flex-wrap gap-2 items-center">
        <input
          type="text"
          className="border border-slate-300 rounded px-3 py-2"
          placeholder="Buscar en comentarios..."
          value={filtro.comentario}
          onChange={e => setFiltro(f => ({ ...f, comentario: e.target.value, pagina: 1 }))}
        />
        <select
          className="border border-slate-300 rounded px-3 py-2"
          value={filtro.producto}
          onChange={e => setFiltro(f => ({ ...f, producto: e.target.value, pagina: 1 }))}
        >
          <option value="">Todos los productos</option>
          {productos.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select
          className="border border-slate-300 rounded px-3 py-2"
          value={filtro.usuario}
          onChange={e => setFiltro(f => ({ ...f, usuario: e.target.value, pagina: 1 }))}
        >
          <option value="">Todos los usuarios</option>
          {usuarios.map(u => <option key={u.id} value={u.id}>{u.name} ({u.email})</option>)}
        </select>
        <select
          className="border border-slate-300 rounded px-3 py-2"
          value={filtro.calificacion}
          onChange={e => setFiltro(f => ({ ...f, calificacion: e.target.value, pagina: 1 }))}
        >
          <option value="">Todas las calificaciones</option>
          {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{n} estrellas</option>)}
        </select>
        <select
          className="border border-slate-300 rounded px-3 py-2"
          value={filtro.estado}
          onChange={e => setFiltro(f => ({ ...f, estado: e.target.value, pagina: 1 }))}
        >
          <option value="">Todos los estados</option>
          <option value="true">Aprobadas</option>
          <option value="false">Pendientes</option>
        </select>
      </div>
      {/* Tabla de reseñas */}
      {(() => {
        if (loading) {
          return (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="animate-spin text-slate-500" size={32} />
            </div>
          );
        }
        if (reviews.length === 0) {
          return (
            <div className="text-slate-700 text-center py-8 font-semibold">
              No hay reseñas registradas aún.
            </div>
          );
        }
        return (
          <div className="overflow-x-auto rounded-xl shadow bg-white">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-yellow-100 text-yellow-800">
                  <th className="p-2">Producto</th>
                  <th className="p-2">Usuario</th>
                  <th className="p-2">Calificación</th>
                  <th className="p-2">Comentario</th>
                  <th className="p-2">Estado</th>
                  <th className="p-2">Fecha</th>
                  <th className="p-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map(r => (
                  <tr key={r.id} className="border-b last:border-0 hover:bg-yellow-50 transition">
                    <td className="p-2">{r.products?.name || <span className="italic text-slate-400">Producto eliminado</span>}</td>
                    <td className="p-2">{r.users?.name ? r.users.name : <span className="italic text-slate-400">Usuario eliminado</span>} {r.users?.email && <span className="text-xs text-slate-400">({r.users.email})</span>}</td>
                    <td className="p-2 flex items-center gap-1">
                      {Array.from({ length: r.rating }).map((_, i) => (
                        <Star
                          key={`${r.id}-star-${i}`}
                          className="text-yellow-500"
                          size={16}
                          fill="#facc15"
                        />
                      ))}
                    </td>
                    <td className="p-2 max-w-xs truncate">
                      {r.comment
                        ? <span title={r.comment} className="cursor-help">{r.comment.length > 40 ? r.comment.slice(0, 40) + "..." : r.comment}</span>
                        : <span className="italic text-slate-400">Sin comentario</span>
                      }
                    </td>
                    <td className="p-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        r.approved 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {r.approved ? 'Aprobada' : 'Pendiente'}
                      </span>
                    </td>
                    <td className="p-2 text-xs text-slate-500">{r.created_at.slice(0, 10)}</td>
                    <td className="p-2 flex gap-2">
                      <button
                        title="Ver"
                        className="p-1 rounded hover:bg-slate-100 text-blue-700"
                        onClick={() => setModal({ tipo: "ver", review: r })}
                      >
                        <Eye size={18} />
                      </button>
                      {!r.approved && (
                        <button
                          title="Aprobar"
                          className="p-1 rounded hover:bg-slate-100 text-green-700"
                          onClick={() => setModal({ tipo: "aprobar", review: r })}
                        >
                          <Check size={18} />
                        </button>
                      )}
                      {r.approved && (
                        <button
                          title="Rechazar"
                          className="p-1 rounded hover:bg-slate-100 text-orange-700"
                          onClick={() => setModal({ tipo: "rechazar", review: r })}
                        >
                          <X size={18} />
                        </button>
                      )}
                      <button
                        title="Eliminar"
                        className="p-1 rounded hover:bg-slate-100 text-red-700"
                        onClick={() => setModal({ tipo: "eliminar", review: r })}
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })()}
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
          <span>Reseñas por página:</span>
          <select value={porPagina} onChange={e => { setPorPagina(Number(e.target.value)); setPagina(1); }} className="border border-slate-300 rounded px-2 py-1">
            {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>
      {/* Modales */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md relative animate-fade-in">
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
                  <Eye size={20} /> Detalles de la reseña
                </h2>
                <div className="space-y-2">
                  <div><span className="font-semibold">Producto:</span> {modal.review.products?.name || "-"}</div>
                  <div><span className="font-semibold">Usuario:</span> {modal.review.users?.name} ({modal.review.users?.email})</div>
                  <div><span className="font-semibold">Calificación:</span> {modal.review.rating} estrellas</div>
                  <div><span className="font-semibold">Comentario:</span> {modal.review.comment || <span className="italic text-slate-400">Sin comentario</span>}</div>
                  <div><span className="font-semibold">Estado:</span> 
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                      modal.review.approved 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {modal.review.approved ? 'Aprobada' : 'Pendiente'}
                    </span>
                  </div>
                  <div><span className="font-semibold">Fecha:</span> {modal.review.created_at.slice(0, 10)}</div>
                </div>
              </Fragment>
            )}
            {modal.tipo === "aprobar" && (
              <Fragment>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Check size={20} /> Aprobar reseña
                </h2>
                <p className="mb-4">¿Estás seguro de que deseas aprobar esta reseña? Una vez aprobada, será visible para todos los usuarios.</p>
                <div className="bg-gray-50 p-3 rounded mb-4">
                  <p><strong>Comentario:</strong> {modal.review.comment || 'Sin comentario'}</p>
                  <p><strong>Calificación:</strong> {modal.review.rating} estrellas</p>
                </div>
                <button
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-semibold w-full flex items-center justify-center gap-2 disabled:opacity-60 mb-2"
                  disabled={accionCargando}
                  onClick={() => aprobarReview(modal.review.id)}
                >
                  {accionCargando && <Loader2 className="animate-spin" size={18} />} Sí, aprobar reseña
                </button>
                <button
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded font-semibold w-full"
                  onClick={() => setModal(null)}
                >
                  No, volver
                </button>
              </Fragment>
            )}
            {modal.tipo === "rechazar" && (
              <Fragment>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <X size={20} /> Rechazar reseña
                </h2>
                <p className="mb-4">¿Estás seguro de que deseas rechazar esta reseña? Ya no será visible para los usuarios.</p>
                <div className="bg-gray-50 p-3 rounded mb-4">
                  <p><strong>Comentario:</strong> {modal.review.comment || 'Sin comentario'}</p>
                  <p><strong>Calificación:</strong> {modal.review.rating} estrellas</p>
                </div>
                <button
                  className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded font-semibold w-full flex items-center justify-center gap-2 disabled:opacity-60 mb-2"
                  disabled={accionCargando}
                  onClick={() => rechazarReview(modal.review.id)}
                >
                  {accionCargando && <Loader2 className="animate-spin" size={18} />} Sí, rechazar reseña
                </button>
                <button
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded font-semibold w-full"
                  onClick={() => setModal(null)}
                >
                  No, volver
                </button>
              </Fragment>
            )}
            {modal.tipo === "eliminar" && (
              <Fragment>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Trash2 size={20} /> Eliminar reseña
                </h2>
                <p className="mb-4">¿Estás seguro de que deseas eliminar esta reseña? Esta acción no se puede deshacer.</p>
                <button
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-semibold w-full flex items-center justify-center gap-2 disabled:opacity-60 mb-2"
                  disabled={accionCargando}
                  onClick={() => eliminarReview(modal.review.id)}
                >
                  {accionCargando && <Loader2 className="animate-spin" size={18} />} Sí, eliminar reseña
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
