import Link from 'next/link';
import { ArrowLeft, Check } from 'lucide-react';
import PricingCards from '@/components/PricingCards';

export const metadata = {
  title: 'Pricing | Darkpost',
  description: 'Choose your Darkpost plan. Free, Pro ($3/mo), or Black ($7/mo).',
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#080808] text-[#F0ECE3]">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-[#080808]/90 backdrop-blur-xl border-b border-white/5 px-6 h-14 flex items-center gap-4">
        <Link href="/" className="p-2 hover:bg-white/5 rounded-full transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <span className="font-syne font-bold text-sm uppercase tracking-widest">Pricing</span>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-16 md:py-24">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#E63946]/10 border border-[#E63946]/20 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E63946] animate-pulse" />
            <span className="font-syne font-bold text-[11px] uppercase tracking-widest text-[#E63946]">Plans & Pricing</span>
          </div>
          <h1 className="font-syne font-extrabold text-4xl md:text-6xl tracking-tighter mb-4">
            Confess on your terms.
          </h1>
          <p className="font-inter text-[#6B6B6B] text-lg max-w-xl mx-auto">
            Start free. Upgrade when you&apos;re ready for more.
          </p>
        </div>

        {/* Cards — client component handles checkout */}
        <PricingCards />

        {/* FAQ / fine print */}
        <div className="mt-20 text-center space-y-3">
          <p className="font-inter text-[#4A4A4A] text-sm">
            All plans billed monthly. Cancel anytime — no questions asked.
          </p>
          <p className="font-inter text-[#2a2a2a] text-xs">
            GHS pricing is approximate based on current exchange rates.
          </p>
          <div className="flex items-center justify-center gap-6 mt-6">
            {['Secure payments via Stripe', 'Cancel anytime', 'Instant access'].map((item) => (
              <div key={item} className="flex items-center gap-1.5 font-inter text-xs text-[#4A4A4A]">
                <Check size={12} className="text-green-500" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
