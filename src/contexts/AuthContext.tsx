import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { UserRole } from '@/data/dummyData';

export interface AuthUser {
  id: string;
  email: string;
  nama: string;
  role: UserRole;
}

interface LoginResult {
  success: boolean;
  message?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean; // true selama sesi tersimpan masih dicek saat halaman dibuka
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mengambil profil (nama, role, status aktif) milik user yang login.
// Akun yang dinonaktifkan tidak bisa membaca profilnya (diblokir RLS),
// jadi hasilnya kosong dan diperlakukan sebagai "tidak aktif".
const loadProfile = async (
  userId: string
): Promise<{ profile: AuthUser | null; failed: boolean }> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nama, email, role, aktif')
    .eq('id', userId)
    .maybeSingle();

  if (error) return { profile: null, failed: true };
  if (!data || !data.aktif) return { profile: null, failed: false };

  return {
    profile: {
      id: data.id,
      email: data.email,
      nama: data.nama,
      role: data.role as UserRole,
    },
    failed: false,
  };
};

// Mengubah error Supabase menjadi pesan yang menunjukkan penyebab sebenarnya,
// supaya salah password tidak tertukar dengan salah konfigurasi.
const describeAuthError = (
  error: { message?: string; code?: string; status?: number } | null
): string => {
  if (!error) return 'Email atau password tidak sesuai.';

  const msg = (error.message || '').toLowerCase();

  if (error.code === 'invalid_credentials' || msg.includes('invalid login credentials')) {
    return 'Email atau password tidak sesuai.';
  }
  if (error.code === 'email_not_confirmed' || msg.includes('email not confirmed')) {
    return 'Email akun ini belum dikonfirmasi. Konfirmasi lewat dashboard Supabase (Authentication > Users).';
  }
  if (msg.includes('api key') || msg.includes('apikey') || error.status === 401) {
    return 'Kunci API Supabase tidak valid. Periksa VITE_SUPABASE_PUBLISHABLE_KEY di file .env, lalu restart npm run dev.';
  }
  if (msg.includes('failed to fetch') || msg.includes('network') || error.status === 0) {
    return 'Tidak bisa terhubung ke Supabase. Periksa VITE_SUPABASE_URL di file .env, lalu restart npm run dev.';
  }
  return `Login gagal: ${error.message || 'kesalahan tidak diketahui'}`;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // Pulihkan sesi yang tersimpan (supaya refresh halaman tidak logout).
    const restoreSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { profile, failed } = await loadProfile(session.user.id);
          if (cancelled) return;
          if (profile) {
            setUser(profile);
          } else if (!failed) {
            // Akun ada tapi tidak aktif / tidak punya profil: akhiri sesinya.
            await supabase.auth.signOut();
          }
        }
      } catch (err) {
        console.error('Gagal memulihkan sesi:', err);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    restoreSession();

    // Jangan memanggil query Supabase di dalam callback ini (bisa menggantung);
    // cukup tangani logout, misalnya dari tab lain.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') setUser(null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error || !data.user) {
        console.error('Supabase login error:', error);
        return { success: false, message: describeAuthError(error) };
      }

      const { profile, failed } = await loadProfile(data.user.id);

      if (!profile) {
        await supabase.auth.signOut();
        return {
          success: false,
          message: failed
            ? 'Gagal memuat data akun. Periksa koneksi lalu coba lagi.'
            : 'Akun tidak aktif atau belum terdaftar di sistem. Hubungi manajer.',
        };
      }

      setUser(profile);
      return { success: true };
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, message: 'Terjadi kesalahan saat login. Coba lagi.' };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, isLoading, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
