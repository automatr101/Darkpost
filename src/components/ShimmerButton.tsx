'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export const ShimmerButton = ({
  className,
  children,
  onClick,
  disabled,
  ...props
}: {
  className?: string;
  children?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "group relative flex items-center justify-center overflow-hidden transition-all duration-300",
        "bg-primary-red text-text-primary px-8 py-4 rounded-full font-syne font-bold uppercase tracking-wider",
        "hover:scale-[1.02] active:scale-[0.98] disabled:bg-surface-raised disabled:text-text-muted disabled:scale-100",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 z-0 flex items-center justify-center opacity-40">
        <div className="h-full w-20 bg-white/20 blur-[30px] -skew-x-[30deg] animate-shimmer scale-[2]" />
      </div>
      <span className="relative z-10">{children}</span>
    </button>
  );
};
