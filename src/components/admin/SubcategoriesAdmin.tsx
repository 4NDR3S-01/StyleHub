"use client";
import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '../ui/dialog';
import { toast } from '@/hooks/use-toast';
import { TagIcon, EditIcon, Trash2Icon, PlusIcon, SearchIcon } from 'lucide-react';
import { getSubcategories, createSubcategory, updateSubcategory, deleteSubcategory } from '@/services/category.service';
import { getCategories } from '@/services/categoryParent.service';

interface Subcategory {
  id: string;
  name: string;
  parent_id: string;
  parent_name?: string;
}

export default function SubcategoriesAdmin() {
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Subcategory | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', parent_id: '' });
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchSubcategories();
    fetchCategories();
  }, []);

  async function fetchCategories() {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (e) {
      // No toast para evitar ruido visual
      console.error('Error fetching categories:', e);
    }
  }

  async function fetchSubcategories() {
    setLoading(true);
    try {
      const data = await getSubcategories(search);
      setSubcategories(data);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'No se pudieron cargar las subcategorías';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  function handleOpenModal(sub?: Subcategory) {
    setSelected(sub || null);
    setForm(sub ? { name: sub.name, parent_id: sub.parent_id } : { name: '', parent_id: '' });
    setFormError(null);
    setModalOpen(true);
  }

  function slugify(text: string) {
    return text
      .toString()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }

  async function handleSave() {
    setFormError(null);
    if (!form.name.trim() || !form.parent_id) {
      setFormError('Completa el nombre y selecciona la categoría padre.');
      toast({
        title: 'Campos requeridos',
        description: 'Completa el nombre y selecciona la categoría padre.',
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);
    const slug = slugify(form.name);
    try {
      if (selected) {
        await updateSubcategory(selected.id, { ...form, slug });
        toast({ title: 'Subcategoría actualizada' });
      } else {
        await createSubcategory({ ...form, slug });
        toast({ title: 'Subcategoría creada' });
      }
      setModalOpen(false);
      setForm({ name: '', parent_id: '' });
      setSearch(''); // Limpiar búsqueda
      // Esperar a que el estado se actualice antes de recargar
      setTimeout(() => {
        fetchSubcategories();
      }, 0);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'No se pudo guardar';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    setLoading(true);
    try {
      await deleteSubcategory(id);
      toast({ title: 'Subcategoría eliminada' });
      fetchSubcategories();
    } catch (e) {
      const message = e instanceof Error ? e.message : 'No se pudo eliminar';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  // Debug: mostrar subcategorías en consola
  console.log('Subcategorías cargadas:', subcategories);
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <TagIcon size={24} className="text-red-600" /> Gestión de subcategorías
        </h1>
        <Dialog open={modalOpen} onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) {
            setForm({ name: '', parent_id: '' });
            setSelected(null);
            setFormError(null);
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenModal()}>
              <PlusIcon className="mr-2" size={18} /> Nueva subcategoría
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle>{selected ? 'Editar subcategoría' : 'Nueva subcategoría'}</DialogTitle>
            <div className="space-y-4">
              <Input
                placeholder="Nombre de la subcategoría"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
              <select
                className="w-full border rounded px-3 py-2 focus:outline-none focus:ring"
                value={form.parent_id}
                onChange={e => setForm(f => ({ ...f, parent_id: e.target.value }))}
                required
              >
                <option value="">Selecciona la categoría padre</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
              {formError && <div className="text-xs text-red-600">{formError}</div>}
              <Button onClick={handleSave} disabled={loading} className="w-full">
                {selected ? 'Actualizar' : 'Crear'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex items-center mb-4">
        <Input
          placeholder="Buscar subcategoría..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-xs mr-2"
        />
        <Button variant="outline" onClick={fetchSubcategories} disabled={loading}>
          <SearchIcon size={18} />
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border rounded shadow">
          <thead>
            <tr>
              <th className="px-4 py-2 border-b">Nombre</th>
              <th className="px-4 py-2 border-b">Categoría padre</th>
              <th className="px-4 py-2 border-b">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {subcategories.map((sub) => (
              <tr key={sub.id} className="hover:bg-red-50">
                <td className="px-4 py-2 border-b">{sub.name}</td>
                <td className="px-4 py-2 border-b">
                  <Badge>{sub.parent_name || sub.parent_id}</Badge>
                </td>
                <td className="px-4 py-2 border-b flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleOpenModal(sub)}>
                    <EditIcon size={16} />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(sub.id)}>
                    <Trash2Icon size={16} />
                  </Button>
                </td>
              </tr>
            ))}
            {subcategories.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center py-8 text-gray-400">
                  No hay subcategorías
                  <div className="mt-2 text-xs text-red-500">
                    {/* Ayuda visual para depuración */}
                    ¿Seguro que tienes subcategorías en la base de datos? Revisa la consola del navegador para ver los datos cargados.<br />
                    Si ves un array vacío, revisa el servicio <code>getSubcategories</code> y los datos en la tabla <code>categories</code>.
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
