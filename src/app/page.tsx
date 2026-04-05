'use client';

import { useState, useEffect } from 'react';
import FeedClient from '@/components/FeedClient';
import Link from 'next/link';
import { Home as HomeIcon, Plus, User, LogIn, UserPlus, Ghost, Hash, LogOut, Flame, Settings as SettingsIcon } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { useRouter, usePathname } from 'next/navigation';
import { Spinner } from '@/components/Spinner';

export default function Home() {
  const [user, setUser] = useState<import('@supabase/supabase-js').User | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      setUser(authUser);
    };
    fetchUser();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    
    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleLogout = async () => {
    setSigningOut(true);
    await supabase.auth.signOut();
    setUser(null);
    setSigningOut(false);
    router.refresh();
  };

  const desktopNavItems = [
    { label: 'Home', icon: <HomeIcon size={22} />, href: '/', show: true, active: true },
    { label: 'Archive', icon: <Hash size={22} />, href: '/archive', show: true, active: false },
    { label: 'Profile', icon: <User size={22} />, href: '/profile', show: !!user, active: false },
    { label: 'Login', icon: <LogIn size={22} />, href: '/login', show: !user, active: false },
    { label: 'Join', icon: <UserPlus size={22} />, href: '/signup', show: !user, active: false },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row justify-center" style={{ backgroundColor: '#131313' }}>
      {/* Premium Desktop Sidebar (Twitter Style) */}
      <aside
        className="hidden md:flex flex-col w-64 lg:w-72 h-screen sticky top-0 p-6 pr-8 border-r border-white/5"
      >
        <Link href="/" className="mb-10 px-4 group">
          <h1 className="font-syne font-extrabold text-2xl tracking-tighter transition-all group-hover:scale-105" style={{ color: '#F0ECE3' }}>
            DARK<span style={{ color: '#ff535b' }}>.</span>POST
          </h1>
        </Link>
        
        <nav className="flex flex-col gap-1 mb-6">
          {desktopNavItems.filter(item => item.show).map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 font-syne font-bold uppercase tracking-widest text-[13px] ${
                item.active 
                  ? "bg-white/10 text-white border border-white/10" 
                  : "text-[#4A4A4A] hover:bg-white/5 hover:text-[#6B6B6B]"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
          {user && (
            <button
              onClick={handleLogout}
              disabled={signingOut}
              className="flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 font-syne font-bold uppercase tracking-widest text-[13px] text-[#4A4A4A] hover:bg-[#ff535b]/10 hover:text-[#ff535b] disabled:opacity-50"
            >
              {signingOut ? <Spinner size="sm" /> : <LogOut size={22} />}
              {signingOut ? 'Exiting...' : 'Exit'}
            </button>
          )}
        </nav>

        <Link
          href="/compose"
          className="flex items-center justify-center gap-3 w-full font-syne font-extrabold text-center transition-all active:scale-[0.97] hover:shadow-[0_0_30px_rgba(255,83,91,0.3)] shadow-lg group mb-8"
          style={{
            backgroundColor: '#ff535b',
            color: '#F0ECE3',
            padding: '16px',
            borderRadius: '100px',
            fontSize: '14px',
            textTransform: 'uppercase',
          }}
        >
          <Plus size={20} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
          Confess
        </Link>

        {/* User Info Section if Logged In */}
        {user && (
          <div className="px-4 py-3 flex items-center gap-3 border border-white/5 rounded-2xl bg-white/5 mb-6">
             <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#ff535b] to-[#1c1b1b] flex items-center justify-center text-[10px]">
                👻
             </div>
             <div className="flex-1 overflow-hidden">
                <p className="font-inter text-[9px] text-[#6B6B6B] truncate">{user.email}</p>
             </div>
          </div>
        )}

        {/* Footer in Sidebar */}
         <div className="mt-auto px-4 pb-4">
            <div className="p-4 rounded-2xl bg-[#1c1b1b]/50 border border-white/5 backdrop-blur-sm">
              <div className="flex items-center gap-2 mb-2">
                <Ghost size={14} className="text-[#ff535b]" />
              </div>
              <p className="font-inter text-[12px] text-[#353534] leading-relaxed italic">
                &ldquo;Nobody knows it&apos;s you.&rdquo;
              </p>
            </div>
         </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 max-w-2xl flex flex-col min-h-screen md:mx-4">
        <div
          className="w-full max-w-2xl min-h-screen"
          style={{
            borderLeft: '1px solid #1c1b1b',
            borderRight: '1px solid #1c1b1b',
          }}
        >
          {/* Mobile Header */}
          <header
            className="md:hidden sticky top-0 z-30 flex items-center justify-center p-4 border-b border-white/5"
            style={{
              backgroundColor: 'rgba(19,19,19,0.85)',
              backdropFilter: 'blur(20px)',
            }}
          >
            <h1 className="font-syne font-extrabold text-xl tracking-tight" style={{ color: '#F0ECE3' }}>
              DARK<span style={{ color: '#ff535b' }}>.</span>POST
            </h1>
          </header>

          <FeedClient initialPosts={[]} />
        </div>
      </main>

      {/* Desktop Right Sidebar - Hidden on Tablets/Mobile */}
      <aside className="hidden lg:flex flex-col w-[350px] h-screen sticky top-0 p-6 pl-8">
        <div className="bg-[#1c1b1b] border border-white/5 rounded-3xl p-6 mb-8">
          <h2 className="font-syne font-extrabold text-lg uppercase tracking-tight mb-6 flex items-center gap-3">
            <Flame size={20} className="text-[#ff535b]" />
            Trending
          </h2>
          <div className="flex flex-col gap-6">
            {[
              { category: 'LOVE', label: '#HeartbreakHotel', user: '2.4k' },
              { category: 'WORK', label: '#BossFromHell', user: '1.2k' },
              { category: 'SCHOOL', label: '#CheatingArchived', user: '850' },
              { category: 'FAMILY', label: '#InheritanceWar', user: '2.1k' },
            ].map((item) => (
              <div key={item.label} className="group cursor-pointer">
                <p className="font-syne font-bold text-[10px] text-[#4A4A4A] uppercase tracking-widest mb-1 group-hover:text-[#ff535b] transition-colors">
                  {item.category}
                </p>
                <p className="font-syne font-extrabold text-[15px] text-[#F0ECE3] mb-1">
                  {item.label}
                </p>
                <div className="flex items-center gap-1.5">
                  <Ghost size={10} className="text-[#353534]" />
                  <span className="font-inter font-medium" style={{ fontSize: '13px', color: '#e5e2e1' }}>
                    {item.user}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-auto pt-12 pb-8 border-t border-white/5">
          <div className="flex gap-4 flex-wrap mb-4" style={{ fontSize: '11px', color: '#353534' }}>
            <Link href="/about" className="font-inter uppercase font-bold tracking-widest hover:text-[#ff535b] transition-colors">About</Link>
            <Link href="/about" className="font-inter uppercase font-bold tracking-widest hover:text-[#ff535b] transition-colors">Rules</Link>
            <Link href="/" className="font-inter uppercase font-bold tracking-widest hover:text-[#ff535b] transition-colors">Feed</Link>
          </div>
          <p className="font-inter" style={{ fontSize: '10px', color: '#353534', opacity: 0.5 }}>
            © 2026 DARKPOST INC. <br/> Say what you actually think.
          </p>
        </div>
      </aside>

      {/* ─── Premium Mobile Bottom Nav ─── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {/* Glow line at top */}
        <div className="h-px w-full bg-gradient-to-r from-transparent via-[#ff535b]/20 to-transparent" />

        <div
          className="flex items-end justify-around px-1"
          style={{
            backgroundColor: 'rgba(10,10,10,0.97)',
            backdropFilter: 'blur(30px)',
            height: '72px',
          }}
        >
          {/* HOME */}
          <Link href="/" className="flex flex-col items-center justify-end gap-1 pb-3 min-w-[60px] group">
            <HomeIcon
              size={22}
              className={pathname === '/' ? 'text-[#ff535b]' : 'text-[#555] group-active:text-white transition-colors'}
            />
            <span
              className="font-syne font-bold uppercase tracking-widest"
              style={{ fontSize: '8px', color: pathname === '/' ? '#ff535b' : '#444' }}
            >
              Home
            </span>
            {pathname === '/' && (
              <span className="absolute bottom-[10px] w-1 h-1 rounded-full bg-[#ff535b]" />
            )}
          </Link>

          {/* ARCHIVE */}
          <Link href="/archive" className="flex flex-col items-center justify-end gap-1 pb-3 min-w-[60px] group">
            <Hash
              size={22}
              className={pathname === '/archive' ? 'text-[#ff535b]' : 'text-[#555] group-active:text-white transition-colors'}
            />
            <span
              className="font-syne font-bold uppercase tracking-widest"
              style={{ fontSize: '8px', color: pathname === '/archive' ? '#ff535b' : '#444' }}
            >
              Feed
            </span>
          </Link>

          {/* CENTER — CONFESS (elevated) */}
          <div className="relative flex flex-col items-center" style={{ marginTop: '-28px' }}>
            <Link
              href="/compose"
              className="flex items-center justify-center rounded-[20px] shadow-2xl active:scale-95 transition-transform"
              style={{
                width: '58px',
                height: '58px',
                backgroundColor: '#ff535b',
                boxShadow: '0 0 30px rgba(255,83,91,0.5), 0 8px 24px rgba(255,83,91,0.3)',
                border: '3px solid rgba(10,10,10,0.97)',
              }}
            >
              <Plus size={28} strokeWidth={3} className="text-white" />
            </Link>
            <span
              className="font-syne font-bold uppercase tracking-widest mt-1"
              style={{ fontSize: '8px', color: '#444' }}
            >
              Confess
            </span>
          </div>

          {/* SOUL / ENTER */}
          {user ? (
            <Link href="/profile" className="flex flex-col items-center justify-end gap-1 pb-3 min-w-[60px] group">
              <User
                size={22}
                className={pathname === '/profile' ? 'text-[#ff535b]' : 'text-[#555] group-active:text-white transition-colors'}
              />
              <span
                className="font-syne font-bold uppercase tracking-widest"
                style={{ fontSize: '8px', color: pathname === '/profile' ? '#ff535b' : '#444' }}
              >
                Profile
              </span>
            </Link>
          ) : (
            <Link href="/login" className="flex flex-col items-center justify-end gap-1 pb-3 min-w-[60px] group">
              <LogIn size={22} className="text-[#555] group-active:text-white transition-colors" />
              <span className="font-syne font-bold uppercase tracking-widest" style={{ fontSize: '8px', color: '#444' }}>
                Log In
              </span>
            </Link>
          )}

          {/* ENCLAVE (settings) */}
          <Link href="/settings" className="flex flex-col items-center justify-end gap-1 pb-3 min-w-[60px] group">
            <SettingsIcon
              size={22}
              className={pathname === '/settings' ? 'text-[#ff535b]' : 'text-[#555] group-active:text-white transition-colors'}
            />
            <span
              className="font-syne font-bold uppercase tracking-widest"
              style={{ fontSize: '8px', color: pathname === '/settings' ? '#ff535b' : '#444' }}
            >
              Settings
            </span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
