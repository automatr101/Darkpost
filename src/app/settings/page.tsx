'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import type { Profile } from '@/lib/types';
import {
  ArrowLeft,
  User,
  Shield,
  Ghost,
  LogOut,
  Save,
  Trash2,
  Zap,
  Crown,
  CreditCard,
} from 'lucide-react';

type Tier = 'free' | 'pro' | 'black';

const TIER_LABELS: Record<Tier, string> = {
  free: 'Free',
  pro: 'Darkpost Pro',
  black: 'Darkpost Black',
};

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#131313] flex items-center justify-center">
        <Ghost size={40} className="text-[#2a2a2a] animate-pulse" />
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const [user, setUser] = useState<import('@supabase/supabase-js').User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tier, setTier] = useState<Tier>('free');
  const [periodEnd, setPeriodEnd] = useState<string | null>(null);
  const [subLoading, setSubLoading] = useState(false);
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);
  const [usernameWarning, setUsernameWarning] = useState('');

  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  useEffect(() => {
    if (searchParams.get('upgraded') === 'true') {
      setUpgradeSuccess(true);
      setTimeout(() => setUpgradeSuccess(false), 5000);
    }
  }, [searchParams]);

  const loadData = useCallback(async () => {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (!authUser) { router.push('/login'); return; }
    setUser(authUser);

    const { data: profileData } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    setProfile(profileData || {
      display_name: '',
      username: authUser.email?.split('@')[0] || 'shadow_ghost',
      bio: '',
    });

    // Fetch subscription
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('tier, status, current_period_end')
      .eq('user_id', authUser.id)
      .single();

    if (sub && sub.status === 'active') {
      setTier(sub.tier as Tier);
      setPeriodEnd(sub.current_period_end);
    }

    setLoading(false);
  }, [supabase, router]);

  useEffect(() => { loadData(); }, [loadData]);

  function sanitizeUsername(raw: string) {
    return raw
      .replace(/^@+/, '')
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
      .toLowerCase()
      .slice(0, 30);
  }

  function validateUsername(raw: string) {
    if (/[A-Z]/.test(raw)) return 'Usernames must be lowercase.';
    if (/\s/.test(raw)) return 'Usernames cannot contain spaces.';
    if (/[^a-z0-9_]/.test(raw)) return 'Letters, numbers, and underscores only.';
    return '';
  }

  function handleUsernameChange(val: string) {
    if (profile) {
      setProfile({ ...profile, username: val });
      setUsernameWarning(validateUsername(val));
    }
  }

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    if (!user || !profile) { setSaving(false); return; }

    // Final sanitization before saving
    const cleanUsername = sanitizeUsername(profile.username);
    if (!cleanUsername || cleanUsername.length < 3) {
      setError('Username must be at least 3 characters.');
      setSaving(false);
      return;
    }

    if (usernameWarning) {
      setError(usernameWarning);
      setSaving(false);
      return;
    }

    const { error: updateError } = await supabase.from('users').upsert({
      id: user.id,
      display_name: profile.display_name || '',
      username: cleanUsername,
      bio: profile.bio || '',
      updated_at: new Date().toISOString(),
    });

    if (updateError) {
      setError(updateError.message.includes('username_check') || updateError.message.includes('constraint')
        ? 'Username can only contain lowercase letters, numbers, and underscores.'
        : updateError.message);
    } else {
      setProfile((p) => p ? { ...p, username: cleanUsername } : p);
      setSuccess('Profile updated.');
      setTimeout(() => setSuccess(''), 3000);
    }
    setSaving(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  const handleCheckout = async (planTier: 'pro' | 'black') => {
    setSubLoading(true);
    const res = await fetch('/api/stripe/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier: planTier }),
    });
    const { url } = await res.json();
    if (url) window.location.href = url;
    else setSubLoading(false);
  };

  const handlePortal = async () => {
    setSubLoading(true);
    const res = await fetch('/api/stripe/portal', { method: 'POST' });
    const { url } = await res.json();
    if (url) window.location.href = url;
    else setSubLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#131313] flex items-center justify-center">
        <Ghost size={40} className="text-[#2a2a2a] animate-pulse" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#131313] text-[#F0ECE3] pb-24 md:pb-12">
      <header className="sticky top-0 z-30 bg-[#131313]/80 backdrop-blur-xl border-b border-white/5 px-4 pt-[max(env(safe-area-inset-top),1rem)] pb-2 h-auto min-h-[4rem] flex items-center gap-4">
        <Link href="/profile" className="p-2 hover:bg-white/5 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-syne font-bold text-lg uppercase tracking-tight">Settings</h1>
      </header>

      {/* Upgrade success toast */}
      {upgradeSuccess && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full bg-[#E63946] text-white font-syne font-bold text-sm shadow-xl shadow-[#E63946]/20 whitespace-nowrap">
          🔥 Welcome to {TIER_LABELS[tier]}!
        </div>
      )}

      <main className="max-w-2xl mx-auto py-8 px-4">
        <div className="flex flex-col gap-10">

          {/* Section: Subscription */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <CreditCard size={18} className="text-[#E63946]" />
              <h2 className="font-syne font-extrabold text-xl uppercase tracking-tighter">Subscription</h2>
            </div>
            <div className="p-6 rounded-[32px] bg-white/5 border border-white/5">
              <div className="flex items-center gap-2 mb-4">
                {tier === 'pro' && <Zap size={14} className="text-[#E63946]" />}
                {tier === 'black' && <Crown size={14} className="text-[#F0ECE3]" />}
                <span className="font-syne font-extrabold text-lg">{TIER_LABELS[tier]}</span>
                {tier !== 'free' && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-syne font-bold uppercase tracking-widest bg-[#E63946]/10 text-[#E63946] border border-[#E63946]/20">
                    Active
                  </span>
                )}
              </div>
              {tier !== 'free' && periodEnd && (
                <p className="font-inter text-[#4A4A4A] text-sm mb-6">
                  Next billing: {new Date(periodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              )}
              {tier === 'free' ? (
                <div className="flex flex-col gap-3">
                  <p className="font-inter text-[#6B6B6B] text-sm mb-2">Upgrade to unlock more features.</p>
                  <button
                    onClick={() => handleCheckout('pro')}
                    disabled={subLoading}
                    className="w-full py-3 rounded-2xl font-syne font-bold text-sm uppercase tracking-widest text-white bg-[#E63946] hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Zap size={15} />
                    Upgrade to Pro — $3/mo
                  </button>
                  <button
                    onClick={() => handleCheckout('black')}
                    disabled={subLoading}
                    className="w-full py-3 rounded-2xl font-syne font-bold text-sm uppercase tracking-widest text-[#0A0A0A] bg-[#F0ECE3] hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Crown size={15} />
                    Upgrade to Black — $7/mo
                  </button>
                  <Link href="/pricing" className="text-center font-inter text-xs text-[#4A4A4A] hover:text-white transition-colors">
                    Compare all plans →
                  </Link>
                </div>
              ) : (
                <button
                  onClick={handlePortal}
                  disabled={subLoading}
                  className="w-full py-3 rounded-2xl font-syne font-bold text-sm uppercase tracking-widest bg-white/5 text-[#F0ECE3] border border-white/10 hover:bg-white/10 transition-all disabled:opacity-50"
                >
                  {subLoading ? 'Loading...' : 'Manage Subscription'}
                </button>
              )}
            </div>
          </section>

          {/* Section: Profile */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <User size={18} className="text-[#ff535b]" />
              <h2 className="font-syne font-extrabold text-xl uppercase tracking-tighter">Edit Profile</h2>
            </div>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="space-y-4 p-6 rounded-[32px] bg-white/5 border border-white/5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff535b]/5 blur-3xl pointer-events-none" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="font-syne font-bold text-[10px] text-[#4A4A4A] uppercase tracking-widest ml-1">Display Name</label>
                    <input
                      value={profile?.display_name || ''}
                      onChange={(e) => setProfile((p) => p ? { ...p, display_name: e.target.value } : p)}
                      placeholder="Your name"
                      className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3.5 font-inter text-sm outline-none focus:border-[#ff535b]/30 transition-all placeholder:text-[#2a2a2a]"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-syne font-bold text-[10px] text-[#4A4A4A] uppercase tracking-widest ml-1">Username (@)</label>
                    <input
                      value={profile?.username || ''}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      placeholder="username"
                      maxLength={30}
                      className={`w-full bg-black/40 border ${usernameWarning ? 'border-red-500/50' : 'border-white/10'} rounded-2xl px-5 py-3.5 font-inter text-sm outline-none focus:border-[#ff535b]/30 transition-all placeholder:text-[#2a2a2a]`}
                    />
                    {usernameWarning ? (
                      <p className="font-inter text-[10px] text-red-500/80 ml-1 font-semibold uppercase tracking-wider">{usernameWarning}</p>
                    ) : (
                      <p className="font-inter text-[10px] text-[#4A4A4A] ml-1 tracking-tight">lowercase · letters, numbers, underscores only</p>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between ml-1">
                    <label className="font-syne font-bold text-[10px] text-[#4A4A4A] uppercase tracking-widest">Biography</label>
                    <span className={`text-[9px] font-syne font-bold ${(profile?.bio?.length || 0) > 150 ? 'text-[#ff535b]' : 'text-[#4A4A4A]'}`}>
                      {profile?.bio?.length || 0} / 160
                    </span>
                  </div>
                  <textarea
                    value={profile?.bio || ''}
                    onChange={(e) => setProfile((p) => p ? { ...p, bio: e.target.value } : p)}
                    placeholder="Tell us a bit about yourself..."
                    rows={3}
                    maxLength={160}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3.5 font-inter text-sm outline-none focus:border-[#ff535b]/30 transition-all placeholder:text-[#2a2a2a] resize-none"
                  />
                  <p className="font-inter text-[10px] text-[#2a2a2a] ml-1">Your bio is public on your user profile.</p>
                </div>
                <button
                  disabled={saving}
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 bg-[#F0ECE3] hover:bg-white text-[#131313] py-4 rounded-2xl font-syne font-extrabold text-[12px] uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {saving ? <Ghost className="animate-pulse" size={16} /> : <Save size={16} />}
                  Save Changes
                </button>
                {success && <p className="text-center font-inter text-[11px] text-green-400/80 uppercase tracking-widest mt-2">{success}</p>}
                {error && <p className="text-center font-inter text-[11px] text-[#ff535b]/80 uppercase tracking-widest mt-2">{error}</p>}
              </div>
            </form>
          </section>

          {/* Section: Account */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <Shield size={18} className="text-[#6B6B6B]" />
              <h2 className="font-syne font-extrabold text-xl uppercase tracking-tighter">Account</h2>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleLogout}
                className="flex items-center justify-between p-5 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-[#ff535b]">
                    <LogOut size={18} />
                  </div>
                  <div className="text-left">
                    <p className="font-syne font-bold text-sm uppercase tracking-tight">Log Out</p>
                    <p className="font-inter text-[11px] text-[#4A4A4A]">Sign out of your account.</p>
                  </div>
                </div>
              </button>

              <button className="flex items-center justify-between p-5 rounded-3xl bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
                    <Trash2 size={18} />
                  </div>
                  <div className="text-left">
                    <p className="font-syne font-bold text-sm uppercase tracking-tight text-red-500">Delete Account</p>
                    <p className="font-inter text-[11px] text-red-500/50">Permanently delete your account.</p>
                  </div>
                </div>
              </button>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
