"use client";

import { useEffect, useState, Fragment } from "react";
import { createClient } from "@supabase/supabase-js";
import { Tag, Loader2, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight, X, CheckCircle, AlertCircle, Eye, Pencil, Trash2, Plus } from "lucide-react";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function CouponsAdmin() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(10);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [filtro, setFiltro] = useState({ codigo: "", estado: "", descuento: "" });
  const [modal, setModal] = useState<any>(null);
  const [toast, setToast] = useState<{ tipo: "exito" | "error"; mensaje: string } | null>(null);
  const [accionCargando, setAccionCargando] = useState(false);

  useEffect(() => {
    fetchCoupons();
    // eslint-disable-next-line
  }, [pagina, porPagina, filtro]);

  async function fetchCoupons() {
    setLoading(true);
    let query = supabase
      .from("coupons")
      .select("id, code, description, discount_percent, max_uses, expires_at, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range((pagina - 1) * porPagina, pagina * porPagina - 1);
    if (filtro.codigo) query = query.ilike("code", `%${filtro.codigo}%`);
    if (filtro.descuento) query = query.eq("discount_percent", filtro.descuento);
    const { data, count } = await query;
    let filtrados = (data || []);
    if (filtro.estado) {
      const ahora = new Date();
      filtrados = filtrados.filter(c => {
        if (filtro.estado === "vigente") return !c.expires_at || new Date(c.expires_at) > ahora;
        if (filtro.estado === "expirado") return c.expires_at && new Date(c.expires_at) <= ahora;
        return true;
      });
    }
    setCoupons(filtrados);
    setTotalPaginas(count ? Math.ceil(count / porPagina) : 1);
    setLoading(false);
  }

  function mostrarToast(tipo: "exito" | "error", mensaje: string) {
    setToast({ tipo, mensaje });
    setTimeout(() => setToast(null), 3500);
  }

  async function eliminarCoupon(id: string) {
    setAccionCargando(true);
    const { error } = await supabase.from("coupons").delete().eq("id", id);
    setAccionCargando(false);
    setModal(null);
    if (error) {
      mostrarToast("error", "Error al eliminar el cupón.");
    } else {
      mostrarToast("exito", "Cupón eliminado correctamente.");
      fetchCoupons();
    }
  }

  async function crearEditarCoupon(e: any, editar = false, id = null) {
    e.preventDefault();
    setAccionCargando(true);
    const form = e.target;
    const values = {
      code: form.code.value,
      description: form.description.value,
      discount_percent: Number(form.discount_percent.value),
      max_uses: form.max_uses.value ? Number(form.max_uses.value) : null,
      expires_at: form.expires_at.value ? form.expires_at.value : null,
    };
    let res;
    if (editar && id) {
      res = await supabase.from("coupons").update(values).eq("id", id);
    } else {
      res = await supabase.from("coupons").insert([values]);
    }
    setAccionCargando(false);
    setModal(null);
    if (res.error) {
      mostrarToast("error", res.error.message || "Error al guardar el cupón.");
    } else {
      mostrarToast("exito", editar ? "Cupón editado correctamente." : "Cupón creado correctamente.");
      fetchCoupons();
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Tag className="text-pink-500" /> Cupones
      </h1>
      {/* Filtros */}
      <div className="mb-4 flex flex-wrap gap-2 items-center">
        <input
          type="text"
          className="border border-slate-300 rounded px-3 py-2"
          placeholder="Buscar por código..."
          value={filtro.codigo}
          onChange={e => setFiltro(f => ({ ...f, codigo: e.target.value }))}
        />
        <select
          className="border border-slate-300 rounded px-3 py-2"
          value={filtro.estado}
          onChange={e => setFiltro(f => ({ ...f, estado: e.target.value }))}
        >
          <option value="">Todos los estados</option>
          <option value="vigente">Vigente</option>
          <option value="expirado">Expirado</option>
        </select>
        <select
          className="border border-slate-300 rounded px-3 py-2"
          value={filtro.descuento}
          onChange={e => setFiltro(f => ({ ...f, descuento: e.target.value }))}
        >
          <option value="">Todos los descuentos</option>
          {[100, 90, 80, 70, 60, 50, 40, 30, 20, 10, 5].map(n => <option key={n} value={n}>{n}%</option>)}
        </select>
        <button
          className="flex items-center gap-1 bg-pink-600 hover:bg-pink-700 text-white px-3 py-2 rounded font-semibold"
          onClick={() => setModal({ tipo: "crear" })}
        >
          <Plus size={18} /> Nuevo cupón
        </button>
      </div>
      {/* Tabla de cupones */}
      {(() => {
        if (loading) {
          return (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="animate-spin text-slate-500" size={32} />
            </div>
          );
        }
        if (coupons.length === 0) {
          return (
            <div className="text-slate-700 text-center py-8 font-semibold">
              No hay cupones registrados aún.
            </div>
          );
        }
        return (
          <div className="overflow-x-auto rounded-xl shadow bg-white">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-pink-100 text-pink-800">
                  <th className="p-2">Código</th>
                  <th className="p-2">Descripción</th>
                  <th className="p-2">Descuento</th>
                  <th className="p-2">Usos máximos</th>
                  <th className="p-2">Expira</th>
                  <th className="p-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map(c => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-pink-50 transition">
                    <td className="p-2 font-mono text-xs text-pink-800">{c.code}</td>
                    <td className="p-2 max-w-xs truncate" title={c.description}>{c.description || <span className="italic text-slate-400">Sin descripción</span>}</td>
                    <td className="p-2 font-bold text-pink-700">{c.discount_percent}%</td>
                    <td className="p-2">{c.max_uses ?? <span className="italic text-slate-400">Ilimitado</span>}</td>
                    <td className="p-2 text-xs text-slate-500">{c.expires_at ? c.expires_at.slice(0, 10) : <span className="italic text-slate-400">Sin expiración</span>}</td>
                    <td className="p-2 flex gap-2">
                      <button
                        title="Ver"
                        className="p-1 rounded hover:bg-slate-100 text-blue-700"
                        onClick={() => setModal({ tipo: "ver", coupon: c })}
                      >
                        <Eye size={18} />
                      </button>
                      <button
                        title="Editar"
                        className="p-1 rounded hover:bg-slate-100 text-green-700"
                        onClick={() => setModal({ tipo: "editar", coupon: c })}
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        title="Eliminar"
                        className="p-1 rounded hover:bg-slate-100 text-red-700"
                        onClick={() => setModal({ tipo: "eliminar", coupon: c })}
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
          <span>Cupones por página:</span>
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
                  <Eye size={20} /> Detalles del cupón
                </h2>
                <div className="space-y-2">
                  <div><span className="font-semibold">Código:</span> {modal.coupon.code}</div>
                  <div><span className="font-semibold">Descripción:</span> {modal.coupon.description || <span className="italic text-slate-400">Sin descripción</span>}</div>
                  <div><span className="font-semibold">Descuento:</span> {modal.coupon.discount_percent}%</div>
                  <div><span className="font-semibold">Usos máximos:</span> {modal.coupon.max_uses ?? <span className="italic text-slate-400">Ilimitado</span>}</div>
                  <div><span className="font-semibold">Expira:</span> {modal.coupon.expires_at ? modal.coupon.expires_at.slice(0, 10) : <span className="italic text-slate-400">Sin expiración</span>}</div>
                  <div><span className="font-semibold">Creado:</span> {modal.coupon.created_at.slice(0, 10)}</div>
                </div>
              </Fragment>
            )}
            {(modal.tipo === "crear" || modal.tipo === "editar") && (
              <Fragment>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  {modal.tipo === "crear" ? <Plus size={20} /> : <Pencil size={20} />} {modal.tipo === "crear" ? "Nuevo cupón" : "Editar cupón"}
                </h2>
                <form onSubmit={e => crearEditarCoupon(e, modal.tipo === "editar", modal.coupon?.id)}>
                  <label className="block mb-1 font-semibold" htmlFor="code">Código</label>
                  <input id="code" name="code" required className="border border-slate-300 rounded px-3 py-2 w-full mb-2" defaultValue={modal.coupon?.code || ""} />
                  <label className="block mb-1 font-semibold" htmlFor="description">Descripción</label>
                  <input id="description" name="description" className="border border-slate-300 rounded px-3 py-2 w-full mb-2" defaultValue={modal.coupon?.description || ""} />
                  <label className="block mb-1 font-semibold" htmlFor="discount_percent">Descuento (%)</label>
                  <input id="discount_percent" name="discount_percent" type="number" min={1} max={100} required className="border border-slate-300 rounded px-3 py-2 w-full mb-2" defaultValue={modal.coupon?.discount_percent || ""} />
                  <label className="block mb-1 font-semibold" htmlFor="max_uses">Usos máximos</label>
                  <input id="max_uses" name="max_uses" type="number" min={1} className="border border-slate-300 rounded px-3 py-2 w-full mb-2" defaultValue={modal.coupon?.max_uses || ""} />
                  <label className="block mb-1 font-semibold" htmlFor="expires_at">Expira</label>
                  <input id="expires_at" name="expires_at" type="date" className="border border-slate-300 rounded px-3 py-2 w-full mb-4" defaultValue={modal.coupon?.expires_at ? modal.coupon.expires_at.slice(0, 10) : ""} />
                  <button
                    type="submit"
                    className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded font-semibold w-full flex items-center justify-center gap-2 disabled:opacity-60"
                    disabled={accionCargando}
                  >
                    {accionCargando && <Loader2 className="animate-spin" size={18} />} Guardar
                  </button>
                </form>
              </Fragment>
            )}
            {modal.tipo === "eliminar" && (
              <Fragment>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Trash2 size={20} /> Eliminar cupón
                </h2>
                <p className="mb-4">¿Estás seguro de que deseas eliminar este cupón? Esta acción no se puede deshacer.</p>
                <button
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-semibold w-full flex items-center justify-center gap-2 disabled:opacity-60 mb-2"
                  disabled={accionCargando}
                  onClick={() => eliminarCoupon(modal.coupon.id)}
                >
                  {accionCargando && <Loader2 className="animate-spin" size={18} />} Sí, eliminar cupón
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
