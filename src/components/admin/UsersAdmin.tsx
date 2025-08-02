'use client';

import { useEffect, useState } from 'react';
import { Edit2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface User {
  id: string;
  email: string;
  name: string;
  lastname: string;
  avatar?: string;
  created_at?: string;
  role: string;
}

export default function UsersAdmin() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    lastname: '',
    email: '',
    role: 'cliente',
  });
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();
      setCurrentUser(data);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('users').select('id, email, name, lastname, avatar, created_at, role');
    if (error) {
      console.error('Error al cargar usuarios:', error);
      toast({ title: 'Error al cargar usuarios', description: error.message, variant: 'destructive' });
    }
    if (data) {
      console.log('Usuarios cargados:', data);
      setUsers(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCurrentUser();
    fetchUsers();
  }, []);

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      lastname: user.lastname,
      email: user.email,
      role: user.role,
    });
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({ name: '', lastname: '', email: '', role: 'cliente' });
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (value: string) => {
    console.log('Cambiando rol a:', value); // Debug log
    setFormData((prev) => ({ ...prev, role: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.lastname.trim() || !formData.email.trim()) {
      toast({ title: 'Campos requeridos', description: 'Nombre, apellido y email son obligatorios.', variant: 'destructive' });
      return;
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(formData.email)) {
      toast({ title: 'Email inválido', description: 'Introduce un email válido.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      let result;
      console.log('Datos a actualizar/crear:', formData); // Debug log
      if (editingUser) {
        console.log('Actualizando usuario ID:', editingUser.id); // Debug log
        result = await supabase
          .from('users')
          .update({
            name: formData.name,
            lastname: formData.lastname,
            email: formData.email,
            role: formData.role
          })
          .eq('id', editingUser.id)
          .select();
      } else {
        result = await supabase.from('users').insert([{ ...formData }]).select();
      }
      console.log('Resultado de la operación:', result); // Debug log
      if (result.error) {
        console.error('Error en la base de datos:', result.error); // Debug log
        toast({ title: 'Error', description: result.error.message, variant: 'destructive' });
        return;
      }
      toast({ title: editingUser ? 'Usuario actualizado' : 'Usuario creado', variant: 'default' });
      setIsModalOpen(false);
      fetchUsers();
    } catch (error: any) {
      console.error('Error en catch:', error); // Debug log
      toast({ title: 'Error', description: error?.message || 'Error desconocido', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (user: User) => {
    if (window.confirm('¿Seguro que deseas eliminar este usuario? Esta acción no se puede deshacer.')) {
      try {
        const { error } = await supabase.from('users').delete().eq('id', user.id);
        if (error) {
          toast({ title: 'Error al eliminar', description: error.message, variant: 'destructive' });
          return;
        }
        toast({ title: 'Usuario eliminado', variant: 'default' });
        fetchUsers();
      } catch (error: any) {
        toast({ title: 'Error al eliminar', description: error?.message || 'Error desconocido', variant: 'destructive' });
      }
    }
  };

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  // Filtrado de usuarios por búsqueda y rol
  const filteredUsers = users.filter((user) => {
    const q = search.toLowerCase();
    const matchesSearch =
      user.name?.toLowerCase().includes(q) ||
      user.lastname?.toLowerCase().includes(q) ||
      user.email?.toLowerCase().includes(q);
    const matchesRole = roleFilter === 'all' ? true : user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="max-w-5xl mx-auto mt-8">
      {currentUser && currentUser.role !== 'admin' && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <strong>Advertencia:</strong> No tienes permisos de administrador. Algunas funciones pueden no estar disponibles.
        </div>
      )}
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
        <Button onClick={openCreateModal} className="bg-gradient-to-r from-[#ff6f61] via-[#d7263d] to-[#2d2327] hover:from-[#d7263d] hover:to-[#ff6f61] text-white font-semibold px-5 py-2 rounded-lg shadow transition flex items-center gap-2 drop-shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Agregar usuario
        </Button>
      </div>
      <div className="bg-white rounded-2xl shadow-xl p-6">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
          <Input
            type="text"
            placeholder="Buscar usuario por nombre, apellido o email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-xs border-slate-300 focus:border-pink-400 focus:ring-pink-200"
            autoComplete="off"
          />
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="max-w-xs">
              <SelectValue placeholder="Filtrar por rol" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="admin">Administrador</SelectItem>
              <SelectItem value="cliente">Cliente</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {(() => {
          if (loading) {
            return (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-red-400 mb-4"></div>
                <span className="text-slate-400">Cargando usuarios...</span>
              </div>
            );
          } else if (filteredUsers.length === 0) {
            return (
              <div className="text-center py-12 text-slate-400">No hay usuarios que coincidan con la búsqueda o filtro.</div>
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
                      <th className="p-3">Acciones</th>
                      <th className="p-3 rounded-r-xl">Fecha de registro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user, idx) => (
                      <tr key={user.id} className={`shadow-sm ${idx % 2 === 0 ? 'bg-slate-50' : 'bg-white'} hover:bg-pink-50 transition rounded-xl`}>
                        <td className="p-3">
                          <div
                            className={
                              `w-12 h-12 rounded-full flex items-center justify-center font-extrabold text-lg border-2 shadow-md transition-all duration-200 ` +
                              `bg-gradient-to-br from-pink-200 via-red-200 to-yellow-100 text-red-600 border-red-200`
                            }
                            title={user.name || user.email}
                          >
                            {(user.name ? user.name[0] : user.email[0]).toUpperCase()}
                          </div>
                        </td>
                        <td className="p-3 font-semibold text-slate-800">{user.name}</td>
                        <td className="p-3 font-semibold text-slate-800">{user.lastname}</td>
                        <td className="p-3 text-slate-600 whitespace-nowrap">{user.email}</td>
                        <td className="p-3 capitalize text-white">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.role === 'admin' ? 'bg-gradient-to-r from-red-400 via-red-700 to-[#2d2327]' : 'bg-gradient-to-r from-slate-400 to-slate-600'}`}>{user.role}</span>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <Button size="icon" variant="outline" onClick={() => openEditModal(user)} title="Editar usuario" className="hover:bg-pink-100">
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="destructive" onClick={() => handleDelete(user)} title="Eliminar usuario" className="hover:bg-red-200">
                              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </Button>
                          </div>
                        </td>
                        <td className="p-3 text-xs text-slate-400 whitespace-nowrap">{user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }
        })()}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md mx-auto rounded-2xl bg-white shadow-2xl border border-red-100 p-0">
          <DialogHeader className="px-8 pt-8 pb-2">
            <DialogTitle className="text-2xl font-extrabold text-red-700 mb-1">
              {editingUser ? 'Editar usuario' : 'Agregar usuario'}
            </DialogTitle>
            <p className="text-slate-500 text-sm mb-2">
              {editingUser ? 'Modifica los datos del usuario seleccionado.' : 'Completa los datos para crear un nuevo usuario.'}
            </p>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5 px-8 pb-8 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-slate-700 font-semibold">Nombre</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required className="mt-1 border-slate-300 focus:border-pink-400 focus:ring-pink-200" />
              </div>
              <div>
                <Label htmlFor="lastname" className="text-slate-700 font-semibold">Apellido</Label>
                <Input id="lastname" name="lastname" value={formData.lastname} onChange={handleInputChange} required className="mt-1 border-slate-300 focus:border-pink-400 focus:ring-pink-200" />
              </div>
            </div>
            <div>
              <Label htmlFor="email" className="text-slate-700 font-semibold">Email</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} required disabled={!!editingUser} className="mt-1 border-slate-300 focus:border-pink-400 focus:ring-pink-200 bg-slate-100 disabled:opacity-70" />
            </div>
            <div>
              <Label htmlFor="role" className="text-slate-700 font-semibold">Rol</Label>
              <Select onValueChange={handleRoleChange} value={formData.role}>
                <SelectTrigger className="mt-1 border-slate-300 focus:border-pink-400 focus:ring-pink-200">
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cliente">Cliente</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-6">
              {(() => {
                let buttonText;
                if (submitting) {
                  buttonText = editingUser ? 'Actualizando...' : 'Guardando...';
                } else {
                  buttonText = editingUser ? 'Actualizar usuario' : 'Guardar usuario';
                }
                return (
                  <Button type="submit" className="flex-1 bg-red-600 text-white font-bold shadow hover:bg-red-700 transition-colors text-base disabled:opacity-60" disabled={submitting}>
                    {buttonText}
                  </Button>
                );
              })()}
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1 border-slate-300 hover:bg-slate-100" disabled={submitting}>
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
