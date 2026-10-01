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
  avatarUrl?: string;
}

export interface AuthContextType {
  user: UserProfile | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
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

function buildUserProfile(session: Session | null): UserProfile | null {
  if (!session) return null;
  const user = session.user;
  const name =
    user.user_metadata?.display_name ||
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    'Traveller';
  const email = user.email || '';
  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;

  return {
    id: user.id,
    email,
    name,
    initials: extractInitials(name, email),
    avatarUrl,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setUser(null);
      setSession(null);
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      if (!supabase) {
        setUser(null);
        setSession(null);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        setUser(null);
        setSession(null);
      } else {
        setSession(data.session);
        setUser(buildUserProfile(data.session));
      }
    } catch {
      setUser(null);
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      if (!isSupabaseConfigured()) {
        if (mounted) setLoading(false);
        return;
      }

      try {
        const supabase = createClient();
        if (!supabase) {
          if (mounted) setLoading(false);
          return;
        }

        const { data } = await supabase.auth.getSession();
        if (mounted) {
          if (data.session) {
            setSession(data.session);
            setUser(buildUserProfile(data.session));
          } else {
            setUser(null);
            setSession(null);
          }
          setLoading(false);
        }

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, newSession) => {
          if (!mounted) return;
          setSession(newSession);
          setUser(buildUserProfile(newSession));
          setLoading(false);
        });

        return () => {
          subscription.unsubscribe();
        };
      } catch {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      const supabase = createClient();
      if (!supabase) throw new Error('Supabase is not configured');
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      return { error: error ? new Error(error.message) : null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign-in initiation failed';
      return { error: new Error(msg) };
    }
  }, []);

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

  const contextValue = useMemo(
    () => ({
      user,
      session,
      loading,
      signOut,
      signInWithGoogle,
      refreshSession,
    }),
    [user, session, loading, signOut, signInWithGoogle, refreshSession]
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
