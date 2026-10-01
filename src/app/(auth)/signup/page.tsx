"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Compass, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export default function SignupPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        if (supabase) {
          const { error: signUpErr } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { display_name: displayName } },
          });

          if (signUpErr) {
            setError(signUpErr.message);
            setLoading(false);
            return;
          }

          router.push('/dashboard');
          return;
        }
      } catch {
        // Fall back
      }
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'tripcraft_demo_user',
        JSON.stringify({ email, name: displayName || 'Traveller' })
      );
    }
    router.push('/dashboard');
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
        Create your account
      </h2>
      <p className="mt-2 text-center text-xs text-slate-500">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-amber-600 hover:text-amber-500">
          Sign in here
        </Link>
      </p>

      <div className="mt-6 bg-white py-7 px-5 shadow-xs border border-slate-200 sm:rounded-2xl sm:px-8">
        <form className="space-y-4" onSubmit={handleSignUp}>
          {error && (
            <div className="p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700">Display name</label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Alex Hunter"
              className="mt-1 w-full px-3 py-2 text-xs border border-slate-300 rounded-lg shadow-2xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700">Email address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1 w-full px-3 py-2 text-xs border border-slate-300 rounded-lg shadow-2xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-slate-900"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
              className="mt-1 w-full px-3 py-2 text-xs border border-slate-300 rounded-lg shadow-2xs focus:ring-1 focus:ring-amber-500 focus:border-amber-500 text-slate-900"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-transparent rounded-lg text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 focus:outline-hidden transition-colors cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Create account</span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
