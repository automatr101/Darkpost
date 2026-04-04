// Concentric double-ring spinner — inspired by 21st.dev/community/mvp_Subha/loader/concentric-loader
// Tuned for Darkpost's dark theme with brand red accent

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: { outer: 'w-4 h-4', inner: 'w-2.5 h-2.5' },
  md: { outer: 'w-5 h-5', inner: 'w-3 h-3' },
  lg: { outer: 'w-7 h-7', inner: 'w-4 h-4' },
};

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
  const s = sizes[size];
  return (
    <span className={`inline-flex items-center justify-center ${className}`} aria-label="Loading">
      <span
        className={`animate-spin rounded-full border-2 border-transparent border-t-[#ff535b] flex items-center justify-center ${s.outer}`}
      >
        <span
          className={`animate-spin rounded-full border-2 border-transparent border-t-[#F0ECE3]/40 ${s.inner}`}
          style={{ animationDirection: 'reverse', animationDuration: '0.5s' }}
        />
      </span>
    </span>
  );
}
