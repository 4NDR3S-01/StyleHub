import supabase from '@/lib/supabaseClient';

export async function getSubcategories(search = '') {
  // Obtener todas las subcategorías
  let query = supabase
    .from('categories')
    .select('id, name, parent_id')
    .neq('parent_id', null);
  if (search) {
    query = query.ilike('name', `%${search}%`);
  }
  const { data, error } = await query;
  if (error) throw error;
  // Obtener todas las categorías para mapear el nombre del padre
  const { data: allCategories, error: errorCat } = await supabase
    .from('categories')
    .select('id, name');
  if (errorCat) throw errorCat;
  return data.map((sub: any) => {
    const parent = allCategories.find((cat: any) => cat.id === sub.parent_id);
    return {
      id: sub.id,
      name: sub.name,
      parent_id: sub.parent_id,
      parent_name: parent ? parent.name : '',
    };
  });
}

export async function createSubcategory({ name, parent_id, slug }: { name: string; parent_id: string; slug: string }) {
  const { error } = await supabase.from('categories').insert([{ name, parent_id, slug }]);
  if (error) throw error;
}

export async function updateSubcategory(id: string, { name, parent_id, slug }: { name: string; parent_id: string; slug: string }) {
  const { error } = await supabase.from('categories').update({ name, parent_id, slug }).eq('id', id);
  if (error) throw error;
}

export async function deleteSubcategory(id: string) {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}
