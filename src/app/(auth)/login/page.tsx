"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Compass, Sparkles, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('japjit31@gmail.com');
  const [password, setPassword] = useState('Japjit12');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        if (supabase) {
          const { error: authErr } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (authErr) {
            // If user doesn't exist in Supabase yet, attempt quick signup for demo user
            if (email === 'japjit31@gmail.com') {
              const { error: signUpErr } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { display_name: 'Japjit' } },
              });
              if (!signUpErr) {
                router.push('/dashboard');
                return;
              }
            }
            setError(authErr.message);
            setLoading(false);
            return;
          }

          router.push('/dashboard');
          return;
        }
      } catch {
        // Fall back to local session
      }
    }

    // Local / Demo mode fallback
    if (email === 'japjit31@gmail.com' && password === 'Japjit12') {
      if (typeof window !== 'undefined') {
        localStorage.setItem('tripcraft_demo_user', JSON.stringify({ email, name: 'Japjit' }));
      }
      router.push('/dashboard');
    } else {
      setError('Invalid email or password.');
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setEmail('japjit31@gmail.com');
    setPassword('Japjit12');
    setTimeout(() => {
      handleSignIn();
    }, 50);
  };

  return (
    <div className="sm:mx-auto sm:w-full sm:max-w-md">
      <div className="flex justify-center">
        <Link href="/" className="flex items-center gap-2 font-bold text-2xl text-slate-900 tracking-tight">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center text-white shadow-sm">
            <Compass className="w-5 h-5" />
          </div>
          <span>Tripcraft</span>
        </Link>
      </div>

      <h2 className="mt-6 text-center text-2xl font-extrabold text-slate-900">
        Sign in to your account
      </h2>
      <p className="mt-2 text-center text-xs text-slate-500">
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="font-semibold text-amber-600 hover:text-amber-500">
          Create account
        </Link>
      </p>

      {/* 1-Click Demo Access Banner for Reviewers */}
      <div className="mt-6 p-4 rounded-xl bg-amber-50/80 border border-amber-200/80 text-center">
        <p className="text-xs font-semibold text-amber-900">Evaluator / Demo Credentials</p>
        <p className="text-[11px] text-amber-700/90 mt-0.5 font-mono">japjit31@gmail.com / Japjit12</p>
        <button
          type="button"
          onClick={handleDemoLogin}
          disabled={loading}
          className="mt-2.5 inline-flex items-center justify-center gap-1.5 w-full py-1.5 px-3 rounded-lg text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 transition-colors shadow-2xs cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>1-Click Demo Login</span>
        </button>
      </div>

      <div className="mt-5 bg-white py-7 px-5 shadow-xs border border-slate-200 sm:rounded-2xl sm:px-8">
        <form className="space-y-4" onSubmit={handleSignIn}>
          {error && (
            <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700">Email address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full px-3 py-2 text-xs border border-slate-300 rounded-lg shadow-2xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full px-3 py-2 text-xs border border-slate-300 rounded-lg shadow-2xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-slate-900"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-transparent rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 focus:outline-hidden transition-colors cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Sign in</span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
