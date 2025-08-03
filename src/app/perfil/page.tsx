'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import supabase from '../../lib/supabaseClient';
import UserAvatar from '../../components/ui/UserAvatar';
// import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import { Calendar, ShieldCheck, MailCheck, MapPin, ShoppingBag, Pencil } from 'lucide-react';
import dynamic from 'next/dynamic';

const AddressesPage = dynamic(() => import('./addresses/page'), { ssr: false });
const OrdersPage = dynamic(() => import('./orders/page'), { ssr: false });

export default function PerfilDashboard() {
  const { user, isLoading, refreshUser } = useAuth();
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
  const [accountInfo, setAccountInfo] = useState({
    created_at: '',
    last_login: '',
    login_count: 0,
    account_status: 'active'
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sincronizar datos del usuario cuando cambie el contexto
  useEffect(() => {
    if (user) {
      console.log('[Perfil] Cargando datos del usuario:', user);
      
      setName(user.name || '');
      setLastname(user.lastname || '');
      setPhone(user.phone || '');
      setAvatar(user.avatar || '');
      setEmail(user.email || '');
      setRole(user.role || 'cliente');
      setEmailVerified(user.email_verified || false);
      
      setAccountInfo({
        created_at: user.created_at || '',
        last_login: user.last_login || '',
        login_count: user.login_count || 0,
        account_status: user.account_status || 'active'
      });
      
      setMsg('Datos cargados correctamente desde el contexto');
      
      // Limpiar mensaje después de un tiempo
      setTimeout(() => setMsg(''), 3000);
    }
  }, [user]);

  // Función para refrescar datos manualmente
  const handleRefreshData = async () => {
    try {
      setMsg('Actualizando datos...');
      await refreshUser();
      setMsg('Datos actualizados exitosamente');
      setTimeout(() => setMsg(''), 3000);
    } catch (error) {
      console.error('[Perfil] Error refreshing data:', error);
      setMsg('Error al actualizar los datos');
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMsg('');
    setUpdating(true);
    
    if (!user?.id) {
      setMsg('Usuario no válido');
      setUpdating(false);
      return;
    }
    
    try {
      // Actualizar datos en la tabla users
      const { error: dbError } = await supabase
        .from('users')
        .update({ 
          name: name.trim(), 
          lastname: lastname.trim(), 
          phone: phone.trim(),
          avatar,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (dbError) {
        setMsg(`Error en base de datos: ${dbError.message}`);
        setUpdating(false);
        return;
      }
      
      // Actualizar datos en el perfil de autenticación de Supabase
      const { error: authError } = await supabase.auth.updateUser({ 
        data: { 
          name: name.trim(), 
          lastname: lastname.trim(), 
          avatar_url: avatar 
        } 
      });
      
      if (authError) {
        console.warn('[Perfil] Auth metadata update warning:', authError.message);
        // No fallar por esto, ya que los datos principales están en public.users
      }
      
      setMsg('Perfil actualizado correctamente');
      
      // Refrescar datos del contexto después de actualizar
      setTimeout(async () => {
        await refreshUser();
      }, 500);
      
    } catch (error) {
      console.error('[Perfil] Error updating profile:', error);
      setMsg('Error inesperado al actualizar el perfil');
    } finally {
      setUpdating(false);
    }
  };

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
      const filePath = `avatars/${fileName}`;
      
      // Subir archivo al storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false 
        });
      
      if (uploadError) {
        console.error('Upload error:', uploadError);
        setMsg(`Error al subir el avatar: ${uploadError.message}`);
        setUploading(false);
        return;
      }
      
      // Obtener URL pública
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      if (urlData?.publicUrl) {
        setAvatar(urlData.publicUrl);
        setMsg('Avatar actualizado. Haz clic en "Guardar cambios" para confirmar.');
      } else {
        setMsg('Error al obtener la URL del avatar');
      }
      
    } catch (error) {
      console.error('Avatar upload error:', error);
      setMsg('Error inesperado al subir el avatar');
    } finally {
      setUploading(false);
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
              <div
                className="absolute bottom-2 right-2 bg-blue-500 rounded-full p-2 shadow-lg border-2 border-white opacity-80 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-blue-600"
                onClick={() => fileInputRef.current?.click()}
                role="button"
                aria-label="Cambiar avatar"
              >
                <Pencil size={14} className="text-white" />
              </div>
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
              <Button type="submit" className="w-full" disabled={isLoading || uploading || updating}>
                {(isLoading || uploading || updating) ? 'Guardando...' : 'Guardar cambios'}
              </Button>
            </div>
            {msg && (
              <div className={`text-center text-sm mt-3 p-2 rounded ${msg.includes('error') || msg.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {msg}
              </div>
            )}
          </form>
          
          {/* Información adicional */}
          <div className="mt-6 pt-6 border-t">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold">Información de cuenta</h3>
              <div className="flex gap-2 flex-wrap text-xs">
                <button
                  onClick={handleRefreshData}
                  className="text-blue-600 hover:text-blue-800 underline"
                  type="button"
                  disabled={isLoading}
                >
                  {isLoading ? 'Actualizando...' : 'Refrescar Datos'}
                </button>
              </div>
            </div>
            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Registrado:</span>
                <span>{accountInfo.created_at?.slice(0,10) || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span>Último login:</span>
                <span>
                  {accountInfo.last_login 
                    ? (typeof accountInfo.last_login === 'string' 
                        ? accountInfo.last_login.slice(0,19).replace('T',' ') 
                        : accountInfo.last_login)
                    : 'N/A'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total logins:</span>
                <span>{accountInfo.login_count}</span>
              </div>
              <div className="flex justify-between">
                <span>Estado:</span>
                <span className="capitalize">{accountInfo.account_status}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
