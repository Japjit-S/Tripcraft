"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { useAuth } from '@/lib/auth/AuthContext';

function GoogleIcon() {
  return (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { user, signInWithGoogle, refreshSession } = useAuth();

  React.useEffect(() => {
    if (user) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!isSupabaseConfigured()) {
      setError('Database connection is not configured.');
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      if (!supabase) throw new Error('Supabase client failed to initialize');

      const { data, error: authErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authErr) {
        setError(authErr.message);
        setLoading(false);
        return;
      }

      if (data?.session) {
        await refreshSession();
        router.push('/dashboard');
        return;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error occurred during sign in';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setGoogleLoading(true);
    const { error: gErr } = await signInWithGoogle();
    if (gErr) {
      setError(gErr.message);
      setGoogleLoading(false);
    }
  };

  return (
    <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
      <div className="flex justify-center mb-8">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-11 h-11 shrink-0">
            <Image
              src="/artwork/tripcraft-mark.png"
              alt=""
              width={44}
              height={44}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <span className="font-serif text-2xl font-bold tracking-tight text-[var(--color-tc-ink)]">
            Tripcraft
          </span>
        </Link>
      </div>

      <div className="text-center mb-8">
        <h2 className="text-3xl font-serif font-bold text-[var(--color-tc-ink)] tracking-tight">
          Welcome back
        </h2>
        <p className="mt-3 text-sm text-[var(--color-tc-ink)]/70 font-medium">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-bold text-[var(--color-tc-tangerine)] hover:underline">
            Create account
          </Link>
        </p>
      </div>

      <div className="bg-[var(--color-tc-cream)] py-8 px-6 shadow-[8px_8px_0px_rgba(23,60,57,0.1)] border-2 border-[var(--color-tc-sage)]/50 sm:rounded-2xl sm:px-10 relative overflow-hidden">
        {/* Decorative corner */}
        <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-[var(--color-tc-ink)]/20 -mt-2 -mr-2"></div>
        <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-[var(--color-tc-tangerine)]"></div>

        {/* Google OAuth Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
          className="w-full py-3.5 px-4 rounded-xl border-2 border-[var(--color-tc-sage)] hover:border-[var(--color-tc-ink)] bg-[var(--color-tc-parchment)] text-[var(--color-tc-ink)] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-50"
        >
          {googleLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-[var(--color-tc-ink)]" />
          ) : (
            <GoogleIcon />
          )}
          <span>Continue with Google</span>
        </button>

        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[var(--color-tc-sage)] border-dashed" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-widest font-bold">
            <span className="bg-[var(--color-tc-cream)] px-4 text-[var(--color-tc-ink)]/50">or use email</span>
          </div>
        </div>

        <form className="space-y-5" onSubmit={handleSignIn}>
          {error && (
            <div className="p-4 text-xs text-[#7F1D1D] bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl flex items-start gap-3">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{error}</div>
            </div>
          )}

          <div>
            <label className="block text-[10px] font-bold text-[var(--color-tc-teal)] uppercase tracking-widest mb-1.5 ml-1">
              Email address
            </label>
            <input
              type="email"
              required
              placeholder="explorer@atlas.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-[var(--color-tc-sage)] bg-[var(--color-tc-parchment)] text-sm text-[var(--color-tc-ink)] font-medium focus:outline-none focus:border-[var(--color-tc-teal)] transition-colors placeholder:text-[var(--color-tc-ink)]/30"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-[var(--color-tc-teal)] uppercase tracking-widest mb-1.5 ml-1">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border-2 border-[var(--color-tc-sage)] bg-[var(--color-tc-parchment)] text-sm text-[var(--color-tc-ink)] font-medium focus:outline-none focus:border-[var(--color-tc-teal)] transition-colors placeholder:text-[var(--color-tc-ink)]/30"
            />
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full mt-2 py-4 px-4 bg-[var(--color-tc-ink)] hover:bg-[var(--color-tc-teal)] text-[var(--color-tc-cream)] rounded-xl text-xs font-bold uppercase tracking-widest shadow-[4px_4px_0px_rgba(23,60,57,0.2)] hover:shadow-[2px_2px_0px_rgba(23,60,57,0.2)] hover:translate-y-[2px] hover:translate-x-[2px] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>Unlock Atlas</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
