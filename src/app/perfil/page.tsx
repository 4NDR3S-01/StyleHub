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
    <div className="max-w-xl mx-auto p-8 bg-white rounded-lg shadow-lg mt-10">
      <h1 className="text-3xl font-bold mb-8 text-center">Mi perfil</h1>
      <div className="flex flex-col items-center mb-8">
        <div className="relative w-28 h-28 mb-4">
          <img
            src={avatar || '/default-avatar.png'}
            alt="Avatar"
            className="w-28 h-28 rounded-full object-cover border-4 border-blue-200 shadow"
            onError={e => (e.currentTarget.src = '/default-avatar.png')}
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
        <div>
          <label htmlFor="avatar" className="block mb-1 font-semibold">Avatar (URL)</label>
          <input
            id="avatar"
            type="text"
            value={avatar}
            onChange={e => setAvatar(e.target.value)}
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 transition text-white py-2 rounded font-semibold shadow"
          disabled={isLoading}
        >
          {isLoading ? 'Guardando...' : 'Guardar cambios'}
        </button>
        {msg && <div className={`text-center text-sm mt-2 ${msg.includes('error') ? 'text-red-500' : 'text-green-600'}`}>{msg}</div>}
      </form>
    </div>
  );
}
