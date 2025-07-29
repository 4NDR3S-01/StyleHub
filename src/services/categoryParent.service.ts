import supabase from '@/lib/supabaseClient';

export async function getCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name')
    .is('parent_id', null);
  if (error) throw error;
  return data || [];
}
