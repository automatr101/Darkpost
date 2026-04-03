'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { Particles } from '@/components/Particles';
import { motion } from 'framer-motion';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      window.location.href = '/';
    }
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ backgroundColor: '#131313' }}
    >
      <Particles 
        className="absolute inset-0 z-0" 
        quantity={200} 
        staticity={30} 
        ease={50} 
        color="#ff535b" 
      />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-sm relative z-10 p-8 rounded-3xl border border-white/5 bg-black/40 backdrop-blur-sm shadow-2xl"
      >
        <div className="text-center mb-10">
          <h1 className="font-syne font-extrabold text-3xl tracking-tight mb-2" style={{ color: '#F0ECE3' }}>
            DARK<span style={{ color: '#ff535b' }}>.</span>POST
          </h1>
          <p className="font-inter" style={{ fontSize: '14px', color: '#6B6B6B' }}>
            Say what you actually think.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              required
              className="w-full font-inter outline-none transition-all placeholder:text-neutral-700"
              style={{
                backgroundColor: '#0e0e0e',
                border: '1px solid #2a2a2a',
                borderRadius: '12px',
                padding: '14px 16px',
                fontSize: '14px',
                color: '#F0ECE3',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#ff535b') }
              onBlur={(e) => (e.currentTarget.style.borderColor = '#2a2a2a')}
            />
          </div>
          <div className="space-y-1">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full font-inter outline-none transition-all placeholder:text-neutral-700"
              style={{
                backgroundColor: '#0e0e0e',
                border: '1px solid #2a2a2a',
                borderRadius: '12px',
                padding: '14px 16px',
                fontSize: '14px',
                color: '#F0ECE3',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#ff535b')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#2a2a2a')}
            />
          </div>

          {error && (
            <p className="font-inter text-center" style={{ fontSize: '13px', color: '#ff535b' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full font-syne font-bold transition-all active:scale-[0.97] hover:shadow-[0_0_30px_rgba(255,83,91,0.3)] shadow-lg"
            style={{
              backgroundColor: '#ff535b',
              color: '#F0ECE3',
              padding: '14px',
              borderRadius: '100px',
              fontSize: '15px',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Entering...' : 'Enter the Archive'}
          </button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px" style={{ backgroundColor: '#2a2a2a' }} />
          <span className="font-inter" style={{ fontSize: '12px', color: '#4A4A4A' }}>or</span>
          <div className="flex-1 h-px" style={{ backgroundColor: '#2a2a2a' }} />
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full font-inter font-medium flex items-center justify-center gap-3 transition-colors border border-white/5 hover:bg-[#2a2a2a]"
          style={{
            backgroundColor: '#1c1b1b',
            color: '#e5e2e1',
            padding: '14px',
            borderRadius: '100px',
            fontSize: '14px',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <p className="text-center mt-8 font-inter" style={{ fontSize: '14px', color: '#6B6B6B' }}>
          New to the archive?{' '}
          <Link href="/signup" style={{ color: '#ff535b' }} className="font-medium hover:underline">
            Create account
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
