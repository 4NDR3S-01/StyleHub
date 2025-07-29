-- Tabla de usuarios
create table public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text not null,
  lastname text not null,
  avatar text,
  role text not null default 'cliente',
  created_at timestamp with time zone default now()
);

-- Tabla de categorías
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  image text, -- URL de imagen en Supabase Storage
  slug text unique not null,
  description text,
  parent_id uuid references public.categories(id)
);

-- Tabla de productos
create table public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  price numeric not null,
  original_price numeric,
  images text[] default '{}', -- Array de URLs de imágenes en Supabase Storage
  category_id uuid references public.categories(id),
  brand text,
  gender text,
  material text,
  season text,
  tags text[],
  featured boolean default false,
  sale boolean default false,
  created_at timestamp with time zone default now()
);

-- Tabla de variantes de producto
create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  color text not null,
  size text not null,
  stock integer not null default 0,
  image text -- URL de imagen en Supabase Storage
);

-- Tabla de órdenes
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id),
  total numeric not null,
  status text not null default 'pending',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone,
  address jsonb not null,
  payment_method text not null,
  tracking_number text
);

-- Tabla de items de carrito/orden
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade,
  product_id uuid references public.products(id),
  variant_id uuid references public.product_variants(id),
  quantity integer not null,
  price numeric not null
);

-- Trigger para actualizar updated_at en orders
create or replace function update_order_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_order_updated_at
before update on public.orders
for each row
execute procedure update_order_updated_at();

-- Habilitar Row Level Security (RLS)
alter table public.users enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.categories enable row level security;

-- Políticas para usuarios
create policy "Usuarios pueden ver su propio perfil"
on public.users
for select using (auth.uid() = id);

create policy "Usuarios pueden editar su propio perfil"
on public.users
for update using (auth.uid() = id);

create policy "Usuarios pueden insertar su propio perfil"
on public.users
for insert with check (auth.uid() = id);

-- Políticas para órdenes
create policy "Solo el dueño puede ver sus órdenes"
on public.orders
for select using (auth.uid() = user_id);

create policy "Solo el dueño puede insertar órdenes"
on public.orders
for insert with check (auth.uid() = user_id);

create policy "Solo el dueño puede actualizar sus órdenes"
on public.orders
for update using (auth.uid() = user_id);

-- Políticas para order_items
create policy "Solo el dueño puede ver sus items"
on public.order_items
for select using (
  exists (
    select 1 from public.orders o
    where o.id = order_id and o.user_id = auth.uid()
  )
);

-- Políticas para productos, variantes y categorías (lectura pública)
create policy "Lectura pública de productos"
on public.products
for select using (true);

create policy "Lectura pública de variantes"
on public.product_variants
for select using (true);

create policy "Lectura pública de categorías"
on public.categories
for select using (true);

-- Políticas para administración (solo admin puede modificar productos/categorías/variantes)
-- Productos
create policy "Solo admin puede insertar productos"
on public.products
for insert
with check (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

create policy "Solo admin puede actualizar productos"
on public.products
for update
using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

create policy "Solo admin puede eliminar productos"
on public.products
for delete
using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

-- Variantes
create policy "Solo admin puede insertar variantes"
on public.product_variants
for insert
with check (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

create policy "Solo admin puede actualizar variantes"
on public.product_variants
for update
using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

create policy "Solo admin puede eliminar variantes"
on public.product_variants
for delete
using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

-- Categorías
create policy "Solo admin puede insertar categorías"
on public.categories
for insert
with check (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

create policy "Solo admin puede actualizar categorías"
on public.categories
for update
using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

create policy "Solo admin puede eliminar categorías"
on public.categories
for delete
using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

-- ¡Listo! Este script es seguro, funcional y compatible con Supabase Storage y tu frontend.

--------------------------------------------------------------------------------------------------
-- Función para insertar usuario en public.users al registrarse
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, lastname, avatar, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'lastname', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', ''),
    coalesce(new.raw_user_meta_data->>'role', 'cliente')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger en auth.users
create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();

----------------------------------------------------------------------------
create policy "users can upload their own avatar"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatar'
  AND (storage.foldername(name))[1] = 'users'
  AND split_part(storage.filename(name), '.', 1) = auth.uid()::text
);

create policy "users can update their own avatar"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatar'
  AND (storage.foldername(name))[1] = 'users'
  AND split_part(storage.filename(name), '.', 1) = auth.uid()::text
);

create policy "users can select their own avatar"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'avatar'
  AND (storage.foldername(name))[1] = 'users'
  AND split_part(storage.filename(name), '.', 1) = auth.uid()::text
);

---------------------------------------------
create policy "Todos pueden ver usuarios temporalmente"
on public.users
for select
using (true);

---------------------------------------------------
-- a) Tabla de reviews (reseñas de productos)
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete cascade,
  user_id uuid references public.users(id),
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamp with time zone default now()
);

-- Políticas de seguridad para reviews
alter table public.reviews enable row level security;

create policy "Solo usuarios autenticados pueden insertar reviews"
  on public.reviews for insert
  with check (auth.uid() = user_id);

create policy "Lectura pública de reviews"
  on public.reviews for select
  using (true);



-- b) Tabla de wishlist (lista de deseos)
create table public.wishlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id),
  product_id uuid references public.products(id),
  created_at timestamp with time zone default now(),
  unique (user_id, product_id)
);

alter table public.wishlist enable row level security;

create policy "Solo el dueño puede ver su wishlist"
  on public.wishlist for select
  using (auth.uid() = user_id);

create policy "Solo el dueño puede insertar en su wishlist"
  on public.wishlist for insert
  with check (auth.uid() = user_id);

create policy "Solo el dueño puede eliminar de su wishlist"
  on public.wishlist for delete
  using (auth.uid() = user_id);



-- c) Tabla de direcciones de usuario (para múltiples direcciones)
create table public.addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id),
  name text not null,
  phone text,
  address text not null,
  city text not null,
  state text,
  zip_code text,
  country text not null default 'Colombia',
  is_default boolean default false,
  created_at timestamp with time zone default now()
);

alter table public.addresses enable row level security;

create policy "Solo el dueño puede ver sus direcciones"
  on public.addresses for select
  using (auth.uid() = user_id);

create policy "Solo el dueño puede insertar direcciones"
  on public.addresses for insert
  with check (auth.uid() = user_id);

create policy "Solo el dueño puede actualizar sus direcciones"
  on public.addresses for update
  using (auth.uid() = user_id);

create policy "Solo el dueño puede eliminar sus direcciones"
  on public.addresses for delete
  using (auth.uid() = user_id);



-- d) Tabla de cupones de descuento
create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  description text,
  discount_percent numeric check (discount_percent > 0 and discount_percent <= 100),
  max_uses integer,
  expires_at timestamp with time zone,
  created_at timestamp with time zone default now()
);

alter table public.coupons enable row level security;

create policy "Lectura pública de cupones"
  on public.coupons for select
  using (true);

create policy "Solo admin puede insertar cupones"
  on public.coupons for insert
  with check (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

create policy "Solo admin puede actualizar cupones"
  on public.coupons for update
  using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));

create policy "Solo admin puede eliminar cupones"
  on public.coupons for delete
  using (exists (select 1 from public.users where id = auth.uid() and role = 'admin'));
