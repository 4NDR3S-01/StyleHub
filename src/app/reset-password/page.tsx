'use client';

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import supabase from "@/lib/supabaseClient";

function ResetPasswordPageContent() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  // Obtener token y email de query o hash
  let token = searchParams.get("token");
  let email = searchParams.get("email");
  if (typeof window !== "undefined" && (!token || !email) && window.location.hash) {
    const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));
    token = hashParams.get("access_token") || token;
    email = hashParams.get("email") || email;
    if (!email && hashParams.get("user_metadata.email")) {
      email = hashParams.get("user_metadata.email");
    }
  }

  useEffect(() => {
    if (!token || !email) {
      setError("Token o correo inválido. Verifica el enlace de tu correo.");
    }
  }, [token, email]);

  useEffect(() => {
    if (success) {
      const timeout = setTimeout(() => {
        window.location.href = '/';
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [success]);

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
    if (!token || !email) {
      setError("Token o correo inválido.");
      return;
    }
    setLoading(true);
    // Verifica el token primero
    const { error: verifyError } = await supabase.auth.verifyOtp({ type: 'recovery', token, email });
    if (verifyError) {
      setLoading(false);
      setError(verifyError.message);
      return;
    }
    // Si la verificación fue exitosa, actualiza la contraseña
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setSuccess(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#ff6f61] via-[#d7263d] to-[#2d2327] bg-clip-text text-transparent drop-shadow-lg mb-4">Restablece tu contraseña</h1>
        {success ? (
          <>
            <p className="text-slate-700 mb-6">¡Contraseña actualizada exitosamente!<br />Serás redirigido al inicio.</p>
            <a href="/" className="btn bg-red-400 text-white font-semibold px-6 py-3 rounded-lg inline-block mt-4 hover:bg-red-500 transition">Ir al inicio</a>
            <span className="block text-xs text-slate-400 mt-2">Serás redirigido automáticamente...</span>
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
              disabled={loading || !token || !email}
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
