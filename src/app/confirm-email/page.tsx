'use client';

import React, { useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import supabase from "@/lib/supabaseClient";

function ConfirmEmailPageContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = React.useState<'pending'|'success'|'error'|'unauthorized'>('pending');
  const [emailToResend, setEmailToResend] = React.useState<string | null>(null);
  const [resendMsg, setResendMsg] = React.useState<string>("");

  useEffect(() => {
    const token = searchParams.get("token");
    const email = searchParams.get("email");
    if (!token || !email) {
      setStatus('unauthorized');
      setEmailToResend(null);
      return;
    }
    setEmailToResend(email);
    // Confirmar email con Supabase
    const confirm = async () => {
      try {
        const { error } = await supabase.auth.verifyOtp({ type: 'email', token, email });
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
  useEffect(() => {
    if (status === 'success') {
      const timeout = setTimeout(() => {
        window.location.href = '/';
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [status]);

  // Función para reenviar correo de verificación
  const handleResend = async () => {
    setResendMsg("");
    if (!emailToResend) return;
    const { error } = await supabase.auth.resend({ type: 'signup', email: emailToResend });
    if (error) {
      setResendMsg("No se pudo reenviar el correo. Intenta más tarde o contáctanos.");
    } else {
      setResendMsg("Correo de verificación reenviado. Revisa tu bandeja de entrada.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {status === 'unauthorized' && (
          <>
            <h1 className="text-3xl font-bold text-red-400 mb-4">Acceso denegado</h1>
            <p className="text-slate-700 mb-6">No tienes permiso para acceder a esta página.<br />Utiliza el enlace de confirmación enviado a tu correo.</p>
            <Link href="/" className="btn bg-red-400 text-white font-semibold px-6 py-3 rounded-lg inline-block mt-4 hover:bg-red-500 transition">Ir al inicio</Link>
          </>
        )}
        {status === 'pending' && (
          <>
            <h1 className="text-3xl font-bold text-red-400 mb-4">Verificando correo...</h1>
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-red-400 mx-auto mb-6"></div>
            <p className="text-slate-700 mb-6">Estamos confirmando tu cuenta, por favor espera unos segundos.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <h1 className="text-3xl font-bold text-red-400 mb-4">¡Correo confirmado!</h1>
            <p className="text-slate-700 mb-6">Tu cuenta ha sido activada exitosamente.<br />Ya puedes iniciar sesión y disfrutar de StyleHub.</p>
            <Link href="/" className="btn bg-red-400 text-white font-semibold px-6 py-3 rounded-lg inline-block mt-4 hover:bg-red-500 transition">Ir al inicio</Link>
            <span className="block text-xs text-slate-400 mt-2">Serás redirigido automáticamente...</span>
          </>
        )}
        {status === 'error' && (
          <>
            <h1 className="text-3xl font-bold text-red-400 mb-4">Error al confirmar</h1>
            <p className="text-slate-700 mb-6">No se pudo verificar tu correo. El enlace puede estar expirado o ya fue usado.<br />Solicita un nuevo correo de verificación o contáctanos.</p>
            <button onClick={handleResend} className="btn bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg inline-block mt-4 hover:bg-blue-700 transition">Reenviar correo</button>
            {resendMsg && <div className="text-xs text-green-500 mt-2">{resendMsg}</div>}
            <Link href="/" className="btn bg-red-400 text-white font-semibold px-6 py-3 rounded-lg inline-block mt-4 hover:bg-red-500 transition">Ir al inicio</Link>
          </>
        )}
        <p className="text-xs mt-6 text-slate-400">¿Necesitas ayuda? <a href="mailto:soporte@stylehub.com" className="underline text-red-400">Contáctanos</a></p>
      </div>
    </div>
  );
}

export default function ConfirmEmailPage() {
  return (
    <Suspense>
      <ConfirmEmailPageContent />
    </Suspense>
  );
}
