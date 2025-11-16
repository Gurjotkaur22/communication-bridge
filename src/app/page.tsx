'use client'; // enable browser APIs like speechSynthesis

import { useEffect, useRef, useState } from 'react';

export default function Home() {
  // UI state
  const [text, setText] = useState('');
  const [volume, setVolume] = useState(1); // 0..1
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Quick phrases for MVP
  const quickPhrases = [
    'I need help.',
    'Thank you.',
    'Please repeat that.',
    'Can you write it down?',
    "I'm calling about..."
  ];

  // Capability detection
  const supportsSpeech = () =>
    typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Speak helper
  const speak = (message: string) => {
    if (!supportsSpeech()) {
      alert('Text-to-speech is not supported on this browser.');
      return;
    }
    const utter = new SpeechSynthesisUtterance(message);
    utter.volume = Math.min(1, Math.max(0, volume));
    utter.rate = 1;
    utter.pitch = 1;

    // Prefer an English voice if available
    const voices = window.speechSynthesis.getVoices();
    const en = voices.find(v => /en[-_]/i.test(v.lang));
    if (en) utter.voice = en;

    window.speechSynthesis.cancel(); // stop anything currently speaking
    window.speechSynthesis.speak(utter);

    // tiny haptic on supported mobile devices
    try { (navigator as any).vibrate?.(30); } catch {}
  };

  // Stop helper
  const stopSpeaking = () => {
    if (!supportsSpeech()) return;
    window.speechSynthesis.cancel();
  };

  // iOS quirk: populate voices after a user gesture; we “warm” it here
  useEffect(() => {
    if (!supportsSpeech()) return;
    const load = () => window.speechSynthesis.getVoices();
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load);
  }, []);

  // Keyboard shortcuts on textarea: Cmd/Ctrl/Shift+Enter to speak, Esc to stop
  const onKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if ((e.key === 'Enter') && (e.metaKey || e.ctrlKey || e.shiftKey)) {
      e.preventDefault();
      const msg = text.trim();
      if (msg) speak(msg);
    } else if (e.key === 'Escape') {
      stopSpeaking();
    }
  };

  const disabled = !supportsSpeech();

  // Simple inline styles (you can Tailwindify later)
  const btn = {
    padding: '10px 16px',
    fontSize: 16,
    borderRadius: 12,
    border: '1px solid #d1d5db',
    background: '#f8fafc',
    cursor: 'pointer' as const,
  };
  const primaryBtn = { ...btn, background: '#2563eb', color: 'white', border: 'none' };
  const dangerBtn = { ...btn, background: '#ef4444', color: 'white', border: 'none' };

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#fafafa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      {/* Status for screen readers */}
      <div aria-live="polite" style={{ position: 'absolute', height: 0, overflow: 'hidden' }}>
        {disabled ? 'Text to speech not supported' : 'Ready'}
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: 720,
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: 16,
          padding: 20,
          boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
        }}
      >
        <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 16 }}>
          Communication Bridge
        </h1>

        <label htmlFor="say" style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
          Type what you want to say
        </label>
        <textarea
          id="say"
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type here…"
          aria-label="Message text"
          style={{
            width: '100%',
            minHeight: 120,
            fontSize: 18,
            padding: 12,
            borderRadius: 12,
            border: '1px solid #d1d5db',
          }}
        />

        {/* Main controls */}
        <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
          <button
            style={primaryBtn}
            onClick={() => text.trim() && speak(text)}
            disabled={disabled}
            aria-disabled={disabled}
          >
            Speak
          </button>
          <button
            style={btn}
            onClick={() => { setText(''); textareaRef.current?.focus(); }}
          >
            Clear
          </button>
          <button style={dangerBtn} onClick={stopSpeaking}>
            Stop
          </button>
        </div>

        {/* Volume */}
        <div
          style={{
            marginTop: 16,
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: 12,
          }}
        >
          <label htmlFor="vol" style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>
            Volume
          </label>
          <input
            id="vol"
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            aria-valuemin={0}
            aria-valuemax={1}
            aria-valuenow={volume}
            style={{ width: '100%' }}
          />
          <div style={{ fontSize: 14, color: '#6b7280', marginTop: 6 }}>
            {Math.round(volume * 100)}%
          </div>
        </div>

        {/* Quick phrases */}
        <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 18, marginBottom: 8 }}>
          Quick phrases
        </h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 10,
          }}
        >
          {quickPhrases.map((p, i) => (
            <button
              key={i}
              style={btn}
              onClick={() => speak(p)}
              aria-label={`Say: ${p}`}
            >
              {p}
            </button>
          ))}
        </div>

        {disabled && (
          <div
            style={{
              marginTop: 12,
              border: '1px solid #f59e0b',
              background: '#fffbeb',
              color: '#92400e',
              padding: 12,
              borderRadius: 12,
            }}
          >
            Your browser doesn't support text-to-speech. Try the latest Chrome, Edge, or Safari.
          </div>
        )}

        <footer style={{ marginTop: 16, fontSize: 12, color: '#6b7280' }}>
          v0.1 • No data stored • English only (MVP)
        </footer>
      </div>
    </main>
  );
}