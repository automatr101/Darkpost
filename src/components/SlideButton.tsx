'use client';

import React, { useRef, useState, useEffect } from 'react';
import { motion, useAnimation, useMotionValue, useTransform } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';
import { Spinner } from '@/components/Spinner';

interface SlideButtonProps {
  onSuccess: () => void | Promise<void>;
  text?: string;
  successText?: string;
  className?: string;
  disabled?: boolean;
  isLoading?: boolean;
}

export function SlideButton({
  onSuccess,
  text = 'SLIDE TO POST',
  successText = 'POSTING...',
  className,
  disabled = false,
  isLoading = false,
}: SlideButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const x = useMotionValue(0);
  const controls = useAnimation();

  // Measure container once mounted
  useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
    }
    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const thumbWidth = 56;
  const maxTravel = Math.max(0, containerWidth - thumbWidth - 12); // 6px padding on left/right

  // Text opacity transitions as you drag
  const opacity = useTransform(x, [0, maxTravel / 2], [1, 0]);

  const handleDragEnd = async (event: MouseEvent | TouchEvent | PointerEvent, info: { offset: { x: number; y: number }; velocity: { x: number; y: number } }) => {
    if (disabled || isSuccess) return;

    if (info.offset.x >= maxTravel * 0.9) {
      // User reached the end successfully
      setIsSuccess(true);
      await controls.start({ x: maxTravel, transition: { type: 'spring', stiffness: 200, damping: 20 } });
      await onSuccess();
    } else {
      // Snap back if released early
      controls.start({ x: 0, transition: { type: 'spring', stiffness: 300, damping: 25 } });
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex items-center h-16 w-full rounded-full bg-surface-raised border border-border-subtle",
        "overflow-hidden transition-all duration-300",
        disabled && "opacity-50 cursor-not-allowed",
        isSuccess && "border-primary-red/50 shadow-[0_0_20px_rgba(255,83,91,0.2)]",
        className
      )}
    >
      {/* Background fill that follows the thumb */}
      <motion.div
        className="absolute left-0 top-0 bottom-0 bg-primary-red/10 rounded-full"
        style={{ width: useTransform(x, (val) => val + thumbWidth + 6) }}
      />

      {/* Center text behind the thumb */}
      <motion.span
        style={{ opacity }}
        className="absolute inset-0 flex items-center justify-center font-syne font-bold text-[14px] text-text-secondary tracking-[0.2em]"
      >
        {isSuccess ? successText : text}
      </motion.span>

      <motion.div
        className="absolute inset-0 flex items-center justify-center font-syne font-bold text-[14px] text-primary-red tracking-[0.2em]"
        initial={{ opacity: 0 }}
        animate={{ opacity: isSuccess ? 1 : 0 }}
      >
        {successText}
      </motion.div>

      {/* Draggable Thumb */}
      <motion.div
        drag={disabled || isSuccess ? false : "x"}
        dragConstraints={{ left: 0, right: maxTravel }}
        dragElastic={0}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{ x }}
        className={cn(
          "relative z-10 flex items-center justify-center h-14 w-14 rounded-full shadow-lg ml-[6px]",
          "transition-colors duration-200 cursor-grab active:cursor-grabbing",
          isSuccess ? "bg-primary-red text-white" : "bg-[#2a2a2a] text-white hover:bg-[#353534]"
        )}
      >
        {!isSuccess && !isLoading ? (
          <ArrowRight className="w-5 h-5 text-text-primary group-hover:text-white transition-colors" />
        ) : isLoading ? (
          <Spinner size="sm" />
        ) : (
          <motion.svg
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-6 h-6 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </motion.svg>
        )}
      </motion.div>
    </div>
  );
}
