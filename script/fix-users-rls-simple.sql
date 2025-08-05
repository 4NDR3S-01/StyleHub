-- =====================================================
-- FIX USERS TABLE RLS POLICIES - SIMPLIFIED VERSION
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
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_insert_auth" ON public.users;
DROP POLICY IF EXISTS "users_admin_select" ON public.users;
DROP POLICY IF EXISTS "users_admin_update" ON public.users;

-- Create simple, non-recursive policies for users table
CREATE POLICY "users_select_own" ON public.users 
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users 
FOR UPDATE USING (auth.uid() = id);

-- Allow inserts from authenticated users (for registration)
CREATE POLICY "users_insert_auth" ON public.users 
FOR INSERT WITH CHECK (auth.uid() = id);

-- Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Test the setup by checking policies
SELECT policyname, permissive, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public';
