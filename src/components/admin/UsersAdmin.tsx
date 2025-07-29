'use client';

import { useEffect, useState } from 'react';
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

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('users').select('id, email, name, lastname, avatar, created_at, role');
    if (error) {
      toast({ title: 'Error al cargar usuarios', description: error.message, variant: 'destructive' });
    }
    if (data) setUsers(data);
    setLoading(false);
  };

  useEffect(() => {
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
      if (editingUser) {
        result = await supabase.from('users').update(formData).eq('id', editingUser.id).select();
      } else {
        result = await supabase.from('users').insert([{ ...formData }]).select();
      }
      if (result.error) {
        toast({ title: 'Error', description: result.error.message, variant: 'destructive' });
        return;
      }
      toast({ title: editingUser ? 'Usuario actualizado' : 'Usuario creado', variant: 'default' });
      setIsModalOpen(false);
      fetchUsers();
    } catch (error: any) {
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
        <Button onClick={openCreateModal} className="bg-gradient-to-r from-[#ff6f61] via-[#d7263d] to-[#2d2327] hover:from-[#d7263d] hover:to-[#ff6f61] text-white font-semibold px-5 py-2 rounded-lg shadow transition flex items-center gap-2 drop-shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Agregar usuario
        </Button>
      </div>
      <div className="bg-white rounded-2xl shadow-xl p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-red-400 mb-4"></div>
            <span className="text-slate-400">Cargando usuarios...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 text-slate-400">No hay usuarios registrados.</div>
        ) : (
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
                {users.map((user, idx) => (
                  <tr key={user.id} className={`bg-white shadow-sm ${idx % 2 === 0 ? 'bg-slate-50' : ''} hover:bg-red-50 transition rounded-xl`}>
                    <td className="p-3">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name || user.email} className="w-10 h-10 rounded-full object-cover border-2 border-red-200" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold border-2 border-red-100">
                          {user.name ? user.name[0] : user.email[0]}
                        </div>
                      )}
                    </td>
                    <td className="p-3 font-semibold text-slate-700">{user.name}</td>
                    <td className="p-3 font-semibold text-slate-700">{user.lastname}</td>
                    <td className="p-3 text-slate-600">{user.email}</td>
                    <td className="p-3 capitalize text-slate-500">{user.role}</td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEditModal(user)}>
                          Editar
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(user)}>
                          Eliminar
                        </Button>
                      </div>
                    </td>
                    <td className="p-3 text-xs text-slate-400">{user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Editar usuario' : 'Agregar usuario'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
            </div>
            <div>
              <Label htmlFor="lastname">Apellido</Label>
              <Input id="lastname" name="lastname" value={formData.lastname} onChange={handleInputChange} required />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} required disabled={!!editingUser} />
            </div>
            <div>
              <Label htmlFor="role">Rol</Label>
              <Select onValueChange={handleRoleChange} value={formData.role}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cliente">Cliente</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-4">
              <Button type="submit" className="flex-1" disabled={submitting}>
                {submitting ? (editingUser ? 'Actualizando...' : 'Guardando...') : (editingUser ? 'Actualizar usuario' : 'Guardar usuario')}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} className="flex-1" disabled={submitting}>
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
