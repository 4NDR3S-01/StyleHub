'use client';

import React, { useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from 'sonner';
import supabase from "@/lib/supabaseClient";
import AuthHeader from '@/components/auth/AuthHeader';

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
    <>
      <AuthHeader 
        title="Verificación de Email" 
        subtitle="Confirmando tu cuenta de StyleHub"
        showBackButton={false}
      />
      
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 text-center border-0">
          
          {status === 'pending' && (
            <>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Verificando correo...</h1>
              <p className="text-gray-600 mb-6">Estamos confirmando tu cuenta, por favor espera unos segundos.</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">¡Correo confirmado!</h1>
            <p className="text-gray-600 mb-6">
              Tu cuenta ha sido activada exitosamente.<br />
              Ya puedes iniciar sesión y disfrutar de <span className="text-[#d7263d] font-semibold">StyleHub</span>.
            </p>
            <a 
              href="/" 
              className="inline-block bg-gradient-to-r from-[#ff6f61] via-[#d7263d] to-[#2d2327] hover:from-[#ff5a4a] hover:via-[#c41f2a] hover:to-[#1a1518] text-white font-semibold px-8 py-3 rounded-lg transition-all duration-300 transform hover:scale-[1.02] shadow-lg"
            >
              Ir al inicio
            </a>
            <p className="text-xs text-gray-500 mt-4">Serás redirigido automáticamente...</p>
          </>
        )}
        
        {status === 'error' && (
          <>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Error al confirmar</h1>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600 text-sm">
                No se pudo verificar tu correo. {errorMessage || 'El enlace puede estar expirado o ya fue usado.'}
                <br />
                Solicita un nuevo correo de verificación o contáctanos.
              </p>
            </div>
            <div className="space-y-3">
              <a 
                href="/register" 
                className="block w-full bg-gradient-to-r from-[#ff6f61] via-[#d7263d] to-[#2d2327] hover:from-[#ff5a4a] hover:via-[#c41f2a] hover:to-[#1a1518] text-white font-semibold py-3 rounded-lg transition-all duration-300 transform hover:scale-[1.02] shadow-lg"
              >
                Registrarse nuevamente
              </a>
              <a 
                href="/login" 
                className="block w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-lg transition-all duration-300"
              >
                Ir a iniciar sesión
              </a>
            </div>
          </>
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

export default function ConfirmEmailPage() {
  return (
    <Suspense>
      <ConfirmEmailPageContent />
    </Suspense>
  );
}
