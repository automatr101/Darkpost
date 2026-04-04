'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import type { Category } from '@/lib/types';
import { SlideButton } from '@/components/SlideButton';

export default function ComposePage() {
  const router = useRouter();
  const supabase = createClient();

  const [tab, setTab] = useState<'text' | 'voice'>('text');
  const [content, setContent] = useState('');
  const [isAnon, setIsAnon] = useState(true);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Voice state
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [mediaSupported, setMediaSupported] = useState(true);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const charsRemaining = 280 - content.length;

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((j) => setCategories(j.data || []))
      .catch(() => {});

    if (!navigator.mediaDevices?.getUserMedia) {
      setMediaSupported(false);
    }
  }, []);

  const [liveWaveform, setLiveWaveform] = useState<number[]>(Array(30).fill(0.05));
  const [isPlayingReview, setIsPlayingReview] = useState(false);
  const reviewAudioRef = useRef<HTMLAudioElement | null>(null);

  function toggleReviewPlayback() {
    if (!reviewAudioRef.current) {
      if (!recordedBlob) return;
      const audioUrl = URL.createObjectURL(recordedBlob);
      const audio = new Audio(audioUrl);
      audio.onended = () => setIsPlayingReview(false);
      reviewAudioRef.current = audio;
    }
    
    if (isPlayingReview) {
      reviewAudioRef.current.pause();
      setIsPlayingReview(false);
    } else {
      reviewAudioRef.current.play();
      setIsPlayingReview(true);
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const options = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? { mimeType: 'audio/webm;codecs=opus' }
        : MediaRecorder.isTypeSupported('audio/mp4') 
          ? { mimeType: 'audio/mp4' } 
          : undefined;

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      // Set up analyser for waveform
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;

      const amplitudes: number[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        if (blob.size > 5000 * 1024) { // Increased size limit for 60s
          setError('Recording too large. Try a shorter confession.');
          return;
        }
        setRecordedBlob(blob);
        setWaveformData(amplitudes.length > 0 ? amplitudes : Array.from({ length: 100 }, () => Math.random()));
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingTime(0);

      // Timer + amplitude sampling
      timerRef.current = setInterval(() => {
        setRecordingTime((t) => {
          const newTime = t + 0.1;
          if (newTime >= 60) {
            mediaRecorder.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
            return 60;
          }
          // Sample amplitude
          if (analyserRef.current) {
            const data = new Uint8Array(analyserRef.current.frequencyBinCount);
            analyserRef.current.getByteFrequencyData(data);
            const avg = data.reduce((a, b) => a + b, 0) / data.length / 255;
            const amp = Math.max(0.05, avg);
            amplitudes.push(amp);
            setLiveWaveform(prev => {
              const next = [...prev.slice(1), amp];
              return next;
            });
          }
          return newTime;
        });
      }, 100); 
    } catch {
      setError('Microphone access is required for voice confessions. Check your browser permissions.');
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }

  function resetRecording() {
    setRecordedBlob(null);
    setWaveformData([]);
    setRecordingTime(0);
  }

  async function handleSubmit() {
    setError('');
    setLoading(true);

    try {
      if (tab === 'text') {
        const res = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            post_type: 'text',
            content,
            is_anon: isAnon,
            category_id: categoryId,
          }),
        });

        if (!res.ok) {
          const { error } = await res.json();
          setError(error || 'Failed to post.');
          setLoading(false);
          return;
        }
      } else if (tab === 'voice' && recordedBlob) {
        // Upload voice file to Supabase Storage
        const mimeType = recordedBlob.type || 'audio/webm';
        const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('mpeg') ? 'mp3' : 'webm';
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('voice-posts')
          .upload(filename, recordedBlob, { contentType: mimeType });

        if (uploadError) {
          setError('Voice upload failed. Try again.');
          setLoading(false);
          return;
        }

        // Trim waveform to 100 values
        const trimmed = waveformData.slice(0, 100);
        while (trimmed.length < 100) trimmed.push(0.1);

        const res = await fetch('/api/posts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            post_type: 'voice',
            voice_url: filename,
            waveform_data: trimmed,
            duration_seconds: recordingTime,
            is_anon: isAnon,
            category_id: categoryId,
          }),
        });

        if (!res.ok) {
          const { error } = await res.json();
          setError(error || 'Failed to post.');
          setLoading(false);
          return;
        }
      }

      router.push('/');
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  const canPost = tab === 'text' ? content.length >= 10 : !!recordedBlob;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#131313' }}>
      {/* Header */}
      <header
        className="flex items-center justify-between px-5 py-4 sticky top-0 z-10"
        style={{
          backgroundColor: 'rgba(19,19,19,0.92)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid #1c1b1b',
        }}
      >
        <button
          onClick={() => router.back()}
          className="font-inter"
          style={{ color: '#6B6B6B', fontSize: '14px' }}
        >
          ← Back
        </button>
        <h1 className="font-syne font-extrabold" style={{ fontSize: '18px', color: '#F0ECE3' }}>
          DARK<span style={{ color: '#ff535b' }}>.</span>POST
        </h1>
        <div style={{ width: '48px' }} />
      </header>

      <div className="flex-1 flex justify-center px-4 py-6">
        <div className="w-full max-w-lg">
          {/* Tab Switcher */}
          <div className="flex gap-1 mb-6" style={{ backgroundColor: '#1c1b1b', borderRadius: '12px', padding: '4px' }}>
            <button
              onClick={() => setTab('text')}
              className="flex-1 font-syne font-bold text-center py-2.5 rounded-lg transition-colors"
              style={{
                fontSize: '14px',
                backgroundColor: tab === 'text' ? '#2a2a2a' : 'transparent',
                color: tab === 'text' ? '#F0ECE3' : '#6B6B6B',
              }}
            >
              Text
            </button>
            <button
              onClick={() => setTab('voice')}
              className="flex-1 font-syne font-bold text-center py-2.5 rounded-lg transition-colors"
              style={{
                fontSize: '14px',
                backgroundColor: tab === 'voice' ? '#2a2a2a' : 'transparent',
                color: tab === 'voice' ? '#F0ECE3' : '#6B6B6B',
              }}
            >
              Voice
            </button>
          </div>

          {/* Text Compose */}
          {tab === 'text' && (
            <div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value.slice(0, 280))}
                placeholder="What's your confession..."
                rows={6}
                className="w-full font-dm-serif resize-none outline-none"
                style={{
                  backgroundColor: '#0e0e0e',
                  borderRadius: '12px',
                  padding: '20px',
                  fontSize: '18px',
                  color: '#F0ECE3',
                  lineHeight: '1.5',
                  border: '1px solid transparent',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#ff535b15')}
                onBlur={(e) => (e.currentTarget.style.borderColor = 'transparent')}
              />
              <div className="flex justify-end mt-2">
                <span
                  className="font-inter font-medium"
                  style={{
                    fontSize: '13px',
                    color: charsRemaining <= 20 ? '#ff535b' : '#4A4A4A',
                    fontWeight: charsRemaining <= 0 ? 700 : 400,
                  }}
                >
                  {charsRemaining}
                </span>
              </div>
            </div>
          )}


          {tab === 'voice' && (
            <div className="flex flex-col items-center py-8">
              {!mediaSupported ? (
                <div
                  className="font-inter text-center px-4 py-3 rounded-xl"
                  style={{ backgroundColor: '#1c1b1b', color: '#9A9A9A', fontSize: '14px' }}
                >
                  ℹ️ Voice posts aren't supported on this browser. Try Chrome or Safari.
                </div>
              ) : recordedBlob ? (
                <div className="w-full">
                  {/* Playback waveform */}
                  <div
                    className="flex items-center gap-[2px] h-16 w-full px-4 mb-4 relative"
                    style={{ backgroundColor: '#0e0e0e', borderRadius: '12px', padding: '16px' }}
                  >
                    <button 
                       onClick={toggleReviewPlayback} 
                       className="mr-3 w-10 h-10 flex items-center justify-center rounded-full bg-[#ff535b] text-white shadow-lg active:scale-95 transition-all outline-none"
                    >
                       {isPlayingReview ? '⏸' : '▶'}
                    </button>
                    {waveformData.slice(0, 60).map((v, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-full transition-all duration-75"
                        style={{
                          backgroundColor: '#E63946',
                          height: `${v * 100}%`,
                          minHeight: '3px',
                        }}
                      />
                    ))}
                  </div>
                  <p className="font-inter text-center mb-4" style={{ color: '#6B6B6B', fontSize: '13px' }}>
                    0:{Math.floor(recordingTime).toString().padStart(2, '0')} recorded
                  </p>
                  <button
                    onClick={() => {
                       if (reviewAudioRef.current) reviewAudioRef.current.pause();
                       setIsPlayingReview(false);
                       reviewAudioRef.current = null;
                       resetRecording();
                    }}
                    className="w-full font-inter font-medium py-3 rounded-xl transition-colors"
                    style={{ backgroundColor: '#1c1b1b', color: '#9A9A9A', fontSize: '14px' }}
                  >
                    🔄 Re-record
                  </button>
                </div>
              ) : (
                <>
                  {/* Live visualization */}
                  {isRecording && (
                    <div className="flex items-center gap-[2px] h-12 w-full max-w-[200px] mb-8">
                      {liveWaveform.map((v, i) => (
                        <div
                          key={i}
                          className="flex-1 rounded-full bg-[#ff535b] transition-all duration-100 ease-linear"
                          style={{
                            height: `${Math.max(5, v * 150)}%`,
                            minHeight: '4px',
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Record button */}
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className="transition-all active:scale-95"
                    style={{
                      width: '100px',
                      height: '100px',
                      borderRadius: '50%',
                      backgroundColor: isRecording ? '#92001c' : '#ff535b',
                      border: isRecording ? '4px solid #F0ECE3' : '4px solid transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '36px',
                      boxShadow: isRecording ? '0 0 40px rgba(255,83,91,0.4)' : 'none',
                    }}
                  >
                    {isRecording ? '⏹' : '🎙'}
                  </button>
                  <p className="font-inter mt-4" style={{ color: '#6B6B6B', fontSize: '14px' }}>
                    {isRecording
                      ? `0:${Math.floor(recordingTime).toString().padStart(2, '0')} / 1:00`
                      : 'Tap to record. Max 60 seconds.'}
                  </p>
                  {isRecording && recordingTime >= 60 && (
                    <p className="font-inter mt-2 font-medium" style={{ color: '#ff535b', fontSize: '13px' }}>
                      Max Duration Reached
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          {/* Anonymous Toggle */}
          <div className="mt-6">
            <button
              onClick={() => setIsAnon(!isAnon)}
              className="flex items-center gap-3 font-inter font-medium transition-colors w-full px-4 py-3 rounded-xl"
              style={{
                backgroundColor: isAnon ? '#3A121720' : '#1c1b1b',
                border: isAnon ? '1px solid #ff535b30' : '1px solid transparent',
                color: isAnon ? '#ff535b' : '#9A9A9A',
                fontSize: '14px',
              }}
            >
              <span>{isAnon ? '👻' : '👤'}</span>
              {isAnon ? 'Posting as Anonymous' : 'Posting as @you'}
            </button>
          </div>

          {/* Category Selector */}
          <div className="mt-4">
            <p className="font-syne font-bold mb-3" style={{ fontSize: '13px', color: '#6B6B6B' }}>
              Classify the archive
            </p>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryId(categoryId === cat.id ? null : cat.id)}
                  className="font-inter font-medium uppercase transition-colors"
                  style={{
                    fontSize: '11px',
                    padding: '6px 14px',
                    borderRadius: '100px',
                    backgroundColor: categoryId === cat.id ? `${cat.color_hex}20` : '#1c1b1b',
                    border: categoryId === cat.id ? `1px solid ${cat.color_hex}40` : '1px solid transparent',
                    color: categoryId === cat.id ? cat.color_hex : '#6B6B6B',
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              className="mt-4 font-inter px-4 py-3 rounded-xl"
              style={{
                backgroundColor: '#3A121720',
                borderLeft: '3px solid #ff535b',
                color: '#ff535b',
                fontSize: '13px',
              }}
            >
              {error}
            </div>
          )}

          {/* Post Button */}
          <div className="mt-8 relative h-[60px]">
            <SlideButton
              onSuccess={handleSubmit}
              disabled={!canPost || loading}
              text={tab === 'voice' ? 'SLIDE TO POST VOICE' : 'SLIDE TO CONFESS'}
              successText={loading ? 'POSTING...' : 'CONFESSED'}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
