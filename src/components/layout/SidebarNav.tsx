"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Compass, Map as MapIcon, LogOut, LogIn, Plus } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';

export default function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();

  const navItems = [
    { name: 'My Home', href: '/dashboard', icon: Compass },
    { name: 'All Trips', href: '/trips', icon: MapIcon },
  ];

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <nav className="w-64 bg-[var(--color-tc-cream)] h-full hidden md:flex flex-col z-10 shrink-0 border-r border-[var(--color-tc-sage)] shadow-[4px_0px_20px_rgba(23,60,57,0.02)]">
      <div className="px-5 mt-8 mb-6">
        <Link 
          href="/planner" 
          className="flex items-center justify-center gap-2 w-full bg-[var(--color-tc-ink)] hover:bg-[var(--color-tc-teal)] text-[var(--color-tc-cream)] py-3.5 rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-[3px_3px_0px_var(--color-tc-sage)] hover:shadow-[1px_1px_0px_var(--color-tc-sage)] hover:translate-y-[2px] hover:translate-x-[2px] cursor-pointer"
        >
          <span>New Trip</span>
          <Plus className="w-4 h-4" />
        </Link>
      </div>

      <div className="flex-1 px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all font-bold text-xs uppercase tracking-widest ${
                isActive 
                  ? 'bg-[var(--color-tc-parchment)] text-[var(--color-tc-tangerine)] border-2 border-[var(--color-tc-tangerine)] shadow-[2px_2px_0px_var(--color-tc-ink)]' 
                  : 'border-2 border-transparent text-[var(--color-tc-ink)]/60 hover:text-[var(--color-tc-ink)] hover:bg-[var(--color-tc-parchment)]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[var(--color-tc-tangerine)]' : 'text-[var(--color-tc-ink)]/40'}`} />
              {item.name}
            </Link>
          );
        })}
      </div>
      
      {/* User / Auth Footer */}
      <div className="p-4 border-t border-[var(--color-tc-sage)]/50 bg-[var(--color-tc-parchment)]">
        {user ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 px-2 py-1">
              <div className="w-9 h-9 rounded-full bg-[var(--color-tc-ink)] text-[var(--color-tc-cream)] flex items-center justify-center text-xs font-bold shrink-0 border-2 border-[var(--color-tc-sage)] shadow-sm">
                {user.initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-[var(--color-tc-ink)] truncate">{user.name}</p>
                <p className="text-[10px] text-[var(--color-tc-ink)]/60 font-medium truncate">{user.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-[var(--color-tc-ink)]/70 hover:text-[#7F1D1D] hover:bg-[#FEF2F2] rounded-xl transition-colors font-bold text-xs uppercase tracking-wider cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 w-full py-3 px-3 bg-[var(--color-tc-cream)] hover:bg-[var(--color-tc-parchment)] border-2 border-[var(--color-tc-sage)] text-[var(--color-tc-ink)] rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
          >
            <LogIn className="w-4 h-4 text-[var(--color-tc-tangerine)]" />
            <span>Sign In to Atlas</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
