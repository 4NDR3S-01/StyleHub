'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface User {
  id: string;
  email: string;
  name: string;
  surname: string;
  avatar_url?: string;
  created_at?: string;
  role?: string;
}

export default function UsersAdmin() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('users').select('id, email, name, surname, avatar_url, created_at, role');
      if (!error && data) setUsers(data);
      setLoading(false);
    };
    fetchUsers();
  }, []);

  return (
    <div className="max-w-5xl mx-auto mt-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-500 text-2xl shadow">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 19.5a7.5 7.5 0 1115 0v.75A2.25 2.25 0 0117.25 22.5h-10.5A2.25 2.25 0 014.5 20.25v-.75z" />
            </svg>
          </span>
          <div>
            <h2 className="text-3xl font-bold text-slate-800">Usuarios</h2>
            <p className="text-slate-500 text-sm">Gestión de usuarios registrados en StyleHub</p>
          </div>
        </div>
        <button className="bg-gradient-to-r from-[#ff6f61] via-[#d7263d] to-[#2d2327] hover:from-[#d7263d] hover:to-[#ff6f61] text-white font-semibold px-5 py-2 rounded-lg shadow transition flex items-center gap-2 drop-shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Agregar usuario
        </button>
      </div>
      <div className="bg-white rounded-2xl shadow-xl p-6">
        {(() => {
          if (loading) {
            return (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-red-400 mb-4"></div>
                <span className="text-slate-400">Cargando usuarios...</span>
              </div>
            );
          } else if (users.length === 0) {
            return (
              <div className="text-center py-12 text-slate-400">No hay usuarios registrados.</div>
            );
          } else {
            return (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-separate border-spacing-y-2">
                  <thead>
                    <tr className="bg-slate-100 text-slate-600">
                      <th className="p-3 rounded-l-xl">Avatar</th>
                      <th className="p-3">Nombre</th>
                      <th className="p-3">Apellido</th>
                      <th className="p-3">Email</th>
                      <th className="p-3">Rol</th>
                      <th className="p-3 rounded-r-xl">Fecha de registro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user, idx) => (
                      <tr key={user.id} className={`bg-white shadow-sm ${idx % 2 === 0 ? 'bg-slate-50' : ''} hover:bg-red-50 transition rounded-xl`}>
                        <td className="p-3">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt={user.name || user.email} className="w-10 h-10 rounded-full object-cover border-2 border-red-200" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold border-2 border-red-100">
                              {user.name ? user.name[0] : user.email[0]}
                            </div>
                          )}
                        </td>
                        <td className="p-3 font-semibold text-slate-700">{user.name}</td>
                        <td className="p-3 font-semibold text-slate-700">{user.surname}</td>
                        <td className="p-3 text-slate-600">{user.email}</td>
                        <td className="p-3 capitalize text-slate-500">{user.role || '-'}</td>
                        <td className="p-3 text-xs text-slate-400">{user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }
        })()}
      </div>
    </div>
  );
}
