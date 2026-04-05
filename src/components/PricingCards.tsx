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
                  <span className="font-syne font-bold text-xs mt-0.5 flex-shrink-0" style={{ color: bulletColor }}>
                    {bullet}
                  </span>
                  <span className="font-inter text-[13px] leading-snug" style={{ color: isComingSoon ? '#4A4A4A' : '#F0ECE3' }}>
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

function PaymentButtons({
  tier,
  loading,
  onStripe,
  onPaystack,
  stripeLabel,
  paystackLabel,
  stripeStyle,
  paystackStyle,
}: {
  tier: 'pro' | 'black';
  loading: string | null;
  onStripe: () => void;
  onPaystack: () => void;
  stripeLabel: string;
  paystackLabel: string;
  stripeStyle: React.CSSProperties;
  paystackStyle: React.CSSProperties;
}) {
  return (
    <div className="flex flex-col gap-2">
      {/* Stripe — USD */}
      <button
        onClick={onStripe}
        disabled={loading !== null}
        className="w-full py-3 rounded-xl font-syne font-bold text-sm uppercase tracking-widest transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
        style={stripeStyle}
      >
        {loading === `stripe-${tier}` ? 'Redirecting...' : (
          <>
            <svg viewBox="0 0 60 25" width="36" height="15" fill="currentColor" className="opacity-80">
              <path d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a8.33 8.33 0 0 1-4.56 1.1c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.04 1.26-.06 1.48zm-5.92-5.62c-1.03 0-2.17.73-2.17 2.58h4.25c0-1.85-1.07-2.58-2.08-2.58zM40.95 20.3c-1.44 0-2.32-.6-2.9-1.04l-.02 4.63-4.45.96V5.43h3.94l.17 1.07c.58-.59 1.6-1.3 3.18-1.3 2.9 0 5.62 2.6 5.62 7.6 0 5.37-2.7 7.5-5.54 7.5zM40 8.95c-.55 0-1.3.26-1.64.58l.04 6.84c.32.28 1.04.56 1.6.56 1.6 0 2.7-1.6 2.7-4 0-2.35-1.1-3.98-2.7-3.98zM25.97 7.84l-.17-1.3H21.6v13.47h4.43V11.3c1.05-1.36 2.83-1.12 3.38-.93V6.54c-.58-.2-2.65-.56-3.44 1.3zM17.42 5.43l-4.43.96V20h4.43V5.43zM15.21.84c-1.42 0-2.57 1.15-2.57 2.57 0 1.42 1.15 2.57 2.57 2.57 1.42 0 2.57-1.15 2.57-2.57C17.78 2 16.63.84 15.21.84zM7.03 5.43l-4.2.9-.02 9.38c0 1.73.65 2.9 2.5 2.9 1.2 0 2.02-.2 2.4-.4V14.6c-.45.18-2.66.8-2.66-.83V8.98h2.66V5.43H7.03zM2.45 3.55l4.18-.9V.29L2.45 1.2v2.35z" />
            </svg>
            {stripeLabel}
          </>
        )}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-white/5" />
        <span className="font-inter text-[10px] text-[#2a2a2a] uppercase tracking-widest">or</span>
        <div className="flex-1 h-px bg-white/5" />
      </div>

      {/* Paystack — GHS */}
      <button
        onClick={onPaystack}
        disabled={loading !== null}
        className="w-full py-3 rounded-xl font-syne font-bold text-sm uppercase tracking-widest transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
        style={paystackStyle}
      >
        {loading === `paystack-${tier}` ? 'Redirecting...' : (
          <>
            {/* Paystack logo */}
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" className="opacity-80">
              <path d="M12 0C5.374 0 0 5.373 0 12c0 6.628 5.374 12 12 12 6.628 0 12-5.372 12-12 0-6.627-5.372-12-12-12zm0 4.8c3.974 0 7.2 3.226 7.2 7.2S15.974 19.2 12 19.2 4.8 15.974 4.8 12 8.026 4.8 12 4.8z"/>
            </svg>
            {paystackLabel}
          </>
        )}
      </button>
    </div>
  );
}

export default function PricingCards() {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  const handleCheckout = async (provider: 'stripe' | 'paystack', tier: 'pro' | 'black') => {
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
        router.push('/login?redirect=/pricing');
        return;
      }

      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      // ignore
    }
    setLoading(null);
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
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <div className="px-4 py-1.5 rounded-full bg-[#E63946] font-syne font-bold text-[10px] uppercase tracking-widest text-white whitespace-nowrap">
            Most popular
          </div>
        </div>

        <div className="pt-2">
          <p className="font-syne font-bold text-xs uppercase tracking-widest text-[#E63946] mb-4">Darkpost Pro</p>
          <div className="flex items-end gap-3 mb-1">
            <div>
              <span className="font-syne font-extrabold text-5xl tracking-tighter text-[#F0ECE3]">$3</span>
              <span className="font-inter text-[#6B6B6B] text-sm">/mo</span>
            </div>
            <span className="font-syne font-bold text-base text-[#4A4A4A] mb-1">or</span>
            <div>
              <span className="font-syne font-extrabold text-2xl tracking-tighter text-[#6B6B6B]">GHS 45</span>
              <span className="font-inter text-[#4A4A4A] text-xs">/mo</span>
            </div>
          </div>
        </div>

        <PaymentButtons
          tier="pro"
          loading={loading}
          onStripe={() => handleCheckout('stripe', 'pro')}
          onPaystack={() => handleCheckout('paystack', 'pro')}
          stripeLabel="Pay $3/mo with Stripe"
          paystackLabel="Pay GHS 45/mo with Paystack"
          stripeStyle={{ backgroundColor: '#E63946', color: 'white' }}
          paystackStyle={{ backgroundColor: '#0B6DF6', color: 'white' }}
        />

        <div>
          <p className="font-syne font-bold text-[10px] uppercase tracking-widest text-[#6B6B6B] mb-4">Everything in Free, plus</p>
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
          <div className="flex items-end gap-3 mb-1">
            <div>
              <span className="font-syne font-extrabold text-5xl tracking-tighter text-[#F0ECE3]">$7</span>
              <span className="font-inter text-[#6B6B6B] text-sm">/mo</span>
            </div>
            <span className="font-syne font-bold text-base text-[#4A4A4A] mb-1">or</span>
            <div>
              <span className="font-syne font-extrabold text-2xl tracking-tighter text-[#6B6B6B]">GHS 105</span>
              <span className="font-inter text-[#4A4A4A] text-xs">/mo</span>
            </div>
          </div>
        </div>

        <PaymentButtons
          tier="black"
          loading={loading}
          onStripe={() => handleCheckout('stripe', 'black')}
          onPaystack={() => handleCheckout('paystack', 'black')}
          stripeLabel="Pay $7/mo with Stripe"
          paystackLabel="Pay GHS 105/mo with Paystack"
          stripeStyle={{ backgroundColor: '#F0ECE3', color: '#0A0A0A' }}
          paystackStyle={{ backgroundColor: '#0B6DF6', color: 'white' }}
        />

        <div>
          <p className="font-syne font-bold text-[10px] uppercase tracking-widest text-[#6B6B6B] mb-4">Everything in Pro, plus</p>
          <FeatureList groups={BLACK_FEATURES} bullet="+" bulletColor="#E63946" />
        </div>
      </motion.div>
    </div>
  );
}
