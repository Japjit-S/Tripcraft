"use client";

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Compass } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';

export default function LandingHeader() {
  const { user, loading } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-[var(--color-tc-parchment)]/90 backdrop-blur-md border-b border-[var(--color-tc-sage)]/30">
      <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-9 h-9 sm:w-10 sm:h-10 shrink-0">
            <Image
              src="/artwork/tripcraft-mark.png"
              alt=""
              width={40}
              height={40}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <span className="font-serif text-2xl font-bold tracking-tight text-[var(--color-tc-ink)]">
            Tripcraft
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-[var(--color-tc-ink)]/70 uppercase tracking-widest">
          <a href="#personas" className="hover:text-[var(--color-tc-tangerine)] transition-colors">Personas</a>
          <a href="#how-it-works" className="hover:text-[var(--color-tc-tangerine)] transition-colors">Method</a>
          <a href="#destinations" className="hover:text-[var(--color-tc-tangerine)] transition-colors">Atlas</a>
        </nav>

        <div className="flex items-center gap-4">
          {!loading && user ? (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[var(--color-tc-sage)] bg-[var(--color-tc-cream)] text-xs font-bold text-[var(--color-tc-ink)] hover:border-[var(--color-tc-tangerine)] transition-colors shadow-sm"
            >
              <div className="w-7 h-7 rounded-full bg-[var(--color-tc-ink)] text-[var(--color-tc-cream)] flex items-center justify-center font-bold text-[11px]">
                {user.initials}
              </div>
              <span className="hidden sm:inline uppercase tracking-wider text-[11px] font-bold">
                My Atlas
              </span>
              <Compass className="w-3.5 h-3.5 text-[var(--color-tc-teal)] hidden sm:block" />
            </Link>
          ) : !loading && !user ? (
            <Link
              href="/login"
              className="text-sm font-bold uppercase tracking-wider text-[var(--color-tc-ink)] hover:text-[var(--color-tc-tangerine)] px-2 transition-colors"
            >
              Sign In
            </Link>
          ) : null}

          <Link
            href="/planner"
            className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[var(--color-tc-cream)] bg-[var(--color-tc-ink)] hover:bg-[var(--color-tc-teal)] px-6 py-3 rounded-full transition-all shadow-[2px_2px_0px_var(--color-tc-sage)] hover:shadow-[1px_1px_0px_var(--color-tc-sage)] hover:translate-y-[1px] hover:translate-x-[1px]"
          >
            Plan Trip
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </header>
  );
}
