import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, supabaseAdmin } from '../../../lib/supabase';
import { requireAuth, AuthError } from '../../../lib/auth';
import { UpdateProfileInput } from '../../../types/user';

// GET /api/auth — get current user profile
export async function GET() {
  try {
    const user = await requireAuth();
    return NextResponse.json(user);
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/auth — update user profile (name, phone, avatar)
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth();
    const body: UpdateProfileInput = await req.json();

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return NextResponse.json(data);
  } catch (err: unknown) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// POST /api/auth/signout — sign the user out
export async function POST() {
  try {
    const supabase = createSupabaseServerClient();
    await supabase.auth.signOut();
    return NextResponse.json({ message: 'Signed out successfully' });
  } catch {
    return NextResponse.json({ error: 'Sign out failed' }, { status: 500 });
  }
}
