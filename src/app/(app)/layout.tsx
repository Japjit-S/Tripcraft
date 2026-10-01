import SidebarNav from '@/components/layout/SidebarNav';
import TopNav from '@/components/layout/TopNav';
import MobileNav from '@/components/layout/MobileNav';

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col h-screen w-full bg-[#f8f9fc] text-slate-900 overflow-hidden">
      <TopNav />
      <div className="flex flex-1 overflow-hidden relative">
        <SidebarNav />
        <main className="flex-1 overflow-auto bg-gradient-to-b from-[#f8f9fc] to-[#eef2f6] pb-16 md:pb-0">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
