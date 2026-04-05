'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Crown } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UpgradeModalProps {
  feature: string;
  requiredTier: 'pro' | 'black';
  onClose: () => void;
}

const TIER_CONFIG = {
  pro: {
    name: 'Darkpost Pro',
    price: '$3/mo',
    color: '#E63946',
    icon: Zap,
    description: 'Unlock Pro features including custom aliases, extended voice, drafts, post analytics, and more.',
  },
  black: {
    name: 'Darkpost Black',
    price: '$7/mo',
    color: '#F0ECE3',
    textColor: '#0A0A0A',
    icon: Crown,
    description: 'The ultimate tier — AI Therapist, voice effects, custom themes, Black badge, and weekly Explore features.',
  },
};

export default function UpgradeModal({ feature, requiredTier, onClose }: UpgradeModalProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const config = TIER_CONFIG[requiredTier];
  const Icon = config.icon;

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier: requiredTier }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', duration: 0.4 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[#111111] border border-white/10 rounded-3xl p-8 max-w-sm w-full relative overflow-hidden"
        >
          {/* Glow */}
          <div
            className="absolute -top-10 -right-10 w-32 h-32 rounded-full opacity-10 blur-2xl"
            style={{ backgroundColor: config.color }}
          />

          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/5 text-[#4A4A4A] hover:text-white transition-colors"
          >
            <X size={16} />
          </button>

          {/* Icon */}
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
            style={{ backgroundColor: `${config.color}15`, border: `1px solid ${config.color}30` }}
          >
            <Icon size={22} style={{ color: config.color }} />
          </div>

          {/* Content */}
          <p className="font-inter text-xs text-[#4A4A4A] uppercase tracking-widest mb-2">
            {feature} requires
          </p>
          <h2 className="font-syne font-extrabold text-2xl text-[#F0ECE3] mb-1">
            {config.name}
          </h2>
          <p className="font-syne font-bold text-[#E63946] text-lg mb-4">
            {config.price}
          </p>
          <p className="font-inter text-[#6B6B6B] text-sm leading-relaxed mb-8">
            {config.description}
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleUpgrade}
              disabled={loading}
              className="w-full py-3 rounded-xl font-syne font-bold text-sm uppercase tracking-widest transition-all disabled:opacity-50"
              style={{
                backgroundColor: config.color,
                color: requiredTier === 'black' ? '#0A0A0A' : 'white',
              }}
            >
              {loading ? 'Redirecting...' : `Upgrade to ${config.name}`}
            </button>
            <button
              onClick={() => router.push('/pricing')}
              className="w-full py-3 rounded-xl font-syne font-bold text-xs uppercase tracking-widest text-[#4A4A4A] hover:text-white bg-white/5 hover:bg-white/10 transition-all"
            >
              See all plans
            </button>
            <button
              onClick={onClose}
              className="font-inter text-xs text-[#2a2a2a] hover:text-[#4A4A4A] transition-colors text-center"
            >
              Maybe later
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
