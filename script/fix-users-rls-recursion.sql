-- =====================================================
-- FIX USERS TABLE RLS POLICIES - REMOVE INFINITE RECURSION
-- =====================================================

-- Disable RLS temporarily to make changes
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies on users table
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Admins can read all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Allow insert during sign up" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authentication users only" ON public.users;

-- Create non-recursive policies for users table
-- Simple policy: users can read and update their own data
CREATE POLICY "users_select_own" ON public.users 
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users 
FOR UPDATE USING (auth.uid() = id);

-- Allow inserts from authenticated users (for registration)
CREATE POLICY "users_insert_auth" ON public.users 
FOR INSERT WITH CHECK (auth.uid() = id);

-- For admin access, we'll use auth.jwt() to check role from JWT token
-- instead of querying the users table (which causes recursion)
CREATE POLICY "users_admin_select" ON public.users 
FOR SELECT USING (
  auth.jwt() ->> 'role' = 'admin' OR 
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

CREATE POLICY "users_admin_update" ON public.users 
FOR UPDATE USING (
  auth.jwt() ->> 'role' = 'admin' OR 
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
);

-- Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Update the handle_new_user function to ensure it works properly
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, lastname, avatar, role, email_verified, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'name', ''),
    COALESCE(new.raw_user_meta_data->>'lastname', ''),
    COALESCE(new.raw_user_meta_data->>'avatar_url', ''),
    COALESCE(new.raw_user_meta_data->>'role', 'cliente'),
    CASE WHEN new.email_confirmed_at IS NOT NULL THEN true ELSE false END,
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    email_verified = CASE WHEN new.email_confirmed_at IS NOT NULL THEN true ELSE false END,
    updated_at = now();
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Test the setup by checking policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public';
