"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Compass, Loader2, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { useAuth } from '@/lib/auth/AuthContext';

export default function SignupPage() {
  const router = useRouter();
  const { loginWithDemo, refreshSession } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessNotice(null);
    setLoading(true);

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        if (supabase) {
          const { data, error: signUpErr } = await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: { data: { display_name: displayName.trim() } },
          });

          if (signUpErr) {
            setError(signUpErr.message);
            setLoading(false);
            return;
          }

          if (data.session) {
            await refreshSession();
            router.push('/dashboard');
            return;
          }

          // Case: Account created but email confirmation is pending
          setSuccessNotice(
            `Account created for ${email}. If confirmation is required, check your inbox or continue immediately in Guest/Demo mode.`
          );
          setLoading(false);
          return;
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Network error during signup';
        setError(message);
        setLoading(false);
        return;
      }
    }

    loginWithDemo(email.trim() || 'traveller@tripcraft.com', displayName.trim() || 'Traveller');
    router.push('/dashboard');
  };

  const handleContinueAsGuest = () => {
    loginWithDemo(
      email.trim() || 'guest@tripcraft.com',
      displayName.trim() || 'Explorer'
    );
    router.push('/dashboard');
  };

  return (
    <div className="sm:mx-auto sm:w-full sm:max-w-md">
      <div className="flex justify-center">
        <Link href="/" className="flex items-center gap-2.5 font-black text-2xl text-slate-900 tracking-tight group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition-transform">
            <Compass className="w-5 h-5 stroke-[2.2]" />
          </div>
          <span>Tripcraft</span>
        </Link>
      </div>

      <h2 className="mt-6 text-center text-2xl font-black text-slate-900 tracking-tight">
        Create your account
      </h2>
      <p className="mt-1.5 text-center text-xs text-slate-500">
        Already have an account?{' '}
        <Link href="/login" className="font-bold text-[#1d6b8f] hover:underline">
          Sign in here
        </Link>
      </p>

      <div className="mt-6 bg-white py-7 px-5 shadow-xs border border-slate-200 sm:rounded-3xl sm:px-8">
        {successNotice ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs">
              <div className="flex items-center gap-2 font-bold mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Account Created Successfully</span>
              </div>
              <p className="text-emerald-700/90 leading-relaxed">{successNotice}</p>
            </div>

            <button
              type="button"
              onClick={handleContinueAsGuest}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-[#1d6b8f] hover:bg-[#155370] transition-all shadow-md shadow-[#1d6b8f]/20 cursor-pointer"
            >
              <span>Launch Workspace Immediately</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSignUp}>
            {error && (
              <div className="p-3.5 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Display name
              </label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Alex Hunter"
                className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl shadow-2xs focus:ring-2 focus:ring-[#1d6b8f]/20 focus:border-[#1d6b8f] text-slate-900 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Email address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl shadow-2xs focus:ring-2 focus:ring-[#1d6b8f]/20 focus:border-[#1d6b8f] text-slate-900 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-xl shadow-2xs focus:ring-2 focus:ring-[#1d6b8f]/20 focus:border-[#1d6b8f] text-slate-900 transition-all"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-transparent rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 focus:outline-hidden transition-all shadow-md shadow-slate-900/10 hover:-translate-y-0.5 cursor-pointer"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Create account</span>}
              </button>
            </div>

            <div className="pt-2 text-center border-t border-slate-100">
              <button
                type="button"
                onClick={handleContinueAsGuest}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-800 hover:underline cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Or bypass signup & continue as Guest</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
