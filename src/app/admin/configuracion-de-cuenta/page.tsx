"use client";

import { useState, useEffect, useRef } from "react";
import supabase from "@/lib/supabaseClient";

export default function ConfiguracionDeCuentaPage() {
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    password: "",
    avatar: null as File | null,
    avatarUrl: "",
  });
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Obtener datos reales del usuario autenticado
  useEffect(() => {
    async function fetchUser() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      // Obtener datos del perfil
      const { data, error } = await supabase
        .from("users")
        .select("nombre: name, email, avatar")
        .eq("id", user.id)
        .single();
      if (data) {
        let avatarUrl = "";
        if (data.avatar) {
          const { data: urlData } = supabase.storage.from("avatar").getPublicUrl(data.avatar);
          avatarUrl = urlData.publicUrl;
        }
        setForm({
          nombre: data.nombre || "",
          email: data.email || "",
          password: "",
          avatar: null,
          avatarUrl,
        });
      }
      setLoading(false);
    }
    fetchUser();
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, files } = e.target;
    if (name === "avatar" && files?.[0]) {
      const file = files[0];
      // Validar tipo de archivo
      if (!file.type.startsWith("image/")) {
        setMensaje("El archivo debe ser una imagen.");
        return;
      }
      // Validar tamaño (máx 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setMensaje("El avatar no debe superar los 2MB.");
        return;
      }
      setForm((f) => ({ ...f, avatar: file, avatarUrl: URL.createObjectURL(file) }));
      setMensaje("");
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMensaje("");
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMensaje("No autenticado");
      setLoading(false);
      return;
    }
    let avatarPath = undefined;
    if (form.avatar) {
      setMensaje("Subiendo avatar...");
      const ext = form.avatar.name.split('.').pop();
      avatarPath = `users/${user.id}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("avatar").upload(avatarPath, form.avatar, { upsert: true });
      if (uploadError) {
        setMensaje("Error al subir el avatar: " + uploadError.message);
        setLoading(false);
        return;
      }
    }
    // Actualizar datos en la tabla users
    const updates: any = {
      name: form.nombre,
      email: form.email,
    };
    if (avatarPath) updates.avatar = avatarPath;
    if (form.password) {
      // Cambiar contraseña
      await supabase.auth.updateUser({ password: form.password });
    }
    const { error } = await supabase.from("users").update(updates).eq("id", user.id);
    if (!error) {
      setMensaje("¡Datos actualizados correctamente!");
      // Refrescar avatar
      if (avatarPath) {
        const { data: urlData } = supabase.storage.from("avatar").getPublicUrl(avatarPath);
        setForm((f) => ({ ...f, avatar: null, avatarUrl: urlData.publicUrl }));
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } else {
      setMensaje("Error al actualizar los datos");
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="max-w-xl w-full bg-white p-8 rounded-2xl shadow-lg">
        <h2 className="text-3xl font-extrabold mb-8 text-red-700 text-center tracking-tight">Configuraciones de la cuenta</h2>
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <img
                src={form.avatarUrl || "/default-avatar.png"}
                alt="Avatar preview"
                className="w-24 h-24 rounded-full border-4 border-red-200 object-cover shadow"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-red-600 text-white rounded-full p-2 shadow hover:bg-red-700 transition-colors"
                title="Cambiar avatar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13h3l8-8a2.828 2.828 0 00-4-4l-8 8v3h3z" /></svg>
              </button>
              <input
                type="file"
                name="avatar"
                id="avatar"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleChange}
                className="hidden"
              />
            </div>
          </div>
          <div>
            <label htmlFor="nombre" className="block text-sm font-semibold text-gray-700 mb-1">Nombre</label>
            <input
              id="nombre"
              type="text"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-200 text-lg"
              required
              autoComplete="name"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">Correo electrónico</label>
            <input
              id="email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-200 text-lg"
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1">Contraseña nueva</label>
            <input
              id="password"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-200 text-lg"
              placeholder="Dejar en blanco para no cambiar"
              autoComplete="new-password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-600 to-red-400 text-white font-bold py-3 rounded-xl shadow hover:from-red-700 hover:to-red-500 transition-colors text-lg disabled:opacity-60"
          >
            {loading ? "Guardando..." : "Guardar cambios"}
          </button>
          {mensaje && <div className="text-center mt-2 font-semibold text-green-600">{mensaje}</div>}
        </form>
      </div>
    </div>
  );
}
