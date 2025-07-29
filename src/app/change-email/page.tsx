'use client';

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import supabase from "@/lib/supabaseClient";

function ChangeEmailPageContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = React.useState<'pending'|'success'|'error'>('pending');
  const [showResend, setShowResend] = React.useState(false);
  const [emailToResend, setEmailToResend] = React.useState("");
  const [resendMsg, setResendMsg] = React.useState("");

  React.useEffect(() => {
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
      setShowResend(true);
      return;
    }
    // Confirmar cambio de email con Supabase
    const confirm = async () => {
      try {
        const { error } = await supabase.auth.verifyOtp({
          type: 'email_change',
          token,
          email
        });
        if (error) {
          setStatus('error');
          setShowResend(true);
        } else {
          setStatus('success');
        }
      } catch {
        setStatus('error');
        setShowResend(true);
      }
    };
    confirm();
    // eslint-disable-next-line
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

  // Manejar reenvío de correo
  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setResendMsg("");
    if (!emailToResend) {
      setResendMsg("Debes ingresar tu nuevo correo.");
      return;
    }
    // El tipo debe ser 'email_change'
    const { error } = await supabase.auth.resend({ type: 'email_change', email: emailToResend });
    if (error) {
      setResendMsg("No se pudo reenviar el correo. Intenta más tarde o contáctanos.");
    } else {
      setResendMsg("Correo para cambio reenviado. Revisa tu bandeja de entrada.");
      setShowResend(false);
    }
  };

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
            {!showResend && (
              <a href="/" className="btn bg-red-400 text-white font-semibold px-6 py-3 rounded-lg inline-block mt-4 hover:bg-red-500 transition">Ir al inicio</a>
            )}
            {showResend && (
              <form onSubmit={handleResend} className="flex flex-col gap-4 mt-4">
                <input
                  type="email"
                  placeholder="Tu nuevo correo"
                  value={emailToResend}
                  onChange={e => setEmailToResend(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg bg-slate-100 text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400"
                  required
                />
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow"
                >
                  Reenviar correo de cambio
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

export default function ChangeEmailPage() {
  return (
    <Suspense>
      <ChangeEmailPageContent />
    </Suspense>
  );
}
