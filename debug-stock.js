// Script para depurar el problema de stock
// Este script ayudará a identificar si el problema es con product_id o variant_id

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'your-supabase-url',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key'
);

async function debugStock() {
  const problematicId = '65949a60-f8b0-4c11-8fed-d15716d3f34d';
  
  console.log('🔍 Investigando ID:', problematicId);
  console.log('');
  
  // 1. Verificar si es un product_id
  console.log('1. Verificando como product_id...');
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, name, active')
    .eq('id', problematicId)
    .single();
  
  if (product) {
    console.log('✅ Encontrado como producto:', product);
    
    // Buscar sus variantes
    const { data: variants, error: variantsError } = await supabase
      .from('product_variants')
      .select('id, color, size, stock')
      .eq('product_id', problematicId);
    
    console.log('📦 Variantes del producto:', variants);
  } else {
    console.log('❌ No encontrado como producto:', productError?.message);
  }
  
  console.log('');
  
  // 2. Verificar si es un variant_id
  console.log('2. Verificando como variant_id...');
  const { data: variant, error: variantError } = await supabase
    .from('product_variants')
    .select('id, product_id, color, size, stock')
    .eq('id', problematicId)
    .single();
  
  if (variant) {
    console.log('✅ Encontrado como variante:', variant);
  } else {
    console.log('❌ No encontrado como variante:', variantError?.message);
  }
  
  console.log('');
  
  // 3. Verificar datos del carrito
  console.log('3. Verificando carrito...');
  const { data: cartItems, error: cartError } = await supabase
    .from('cart')
    .select('id, product_id, variant_id, quantity, color, size')
    .limit(5);
  
  console.log('🛒 Items en carrito:', cartItems);
  
  // 4. Mostrar algunas variantes con stock
  console.log('');
  console.log('4. Mostrando variantes con stock > 0...');
  const { data: stockyVariants, error: stockError } = await supabase
    .from('product_variants')
    .select('id, product_id, color, size, stock')
    .gt('stock', 0)
    .limit(5);
  
  console.log('📈 Variantes con stock:', stockyVariants);
}

debugStock().catch(console.error);
