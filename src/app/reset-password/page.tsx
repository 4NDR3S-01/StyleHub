'use client';

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import supabase from "@/lib/supabaseClient";

function ResetPasswordPageContent() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const accessToken = searchParams.get("access_token");

  useEffect(() => {
    if (!accessToken) {
      setError("Token inválido o expirado. Verifica el enlace de tu correo.");
    }
  }, [accessToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!password || !confirmPassword) {
      setError("Completa ambos campos.");
      return;
    }
    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    const { error: supaError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (supaError) {
      setError(supaError.message);
      return;
    }
    setSuccess(true);
    setTimeout(() => router.push("/"), 3000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-red-400 mb-4">Restablece tu contraseña</h1>
        {success ? (
          <>
            <p className="text-slate-700 mb-6">¡Contraseña actualizada exitosamente!<br />Serás redirigido al inicio.</p>
            <a href="/" className="btn bg-red-400 text-white font-semibold px-6 py-3 rounded-lg inline-block mt-4 hover:bg-red-500 transition">Ir al inicio</a>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              type="password"
              placeholder="Nueva contraseña"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-100 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400"
              minLength={8}
              required
            />
            <input
              type="password"
              placeholder="Confirmar contraseña"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-100 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400"
              minLength={8}
              required
            />
            <button
              type="submit"
              disabled={loading || !accessToken}
              className="w-full bg-red-400 text-white py-3 rounded-lg font-semibold hover:bg-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow"
            >
              {loading ? "Actualizando..." : "Restablecer contraseña"}
            </button>
            {error && <div className="text-xs text-red-400 mt-2">{error}</div>}
          </form>
        )}
        <p className="text-xs mt-6 text-slate-400">¿Necesitas ayuda? <a href="mailto:soporte@stylehub.com" className="underline text-red-400">Contáctanos</a></p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordPageContent />
    </Suspense>
  );
}
