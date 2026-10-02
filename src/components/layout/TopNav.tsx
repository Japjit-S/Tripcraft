"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  LogOut,
  User,
  ShieldCheck,
  Sparkles,
  ChevronDown,
  Calendar,
  Compass,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';

export default function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const isTrip = pathname.startsWith('/trip/');

  // Handle outside clicks to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    setMenuOpen(false);
    await signOut();
    router.push('/login');
  };

  return (
    <header className="h-16 sm:h-20 bg-[var(--color-tc-parchment)] border-b border-[var(--color-tc-sage)] flex items-center justify-between px-4 sm:px-8 shrink-0 w-full z-30">
      <div className="flex items-center gap-4 sm:gap-6 md:gap-10">
        <Link href="/" className="flex items-center gap-3 group shrink-0">
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
          <span className="font-serif text-xl font-bold tracking-tight text-[var(--color-tc-ink)] hidden sm:inline-block">Tripcraft</span>
        </Link>
        
        {isTrip ? (
          <div className="hidden md:flex items-center gap-6">
            <Link href="/trips" className="text-xs font-bold uppercase tracking-widest text-[var(--color-tc-ink)]/50 hover:text-[var(--color-tc-tangerine)] transition-colors">
              +? Back to Atlas
            </Link>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-6">
            <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-tc-ink)]/60">
              {pathname === '/planner' ? 'Trip Planner' : pathname === '/trips' ? 'Saved Journeys' : 'My Home'}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 sm:gap-6">
        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button 
            type="button"
            onClick={() => {
              setNotificationsOpen((prev) => !prev);
              setMenuOpen(false);
            }}
            className="relative p-2 text-[var(--color-tc-ink)]/60 hover:text-[var(--color-tc-tangerine)] rounded-full transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--color-tc-saffron)] rounded-full ring-2 ring-[var(--color-tc-parchment)] border border-[var(--color-tc-ink)]"></span>
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-3 w-80 bg-[var(--color-tc-cream)] rounded-2xl shadow-[4px_4px_0px_rgba(23,60,57,0.15)] border-2 border-[var(--color-tc-sage)] p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-[var(--color-tc-sage)]">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-tc-ink)]/60">System Signals</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-tc-teal)] bg-[var(--color-tc-teal)]/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Live
                </span>
              </div>
              <div className="mt-3 space-y-2.5">
                <div className="p-3 rounded-xl bg-[var(--color-tc-parchment)] border border-[var(--color-tc-sage)]/50">
                  <p className="text-xs font-bold text-[var(--color-tc-ink)]">OpenStreetMap engine ready</p>
                  <p className="text-[10px] font-medium text-[var(--color-tc-ink)]/70 mt-1">18 km search radius active with prominence scoring.</p>
                </div>
                <div className="p-3 rounded-xl bg-[var(--color-tc-parchment)] border border-[var(--color-tc-sage)]/50">
                  <p className="text-xs font-bold text-[var(--color-tc-ink)]">Open-Meteo online</p>
                  <p className="text-[10px] font-medium text-[var(--color-tc-ink)]/70 mt-1">Hourly forecast & 16-day historical interpolation ready.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Auth Section */}
        {loading ? (
          <div className="flex items-center gap-3 animate-pulse">
            <div className="h-4 w-24 bg-[var(--color-tc-sage)]/30 rounded-md hidden sm:block"></div>
            <div className="w-10 h-10 rounded-full bg-[var(--color-tc-sage)]/30"></div>
          </div>
        ) : user ? (
          /* Authenticated User Menu */
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => {
                setMenuOpen((prev) => !prev);
                setNotificationsOpen(false);
              }}
              className="flex items-center gap-3 p-1.5 rounded-full hover:bg-[var(--color-tc-cream)] transition-colors cursor-pointer border border-transparent hover:border-[var(--color-tc-sage)]"
            >
              <div className="text-right hidden sm:block pr-1">
                <p className="text-xs font-bold text-[var(--color-tc-ink)] leading-none">{user.name}</p>
                <p className="text-[10px] text-[var(--color-tc-teal)] font-bold uppercase tracking-widest leading-none mt-1.5">
                  Explorer
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[var(--color-tc-ink)] text-[var(--color-tc-cream)] flex items-center justify-center font-bold text-xs shadow-sm border-2 border-[var(--color-tc-sage)]">
                {user.initials}
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-[var(--color-tc-ink)]/40 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-3 w-64 bg-[var(--color-tc-cream)] rounded-2xl shadow-[4px_4px_0px_rgba(23,60,57,0.15)] border-2 border-[var(--color-tc-sage)] p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* User Header */}
                <div className="p-4 border-b border-[var(--color-tc-sage)]/50">
                  <p className="text-xs font-bold text-[var(--color-tc-ink)]">{user.name}</p>
                  <p className="text-[10px] text-[var(--color-tc-ink)]/60 font-medium truncate mt-1">{user.email}</p>
                  <div className="mt-3">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest bg-[var(--color-tc-teal)]/10 text-[var(--color-tc-teal)] border border-[var(--color-tc-teal)]/20">
                      <ShieldCheck className="w-3 h-3" /> Authenticated
                    </span>
                  </div>
                </div>

                {/* Nav Links */}
                <div className="py-2 space-y-1">
                  <Link
                    href="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-[var(--color-tc-ink)]/70 hover:text-[var(--color-tc-ink)] hover:bg-[var(--color-tc-parchment)] transition-colors"
                  >
                    <Compass className="w-4 h-4 text-[var(--color-tc-ink)]/40" />
                    My Home
                  </Link>
                  <Link
                    href="/trips"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-[var(--color-tc-ink)]/70 hover:text-[var(--color-tc-ink)] hover:bg-[var(--color-tc-parchment)] transition-colors"
                  >
                    <Calendar className="w-4 h-4 text-[var(--color-tc-ink)]/40" />
                    All Trips
                  </Link>
                  <Link
                    href="/planner"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-[var(--color-tc-tangerine)] hover:bg-[var(--color-tc-parchment)] transition-colors"
                  >
                    <Sparkles className="w-4 h-4" />
                    Plan New Trip
                  </Link>
                </div>

                {/* Sign Out */}
                <div className="pt-2 border-t border-[var(--color-tc-sage)]/50">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest text-[#7F1D1D]/70 hover:text-[#7F1D1D] hover:bg-[#FEF2F2] transition-colors cursor-pointer text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Guest State: Sign In Link */
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="px-5 py-2.5 text-[10px] uppercase tracking-widest font-bold text-[var(--color-tc-cream)] bg-[var(--color-tc-ink)] hover:bg-[var(--color-tc-teal)] rounded-full transition-all shadow-[2px_2px_0px_var(--color-tc-sage)] flex items-center gap-2"
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
