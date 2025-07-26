import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const accessToken = request.cookies.get('sb-access-token');
    if (!accessToken) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Validar el rol usando la API de Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    // Obtener el usuario actual
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${accessToken.value}`,
        apikey: supabaseKey ?? '',
      },
    });
    if (!userRes.ok) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    const user = await userRes.json();
    // Consultar el rol en la tabla users
    const roleRes = await fetch(`${supabaseUrl}/rest/v1/users?id=eq.${user.id}&select=role`, {
      headers: {
        Authorization: `Bearer ${accessToken.value}`,
        apikey: supabaseKey ?? '',
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
    });
    if (!roleRes.ok) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    const roleData = await roleRes.json();
    if (!roleData[0] || roleData[0].role !== 'admin') {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
