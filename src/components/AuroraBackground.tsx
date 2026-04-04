'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export const AuroraBackground = ({
  className,
  children,
  showRadialGradient = true,
  ...props
}: {
  className?: string;
  children?: React.ReactNode;
  showRadialGradient?: boolean;
}) => {
  return (
    <div
      className={cn(
        "relative flex flex-col h-full bg-[#080808] transition-colors duration-300",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div
          className={cn(
            `
            [--white-gradient:linear-gradient(to_bottom,white,transparent)]
            [--dark-gradient:linear-gradient(to_bottom,#080808,transparent)]
            [--aurora:repeating-linear-gradient(100deg,#E63946_10%,#3A1217_15%,#E63946_20%,#080808_25%,#E63946_30%)]
            [background-image:var(--dark-gradient),var(--aurora)]
            [background-size:300%,_200%]
            [background-position:50%_50%,50%_50%]
            filter blur-[20px] 
            after:content-[""] after:absolute after:inset-0 after:[background-image:var(--dark-gradient),var(--aurora)] 
            after:[background-size:200%,_100%] 
            after:animate-aurora after:[background-attachment:fixed] after:mix-blend-difference
            absolute -inset-[10px] will-change-transform`,
            showRadialGradient &&
              `[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,transparent_70%)]`
          )}
        ></div>
      </div>
      <div className="relative z-10 w-full h-full">{children}</div>
    </div>
  );
};
