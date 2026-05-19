import { createSupabaseServerClient, supabaseAdmin } from './supabase';
import { UserProfile } from '../types/user';

// ─── Get the currently authenticated user from the request cookies ─────────
export async function getCurrentUser(): Promise<UserProfile | null> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return profile ?? null;
}

// ─── Require an authenticated user — throw if not ─────────────────────────
export async function requireAuth(): Promise<UserProfile> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError('Unauthorised — please sign in.', 401);
  }
  return user;
}

// ─── Require admin role ────────────────────────────────────────────────────
export async function requireAdmin(): Promise<UserProfile> {
  const user = await requireAuth();
  if (user.role !== 'admin') {
    throw new AuthError('Forbidden — admin access required.', 403);
  }
  return user;
}

// ─── Custom error class ────────────────────────────────────────────────────
export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 401
  ) {
    super(message);
    this.name = 'AuthError';
  }
}
