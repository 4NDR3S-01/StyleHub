'use client';

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import supabase from "@/lib/supabaseClient";
import AuthHeader from '@/components/auth/AuthHeader';

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
    <>
      <AuthHeader 
        title="Restablecer Contraseña" 
        subtitle="Crea una nueva contraseña segura"
        showBackButton={true}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 text-center border-0">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Restablece tu contraseña</h2>
            <p className="text-gray-600 mb-6">Ingresa tu nueva contraseña</p>
        
        {success ? (
          <>
            <div className="text-center space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <p className="text-green-800 font-semibold">¡Contraseña actualizada exitosamente!</p>
                <p className="text-green-600 text-sm mt-1">Serás redirigido al inicio en unos segundos.</p>
              </div>
              <a 
                href="/" 
                className="inline-block bg-gradient-to-r from-[#ff6f61] via-[#d7263d] to-[#2d2327] hover:from-[#ff5a4a] hover:via-[#c41f2a] hover:to-[#1a1518] text-white font-semibold px-8 py-3 rounded-lg transition-all duration-300 transform hover:scale-[1.02] shadow-lg"
              >
                Ir al inicio
              </a>
              <p className="text-xs text-gray-500 mt-2">Serás redirigido automáticamente...</p>
            </div>
          </>
        ) : (
<<<<<<< HEAD
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <input
                type="password"
                placeholder="Nueva contraseña"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full h-12 px-4 py-3 border border-gray-200 rounded-lg bg-white/50 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#d7263d] focus:ring-2 focus:ring-[#d7263d] transition-all duration-200"
                minLength={8}
                required
              />
            </div>
            <div>
              <input
                type="password"
                placeholder="Confirmar contraseña"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full h-12 px-4 py-3 border border-gray-200 rounded-lg bg-white/50 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#d7263d] focus:ring-2 focus:ring-[#d7263d] transition-all duration-200"
                minLength={8}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || !token || !email}
              className="w-full h-12 bg-gradient-to-r from-[#ff6f61] via-[#d7263d] to-[#2d2327] hover:from-[#ff5a4a] hover:via-[#c41f2a] hover:to-[#1a1518] text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? "Actualizando..." : "Restablecer contraseña"}
            </button>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
          </form>
=======
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
>>>>>>> desarrollo
        )}
        <p className="text-xs mt-6 text-gray-500">
          ¿Necesitas ayuda?{' '}
          <a href="mailto:soporte@stylehub.com" className="text-[#d7263d] hover:text-[#ff6f61] transition-colors">
            Contáctanos
          </a>
        </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordPageContent />
    </Suspense>
  );
}
