'use client';

import React, { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform, MotionValue } from 'framer-motion';
import Link from 'next/link';
import { Home, Plus, User, LogIn, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';

const ICON_SIZE = 20;

export function Dock() {
  const mouseX = useMotionValue(Infinity);

  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex h-16 items-end gap-4 rounded-2xl bg-[#1c1b1b]/80 border border-white/5 px-4 pb-3 backdrop-blur-md shadow-2xl"
    >
      <DockIcon mouseX={mouseX} href="/" icon={<Home size={ICON_SIZE} />} label="Home" />
      <DockIcon mouseX={mouseX} href="/compose" icon={<Plus size={ICON_SIZE} />} label="Post" isPrimary />
      <DockIcon mouseX={mouseX} href="/profile" icon={<User size={ICON_SIZE} />} label="Profile" />
      <div className="w-px h-8 bg-white/10 mx-1 mb-1" />
      <DockIcon mouseX={mouseX} href="/login" icon={<LogIn size={ICON_SIZE} />} label="Login" />
      <DockIcon mouseX={mouseX} href="/signup" icon={<UserPlus size={ICON_SIZE} />} label="Join" />
    </motion.div>
  );
}

function DockIcon({ 
  mouseX, 
  href, 
  icon, 
  label, 
  isPrimary = false 
}: { 
  mouseX: MotionValue<number>, 
  href: string, 
  icon: React.ReactNode, 
  label: string,
  isPrimary?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null);

  const distance = useTransform(mouseX, (val: number) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const widthSync = useTransform(distance, [-150, 0, 150], [40, 60, 40]);
  const width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 });

  return (
    <Link href={href} className="relative group">
      <motion.div
        ref={ref}
        style={{ width }}
        className={cn(
          "aspect-square rounded-full flex items-center justify-center transition-colors shadow-inner",
          isPrimary 
            ? "bg-primary-red text-white" 
            : "bg-[#2a2a2a] text-[#F0ECE3] hover:bg-[#353535]"
        )}
      >
        {icon}
      </motion.div>
      
      {/* Tooltip */}
      <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-[#1c1b1b] text-[10px] font-bold text-[#F0ECE3] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-white/5">
        {label}
      </span>
    </Link>
  );
}
