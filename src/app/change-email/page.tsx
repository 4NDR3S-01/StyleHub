'use client';

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import supabase from "@/lib/supabaseClient";

function ChangeEmailPageContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = React.useState<'pending'|'success'|'error'>('pending');

  React.useEffect(() => {
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
    if (!token || !email) {
      setStatus('error');
      return;
    }
    // Confirmar cambio de email con Supabase
    const confirm = async () => {
      try {
        const { error } = await supabase.auth.verifyOtp({ type: 'email_change', token, email });
        if (error) {
          setStatus('error');
        } else {
          setStatus('success');
        }
      } catch {
        setStatus('error');
      }
    };
    confirm();
  }, [searchParams]);

  // Redirección automática tras éxito
  React.useEffect(() => {
    if (status === 'success') {
      const timeout = setTimeout(() => {
        window.location.href = '/';
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [status]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {status === 'pending' && (
          <>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#ff6f61] via-[#d7263d] to-[#2d2327] bg-clip-text text-transparent drop-shadow-lg mb-4">Verificando cambio...</h1>
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-red-400 mx-auto mb-6"></div>
            <p className="text-slate-700 mb-6">Estamos confirmando el cambio de correo, por favor espera unos segundos.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#ff6f61] via-[#d7263d] to-[#2d2327] bg-clip-text text-transparent drop-shadow-lg mb-4">¡Correo actualizado!</h1>
            <p className="text-slate-700 mb-6">Tu correo ha sido cambiado exitosamente.<br />Ya puedes usar tu nuevo email para iniciar sesión.</p>
            <a href="/" className="btn bg-red-400 text-white font-semibold px-6 py-3 rounded-lg inline-block mt-4 hover:bg-red-500 transition">Ir al inicio</a>
            <span className="block text-xs text-slate-400 mt-2">Serás redirigido automáticamente...</span>
          </>
        )}
        {status === 'error' && (
          <>
            <h1 className="text-3xl font-bold text-red-400 mb-4">Error al confirmar</h1>
            <p className="text-slate-700 mb-6">No se pudo verificar el cambio de correo. El enlace puede estar expirado o ya fue usado.<br />Solicita un nuevo cambio o contáctanos.</p>
            <a href="/" className="btn bg-red-400 text-white font-semibold px-6 py-3 rounded-lg inline-block mt-4 hover:bg-red-500 transition">Ir al inicio</a>
          </>
        )}
        <p className="text-xs mt-6 text-slate-400">¿Necesitas ayuda? <a href="mailto:soporte@stylehub.com" className="underline text-red-400">Contáctanos</a></p>
      </div>
    </div>
  );
}

export default function ChangeEmailPage() {
  return (
    <Suspense>
      <ChangeEmailPageContent />
    </Suspense>
  );
}
