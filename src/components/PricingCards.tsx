'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

const FREE_FEATURES = {
  Posting: [
    'Text confessions',
    'Voice posts up to 15s',
    'Anon toggle per post',
    'Random alias (Shadow #)',
  ],
  Engagement: [
    'Screenshot to unlock',
    'Burn Score reveal',
    'Reply after screenshot',
    'Watermarked screenshots',
    'Public Enclave',
    'Fire + Ghost reactions',
  ],
};

const PRO_FEATURES = {
  Identity: [
    'Custom alias name',
    'Custom font on your posts',
    'Pro badge on Enclave',
    'No watermark on screenshots',
  ],
  Posting: [
    'Voice up to 5 mins',
    'Schedule confessions',
    'Drafts',
    'Edit post within 5 mins',
    'Confession expiry (1h / 6h / 24h)',
    'Pin 1 confession to Enclave',
  ],
  Insights: [
    'See who screenshotted you',
    'Post analytics + Burn Score history',
    'Reply anonymously',
    'Ghost mode (hidden Enclave)',
  ],
};

const BLACK_FEATURES = {
  AI: ['AI Therapist (private GPT-4o reply)'],
  Voice: [
    'Voice effects (deeper, distorted, echo) — Coming soon',
    'Background music on voice posts — Coming soon',
    'Animated waveform — Coming soon',
  ],
  Customisation: [
    'Custom post card color/theme — Coming soon',
    'Unlock replies without screenshotting',
  ],
  Status: [
    'Black badge on Enclave',
    'OG badge (first 1,000 only)',
    'Featured on Explore once a week',
    'Boost 1 confession to Trending/month',
  ],
};

function FeatureList({
  groups,
  bullet,
  bulletColor,
}: {
  groups: Record<string, string[]>;
  bullet: '—' | '+';
  bulletColor: string;
}) {
  return (
    <div className="flex flex-col gap-5">
      {Object.entries(groups).map(([section, items]) => (
        <div key={section}>
          <p className="font-syne font-bold text-[10px] uppercase tracking-widest text-[#6B6B6B] mb-2.5">
            {section}
          </p>
          <ul className="flex flex-col gap-1.5">
            {items.map((item) => {
              const isComingSoon = item.includes('— Coming soon');
              const label = item.replace(' — Coming soon', '');
              return (
                <li key={item} className="flex items-start gap-2.5">
                  <span
                    className="font-syne font-bold text-xs mt-0.5 flex-shrink-0"
                    style={{ color: bulletColor }}
                  >
                    {bullet}
                  </span>
                  <span
                    className="font-inter text-[13px] leading-snug"
                    style={{ color: isComingSoon ? '#4A4A4A' : '#F0ECE3' }}
                  >
                    {label}
                    {isComingSoon && (
                      <span className="ml-2 font-syne font-bold text-[9px] uppercase tracking-widest text-[#2a2a2a] bg-white/5 px-1.5 py-0.5 rounded-md">
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
  const [loading, setLoading] = useState<'pro' | 'black' | null>(null);
  const router = useRouter();

  const handleCheckout = async (tier: 'pro' | 'black') => {
    setLoading(tier);
    try {
      const res = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });
      if (res.status === 401) {
        router.push('/login?redirect=/pricing');
        return;
      }
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      setLoading(null);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 items-start">

      {/* FREE */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-3xl bg-[#0e0e0e] border border-[#242424] p-7 flex flex-col gap-6"
      >
        <div>
          <p className="font-syne font-bold text-xs uppercase tracking-widest text-[#6B6B6B] mb-4">Free</p>
          <div className="flex items-end gap-1 mb-1">
            <span className="font-syne font-extrabold text-5xl tracking-tighter text-[#F0ECE3]">$0</span>
          </div>
          <p className="font-inter text-[#6B6B6B] text-sm">forever</p>
        </div>

        <button
          disabled
          className="w-full py-3 rounded-xl font-syne font-bold text-sm uppercase tracking-widest bg-white/5 text-[#4A4A4A] cursor-not-allowed border border-white/5"
        >
          Current plan
        </button>

        <FeatureList groups={FREE_FEATURES} bullet="—" bulletColor="#4A4A4A" />
      </motion.div>

      {/* PRO */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative rounded-3xl bg-[#0e0e0e] p-7 flex flex-col gap-6"
        style={{ border: '2px solid #E63946' }}
      >
        {/* Most popular badge */}
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <div className="px-4 py-1.5 rounded-full bg-[#E63946] font-syne font-bold text-[10px] uppercase tracking-widest text-white whitespace-nowrap">
            Most popular
          </div>
        </div>

        <div className="pt-2">
          <p className="font-syne font-bold text-xs uppercase tracking-widest text-[#E63946] mb-4">Darkpost Pro</p>
          <div className="flex items-end gap-1 mb-1">
            <span className="font-syne font-extrabold text-5xl tracking-tighter text-[#F0ECE3]">$3</span>
            <span className="font-inter text-[#6B6B6B] text-sm mb-2">/mo</span>
          </div>
          <p className="font-inter text-[#6B6B6B] text-sm">GHS 45 / month</p>
        </div>

        <button
          onClick={() => handleCheckout('pro')}
          disabled={loading !== null}
          className="w-full py-3 rounded-xl font-syne font-bold text-sm uppercase tracking-widest text-white transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
          style={{ backgroundColor: '#E63946' }}
        >
          {loading === 'pro' ? 'Redirecting...' : 'Get Pro'}
        </button>

        <div>
          <p className="font-syne font-bold text-[10px] uppercase tracking-widest text-[#6B6B6B] mb-4">
            Everything in Free, plus
          </p>
          <FeatureList groups={PRO_FEATURES} bullet="+" bulletColor="#E63946" />
        </div>
      </motion.div>

      {/* BLACK */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-3xl p-7 flex flex-col gap-6 border border-[#242424]"
        style={{ backgroundColor: '#0A0A0A' }}
      >
        <div>
          <p className="font-syne font-bold text-xs uppercase tracking-widest text-[#6B6B6B] mb-4">Darkpost Black</p>
          <div className="flex items-end gap-1 mb-1">
            <span className="font-syne font-extrabold text-5xl tracking-tighter text-[#F0ECE3]">$7</span>
            <span className="font-inter text-[#6B6B6B] text-sm mb-2">/mo</span>
          </div>
          <p className="font-inter text-[#6B6B6B] text-sm">GHS 105 / month</p>
        </div>

        <button
          onClick={() => handleCheckout('black')}
          disabled={loading !== null}
          className="w-full py-3 rounded-xl font-syne font-bold text-sm uppercase tracking-widest transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
          style={{ backgroundColor: '#F0ECE3', color: '#0A0A0A' }}
        >
          {loading === 'black' ? 'Redirecting...' : 'Get Black'}
        </button>

        <div>
          <p className="font-syne font-bold text-[10px] uppercase tracking-widest text-[#6B6B6B] mb-4">
            Everything in Pro, plus
          </p>
          <FeatureList groups={BLACK_FEATURES} bullet="+" bulletColor="#E63946" />
        </div>
      </motion.div>
    </div>
  );
}
