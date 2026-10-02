import SidebarNav from '@/components/layout/SidebarNav';
import TopNav from '@/components/layout/TopNav';
import MobileNav from '@/components/layout/MobileNav';

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col h-screen w-full bg-[var(--color-tc-parchment)] text-[var(--color-tc-ink)] overflow-hidden selection:bg-[var(--color-tc-tangerine)] selection:text-white">
      <TopNav />
      <div className="flex flex-1 overflow-hidden relative">
        <SidebarNav />
        <main className="flex-1 overflow-auto bg-[var(--color-tc-parchment)] pb-16 md:pb-0 relative z-0">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
