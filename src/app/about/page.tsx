'use client';

import Link from 'next/link';
import { ArrowLeft, Shield, Scale, Ghost, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TheVoidPage() {
  return (
    <div className="min-h-screen bg-[#131313] text-[#F0ECE3] pb-24 md:pb-12">
      <header className="sticky top-0 z-30 bg-[#131313]/80 backdrop-blur-xl border-b border-white/5 px-4 h-16 flex items-center gap-4">
        <Link href="/" className="p-2 hover:bg-white/5 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-syne font-bold text-lg uppercase tracking-tight">The Manifest</h1>
      </header>

      <main className="max-w-2xl mx-auto py-12 px-6">
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16 text-center"
        >
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-8 animate-pulse text-[#ff535b]">
            <Ghost className="w-8 h-8 md:w-10 md:h-10" />
          </div>
          <h2 className="font-syne font-extrabold text-4xl md:text-5xl uppercase tracking-tighter mb-6">About the Void</h2>
          <p className="font-dm-serif text-xl md:text-2xl text-[#6B6B6B] italic leading-relaxed">
            &ldquo;In the end, anonymity is not about hiding. 
            It is about finding the courage to be honest.&rdquo;
          </p>
        </motion.section>

        <div className="space-y-12">
          <LegalItem 
            icon={Shield} 
            title="Protocol: Sanctity" 
            content="Darkpost is built on the belief that digital memory should be as ephemeral as real conversation. We do not track your IP for targeting. We do not sell your soul to the highest bidder. Your confessions are encrypted until revealed by high-risk snapshots." 
          />
          <LegalItem 
            icon={Scale} 
            title="The Covenant (Terms)" 
            content="By entering the void, you agree to the laws of the enclave. No malicious exposure. No targeted harassment. Confessions that violate the integrity of human dignity will be purged by the incinerator. Use your anonymity for truth, not destruction." 
          />
          <LegalItem 
            icon={Sparkles} 
            title="The Ash (Mockup Ash)" 
            content="Ash is the currency of the void. Generated when threads are burnt. Sacrifice your Ash to unlock deeper archives or to incinerate threads that have become too visible. This is a mockup currency for the high-stakes editorial experience." 
          />
        </div>

        <div className="mt-24 pt-12 border-t border-white/5 text-center">
           <p className="font-inter text-[10px] text-[#4A4A4A] uppercase tracking-[0.3em] mb-4">Established 2026</p>
           <p className="font-syne font-bold text-[12px] text-[#2a2a2a] uppercase">Anonymity is a Sacred Right.</p>
        </div>
      </main>
    </div>
  );
}

function LegalItem({ icon: Icon, title, content }: { icon: any, title: string, content: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      className="p-8 rounded-[40px] bg-white/5 border border-white/5 hover:border-white/10 transition-all group"
    >
       <div className="w-10 h-10 rounded-2xl bg-[#ff535b]/10 flex items-center justify-center text-[#ff535b] mb-6 group-hover:scale-110 transition-transform">
          <Icon size={20} />
       </div>
       <h3 className="font-syne font-extrabold text-xl uppercase tracking-tight mb-4">{title}</h3>
       <p className="font-inter text-sm md:text-base text-[#6B6B6B] leading-[1.7]">{content}</p>
    </motion.div>
  );
}
