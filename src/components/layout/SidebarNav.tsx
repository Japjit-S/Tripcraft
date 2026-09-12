"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Compass, Map, LogOut, Plus } from 'lucide-react';

export default function SidebarNav() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Home', href: '/planner', icon: Compass },
    { name: 'All trips', href: '/trips', icon: Map },
  ];

  return (
    <nav className="w-64 bg-white h-full flex flex-col z-10 shrink-0 border-r border-slate-50">
      <div className="px-8 mt-8 mb-8">
        <Link href="/planner" className="flex items-center justify-center gap-2 w-full bg-[#1d6b8f] hover:bg-[#155370] text-white py-3.5 rounded-full font-bold text-sm transition-colors shadow-sm">
          New trip <Plus className="w-4 h-4" />
        </Link>
      </div>

      <div className="flex-1 px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3.5 rounded-[1rem] transition-all font-bold text-sm ${
                isActive 
                  ? 'bg-slate-50 text-slate-900' 
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-slate-900' : 'text-slate-400'}`} />
              {item.name}
            </Link>
          );
        })}
      </div>
      
      <div className="p-4 mb-4">
        <Link href="/login" className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-slate-900 transition-colors font-bold text-sm">
          <LogOut className="w-5 h-5 text-slate-400" />
          Sign Out
        </Link>
      </div>
    </nav>
  );
}
