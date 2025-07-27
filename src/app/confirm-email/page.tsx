'use client';

import React, { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from 'sonner';
import supabase from "@/lib/supabaseClient";

function ConfirmEmailPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = React.useState<'pending'|'success'|'error'>('pending');
  const [errorMessage, setErrorMessage] = React.useState<string>('');

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        // Obtener los parámetros de la URL de confirmación
        const token_hash = searchParams.get('token_hash');
        const type = searchParams.get('type');
        
        if (!token_hash || type !== 'email') {
          setErrorMessage('Parámetros de confirmación inválidos');
          setStatus('error');
          return;
        }

        // Verificar el token de confirmación
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash,
          type: 'email'
        });

        if (error) {
          console.error('Error verificando email:', error);
          setErrorMessage(error.message);
          setStatus('error');
          return;
        }

        if (data?.user) {
          // Usuario confirmado exitosamente
          console.log('Usuario confirmado:', data.user);
          
          // Verificar si el usuario ya existe en la tabla users
          const { data: existingUser, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('id', data.user.id)
            .single();

          if (userError && userError.code === 'PGRST116') {
            // Usuario no existe en la tabla, crear entrada
            const { error: insertError } = await supabase
              .from('users')
              .insert({
                id: data.user.id,
                email: data.user.email,
                name: data.user.user_metadata?.name || '',
                lastname: data.user.user_metadata?.lastname || '',
                role: 'cliente',
                created_at: new Date().toISOString()
              });

            if (insertError) {
              console.error('Error creando usuario en BD:', insertError);
            }
          }

          setStatus('success');
          toast.success('¡Email verificado exitosamente!');
        } else {
          setErrorMessage('No se pudo verificar el usuario');
          setStatus('error');
        }
      } catch (error: any) {
        console.error('Error en confirmación:', error);
        setErrorMessage(error.message || 'Error desconocido');
        setStatus('error');
      }
    };

    confirmEmail();
  }, [searchParams]);

  // Redirección automática tras éxito
  useEffect(() => {
    if (status === 'success') {
      const timeout = setTimeout(() => {
        router.push('/');
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [status, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
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
            <a href="/" className="btn bg-red-400 text-white font-semibold px-6 py-3 rounded-lg inline-block mt-4 hover:bg-red-500 transition">Ir al inicio</a>
            <span className="block text-xs text-slate-400 mt-2">Serás redirigido automáticamente...</span>
          </>
        )}
        {status === 'error' && (
          <>
            <h1 className="text-3xl font-bold text-red-400 mb-4">Error al confirmar</h1>
            <p className="text-slate-700 mb-6">
              No se pudo verificar tu correo. {errorMessage || 'El enlace puede estar expirado o ya fue usado.'}
              <br />
              Solicita un nuevo correo de verificación o contáctanos.
            </p>
            <div className="space-y-2">
              <a href="/register" className="btn bg-red-400 text-white font-semibold px-6 py-3 rounded-lg inline-block hover:bg-red-500 transition">
                Registrarse nuevamente
              </a>
              <br />
              <a href="/login" className="btn bg-gray-400 text-white font-semibold px-6 py-3 rounded-lg inline-block hover:bg-gray-500 transition">
                Ir a iniciar sesión
              </a>
            </div>
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
