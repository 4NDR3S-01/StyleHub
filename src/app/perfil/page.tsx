'use client';


import { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import supabase from '../../lib/supabaseClient';
import UserAvatar from '../../components/ui/UserAvatar';

export default function PerfilPage() {
  const { user, isLoading } = useAuth();

  const [name, setName] = useState(user?.name ?? '');
  const [avatar, setAvatar] = useState(user?.avatar ?? '');
  const [msg, setMsg] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    const { error } = await supabase.auth.updateUser({ data: { name, avatar_url: avatar } });
    if (error) setMsg(error.message);
    else setMsg('Perfil actualizado correctamente');
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setMsg('');
    // Sube la imagen a Supabase Storage (ajusta el bucket si es necesario)
    const fileExt = file.name.split('.').pop();
    if (!user?.id) {
      setMsg('Usuario no válido, no se puede subir el avatar.');
      setUploading(false);
      return;
    }
    const filePath = `avatars/${user.id}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
    if (uploadError) {
      setMsg('Error al subir el avatar');
      setUploading(false);
      return;
    }
    // Obtiene la URL pública
    const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
    setAvatar(data.publicUrl);
    setMsg('Avatar actualizado, recuerda guardar los cambios.');
    setUploading(false);
  };

  if (!user) return <div className="p-8">Debes iniciar sesión para ver tu perfil.</div>;

  return (
    <div className="max-w-xl mx-auto p-8 bg-white rounded-lg shadow-lg mt-10">
      <h1 className="text-3xl font-bold mb-8 text-center">Mi perfil</h1>
      <div className="flex flex-col items-center mb-8">
        <div className="relative mb-4 group">
          <UserAvatar
            src={avatar}
            name={user?.name || 'Usuario'}
            size="xl"
            className="border-4 border-blue-200 shadow cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          />
          <button
            type="button"
            className="absolute bottom-2 right-2 bg-blue-600 text-white rounded-full p-2 shadow hover:bg-blue-700 transition"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            title="Cambiar avatar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6 6M3 21h6l11-11a2.828 2.828 0 00-4-4L5 17v4z" /></svg>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarChange}
            disabled={uploading}
          />
        </div>
        <div className="text-lg font-semibold">{user.name}</div>
        <div className="text-gray-500">{user.email}</div>
      </div>
      <form onSubmit={handleUpdate} className="space-y-6">
        <div>
          <label htmlFor="name" className="block mb-1 font-semibold">Nombre</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 transition text-white py-2 rounded font-semibold shadow"
          disabled={isLoading || uploading}
        >
          {(isLoading || uploading) ? 'Guardando...' : 'Guardar cambios'}
        </button>
        {msg && <div className={`text-center text-sm mt-2 ${msg.includes('error') ? 'text-red-500' : 'text-green-600'}`}>{msg}</div>}
      </form>
    </div>
  );
}
