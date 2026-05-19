export type UserRole = 'customer' | 'admin';

export interface UserProfile {
  id: string;           // matches Supabase auth user id
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: UserRole;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileInput {
  full_name?: string;
  phone?: string;
  avatar_url?: string;
}
