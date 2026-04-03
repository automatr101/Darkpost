'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  Search, 
  Flame, 
  Camera, 
  Ghost, 
  MessageCircle, 
  TrendingUp, 
  Clock, 
  Filter,
  Users,
  LucideIcon
} from 'lucide-react';
import PostCard from '@/components/PostCard';
import type { Post, Category } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function ArchiveExplorePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [trendingPosts, setTrendingPosts] = useState<Post[]>([]);
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isSearchingBackend, setIsSearchingBackend] = useState(false);
  
  useEffect(() => {
    async function fetchData() {
      try {
        const catRes = await fetch('/api/categories');
        const catJson = await catRes.json();
        setCategories(catJson.data || []);

        const trendRes = await fetch('/api/feed?sort=trending');
        const trendJson = await trendRes.json();
        setTrendingPosts(trendJson.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }

    const delay = setTimeout(async () => {
      setIsSearching(true);
      setIsSearchingBackend(true);
      try {
        const res = await fetch(`/api/feed?q=${encodeURIComponent(searchQuery)}`);
        const json = await res.json();
        setSearchResults(json.data || []);
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearchingBackend(false);
      }
    }, 400);

    return () => clearTimeout(delay);
  }, [searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#131313] flex items-center justify-center">
        <Ghost size={40} className="text-[#2a2a2a] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#131313] text-[#F0ECE3] pb-24 md:pb-12">
      {/* Search Header */}
      <header className="sticky top-0 z-40 bg-[#131313]/80 backdrop-blur-xl border-b border-white/5 px-4 h-16 flex items-center justify-center">
        <div className="w-full max-w-2xl flex items-center bg-white/5 border border-white/10 rounded-full px-4 py-2 gap-3 transition-all focus-within:border-[#ff535b]/30">
           <Search size={16} className="text-[#4A4A4A]" />
           <input 
             value={searchQuery}
             onChange={(e) => setSearchQuery(e.target.value)}
             placeholder="Search the archive..."
             className="bg-transparent flex-1 font-inter text-sm outline-none placeholder:text-[#4A4A4A] text-white"
           />
           {searchQuery && (
             <button 
               onClick={() => setSearchQuery('')}
               className="text-[10px] font-syne font-bold text-[#6B6B6B] hover:text-[#ff535b] transition-colors"
             >
               CLEAR
             </button>
           )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto py-8 px-4 md:px-0 min-h-[calc(100vh-140px)]">
        <AnimatePresence mode="wait">
          {isSearching ? (
             <motion.section 
               key="search-results"
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               className="flex flex-col gap-6"
             >
                <div className="flex items-center justify-between mb-4 px-2">
                   <h2 className="font-syne font-extrabold text-xl md:text-2xl uppercase tracking-tighter">Searching for &ldquo;{searchQuery}&rdquo;</h2>
                   {isSearchingBackend && <Ghost size={16} className="text-[#ff535b] animate-pulse" />}
                </div>

                {searchResults.length > 0 ? (
                  searchResults.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))
                ) : !isSearchingBackend && (
                   <div className="py-24 text-center border border-dashed border-white/5 rounded-[40px] flex flex-col items-center gap-4">
                      <Ghost size={32} className="text-[#2a2a2a]" />
                      <p className="text-[#4A4A4A] font-inter text-sm italic">Nothing but digital echoes in the void.</p>
                   </div>
                )}
             </motion.section>
          ) : (
            <motion.div
              key="archive-default"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Archive Overview Section */}
              <section className="mb-10 md:mb-12">
                 <div className="flex items-center gap-3 mb-6 px-2 md:px-0">
                    <TrendingUp size={20} className="text-[#ff535b]" />
                    <h2 className="font-syne font-extrabold text-xl md:text-2xl uppercase tracking-tighter">Trending Shadows</h2>
                 </div>
                 <div className="flex flex-col gap-4">
                    {trendingPosts.length > 0 ? trendingPosts.slice(0, 3).map((post) => (
                       <PostCard key={post.id} post={post} />
                    )) : (
                      <div className="py-12 text-center border border-dashed border-white/5 rounded-3xl">
                         <p className="text-[#4A4A4A] font-inter text-sm">No trending shadows at this hour.</p>
                      </div>
                    )}
                 </div>
              </section>

              {/* Categories Grid - Visual Style */}
              <section className="mb-10 md:mb-12">
                 <div className="flex items-center gap-3 mb-6 px-2 md:px-0">
                    <Filter size={20} className="text-[#6B6B6B]" />
                    <h2 className="font-syne font-extrabold text-xl md:text-2xl uppercase tracking-tighter">The Segments</h2>
                 </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    {categories.map((cat) => (
                       <Link 
                         href={`/?category_slug=${cat.slug}`} 
                         key={cat.id}
                         className="relative h-28 md:h-32 rounded-[28px] md:rounded-3xl overflow-hidden group transition-transform active:scale-[0.98]"
                       >
                          <div 
                            className="absolute inset-0 z-0 opacity-20 grayscale-0 hover:grayscale group-hover:opacity-40 transition-all duration-500"
                            style={{ backgroundColor: cat.color_hex }}
                          />
                          <div className="absolute inset-x-0 bottom-0 p-4 z-10 bg-gradient-to-t from-black to-transparent">
                             <h3 className="font-syne font-extrabold text-md md:text-lg uppercase tracking-tight">{cat.label}</h3>
                             <p className="font-inter text-[9px] md:text-[10px] text-[#6B6B6B] uppercase tracking-widest">
                                {Math.floor(Math.random() * 100)} Active Souls
                             </p>
                          </div>
                       </Link>
                    ))}
                 </div>
              </section>

              {/* Community Stats */}
              <section className="mb-12">
                 <div className="p-6 md:p-8 rounded-[32px] md:rounded-[40px] bg-gradient-to-br from-[#1c1b1b] to-black border border-white/10 shadow-2xl relative overflow-hidden">
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#ff535b]/10 blur-[80px]" />
                    <div className="relative z-10">
                       <h2 className="font-syne font-extrabold text-lg md:text-xl mb-6 tracking-tight flex items-center gap-2">
                          <Ghost size={20} className="text-[#ff535b]" />
                          Archive Integrity
                       </h2>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                          <StatItem label="Active Ghosts" value="4.2k" subLabel="+12% today" icon={Users} />
                          <StatItem label="Total Burns" value="156.8k" subLabel="30% success" icon={Flame} />
                          <StatItem label="Snapshots" value="1.2M" subLabel="Deep reveal" icon={Camera} />
                          <StatItem label="Up-Time" value="99.9%" subLabel="Eternal record" icon={Clock} />
                       </div>
                    </div>
                 </div>
              </section>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function StatItem({ label, value, subLabel, icon: Icon }: { label: string, value: string, subLabel: string, icon: LucideIcon }) {
   return (
      <div className="p-4 rounded-3xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
         <div className="flex items-center gap-2 mb-2">
            <Icon size={14} className="text-[#6B6B6B]" />
            <span className="font-syne font-extrabold text-[9px] md:text-[10px] text-[#4A4A4A] uppercase tracking-widest leading-none">{label}</span>
         </div>
         <p className="font-syne font-extrabold text-xl md:text-2xl text-[#F0ECE3]">{value}</p>
         <p className="font-inter text-[9px] md:text-[10px] text-[#4A4A4A] mt-1 uppercase tracking-wider">{subLabel}</p>
      </div>
   );
}
