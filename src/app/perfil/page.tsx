'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import supabase from '../../lib/supabaseClient';
import UserAvatar from '../../components/ui/UserAvatar';
import PasswordStrengthBar, { calculatePasswordStrength } from '../../components/ui/PasswordStrengthBar';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import {MailCheck, Pencil } from 'lucide-react';


export default function PerfilDashboard() {
  const { user, changePassword } = useAuth();
  const [name, setName] = useState('');
  const [lastname, setLastname] = useState('');
  const [phone, setPhone] = useState('');
  const [avatar, setAvatar] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('cliente');
  const [emailVerified, setEmailVerified] = useState(false);
  const [msg, setMsg] = useState('');
  const [uploading, setUploading] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Estados para cambio de contraseña
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Eliminado: accountInfo ya no es necesario
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sincronizar datos del usuario cuando cambie el contexto
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setLastname(user.lastname || '');
      setPhone(user.phone || '');
      setAvatar(user.avatar || '');
      setEmail(user.email || '');
      setRole(user.role || 'cliente');
      setEmailVerified(user.email_verified || false);
    }
  }, [user]);

  // Auto-reset del estado si se queda colgado más de 5 segundos
  useEffect(() => {
    if (updating) {
      const timeout = setTimeout(() => {
        setUpdating(false);
        isUpdatingRef.current = false;
      }, 5000);

      return () => clearTimeout(timeout);
    }
  }, [updating]);

  // Usar useRef para controlar el estado de updating de forma más estable
  const isUpdatingRef = useRef(false);

  // === FUNCIÓN DE ACTUALIZACIÓN ÉTICA ===
  const handleUpdate = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('🔄 Iniciando actualización de perfil...');

    // Prevenir múltiples ejecuciones
    if (isUpdatingRef.current) {
      console.log('❌ Ya hay una actualización en progreso');
      return;
    }

    setMsg('');
    setUpdating(true);
    isUpdatingRef.current = true;
    console.log('✅ Estados inicializados');

    if (!user?.id) {
      console.log('❌ Usuario no válido');
      setMsg('❌ Usuario no válido');
      setUpdating(false);
      isUpdatingRef.current = false;
      return;
    }

    try {
      console.log('📝 Actualizando datos en la base de datos...');
      
      // Crear el objeto de actualización
      const updateData = {
        name: name.trim(),
        lastname: lastname.trim(),
        phone: phone.trim(),
        avatar,
        updated_at: new Date().toISOString()
      };
      
      console.log('📋 Datos a actualizar:', updateData);
      
      // Actualizar datos en la tabla users
      const updateResult = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);

      console.log('📊 Resultado de la actualización:', updateResult);

      if (updateResult.error) {
        console.log('❌ Error en la base de datos:', updateResult.error.message);
        throw new Error(updateResult.error.message);
      }

      console.log('✅ Datos actualizados en la base de datos exitosamente');

      console.log('🎉 Actualización completada exitosamente');
      setUpdating(false);
      isUpdatingRef.current = false;
      setMsg('✅ Perfil actualizado correctamente');
      
      // Limpia el mensaje de éxito después de 3s
      setTimeout(() => {
        console.log('🧹 Limpiando mensaje de éxito');
        setMsg('');
      }, 3000);

    } catch (error: any) {
      // ERROR: Algo salió mal
      console.log('💥 Error durante la actualización:', error.message);
      setUpdating(false);
      isUpdatingRef.current = false;
      setMsg(`❌ Error al guardar: ${error.message || 'Error desconocido'}`);
    }
  }, [user?.id, name, lastname, phone, avatar]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMsg('');

    try {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        setMsg('Por favor selecciona una imagen válida');
        setUploading(false);
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMsg('La imagen debe ser menor a 5MB');
        setUploading(false);
        return;
      }

      if (!user?.id) {
        setMsg('Usuario no válido, no se puede subir el avatar.');
        setUploading(false);
        return;
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Subir archivo al storage (bucket correcto: 'avatar')
      const { error: uploadError } = await supabase.storage
        .from('avatar')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        setMsg(`Error al subir el avatar: ${uploadError.message}`);
        setUploading(false);
        return;
      }

      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('avatar')
        .getPublicUrl(filePath);

      if (urlData?.publicUrl) {
        setAvatar(urlData.publicUrl);
        setMsg('Avatar actualizado. Haz clic en "Guardar cambios" para confirmar.');
      } else {
        setMsg('Error al obtener la URL del avatar');
      }

    } catch (error) {
      console.error('Error inesperado al subir el avatar:', error);
      setMsg('Error inesperado al subir el avatar');
    } finally {
      setUploading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordMsg('');
    setChangingPassword(true);

    try {
      // Validaciones básicas
      if (!newPassword || newPassword.length < 6) {
        setPasswordMsg('La nueva contraseña debe tener al menos 6 caracteres');
        setChangingPassword(false);
        return;
      }

      if (newPassword !== confirmPassword) {
        setPasswordMsg('Las contraseñas no coinciden');
        setChangingPassword(false);
        return;
      }

      // Validación de fortaleza de contraseña
      const strength = calculatePasswordStrength(newPassword);
      if (strength.score < 2) {
        setPasswordMsg('La contraseña es demasiado débil. Por favor, usa una contraseña más segura.');
        setChangingPassword(false);
        return;
      }

      await changePassword(newPassword);

      // Limpiar formulario
      // Limpiar formulario
      setNewPassword('');
      setConfirmPassword('');
      setPasswordMsg('Contraseña cambiada exitosamente');
    } catch (error: any) {
      setPasswordMsg(error.message || 'Error al cambiar la contraseña');
    } finally {
      setChangingPassword(false);
    }
  };

  if (!user) {
    return (
      <Card className="max-w-xl mx-auto mt-10">
        <CardHeader>
          <CardTitle>Acceso restringido</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTitle>Debes iniciar sesión</AlertTitle>
            <AlertDescription>Inicia sesión para ver tu perfil y gestionar tu cuenta.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-4 md:p-8 mt-10">
      <Card className="shadow-xl border">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold">Mi Perfil</CardTitle>
          <div className="flex flex-col items-center gap-4 mt-4">
            <div className="relative group w-fit">
              <UserAvatar
                src={avatar || user.avatar}
                name={`${name || user.name || ''} ${lastname || user.lastname || ''}`.trim() || 'Usuario'}
                size="xl"
                className="border-4 border-blue-200 shadow cursor-pointer hover:border-blue-400 hover:scale-105 transition"
                onClick={() => fileInputRef.current?.click()}
              />
              <button
                type="button"
                className="absolute bottom-2 right-2 bg-blue-500 rounded-full p-2 shadow-lg border-2 border-white opacity-80 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-blue-600"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Cambiar avatar"
              >
                <Pencil size={14} className="text-white" />
              </button>
              {uploading && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                  <div className="text-white text-xs">Subiendo...</div>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
              disabled={uploading}
            />
            <div className="text-center">
              <div className="text-lg font-semibold">
                {`${name || ''} ${lastname || ''}`.trim() || 'Usuario'}
              </div>
              <div className="text-gray-500">{email || user?.email}</div>
              <div className="flex gap-2 mt-2 justify-center">
                <Badge variant="secondary">{role === 'admin' ? 'Administrador' : 'Cliente'}</Badge>
                {emailVerified ? (
                  <Badge variant="default" className="flex items-center gap-1"><MailCheck size={14}/> Verificado</Badge>
                ) : (
                  <Badge variant="destructive">No verificado</Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block mb-2 text-sm font-semibold">Nombre</label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Ingresa tu nombre"
                  required
                />
              </div>
              <div>
                <label htmlFor="lastname" className="block mb-2 text-sm font-semibold">Apellido</label>
                <input
                  id="lastname"
                  type="text"
                  value={lastname}
                  onChange={e => setLastname(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Ingresa tu apellido"
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="phone" className="block mb-2 text-sm font-semibold">Teléfono</label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Ej: +1 234 567 8900"
              />
            </div>
            <div className="pt-4">
              <Button
                type="submit"
                className="w-full"
                disabled={uploading || updating}
              >
                {(uploading || updating) ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </div>
            {/* MENSAJE DE FEEDBACK */}
            {msg && (
              <div className={`relative text-center text-sm mt-3 p-3 rounded-lg font-medium transition-all duration-200 ${
                msg.includes('❌') || msg.includes('Error') || msg.includes('error')
                  ? 'bg-red-100 text-red-800 border border-red-200'
                  : 'bg-green-100 text-green-800 border border-green-200'
              }`}>
                {msg}
                {/* Botón de cerrar solo para errores */}
                {msg.includes('❌') && (
                  <button
                    type="button"
                    className="absolute top-2 right-3 text-red-500 hover:text-red-700"
                    onClick={() => setMsg('')}
                    aria-label="Cerrar"
                  >
                    ×
                  </button>
                )}
              </div>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Card para cambiar contraseña */}
      <Card className="shadow-xl border mt-6">
        <CardHeader>
          <CardTitle className="text-center text-xl font-bold">Cambiar Contraseña</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label htmlFor="newPassword" className="block mb-2 text-sm font-semibold">Nueva Contraseña</label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
              />
              <PasswordStrengthBar password={newPassword} showDetails={true} />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block mb-2 text-sm font-semibold">Confirmar Nueva Contraseña</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Repite la nueva contraseña"
                required
                minLength={6}
              />
            </div>
            <div className="pt-4">
              <Button
                type="submit"
                className="w-full"
                disabled={
                  changingPassword ||
                  !newPassword ||
                  !confirmPassword ||
                  newPassword !== confirmPassword ||
                  calculatePasswordStrength(newPassword).score < 2
                }
              >
                {changingPassword ? 'Cambiando...' : 'Cambiar Contraseña'}
              </Button>
              {newPassword && calculatePasswordStrength(newPassword).score < 2 && (
                <p className="text-xs text-amber-600 mt-2 text-center">
                  * La contraseña debe ser al menos de nivel "Medio" para continuar
                </p>
              )}
            </div>
            {passwordMsg && (
              <div className={`text-center text-sm mt-3 p-2 rounded ${passwordMsg.includes('error') || passwordMsg.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {passwordMsg}
              </div>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
