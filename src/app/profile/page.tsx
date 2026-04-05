'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  Flame, 
  Camera, 
  Ghost, 
  ArrowLeft, 
  Zap, 
  ShieldAlert 
} from 'lucide-react';
import PostCard from '@/components/PostCard';
import PricingCards from '@/components/PricingCards';
import type { Post, Profile } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const [user, setUser] = useState<import('@supabase/supabase-js').User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'saved'>('posts');
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function getProfile() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        window.location.href = '/login';
        return;
      }
      setUser(authUser);

      // Get profile
      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();
      
      setProfile(profileData);

      // Get user posts
      const { data: postsData } = await supabase
        .from('posts')
        .select('*, category:categories(*), user:users(*)')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false });

      setPosts(postsData || []);
      setLoading(false);
    }
    
    getProfile();
  }, [supabase]);

  const totalSnapshots = posts.reduce((acc, p) => acc + (p.screenshot_count || 0), 0);
  const totalConfessions = posts.length;


  if (loading) {
    return (
      <div className="min-h-screen bg-[#131313] flex items-center justify-center">
        <Ghost size={40} className="text-[#2a2a2a] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#131313] text-[#F0ECE3] pb-24 md:pb-12">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#131313]/80 backdrop-blur-xl border-b border-white/5 px-4 h-16 flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 hover:bg-white/5 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="font-syne font-bold text-lg uppercase tracking-tight">
            {profile?.display_name || profile?.username || 'Anonymous'}
          </h1>
          <p className="font-inter text-[11px] text-[#4A4A4A] uppercase tracking-widest">
            {posts.length} Confessions
          </p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto py-8 px-4">
        {/* Profile Card */}
        <div className="mb-10 md:mb-12 relative group">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 md:gap-6 mb-8 text-center sm:text-left">
            <div className="relative">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-[#1c1b1b] border-2 border-white/5 flex items-center justify-center text-3xl md:text-4xl shadow-2xl md:rotate-3 group-hover:rotate-0 transition-transform">
                👻
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 md:w-6 md:h-6 bg-green-500 border-4 border-[#131313] rounded-full" />
            </div>
            <div className="flex-1 pb-1 w-full">
              <div className="flex items-center justify-center sm:justify-between gap-4">
                <div>
                  <h2 className="font-syne font-extrabold text-2xl md:text-3xl mb-1 tracking-tighter">
                    {profile?.display_name || 'Anonymous Soul'}
                  </h2>
                  <p className="font-mono text-xs md:text-sm text-[#ff535b]">@{profile?.username || 'shadow_drift'}</p>
                </div>
                <Link href="/settings" className="hidden sm:block p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all active:scale-95">
                  <Settings size={20} className="text-[#6B6B6B]" />
                </Link>
              </div>
            </div>
          </div>

          <p className="font-inter text-[#6B6B6B] leading-relaxed mb-8 max-w-lg text-[13px] md:text-[14px]">
             &ldquo;In the end, we are all just archives of the things we didn&apos;t say. 
             Buried deep beneath the digital soil.&rdquo;
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-2 md:gap-3">
             <div className="bg-[#1c1b1b] border border-white/5 p-3 md:p-4 rounded-2xl text-center group/stat hover:border-[#ff535b]/30 transition-colors">
                <Flame className="mx-auto mb-1.5 md:mb-2 text-[#ff535b] w-4 h-4 md:w-5 md:h-5" />
                <p className="font-syne font-extrabold text-lg md:text-xl">{totalConfessions}</p>
                <p className="font-inter text-[8px] md:text-[10px] text-[#4A4A4A] uppercase tracking-widest">Posts</p>
             </div>
             <div className="bg-[#1c1b1b] border border-white/5 p-3 md:p-4 rounded-2xl text-center group/stat hover:border-blue-400/30 transition-colors">
                <Camera className="mx-auto mb-1.5 md:mb-2 text-blue-400 w-4 h-4 md:w-5 md:h-5" />
                <p className="font-syne font-extrabold text-lg md:text-xl">{totalSnapshots >= 1000 ? `${(totalSnapshots/1000).toFixed(1)}k` : totalSnapshots}</p>
                <p className="font-inter text-[8px] md:text-[10px] text-[#4A4A4A] uppercase tracking-widest">Snapshots</p>
             </div>
             <div className="bg-[#1c1b1b] border border-white/5 p-3 md:p-4 rounded-2xl text-center group/stat hover:border-purple-400/30 transition-colors">
                <ShieldAlert className="mx-auto mb-1.5 md:mb-2 text-purple-400 w-4 h-4 md:w-5 md:h-5" />
                <p className="font-syne font-extrabold text-lg md:text-xl">100%</p>
                <p className="font-inter text-[8px] md:text-[10px] text-[#4A4A4A] uppercase tracking-widest">Privacy</p>
             </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/5 mb-8">
           <button 
             onClick={() => setActiveTab('posts')}
             className={cn(
               "px-6 py-4 font-syne font-bold text-sm uppercase tracking-widest relative transition-all",
               activeTab === 'posts' ? "text-white" : "text-[#4A4A4A] hover:text-[#6B6B6B]"
             )}
           >
             Posts
             {activeTab === 'posts' && (
               <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-[#ff535b] rounded-t-full" />
             )}
           </button>
           <button 
             onClick={() => setActiveTab('saved')}
             className={cn(
               "px-6 py-4 font-syne font-bold text-sm uppercase tracking-widest relative transition-all",
               activeTab === 'saved' ? "text-white" : "text-[#4A4A4A] hover:text-[#6B6B6B]"
             )}
           >
             Saved
             {activeTab === 'saved' && (
               <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-[#ff535b] rounded-t-full" />
             )}
           </button>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-6">
          <AnimatePresence mode="popLayout" initial={false}>
            {posts.length > 0 ? (
              posts.map((post, idx) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <PostCard 
                    post={{ ...post, is_mine: post.user_id === user?.id }} 
                    onDelete={(id) => setPosts(posts.filter(p => p.id !== id))}
                  />
                </motion.div>
              ))
            ) : (
              <div className="py-20 text-center">
                 <Zap size={48} className="text-[#1c1b1b] mx-auto mb-4" />
                 <p className="text-[#4A4A4A] font-inter">No confessions recorded in your archive yet.</p>
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Desktop Pricing Section */}
        <div className="hidden md:block mt-24 border-t border-white/5 pt-12">
          <h3 className="font-syne font-extrabold text-2xl text-center mb-8 tracking-tighter">Your Plan & Upgrades</h3>
          <PricingCards />
        </div>
      </main>
    </div>
  );
}
