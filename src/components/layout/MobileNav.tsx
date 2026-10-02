"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Map, Sparkles, User } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';

export default function MobileNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const isTrip = pathname.startsWith('/trip/');

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-4 py-2 flex items-center justify-around shadow-lg no-print">
      {/* Dashboard */}
      <Link
        href="/dashboard"
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors ${
          pathname === '/dashboard'
            ? 'text-[var(--color-tc-ink)] font-bold'
            : 'text-slate-500 hover:text-slate-900 font-medium'
        }`}
      >
        <Compass className={`w-5 h-5 ${pathname === '/dashboard' ? 'stroke-[2.5]' : ''}`} />
        <span className="text-[10px] tracking-tight">Home</span>
      </Link>

      {/* Plan New Trip (Prominent Center Button) */}
      <Link
        href="/planner"
        className="flex flex-col items-center -mt-5 group"
      >
        <div className="w-12 h-12 rounded-2xl bg-[var(--color-tc-ink)] hover:bg-[var(--color-tc-teal)] text-white flex items-center justify-center shadow-lg shadow-[var(--color-tc-ink)]/30 group-hover:scale-105 transition-transform">
          <Sparkles className="w-6 h-6 stroke-[2.2]" />
        </div>
        <span className={`text-[10px] font-bold mt-1 ${pathname === '/planner' ? 'text-[var(--color-tc-ink)]' : 'text-slate-600'}`}>
          Plan
        </span>
      </Link>

      {/* All Trips */}
      <Link
        href="/trips"
        className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors ${
          pathname === '/trips' || isTrip
            ? 'text-[var(--color-tc-ink)] font-bold'
            : 'text-slate-500 hover:text-slate-900 font-medium'
        }`}
      >
        <Map className={`w-5 h-5 ${pathname === '/trips' || isTrip ? 'stroke-[2.5]' : ''}`} />
        <span className="text-[10px] tracking-tight">Trips</span>
      </Link>

      {/* Profile / Auth */}
      {user ? (
        <Link
          href="/trips"
          className="flex flex-col items-center gap-1 py-1 px-3 rounded-xl text-slate-500 hover:text-slate-900"
        >
          <div className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[9px] font-bold">
            {user.initials}
          </div>
          <span className="text-[10px] font-medium tracking-tight">Account</span>
        </Link>
      ) : (
        <Link
          href="/login"
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-colors ${
            pathname === '/login'
              ? 'text-[var(--color-tc-ink)] font-bold'
              : 'text-slate-500 hover:text-slate-900 font-medium'
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Sign In</span>
        </Link>
      )}
    </nav>
  );
}
