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
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

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
    <>
      <AuthHeader 
        title="Restablecer Contraseña" 
        subtitle="Crea una nueva contraseña segura"
        showBackButton={true}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
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
                className="inline-block bg-gradient-to-r from-red-400 to-pink-400 hover:from-red-500 hover:to-pink-500 text-white font-semibold px-8 py-3 rounded-lg transition-all duration-300 transform hover:scale-[1.02] shadow-lg"
              >
                Ir al inicio
              </a>
              <p className="text-xs text-gray-500 mt-2">Serás redirigido automáticamente...</p>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <input
                type="password"
                placeholder="Nueva contraseña"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full h-12 px-4 py-3 border border-gray-200 rounded-lg bg-white/50 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400 transition-all duration-200"
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
                className="w-full h-12 px-4 py-3 border border-gray-200 rounded-lg bg-white/50 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-400 transition-all duration-200"
                minLength={8}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading || !token || !email}
              className="w-full h-12 bg-gradient-to-r from-red-400 to-pink-400 hover:from-red-500 hover:to-pink-500 text-white font-semibold rounded-lg transition-all duration-300 transform hover:scale-[1.02] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? "Actualizando..." : "Restablecer contraseña"}
            </button>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
          </form>
        )}
        <p className="text-xs mt-6 text-gray-500">
          ¿Necesitas ayuda?{' '}
          <a href="mailto:soporte@stylehub.com" className="text-red-400 hover:text-red-600 transition-colors">
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
