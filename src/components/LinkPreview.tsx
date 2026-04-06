'use client';

import React, { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LinkPreviewData {
  title?: string;
  description?: string;
  image?: string;
  domain?: string;
  url: string;
}

export default function LinkPreview({ url }: { url: string }) {
  const [data, setData] = useState<LinkPreviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchPreview = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
        if (res.ok) {
          const preview = await res.json();
          if (isMounted && preview.title) {
            setData(preview);
          }
        }
      } catch {
        // Silently fail if unable to fetch preview
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPreview();
    return () => { isMounted = false; };
  }, [url]);

  if (loading) {
    return (
      <div className="w-full h-24 rounded-2xl bg-white/5 border border-white/5 animate-pulse mt-4" />
    );
  }

  if (!data) return null;

  return (
    <AnimatePresence>
      <motion.a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={(e) => e.stopPropagation()} // Prevent triggering the parent PostCard's navigation
        className="group mt-4 flex flex-col sm:flex-row overflow-hidden rounded-2xl bg-black/40 border border-white/10 hover:border-[#ff535b]/30 transition-all cursor-pointer backdrop-blur-md"
      >
        {data.image && (
          <div className="w-full sm:w-32 h-32 sm:h-auto overflow-hidden flex-shrink-0 bg-[#0a0a0a]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={data.image} 
              alt={data.title || 'Link Preview'} 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>
        )}
        <div className="p-3 sm:p-4 flex flex-col justify-center flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1.5">
            <ExternalLink size={12} className="text-[#6B6B6B]" />
            <span className="font-syne font-bold text-[10px] uppercase tracking-widest text-[#6B6B6B] truncate">
              {data.domain || new URL(url).hostname}
            </span>
          </div>
          <h4 className="font-syne font-bold text-[13px] text-[#F0ECE3] line-clamp-1 mb-1">
            {data.title}
          </h4>
          {data.description && (
            <p className="font-inter text-[11px] text-[#888] line-clamp-2">
              {data.description}
            </p>
          )}
        </div>
      </motion.a>
    </AnimatePresence>
  );
}
