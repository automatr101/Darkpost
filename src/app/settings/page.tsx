'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import type { Profile } from '@/lib/types';
import { 
  ArrowLeft, 
  User, 
  Shield, 
  Ghost, 
  LogOut,
  Save,
  Trash2
} from 'lucide-react';

export default function SettingsPage() {
  const [user, setUser] = useState<import('@supabase/supabase-js').User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function getProfile() {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        router.push('/login');
        return;
      }
      setUser(authUser);

      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();
      
      setProfile(profileData || {
        display_name: '',
        username: authUser.email?.split('@')[0] || 'shadow_ghost',
        bio: ''
      });
      setLoading(false);
    }
    
    getProfile();
  }, [supabase, router]);

  // Sanitize username: strip @, replace spaces with _, remove invalid chars, lowercase
  function sanitizeUsername(raw: string) {
    return raw
      .replace(/^@+/, '')          // strip leading @
      .replace(/\s+/g, '_')        // spaces → underscores
      .replace(/[^a-z0-9_]/g, '')  // remove anything not a-z 0-9 _
      .toLowerCase()
      .slice(0, 30);               // max 30 chars
  }

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    if (!user || !profile) { setSaving(false); return; }

    // Client-side validation
    const cleanUsername = sanitizeUsername(profile.username);
    if (!cleanUsername || cleanUsername.length < 3) {
      setError('Frequency must be at least 3 characters (letters, numbers, underscores only).');
      setSaving(false);
      return;
    }

    const { error: updateError } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        display_name: profile.display_name,
        username: cleanUsername,
        bio: profile.bio,
        updated_at: new Date().toISOString()
      });

    if (updateError) {
      if (updateError.message.includes('username_check') || updateError.message.includes('constraint')) {
        setError('Frequency can only contain lowercase letters, numbers, and underscores (no spaces or special characters).');
      } else {
        setError(updateError.message);
      }
    } else {
      // Keep the cleaned username in state
      setProfile(p => p ? { ...p, username: cleanUsername } : p);
      setSuccess('Your soul record has been updated.');
      setTimeout(() => setSuccess(''), 3000);
    }
    setSaving(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push('/login');
  }

  if (loading) {
     return (
       <div className="min-h-screen bg-[#131313] flex items-center justify-center">
         <Ghost size={40} className="text-[#2a2a2a] animate-pulse" />
       </div>
     );
  }

  return (
    <div className="min-h-screen bg-[#131313] text-[#F0ECE3] pb-24 md:pb-12">
      <header className="sticky top-0 z-30 bg-[#131313]/80 backdrop-blur-xl border-b border-white/5 px-4 h-16 flex items-center gap-4">
        <Link href="/profile" className="p-2 hover:bg-white/5 rounded-full transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-syne font-bold text-lg uppercase tracking-tight">The Enclave Settings</h1>
      </header>

      <main className="max-w-2xl mx-auto py-8 px-4">
        <div className="flex flex-col gap-10">
           
           {/* Section: Profile */}
           <section>
              <div className="flex items-center gap-3 mb-6">
                 <User size={18} className="text-[#ff535b]" />
                 <h2 className="font-syne font-extrabold text-xl uppercase tracking-tighter">Identity Core</h2>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-6">
                 <div className="space-y-4 p-6 rounded-[32px] bg-white/5 border border-white/5 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#ff535b]/5 blur-3xl pointer-events-none" />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="font-syne font-bold text-[10px] text-[#4A4A4A] uppercase tracking-widest ml-1">Display Alias</label>
                          <input 
                            value={profile?.display_name || ''}
                            onChange={(e) => setProfile(p => p ? {...p, display_name: e.target.value} : p)}
                            placeholder="Ghost Walker"
                            className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3.5 font-inter text-sm outline-none focus:border-[#ff535b]/30 transition-all placeholder:text-[#2a2a2a]"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="font-syne font-bold text-[10px] text-[#4A4A4A] uppercase tracking-widest ml-1">Frequency (@)</label>
                          <input 
                           value={profile?.username || ''}
                           onChange={(e) => setProfile(p => p ? {...p, username: sanitizeUsername(e.target.value)} : p)}
                           placeholder="shadow_drift"
                           maxLength={30}
                           className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3.5 font-inter text-sm outline-none focus:border-[#ff535b]/30 transition-all placeholder:text-[#2a2a2a]"
                        />
                        <p className="font-inter text-[10px] text-[#4A4A4A] ml-1">lowercase · letters, numbers, underscores only</p>
                       </div>
                    </div>

                    <div className="space-y-2">
                       <label className="font-syne font-bold text-[10px] text-[#4A4A4A] uppercase tracking-widest ml-1">Echo Persona (Bio)</label>
                       <textarea 
                          value={profile?.bio || ''}
                          onChange={(e) => setProfile(p => p ? {...p, bio: e.target.value} : p)}
                          placeholder="What would your ghost say?"
                          rows={3}
                          className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3.5 font-inter text-sm outline-none focus:border-[#ff535b]/30 transition-all placeholder:text-[#2a2a2a] resize-none"
                       />
                    </div>

                    <button 
                       disabled={saving}
                       type="submit"
                       className="w-full flex items-center justify-center gap-2 bg-[#F0ECE3] hover:bg-white text-[#131313] py-4 rounded-2xl font-syne font-extrabold text-[12px] uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                       {saving ? <Ghost className="animate-pulse" size={16} /> : <Save size={16} />}
                       Update Soul Record
                    </button>

                    {success && <p className="text-center font-inter text-[11px] text-green-400/80 uppercase tracking-widest mt-2">{success}</p>}
                    {error && <p className="text-center font-inter text-[11px] text-[#ff535b]/80 uppercase tracking-widest mt-2">{error}</p>}
                 </div>
              </form>
           </section>

           {/* Section: Account Actions */}
           <section>
              <div className="flex items-center gap-3 mb-6">
                 <Shield size={18} className="text-[#6B6B6B]" />
                 <h2 className="font-syne font-extrabold text-xl uppercase tracking-tighter">Security Protocols</h2>
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
                          <p className="font-syne font-bold text-sm uppercase tracking-tight">Incinerate Session</p>
                          <p className="font-inter text-[11px] text-[#4A4A4A]">Logout from the archive.</p>
                       </div>
                    </div>
                 </button>

                 <button 
                  className="flex items-center justify-between p-5 rounded-3xl bg-red-500/5 border border-red-500/10 hover:bg-red-500/10 transition-all group"
                 >
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
                          <Trash2 size={18} />
                       </div>
                       <div className="text-left">
                          <p className="font-syne font-bold text-sm uppercase tracking-tight text-red-500">Purge Record</p>
                          <p className="font-inter text-[11px] text-red-500/50">Delete your soul irrevocably.</p>
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
