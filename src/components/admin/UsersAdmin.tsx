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
  name?: string;
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
      const { data, error } = await supabase.from('users').select('id, email, name, avatar_url, created_at, role');
      if (!error && data) setUsers(data);
      setLoading(false);
    };
    fetchUsers();
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Usuarios</h2>
      {loading ? (
        <p>Cargando usuarios...</p>
      ) : (
        <table className="w-full border rounded-xl overflow-hidden shadow-lg">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-3">Avatar</th>
              <th className="p-3">Nombre</th>
              <th className="p-3">Email</th>
              <th className="p-3">Rol</th>
              <th className="p-3">Fecha de registro</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-t hover:bg-blue-50 transition">
                <td className="p-3">
                  {user.avatar_url ? (
                    <img src={user.avatar_url} alt={user.name || user.email} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
                      {user.name ? user.name[0] : user.email[0]}
                    </div>
                  )}
                </td>
                <td className="p-3 font-semibold">{user.name || '-'}</td>
                <td className="p-3">{user.email}</td>
                <td className="p-3 capitalize">{user.role || '-'}</td>
                <td className="p-3 text-sm text-gray-500">{user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
