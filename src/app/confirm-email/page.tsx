'use client';

import React, { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function ConfirmEmailPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (!searchParams.get("success")) {
      router.replace("/");
    }
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-red-400 mb-4">¡Correo confirmado!</h1>
        <p className="text-slate-700 mb-6">Tu cuenta ha sido activada exitosamente.<br />Ya puedes iniciar sesión y disfrutar de StyleHub.</p>
        <a href="/" className="btn bg-red-400 text-white font-semibold px-6 py-3 rounded-lg inline-block mt-4 hover:bg-red-500 transition">Ir al inicio</a>
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
