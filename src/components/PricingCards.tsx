'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import NumberFlow from '@number-flow/react';
import { Check, Zap, Crown, Ghost, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

// Features configuration
const FREE_FEATURES = {
  "Core": [
    'Text confessions',
    'Voice posts up to 30s',
    'Anon toggle per post',
    'Random alias (Shadow #)',
  ],
  "Engagement": [
    'Screenshot to unlock',
    'Burn Score reveal',
    'Reply after screenshot',
    'Fire + Ghost reactions',
  ],
};

const PRO_FEATURES = {
  "Identity": [
    'Custom alias name',
    'Custom font on your posts',
    'Pro badge on Enclave',
    'No watermark on screenshots',
  ],
  "Posting": [
    'Voice up to 5 mins',
    'Schedule confessions',
    'Drafts',
    'Confession expiry',
    'Pin 1 confession',
  ],
  "Insights": [
    'See who screenshotted you',
    'Reply anonymously',
    'Ghost mode (hidden Enclave)',
  ],
};

const BLACK_FEATURES = {
  "AI & Voice": [
    'AI Therapist private reply',
    'Voice effects — Soon',
    'Waveform visualizer — Soon',
  ],
  "Status": [
    'Black badge on Enclave',
    'OG badge (first 1,000)',
    'Boost to Trending/month',
  ],
  "Exclusive": [
    'Custom card color — Soon',
    'Unlock without screenshotting',
    'Featured on Explore weekly',
  ],
};

type Currency = 'USD' | 'GHS';
type Tier = 'pro' | 'black';

interface PriceData {
  USD: number;
  GHS: number;
}

const PRICES: Record<Tier, PriceData> = {
  pro: { USD: 2.99, GHS: 44.99 },
  black: { USD: 6.99, GHS: 104.99 },
};

function FeatureList({ groups }: { groups: Record<string, string[]> }) {
  return (
    <div className="space-y-6">
      {Object.entries(groups).map(([group, items]) => (
        <div key={group}>
          <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/30 mb-3 ml-1">
            {group}
          </h4>
          <ul className="space-y-2.5">
            {items.map((item) => {
               const isSoon = item.includes('— Soon');
               const label = item.replace(' — Soon', '');
               return (
                <li key={item} className="flex items-start gap-2.5 group/item">
                  <div className={cn(
                    "mt-1 flex-shrink-0 w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors px-0.5",
                    isSoon ? "bg-white/5 text-white/20" : "bg-white/10 text-white/80"
                  )}>
                    <Check className="w-2.5 h-2.5" strokeWidth={3} />
                  </div>
                  <span className={cn(
                    "text-[13px] leading-tight transition-colors",
                    isSoon ? "text-white/30" : "text-white/70 group-hover/item:text-white"
                  )}>
                    {label}
                    {isSoon && (
                      <span className="ml-2 text-[8px] font-bold uppercase tracking-wider bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                        Soon
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default function PricingCards() {
  const [currency, setCurrency] = useState<Currency>('USD');
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  const handleCheckout = async (tier: Tier) => {
    // Current currency determines provider
    const provider = currency === 'USD' ? 'stripe' : 'paystack';
    setLoading(`${provider}-${tier}`);

    try {
      const endpoint = provider === 'stripe'
        ? '/api/stripe/create-checkout'
        : '/api/paystack/create-checkout';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });

      if (res.status === 401) {
        router.push(`/login?redirect=/pricing`);
        return;
      }

      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch (err) {
      console.error('Checkout failed:', err);
    }
    setLoading(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4">
      {/* Currency Toggle */}
      <div className="flex justify-center mb-16">
        <div className="bg-[#111] p-1.5 rounded-2xl border border-white/5 flex gap-1 shadow-2xl">
          {(['USD', 'GHS'] as Currency[]).map((cur) => (
            <button
              key={cur}
              onClick={() => setCurrency(cur)}
              className={cn(
                "px-5 py-2.5 rounded-xl text-xs font-bold font-syne uppercase tracking-widest transition-all",
                currency === cur 
                  ? "bg-white text-black shadow-lg" 
                  : "text-white/40 hover:text-white/60"
              )}
            >
              {cur === 'USD' ? "International ($)" : "Local (GHS)"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
        
        {/* FREE PLAN */}
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.1 }}
           className="relative group flex flex-col p-8 rounded-[40px] bg-[#0c0c0c] border border-white/5 hover:border-white/10 transition-all duration-500 overflow-hidden"
        >
          <div className="mb-8">
            <div className="flex items-center gap-2 text-white/40 mb-4 ml-1">
              <Ghost size={14} />
              <span className="font-syne font-bold text-[10px] uppercase tracking-[0.2em]">Free</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-syne font-extrabold text-5xl tracking-tighter text-white/90">
                {currency === 'USD' ? '$' : 'GHS '}0
              </span>
              <span className="text-white/30 text-xs font-medium ml-1">forever</span>
            </div>
          </div>

          <button
            disabled
            className="w-full py-4 rounded-2xl font-syne font-bold text-[11px] uppercase tracking-widest bg-white/5 text-white/20 border border-white/5 mb-10"
          >
            Your current plan
          </button>

          <div className="flex-1">
             <FeatureList groups={FREE_FEATURES} />
          </div>
        </motion.div>

        {/* PRO PLAN */}
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2 }}
           className="relative group flex flex-col p-8 rounded-[40px] bg-[#0c0c0c] border-[1.5px] border-[#E63946] shadow-[0_0_40px_-10px_rgba(230,57,70,0.2)] dark:shadow-[0_0_80px_-20px_rgba(230,57,70,0.15)] transition-all duration-500 overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 pt-6">
            <span className="bg-[#E63946] text-white text-[9px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg shadow-[#E63946]/20">
              Popular
            </span>
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-2 text-[#E63946] mb-4 ml-1">
              <Zap size={14} fill="currentColor" />
              <span className="font-syne font-bold text-[10px] uppercase tracking-[0.2em]">Pro Tier</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-syne font-extrabold text-5xl tracking-tighter text-white">
                {currency === 'USD' ? '$' : ''}
              </span>
              <NumberFlow 
                value={PRICES.pro[currency]} 
                format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}
                className="font-syne font-extrabold text-5xl tracking-tighter text-white"
              />
              <span className="text-white/30 text-xs font-medium ml-1">/mo</span>
            </div>
          </div>

          <button
            onClick={() => handleCheckout('pro')}
            disabled={loading !== null}
            className={cn(
              "w-full py-4 rounded-2xl font-syne font-bold text-[11px] uppercase tracking-[0.2em] transition-all active:scale-[0.98] mb-10 overflow-hidden relative group/btn disabled:opacity-50",
              "bg-[#E63946] text-white hover:bg-[#ff4d5a] shadow-[0_10px_20px_-5px_rgba(230,57,70,0.3)]"
            )}
          >
            <AnimatePresence mode="wait">
               {loading?.includes('pro') ? (
                 <motion.div 
                   key="loading"
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -10 }}
                   className="flex items-center justify-center gap-2"
                 >
                   <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                   Redirecting...
                 </motion.div>
               ) : (
                 <motion.span
                   key="label"
                   className="flex items-center justify-center gap-2"
                 >
                   Get Pro with {currency === 'USD' ? 'Stripe' : 'Paystack'}
                 </motion.span>
               )}
            </AnimatePresence>
          </button>

          <div className="flex-1">
             <FeatureList groups={PRO_FEATURES} />
          </div>
        </motion.div>

        {/* BLACK PLAN */}
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.3 }}
           className="relative group flex flex-col p-8 rounded-[40px] bg-gradient-to-b from-[#111] to-[#080808] border border-white/10 hover:border-white/20 transition-all duration-500 overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 pt-6 opacity-40 group-hover:opacity-100 transition-opacity">
            <Sparkles size={18} className="text-white" />
          </div>

          <div className="mb-8">
            <div className="flex items-center gap-2 text-white/60 mb-4 ml-1">
              <Crown size={14} fill="currentColor" />
              <span className="font-syne font-bold text-[10px] uppercase tracking-[0.2em]">Black Edition</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="font-syne font-extrabold text-5xl tracking-tighter text-white">
                {currency === 'USD' ? '$' : ''}
              </span>
              <NumberFlow 
                value={PRICES.black[currency]} 
                format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}
                className="font-syne font-extrabold text-5xl tracking-tighter text-white"
              />
              <span className="text-white/30 text-xs font-medium ml-1">/mo</span>
            </div>
          </div>

          <button
            onClick={() => handleCheckout('black')}
            disabled={loading !== null}
            className={cn(
              "w-full py-4 rounded-2xl font-syne font-bold text-[11px] uppercase tracking-[0.2em] transition-all active:scale-[0.98] mb-10 overflow-hidden relative disabled:opacity-50",
              "bg-white text-black hover:bg-[#F0ECE3] shadow-[0_10px_25px_-5px_rgba(255,255,255,0.1)]"
            )}
          >
            <AnimatePresence mode="wait">
               {loading?.includes('black') ? (
                 <motion.div 
                   key="loading"
                   className="flex items-center justify-center gap-2"
                 >
                   <div className="w-3 h-3 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                   Processing...
                 </motion.div>
               ) : (
                 <motion.span
                   key="label"
                   className="flex items-center justify-center gap-2"
                 >
                   Unlock {currency === 'USD' ? 'Stripe' : 'Paystack'} Black
                 </motion.span>
               )}
            </AnimatePresence>
          </button>

          <div className="flex-1">
             <FeatureList groups={BLACK_FEATURES} />
          </div>
        </motion.div>

      </div>
    </div>
  );
}
