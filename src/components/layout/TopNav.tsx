"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Bell } from 'lucide-react';

export default function TopNav() {
  const pathname = usePathname();
  const isTrip = pathname.startsWith('/trip/');

  return (
    <header className="h-24 bg-white flex items-center justify-between px-8 shrink-0 w-full z-20">
      <div className="flex items-center gap-6 md:gap-12">
        <Link href="/" className="flex items-center gap-3 font-black text-2xl text-slate-900 min-w-[200px] tracking-tight">
          <div className="w-8 h-8 bg-[#f97316] rounded-xl flex items-center justify-center text-white shadow-sm shadow-orange-200">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
          </div>
          <span>Tripcraft</span>
        </Link>
        
        {isTrip ? (
          <div className="hidden md:flex items-center gap-6">
            <Link href="/trips" className="text-sm font-bold text-slate-800 hover:text-blue-600 transition-colors">Travels</Link>
            <div className="h-4 w-px bg-slate-200"></div>
            <span className="text-sm font-bold text-slate-400">Search</span>
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-6">
            <span className="text-sm font-bold text-slate-800 capitalize">
              {pathname === '/planner' ? 'Planner' : pathname === '/trips' ? 'All trips' : 'Dashboard'}
            </span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-8">
        <div className="relative hidden md:block w-72">
          <Search className="w-4 h-4 absolute left-4 top-3 text-slate-400" />
          <input type="text" placeholder="Search..." className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border-none rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-100 placeholder:text-slate-400" />
        </div>

        <button className="relative text-slate-400 hover:text-slate-600 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        </button>
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-slate-700 hidden sm:block">Japjit Singh</span>
          <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shadow-sm">
             JS
          </div>
        </div>
      </div>
    </header>
  );
}
