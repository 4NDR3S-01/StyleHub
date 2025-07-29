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
  const [showResend, setShowResend] = useState(false);
  const [emailToResend, setEmailToResend] = useState("");
  const [resendMsg, setResendMsg] = useState("");
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
      setShowResend(true);
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
      setShowResend(true);
      return;
    }
    setLoading(true);
    // Verifica el token primero
    const { error: verifyError } = await supabase.auth.verifyOtp({ type: 'recovery', token, email });
    if (verifyError) {
      setLoading(false);
      setError(verifyError.message);
      setShowResend(true);
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

  // Manejar reenvío de correo
  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setResendMsg("");
    if (!emailToResend) {
      setResendMsg("Debes ingresar tu correo.");
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(emailToResend);
    if (error) {
      setResendMsg("No se pudo reenviar el correo. Intenta más tarde o contáctanos.");
    } else {
      setResendMsg("Correo de recuperación reenviado. Revisa tu bandeja de entrada.");
      setShowResend(false);
    }
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
          <>
            {!showResend ? (
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
                {error && (
                  <div className="text-xs text-red-400 mt-2">
                    {error}
                    {error.toLowerCase().includes("expired") || error.toLowerCase().includes("invalid") ? (
                      <div className="text-xs text-blue-500 mt-2">
                        ¿Necesitas un nuevo enlace?{" "}
                        <button
                          type="button"
                          className="underline text-blue-700"
                          onClick={() => setShowResend(true)}
                        >
                          Haz clic aquí
                        </button>{" "}
                        para solicitar otro.
                      </div>
                    ) : null}
                  </div>
                )}
              </form>
            ) : (
              <form onSubmit={handleResend} className="flex flex-col gap-4 mt-4">
                <input
                  type="email"
                  placeholder="Ingresa tu correo"
                  value={emailToResend}
                  onChange={e => setEmailToResend(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-100 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400"
                  required
                />
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow"
                >
                  Reenviar correo de recuperación
                </button>
                {resendMsg && <div className="text-xs text-green-500 mt-2">{resendMsg}</div>}
                <button
                  type="button"
                  className="w-full mt-2 bg-slate-200 text-slate-600 py-2 rounded-lg hover:bg-slate-300 transition"
                  onClick={() => setShowResend(false)}
                >
                  Volver
                </button>
              </form>
            )}
          </>
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
