"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Compass, Map, LogOut, LogIn, Plus } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';

export default function SidebarNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();

  const navItems = [
    { name: 'Home', href: '/dashboard', icon: Compass },
    { name: 'All trips', href: '/trips', icon: Map },
  ];

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <nav className="w-64 bg-white h-full flex flex-col z-10 shrink-0 border-r border-slate-100">
      <div className="px-6 mt-8 mb-6">
        <Link 
          href="/planner" 
          className="flex items-center justify-center gap-2 w-full bg-[#1d6b8f] hover:bg-[#155370] text-white py-3.5 rounded-2xl font-bold text-sm transition-all shadow-md shadow-[#1d6b8f]/15 hover:-translate-y-0.5 cursor-pointer"
        >
          <span>New trip</span>
          <Plus className="w-4 h-4" />
        </Link>
      </div>

      <div className="flex-1 px-4 space-y-1.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm ${
                isActive 
                  ? 'bg-slate-100/80 text-slate-900 shadow-2xs' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#1d6b8f]' : 'text-slate-400'}`} />
              {item.name}
            </Link>
          );
        })}
      </div>
      
      {/* User / Auth Footer */}
      <div className="p-4 border-t border-slate-100">
        {user ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 px-2 py-1">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0">
                {user.initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 truncate">{user.name}</p>
                <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center gap-2.5 w-full px-3 py-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors font-bold text-xs cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 w-full py-2.5 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
          >
            <LogIn className="w-4 h-4 text-slate-500" />
            <span>Sign In to Account</span>
          </Link>
        )}
      </div>
    </nav>
  );
}
