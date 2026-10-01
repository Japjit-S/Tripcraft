"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
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
    <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-6 sm:px-8 shrink-0 w-full z-30">
      <div className="flex items-center gap-6 md:gap-10">
        <Link href="/" className="flex items-center gap-2.5 font-black text-2xl text-slate-900 min-w-[180px] tracking-tight group">
          <div className="w-8 h-8 bg-gradient-to-tr from-orange-600 to-amber-500 rounded-xl flex items-center justify-center text-white shadow-sm shadow-orange-200 group-hover:scale-105 transition-transform">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
          <span>Tripcraft</span>
        </Link>
        
        {isTrip ? (
          <div className="hidden md:flex items-center gap-6">
            <Link href="/trips" className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-[#1d6b8f] transition-colors">
              ← All Travels
            </Link>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-6">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {pathname === '/planner' ? 'Trip Planner' : pathname === '/trips' ? 'Saved Journeys' : 'Travel Dashboard'}
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
            className="relative p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full ring-2 ring-white"></span>
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">System Signals</span>
                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Live
                </span>
              </div>
              <div className="mt-3 space-y-2.5">
                <div className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/70 transition-colors">
                  <p className="text-xs font-bold text-slate-900">Overpass Spatial Engine</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">18 km search radius active with Wikidata sitelink prominence scoring.</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/70 transition-colors">
                  <p className="text-xs font-bold text-slate-900">Open-Meteo Meteorology</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">Hourly forecast & 16-day historical climate interpolation ready.</p>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/70 transition-colors">
                  <p className="text-xs font-bold text-slate-900">Supabase Cloud Sync</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">8 relational tables with RLS and live notes synchronization online.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Auth Section */}
        {loading ? (
          <div className="flex items-center gap-3 animate-pulse">
            <div className="h-4 w-24 bg-slate-200 rounded-md hidden sm:block"></div>
            <div className="w-9 h-9 rounded-full bg-slate-200"></div>
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
              className="flex items-center gap-3 p-1.5 rounded-2xl hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold text-slate-900 leading-none">{user.name}</p>
                <p className="text-[10px] text-slate-400 font-medium leading-none mt-1">
                  Active
                </p>
              </div>
              <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {user.initials}
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${menuOpen ? 'rotate-180' : ''}`} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* User Header */}
                <div className="p-3 border-b border-slate-100">
                  <p className="text-xs font-black text-slate-900">{user.name}</p>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5 font-mono">{user.email}</p>
                  <div className="mt-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <ShieldCheck className="w-3 h-3" /> Authenticated
                    </span>
                  </div>
                </div>

                {/* Nav Links */}
                <div className="py-1">
                  <Link
                    href="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                  >
                    <Compass className="w-4 h-4 text-slate-400" />
                    Dashboard
                  </Link>
                  <Link
                    href="/trips"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                  >
                    <Calendar className="w-4 h-4 text-slate-400" />
                    All Trips
                  </Link>
                  <Link
                    href="/planner"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Plan New Trip
                  </Link>
                </div>

                {/* Sign Out */}
                <div className="pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-left"
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
              className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
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
