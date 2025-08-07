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

  const [showEmailInput, setShowEmailInput] = React.useState(false);

  useEffect(() => {
    let _token = searchParams.get("token");
    let _email = searchParams.get("email");

    // Si no están, intenta obtener del hash
    if (!_token && typeof window !== "undefined" && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.replace('#', ''));
      _token = hashParams.get("access_token");
      _email = hashParams.get("email");
    }


    if (!_token) {
      setStatus('unauthorized');
      setEmailToResend(null);
      return;
    }
    if (_email) setEmailToResend(_email);

    // Confirmar email con Supabase
    const confirm = async (token: string, email: string) => {
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
    if (_token && _email) {
      confirm(_token, _email);
    } else {
      setStatus('error');
    }
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
  const handleResend = async (providedEmail?: string) => {
    setResendMsg("");
    const emailToSend = providedEmail || emailToResend;
    if (!emailToSend) {
      setShowEmailInput(true);
      return;
    }
    setShowEmailInput(false);
    const { error } = await supabase.auth.resend({ type: 'signup', email: emailToSend });
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
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#ff6f61] via-[#d7263d] to-[#2d2327] bg-clip-text text-transparent drop-shadow-lg mb-4">Acceso denegado</h1>
            <p className="text-slate-700 mb-6">No tienes permiso para acceder a esta página.<br />Utiliza el enlace de confirmación enviado a tu correo.</p>
            <Link href="/" className="btn bg-red-400 text-white font-semibold px-6 py-3 rounded-lg inline-block mt-4 hover:bg-red-500 transition">Ir al inicio</Link>
          </>
        )}
        {status === 'pending' && (
          <>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#ff6f61] via-[#d7263d] to-[#2d2327] bg-clip-text text-transparent drop-shadow-lg mb-4">Verificando correo...</h1>
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-red-400 mx-auto mb-6"></div>
            <p className="text-slate-700 mb-6">Estamos confirmando tu cuenta, por favor espera unos segundos.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#ff6f61] via-[#d7263d] to-[#2d2327] bg-clip-text text-transparent drop-shadow-lg mb-4">¡Correo confirmado!</h1>
            <p className="text-slate-700 mb-6">Tu cuenta ha sido activada exitosamente.<br />Ya puedes iniciar sesión y disfrutar de StyleHub.</p>
            <Link href="/" className="btn bg-red-400 text-white font-semibold px-6 py-3 rounded-lg inline-block mt-4 hover:bg-red-500 transition">Ir al inicio</Link>
            <span className="block text-xs text-slate-400 mt-2">Serás redirigido automáticamente...</span>
          </>
        )}
        {status === 'error' && (
          <>
            <h1 className="text-3xl font-bold text-red-400 mb-4">Error al confirmar</h1>
            <p className="text-slate-700 mb-6">No se pudo verificar tu correo. El enlace puede estar expirado o ya fue usado.<br />Solicita un nuevo correo de verificación o contáctanos.</p>
            {!showEmailInput && emailToResend && (
              <button onClick={() => handleResend()} className="btn bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg inline-block mt-4 hover:bg-blue-700 transition">Reenviar correo</button>
            )}
            {(showEmailInput || !emailToResend) && (
              <form onSubmit={e => {
                e.preventDefault();
                const val = (e.target as any).email.value;
                setEmailToResend(val);
                handleResend(val);
              }}>
                <input name="email" type="email" required placeholder="Tu email" className="input px-4 py-2 rounded-lg border border-slate-300 mb-2" />
                <button type="submit" className="btn bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg inline-block mt-2 hover:bg-blue-700 transition">Enviar enlace</button>
              </form>
            )}
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
