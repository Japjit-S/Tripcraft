"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { Session } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  initials: string;
  isDemo: boolean;
}

export interface AuthContextType {
  user: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  loginWithDemo: (email?: string, name?: string) => void;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function extractInitials(name?: string, email?: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email && email.trim()) {
    const clean = email.split('@')[0];
    return clean.slice(0, 2).toUpperCase();
  }
  return 'TR';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const syncDemoUser = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      const raw = localStorage.getItem('tripcraft_demo_user');
      if (raw) {
        const parsed = JSON.parse(raw);
        const email = parsed.email || 'japjit31@gmail.com';
        const name = parsed.name || 'Japjit Singh';
        setUser({
          id: 'demo-user',
          email,
          name,
          initials: extractInitials(name, email),
          isDemo: true,
        });
        return true;
      }
    } catch {
      // ignore
    }
    return false;
  }, []);

  const refreshSession = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      syncDemoUser();
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      if (!supabase) {
        syncDemoUser();
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        // Fall back to demo session if active in localStorage
        const hasDemo = syncDemoUser();
        if (!hasDemo) {
          setUser(null);
          setSession(null);
        }
      } else {
        const s = data.session;
        setSession(s);
        const name =
          s.user.user_metadata?.display_name ||
          s.user.user_metadata?.full_name ||
          s.user.email?.split('@')[0] ||
          'Traveller';
        const email = s.user.email || '';
        setUser({
          id: s.user.id,
          email,
          name,
          initials: extractInitials(name, email),
          isDemo: false,
        });
      }
    } catch {
      syncDemoUser();
    } finally {
      setLoading(false);
    }
  }, [syncDemoUser]);

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      if (!isSupabaseConfigured()) {
        if (mounted) {
          syncDemoUser();
          setLoading(false);
        }
        return;
      }

      try {
        const supabase = createClient();
        if (!supabase) {
          if (mounted) {
            syncDemoUser();
            setLoading(false);
          }
          return;
        }

        const { data } = await supabase.auth.getSession();
        if (mounted) {
          if (data.session) {
            const s = data.session;
            setSession(s);
            const name =
              s.user.user_metadata?.display_name ||
              s.user.user_metadata?.full_name ||
              s.user.email?.split('@')[0] ||
              'Traveller';
            const email = s.user.email || '';
            setUser({
              id: s.user.id,
              email,
              name,
              initials: extractInitials(name, email),
              isDemo: false,
            });
            setLoading(false);
          } else {
            const hasDemo = syncDemoUser();
            if (!hasDemo) {
              setUser(null);
              setSession(null);
            }
            setLoading(false);
          }
        }

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, newSession) => {
          if (!mounted) return;
          if (newSession) {
            setSession(newSession);
            const name =
              newSession.user.user_metadata?.display_name ||
              newSession.user.user_metadata?.full_name ||
              newSession.user.email?.split('@')[0] ||
              'Traveller';
            const email = newSession.user.email || '';
            setUser({
              id: newSession.user.id,
              email,
              name,
              initials: extractInitials(name, email),
              isDemo: false,
            });
          } else {
            setSession(null);
            const hasDemo = syncDemoUser();
            if (!hasDemo) {
              setUser(null);
            }
          }
          setLoading(false);
        });

        return () => {
          subscription.unsubscribe();
        };
      } catch {
        if (mounted) {
          syncDemoUser();
          setLoading(false);
        }
      }
    }

    initAuth();

    return () => {
      mounted = false;
    };
  }, [syncDemoUser]);

  const signOut = useCallback(async () => {
    try {
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        if (supabase) {
          await supabase.auth.signOut();
        }
      }
    } catch {
      // ignore
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('tripcraft_demo_user');
      }
      setUser(null);
      setSession(null);
    }
  }, []);

  const loginWithDemo = useCallback((email = 'japjit31@gmail.com', name = 'Japjit Singh') => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('tripcraft_demo_user', JSON.stringify({ email, name }));
    }
    setUser({
      id: 'demo-user',
      email,
      name,
      initials: extractInitials(name, email),
      isDemo: true,
    });
    setSession(null);
  }, []);

  const contextValue = useMemo(
    () => ({
      user,
      session,
      loading,
      signOut,
      loginWithDemo,
      refreshSession,
    }),
    [user, session, loading, signOut, loginWithDemo, refreshSession]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
