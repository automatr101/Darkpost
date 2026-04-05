'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import PostCard from '@/components/PostCard';
import PostModal from '@/components/PostModal';
import type { Post, Category } from '@/lib/types';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Search, SlidersHorizontal, Sparkles, TrendingUp, Clock, ChevronRight, ChevronLeft } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

export default function FeedClient({ initialPosts = [] }: { initialPosts?: Post[] }) {
  const [user, setUser] = useState<import('@supabase/supabase-js').User | null>(null);
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<'new' | 'trending'>('new');
  const [postType, setPostType] = useState<'text' | 'voice' | 'all'>('all');
  const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const supabase = createClient();

  const checkScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 10);
    }
  }, []);

  useEffect(() => {
     checkScroll();
     window.addEventListener('resize', checkScroll);
     return () => window.removeEventListener('resize', checkScroll);
  }, [categories, checkScroll]);

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      const amount = dir === 'left' ? -200 : 200;
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Try getting session first as it's faster and less likely to trigger lock errors
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setUser(session.user);
          return;
        }
        
        // Final fallback to getUser with a silent catch for lock theft
        const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
        setUser(user);
      } catch {
        console.warn('Silent auth lock error — continuing as guest');
      }
    };
    fetchUser();
  }, [supabase]);

  const fetchPosts = useCallback(async (reset = false, query = searchQuery) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeCategory) params.set('category_slug', activeCategory);
    params.set('sort', sort);
    params.set('type', postType);
    if (query.trim()) params.set('q', query.trim());
    if (!reset && cursor) params.set('cursor', cursor);

    try {
      const res = await fetch(`/api/feed?${params.toString()}`);
      const json = await res.json();
      const feedData = json.data || [];
      const nextCur = json.next_cursor || null;

      if (reset) {
        setPosts(feedData);
      } else {
        setPosts((prev) => [...prev, ...feedData]);
      }

      setCursor(nextCur);
      setHasMore(!!nextCur);
    } catch {
      // Error handled silently
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, sort, postType, cursor, searchQuery]);

  useEffect(() => {
    fetch('/api/categories')
      .then((res) => res.json())
      .then((json) => setCategories(json.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setCursor(null);
    setHasMore(true);
    fetchPosts(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, sort, postType]);

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      setCursor(null);
      setHasMore(true);
      fetchPosts(true, searchQuery);
    }, 400);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchPosts();
        }
      },
      { threshold: 0.1 }
    );

    if (observerRef.current) observer.observe(observerRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, fetchPosts]);

  return (
    <div className="flex flex-col w-full">
      {/* Premium Sticky Filter Bar */}
      <div className="sticky top-0 z-30 px-4 py-3 bg-[#131313]/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setSort('new')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-syne font-bold uppercase tracking-wider transition-all",
                sort === 'new' ? "bg-white text-black shadow-lg" : "bg-white/5 text-[#6B6B6B] hover:bg-white/10"
              )}
            >
              <Clock size={14} />
              Recent
            </button>
            <button 
              onClick={() => setSort('trending')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-syne font-bold uppercase tracking-wider transition-all",
                sort === 'trending' ? "bg-[#ff535b] text-white shadow-lg shadow-[#ff535b]/20" : "bg-white/5 text-[#6B6B6B] hover:bg-white/10"
              )}
            >
              <TrendingUp size={14} />
              Hot
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setShowSearch(!showSearch);
                setShowFilters(false);
                setTimeout(() => searchRef.current?.focus(), 100);
              }}
              className={cn(
                "p-2 rounded-xl transition-colors",
                showSearch ? "bg-[#ff535b]/20 text-[#ff535b]" : "bg-white/5 text-[#6B6B6B] hover:bg-white/10"
              )}
            >
              <Search size={18} />
            </button>
            <button
              onClick={() => { setShowFilters(!showFilters); setShowSearch(false); }}
              className={cn(
                "p-2 rounded-xl transition-colors",
                showFilters ? "bg-[#ff535b]/20 text-[#ff535b]" : "bg-white/5 text-[#6B6B6B] hover:bg-white/10"
              )}
            >
              <SlidersHorizontal size={18} />
            </button>
          </div>
        </div>

        {/* Categories Scrollable Area */}
        <div className="relative group/nav overflow-hidden">
          {/* Left Arrow & Fade */}
          <AnimatePresence>
            {canScrollLeft && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute left-0 top-0 bottom-1.5 w-12 bg-gradient-to-r from-[#131313] to-transparent z-20 flex items-center pr-4 pointer-events-none"
              >
                <button 
                  onClick={() => scroll('left')}
                  className="w-7 h-7 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-[#6B6B6B] hover:bg-white hover:text-black transition-all pointer-events-auto"
                >
                  <ChevronLeft size={16} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Right Arrow & Fade */}
          <AnimatePresence>
            {canScrollRight && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute right-0 top-0 bottom-1.5 w-12 bg-gradient-to-l from-[#131313] to-transparent z-20 flex items-center justify-end pl-4 pointer-events-none"
              >
                <button 
                  onClick={() => scroll('right')}
                  className="w-7 h-7 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-[#6B6B6B] hover:bg-white hover:text-black transition-all pointer-events-auto shadow-xl"
                >
                  <ChevronRight size={16} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div 
            ref={scrollRef}
            onScroll={checkScroll}
            className="flex items-center gap-1.5 md:gap-2 overflow-x-auto no-scrollbar pb-1.5 -mx-2 px-2 md:-mx-0 md:px-0"
          >
            <button
              onClick={() => setActiveCategory(null)}
              className={cn(
                "px-4 py-1.5 rounded-xl text-[10px] md:text-[11px] font-syne font-extrabold uppercase tracking-widest whitespace-nowrap transition-all border",
                !activeCategory 
                  ? "bg-white/10 border-white/20 text-white" 
                  : "bg-transparent border-transparent text-[#4A4A4A] hover:text-[#6B6B6B]"
              )}
            >
              All Posts
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.slug)}
                className={cn(
                  "px-4 py-1.5 rounded-xl text-[10px] md:text-[11px] font-syne font-extrabold uppercase tracking-widest whitespace-nowrap transition-all border",
                  activeCategory === cat.slug 
                    ? "bg-[#ff535b]/10 border-[#ff535b]/30 text-[#ff535b]" 
                    : "bg-transparent border-transparent text-[#4A4A4A] hover:text-[#6B6B6B]"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
          {/* Search Input */}
          <AnimatePresence>
            {showSearch && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pb-3 flex items-center gap-2 bg-[#1c1b1b] rounded-2xl px-4 py-2 border border-white/5">
                  <Search size={16} className="text-[#4A4A4A]" />
                  <input
                    ref={searchRef}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search posts..."
                    className="flex-1 bg-transparent font-inter text-sm outline-none text-white placeholder:text-[#4A4A4A]"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery('')} className="text-[#4A4A4A] hover:text-white text-xs">✕</button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Filter Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="pb-3 flex items-center gap-2">
                  <span className="font-syne font-bold text-[10px] text-[#4A4A4A] uppercase tracking-widest mr-2">Type:</span>
                  {(['all', 'text', 'voice'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setPostType(type)}
                      className={cn(
                        "px-3 py-1.5 rounded-xl font-syne font-bold text-[10px] uppercase tracking-widest transition-all border",
                        postType === type
                          ? "bg-[#ff535b]/10 border-[#ff535b]/30 text-[#ff535b]"
                          : "bg-white/5 border-transparent text-[#4A4A4A] hover:text-white"
                      )}
                    >
                      {type === 'all' ? 'All' : type === 'text' ? '📝 Text' : '🎙️ Voice'}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Feed Content */}
      <div className="flex flex-col gap-6 p-4 md:p-6 w-full max-w-2xl mx-auto pb-32 md:pb-12">
        <AnimatePresence mode="popLayout" initial={false}>
          {posts.map((post, idx) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx % 5 * 0.1, duration: 0.5, ease: "easeOut" }}
            >
              <PostCard
                post={post}
                currentUser={user}
                onClick={() => setSelectedPost(post)}
                onDelete={(id) => setPosts(prev => prev.filter(p => p.id !== id))}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Empty State */}
        {!loading && posts.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-40 text-center"
          >
            <Sparkles size={64} className="text-[#2a2a2a] mb-6" />
            <h3 className="font-syne font-bold text-2xl mb-2 text-[#F0ECE3]">
              Nothing here yet.
            </h3>
            <p className="font-inter text-[#4A4A4A] max-w-[200px] mx-auto" style={{ fontSize: '13px' }}>
              Nothing posted here yet. Post first.
            </p>
          </motion.div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-full h-48 rounded-[24px] bg-white/[0.02] border border-white/5 animate-pulse"
              />
            ))}
          </div>
        )}

        {/* Pagination Trigger */}
        <div ref={observerRef} className="h-20" />
      </div>

      {/* Post Detail Modal */}
      {selectedPost && (
        <PostModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </div>
  );
}
