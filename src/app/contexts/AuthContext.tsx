import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../../lib/supabase';
import type { Session } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'sales_manager' | 'sales_rep';

export interface User {
  id: string;
  name: string;
  email: string;
  availableRoles: UserRole[];
  avatar: string;
  phone: string | null;
  employee_code: string | null;
  status: string;
}

export interface AuthContextType {
  user: User | null;
  activeRole: UserRole;
  loading: boolean;
  setRole: (role: UserRole) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PROFILE_CACHE_KEY = (userId: string) => `profile_cache_${userId}`;

function getCachedProfile(userId: string): User | null {
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY(userId));
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function setCachedProfile(profile: User) {
  try {
    localStorage.setItem(PROFILE_CACHE_KEY(profile.id), JSON.stringify(profile));
  } catch {}
}

function clearCachedProfile(userId: string) {
  localStorage.removeItem(PROFILE_CACHE_KEY(userId));
}

async function fetchProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, available_roles, avatar_initials, phone, employee_code, status')
    .eq('id', userId)
    .single();

  if (error) {
    // Nếu thiếu cột (lỗi 42703) — thử lại với các cột cơ bản
    if (error.code === 'PGRST204' || error.message?.includes('does not exist')) {
      const { data: basic } = await supabase
        .from('profiles')
        .select('id, name, email, available_roles, avatar_initials, active_role')
        .eq('id', userId)
        .single();
      if (!basic) return null;
      return {
        id: basic.id,
        name: basic.name ?? '',
        email: basic.email ?? '',
        availableRoles: (basic.available_roles as UserRole[]) ?? ['sales_rep'],
        avatar: basic.avatar_initials ?? '??',
        phone: null,
        employee_code: null,
        status: 'active',
      };
    }
    return null;
  }
  if (!data) return null;

  return {
    id: data.id,
    name: data.name ?? '',
    email: data.email ?? '',
    availableRoles: (data.available_roles as UserRole[]) ?? ['sales_rep'],
    avatar: data.avatar_initials ?? '??',
    phone: data.phone ?? null,
    employee_code: data.employee_code ?? null,
    status: data.status ?? 'active',
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole>('sales_rep');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        await syncUserFromSession(session);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  function applyRole(profile: User, userId: string) {
    const saved = localStorage.getItem(`activeRole_${userId}`) as UserRole | null;
    const role = saved && profile.availableRoles.includes(saved)
      ? saved
      : profile.availableRoles[0] ?? 'sales_rep';
    setActiveRole(role);
  }

  async function syncUserFromSession(session: Session | null) {
    if (!session) {
      setUser(null);
      setLoading(false);
      return;
    }

    const userId = session.user.id;

    // 1. Hiển thị ngay: cache → session metadata → loading false ngay lập tức
    const cached = getCachedProfile(userId);
    if (cached) {
      setUser(cached);
      applyRole(cached, userId);
    } else {
      // Dùng session metadata làm fallback tức thì (không cần chờ DB)
      const fallback: User = {
        id: userId,
        name: session.user.user_metadata?.name ?? session.user.email?.split('@')[0] ?? '',
        email: session.user.email ?? '',
        availableRoles: ['sales_rep'],
        avatar: (session.user.user_metadata?.name ?? session.user.email ?? '??')
          .slice(0, 2).toUpperCase(),
        phone: null,
        employee_code: null,
        status: 'active',
      };
      setUser(fallback);
      setActiveRole('sales_rep');
    }
    // Tắt loading ngay — không cần chờ network
    setLoading(false);

    // 2. Fetch profile thật từ Supabase trong nền, cập nhật khi xong
    const profile = await fetchProfile(userId);
    if (profile) {
      setCachedProfile(profile);
      setUser(profile);
      applyRole(profile, userId);
    }
  }

  const setRole = (role: UserRole) => {
    setActiveRole(role);
    if (user) localStorage.setItem(`activeRole_${user.id}`, role);
  };

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const register = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) throw error;
  };

  const refreshProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const profile = await fetchProfile(session.user.id);
    if (profile) {
      setCachedProfile(profile);
      setUser(profile);
    }
  };

  const logout = async () => {
    if (user) clearCachedProfile(user.id);
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, activeRole, loading, setRole, login, register, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
