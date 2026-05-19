import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { supabaseAdmin } from './lib/supabase';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request });

  // Build a Supabase client that can read/write cookies on this request
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the session so it stays alive
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // ── Protect /api/admin/* routes ────────────────────────────────────────
  if (pathname.startsWith('/api/admin')) {
    if (!user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }

    // Verify admin role in DB
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  // ── Protect /api/orders and /api/payments ─────────────────────────────
  if (
    pathname.startsWith('/api/orders') ||
    pathname.startsWith('/api/payments')
  ) {
    if (!user) {
      return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
    }
  }

  return response;
}

export const config = {
  matcher: ['/api/admin/:path*', '/api/orders/:path*', '/api/payments/:path*'],
};
