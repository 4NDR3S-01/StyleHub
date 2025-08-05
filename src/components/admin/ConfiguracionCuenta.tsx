"use client";

import { useState, useEffect, useRef } from "react";
import supabase from "@/lib/supabaseClient";
import { Edit2, Eye, EyeOff } from "lucide-react";
import UserAvatar from "@/components/ui/UserAvatar";
import { getAvatarUrl } from "@/utils/avatarUtils";

export default function ConfiguracionCuenta() {
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    email: "",
    password: "",
    confirmPassword: "",
    avatar: null as File | null,
    avatarUrl: "",
    currentPassword: "",
  });
  // Fuerza de la contraseña
  function getPasswordStrength(password: string) {
    let score = 0;
    if (!password) return 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  }

  const [originalEmail, setOriginalEmail] = useState("");
  const [loading, setLoading] = useState(true);
  // mensaje eliminado, ahora se usa error y success
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function fetchUser() {
      setLoading(true);
      setError("");
      setSuccess("");
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setError("No autenticado");
        setLoading(false);
        return;
      }
      const { data, error: dbError } = await supabase
        .from("users")
        .select("nombre: name, apellido: lastname, email, avatar")
        .eq("id", user.id)
        .single();
      if (dbError) {
        setError("Error al obtener datos de usuario");
        setLoading(false);
        return;
      }
      console.log('Final avatar URL:', getAvatarUrl(data?.avatar));
      setForm({
        nombre: data?.nombre || "",
        apellido: data?.apellido || "",
        email: data?.email || "",
        password: "",
        confirmPassword: "",
        avatar: null,
        avatarUrl: getAvatarUrl(data?.avatar),
        currentPassword: "",
      });
      setOriginalEmail(data?.email || "");
      setLoading(false);
    }
    fetchUser();
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, files } = e.target;
    setError("");
    setSuccess("");
    if (name === "avatar" && files?.[0]) {
      const file = files[0];
      if (!file.type.startsWith("image/")) {
        setError("El archivo debe ser una imagen.");
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        setError("El avatar no debe superar los 2MB.");
        return;
      }
      setForm((f) => ({ ...f, avatar: file, avatarUrl: URL.createObjectURL(file) }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  }

  function validateForm() {
    if (!form.nombre.trim()) {
      setError("El nombre es obligatorio.");
      return false;
    }
    if (!form.apellido.trim()) {
      setError("El apellido es obligatorio.");
      return false;
    }
    if (!form.email.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
      setError("Correo electrónico inválido.");
      return false;
    }
    // Si cambia el email o la contraseña, la contraseña actual es obligatoria
    const emailChanged = form.email !== originalEmail;
    if ((emailChanged || form.password) && !form.currentPassword) {
      setError("Debes ingresar tu contraseña actual para cambiar el correo o la contraseña.");
      return false;
    }
    if (form.password) {
      if (form.password.length < 6) {
        setError("La contraseña debe tener al menos 6 caracteres.");
        return false;
      }
      if (form.password !== form.confirmPassword) {
        setError("Las contraseñas nuevas no coinciden.");
        return false;
      }
    }
    return true;
  }

  async function uploadAvatar(userId: string, avatar: File) {
    const ext = avatar.name.split('.').pop();
    const avatarPath = `users/${userId}.${ext}`;
    const { error: uploadError } = await supabase.storage.from("avatar").upload(avatarPath, avatar, { upsert: true });
    if (uploadError) {
      throw new Error("Error al subir el avatar: " + uploadError.message);
    }
    return avatarPath;
  }

  async function reauthenticateIfNeeded(emailChanged: boolean, userEmail: string, currentPassword: string) {
    if ((emailChanged || form.password) && currentPassword) {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: currentPassword,
      });
      if (authError) {
        throw new Error("Contraseña actual incorrecta.");
      }
    }
  }

  async function updatePasswordIfNeeded() {
    if (form.password) {
      const { error: passError } = await supabase.auth.updateUser({ password: form.password });
      if (passError) {
        throw new Error("Error al actualizar la contraseña: " + passError.message);
      }
    }
  }

  async function updateEmailIfNeeded(emailChanged: boolean) {
    if (emailChanged) {
      const { error: emailError } = await supabase.auth.updateUser({ email: form.email });
      if (emailError) {
        throw new Error("Error al actualizar el correo: " + emailError.message);
      }
    }
  }

  async function updateUserData(updates: any, userId: string) {
    const { error: updateError } = await supabase.from("users").update(updates).eq("id", userId);
    if (updateError) {
      throw new Error("Error al actualizar los datos");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!validateForm()) return;
    setLoading(true);
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        setError("No autenticado");
        setLoading(false);
        return;
      }

      let avatarPath: string | undefined = undefined;
      if (form.avatar) {
        avatarPath = await uploadAvatar(user.id, form.avatar);
      }

      const updates: any = {
        name: form.nombre,
        lastname: form.apellido,
        email: form.email,
      };
      if (avatarPath) updates.avatar = avatarPath;

      const emailChanged = form.email !== originalEmail;

      await reauthenticateIfNeeded(emailChanged, originalEmail, form.currentPassword);
      await updatePasswordIfNeeded();
      await updateEmailIfNeeded(emailChanged);
      await updateUserData(updates, user.id);

      setSuccess("¡Datos actualizados correctamente!");
      setError("");
      if (avatarPath) {
        // Obtener la nueva URL del avatar
        const { data: urlData } = supabase.storage.from("avatar").getPublicUrl(avatarPath);
        setForm((f) => ({ ...f, avatar: null, avatarUrl: urlData.publicUrl }));
        if (fileInputRef.current) fileInputRef.current.value = "";
        console.log('Avatar updated, new URL:', urlData.publicUrl);
      }
      // Limpiar campos de contraseña
      setForm((f) => ({ ...f, password: "", confirmPassword: "", currentPassword: "" }));
    } catch (err: any) {
      setError(err.message || "Error desconocido");
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
              <UserAvatar
                src={form.avatarUrl}
                name={`${form.nombre} ${form.apellido}`.trim() || 'Usuario'}
                size="xl"
                alt="Avatar preview"
                className="border-4 border-red-200 shadow"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 bg-red-600 text-white rounded-full p-2 shadow hover:bg-red-700 transition-colors"
                title="Cambiar avatar"
                aria-label="Cambiar avatar"
              >
                <Edit2 className="h-5 w-5" />
              </button>
              <input
                type="file"
                name="avatar"
                id="avatar"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleChange}
                className="hidden"
                aria-label="Subir nuevo avatar"
              />
            </div>
          </div>
          <div>
            <label htmlFor="nombre" className="block text-sm font-semibold text-gray-700 mb-1">Nombre <span className="text-red-500">*</span></label>
            <input
              id="nombre"
              type="text"
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-200 text-lg"
              required
              autoComplete="given-name"
              aria-required="true"
              aria-invalid={!!error && error.includes("nombre")}
            />
          </div>
          <div>
            <label htmlFor="apellido" className="block text-sm font-semibold text-gray-700 mb-1">Apellido <span className="text-red-500">*</span></label>
            <input
              id="apellido"
              type="text"
              name="apellido"
              value={form.apellido}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-200 text-lg"
              required
              autoComplete="family-name"
              aria-required="true"
              aria-invalid={!!error && error.includes("apellido")}
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">Correo electrónico <span className="text-red-500">*</span></label>
            <input
              id="email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-200 text-lg"
              required
              autoComplete="email"
              aria-required="true"
              aria-invalid={!!error && error.includes("Correo")}
            />
          </div>
          {(form.email !== originalEmail || form.password) && (
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-semibold text-gray-700 mb-1">Contraseña actual <span className="text-red-500">*</span></label>
              <input
                id="currentPassword"
                type="password"
                name="currentPassword"
                value={form.currentPassword}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-200 text-lg"
                required
                autoComplete="current-password"
                aria-required="true"
                aria-invalid={!!error && error.includes("actual")}
                placeholder="Ingresa tu contraseña actual"
              />
            </div>
          )}
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1">Contraseña nueva</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                value={form.password}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-200 text-lg pr-10"
                placeholder="Dejar en blanco para no cambiar"
                autoComplete="new-password"
                aria-describedby="passwordHelp"
              />
              <button
                type="button"
                tabIndex={-1}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 focus:outline-none"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {/* Barra de seguridad */}
            {form.password && (() => {
              const strength = getPasswordStrength(form.password);
              let strengthClass = "";
              if (strength <= 2) {
                strengthClass = "bg-red-400 w-1/4";
              } else if (strength === 3) {
                strengthClass = "bg-yellow-400 w-2/4";
              } else if (strength === 4) {
                strengthClass = "bg-green-400 w-3/4";
              } else {
                strengthClass = "bg-green-600 w-full";
              }
              return (
                <div className="w-full h-2 mt-2 rounded bg-gray-200 overflow-hidden">
                  <div
                    className={`h-2 transition-all duration-300 ${strengthClass}`}
                  />
                </div>
              );
            })()}
            <span id="passwordHelp" className="block text-xs text-gray-400 mt-1">Mínimo 6 caracteres. Dejar en blanco para no cambiar.</span>
          </div>
          {/* Confirmación de contraseña nueva */}
          {form.password && (
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-1">Confirmar contraseña nueva</label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-200 text-lg pr-10"
                  autoComplete="new-password"
                  aria-required="true"
                  aria-invalid={!!error && error.includes("coinciden")}
                  placeholder="Repite la nueva contraseña"
                />
                <button
                  type="button"
                  tabIndex={-1}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 focus:outline-none"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-red-600 to-red-400 text-white font-bold py-3 rounded-xl shadow hover:from-red-700 hover:to-red-500 transition-colors text-lg disabled:opacity-60"
          >
            {loading ? "Guardando..." : "Guardar cambios"}
          </button>
          {(error || success) && (
            <div className={`text-center mt-2 font-semibold ${error ? "text-red-600" : "text-green-600"}`}
                 role={error ? "alert" : "status"}>
              {error || success}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
