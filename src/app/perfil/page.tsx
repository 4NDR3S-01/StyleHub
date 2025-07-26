'use client';

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import supabase from '../../lib/supabaseClient';

export default function PerfilPage() {
  const { user, isLoading } = useAuth();
  const [name, setName] = useState(user?.name ?? '');
  const [avatar, setAvatar] = useState(user?.avatar ?? '');
  const [msg, setMsg] = useState('');

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');
    const { error } = await supabase.auth.updateUser({ data: { name, avatar_url: avatar } });
    if (error) setMsg(error.message);
    else setMsg('Perfil actualizado correctamente');
  };

  if (!user) return <div className="p-8">Debes iniciar sesión para ver tu perfil.</div>;

  return (
    <div className="max-w-lg mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Mi perfil</h1>
      <form onSubmit={handleUpdate} className="space-y-4">
        <div>
          <label htmlFor="name" className="block mb-1 font-semibold">Nombre</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full px-4 py-2 border rounded"
          />
        </div>
        <div>
          <label htmlFor="avatar" className="block mb-1 font-semibold">Avatar (URL)</label>
          <input
            id="avatar"
            type="text"
            value={avatar}
            onChange={e => setAvatar(e.target.value)}
            className="w-full px-4 py-2 border rounded"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded font-semibold"
          disabled={isLoading}
        >
          Guardar cambios
        </button>
        {msg && <div className="text-center text-sm mt-2">{msg}</div>}
      </form>
    </div>
  );
}
