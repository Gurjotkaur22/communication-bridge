'use client';

import { useEffect, useRef, useState } from 'react';
import VoiceSelector from './components/VoiceSelector';
import QuickPhrases from './components/QuickPhrases';
import PecsBoard, { PecsItem } from './components/PecsBoard';

import { loadSettings, saveSettings } from './lib/db';

export default function Home() {
  const [text, setText] = useState('');
  const [volume, setVolume] = useState(1);
  const [lang, setLang] = useState('en-US');
  const [voiceId, setVoiceId] = useState<string>(''); // voiceURI
  const [pecsMode, setPecsMode] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const quick = [
    'I need help.',
    'Thank you.',
    'Please repeat that.',
    'Can you write it down?',
    "I'm calling about..."
  ];

  const pecs: PecsItem[] = [
    { label: 'Water',  image: '/images/water.png',  phrase: 'I want water.' },
    { label: 'Food',   image: '/images/food.png',   phrase: 'I want food.' },
    { label: 'Toilet', image: '/images/toilet.png', phrase: 'I need the toilet.' },
    { label: 'Break',  image: '/images/break.png',  phrase: 'I need a break.' },
  ];

  // load & cache voices
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  useEffect(() => {
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load);
  }, []);

  const supportsSpeech = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

  // HYDRATE settings from IndexedDB at startup
  useEffect(() => {
    (async () => {
      try {
        const s = await loadSettings(); // Settings | undefined
        if (s) {
          setLang(s.lang ?? 'en-US');
          setVoiceId(s.voiceId ?? '');
          setVolume(typeof s.volume === 'number' ? s.volume : 1);
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  // PERSIST settings whenever they change
  useEffect(() => {
    saveSettings({ lang, voiceId, volume }).catch(() => {});
  }, [lang, voiceId, volume]);

  const speak = (message: string) => {
    if (!supportsSpeech()) return alert('Speech not supported in this browser.');
    const utter = new SpeechSynthesisUtterance(message);
    utter.volume = Math.min(1, Math.max(0, volume));
    utter.lang = lang;

    // pick by voiceURI first; fallback to first voice matching lang
    const voice =
      voices.find(v => v.voiceURI === voiceId) ||
      voices.find(v => v.lang === lang);

    if (voice) utter.voice = voice;

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
    try { (navigator as any).vibrate?.(30); } catch {}
  };

  const stopSpeaking = () => { if (supportsSpeech()) window.speechSynthesis.cancel(); };

  return (
    <main style={{ minHeight:'100vh', background:'#fafafa', padding:20, display:'flex', justifyContent:'center' }}>
      <div style={{ width:'100%', maxWidth: 780, background:'white', border:'1px solid #e5e7eb', borderRadius:16, padding:20 }}>
        <header style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap' }}>
          <h1 style={{ fontSize:26, fontWeight:700 }}>Communication Bridge</h1>
          <button onClick={() => setPecsMode(v => !v)} style={{ padding:'8px 12px', borderRadius:10, border:'1px solid #d1d5db' }}>
            {pecsMode ? 'Switch to Text Mode' : 'Switch to PECS Mode'}
          </button>
        </header>

        <section style={{ marginTop:16 }}>
          <VoiceSelector
            value={voiceId}     // voiceURI
            lang={lang}
            onChange={setVoiceId}
            onLangChange={setLang}
          />
        </section>

        {!pecsMode ? (
          <>
            <label htmlFor="say" style={{ display:'block', marginTop:16, fontWeight:600 }}>Type what you want to say</label>
            <textarea
              id="say"
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type here…"
              style={{ width:'100%', minHeight:120, padding:12, fontSize:18, borderRadius:12, border:'1px solid #d1d5db' }}
            />
            <div style={{ display:'flex', gap:12, marginTop:12, flexWrap:'wrap' }}>
              <button onClick={() => text.trim() && speak(text)} style={{ padding:'10px 16px', borderRadius:12, background:'#2563eb', color:'#fff', border:'none' }}>Speak</button>
              <button onClick={() => { setText(''); textareaRef.current?.focus(); }} style={{ padding:'10px 16px', borderRadius:12, border:'1px solid #d1d5db' }}>Clear</button>
              <button onClick={stopSpeaking} style={{ padding:'10px 16px', borderRadius:12, background:'#ef4444', color:'#fff', border:'none' }}>Stop</button>
            </div>

            <div style={{ marginTop:16, border:'1px solid #e5e7eb', borderRadius:12, padding:12 }}>
              <label htmlFor="vol" style={{ fontWeight:600 }}>Volume: {Math.round(volume*100)}%</label>
              <input id="vol" type="range" min={0} max={1} step={0.01} value={volume}
                     onChange={e => setVolume(parseFloat(e.target.value))} style={{ width:'100%' }} />
            </div>

            <QuickPhrases phrases={quick} onChoose={(p) => speak(p)} />
          </>
        ) : (
          <PecsBoard items={pecs} onSpeak={speak} />
        )}

        <footer style={{ marginTop:16, fontSize:12, color:'#6b7280' }}>
          v0.3 • Settings persist (lang/voice/volume) • PECS mode
        </footer>
      </div>
    </main>
  );
}