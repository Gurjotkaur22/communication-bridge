'use client';

import { useEffect, useRef, useState } from 'react';
import VoiceSelector from './components/VoiceSelector';
import QuickPhrases from './components/QuickPhrases';
import PecsBoard, { PecsItem } from './components/PecsBoard';
import AddPhraseForm from './components/AddPhraseForm';
import AddPecsForm from './components/AddPecsForm';

import {
  loadSettings,
  saveSettings,
  listPhrases,
  upsertPhrase,
  deletePhrase,
  listPecs,
  upsertPecs,
  deletePecs,
} from './lib/db';

export default function Home() {
  // core settings
  const [text, setText] = useState('');
  const [volume, setVolume] = useState(1);
  const [lang, setLang] = useState('en-US');
  const [voiceId, setVoiceId] = useState<string>(''); // voiceURI
  const [pecsMode, setPecsMode] = useState(false);
  const [editMode, setEditMode] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // defaults
  const defaultQuick = [
    'I need help.',
    'Thank you.',
    'Please repeat that.',
    'Can you write it down?',
    "I'm calling about...",
  ];
  const defaultPecs: PecsItem[] = [
    { label: 'Water', image: '/images/water.png', phrase: 'I want water.' },
    { label: 'Food', image: '/images/food.png', phrase: 'I want food.' },
    { label: 'Toilet', image: '/images/toilet.png', phrase: 'I need the toilet.' },
    { label: 'Break', image: '/images/break.png', phrase: 'I need a break.' },
  ];

  const [quick, setQuick] = useState<string[]>(defaultQuick);
  const [pecs, setPecs] = useState<PecsItem[]>(defaultPecs);

  // voices
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  useEffect(() => {
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load);
  }, []);

  const supportsSpeech = () =>
    typeof window !== 'undefined' && 'speechSynthesis' in window;

  // hydrate settings + user data
  useEffect(() => {
    (async () => {
      try {
        const s = await loadSettings();
        if (s) {
          setLang(s.lang ?? 'en-US');
          setVoiceId(s.voiceId ?? '');
          setVolume(typeof s.volume === 'number' ? s.volume : 1);
        }
        const [dbPhrases, dbPecs] = await Promise.all([listPhrases(), listPecs()]);
        if (dbPhrases.length)
          setQuick([...defaultQuick, ...dbPhrases.map((p) => p.text)]);
        if (dbPecs.length)
          setPecs([
            ...defaultPecs,
            ...dbPecs.map((c) => ({
              label: c.label,
              phrase: c.phrase,
              image: c.imageDataURL || '/images/blank.png',
              audioSrc: c.audioBlobURL || undefined,
            })),
          ]);
      } catch {
        // ignore
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // persist settings
  useEffect(() => {
    saveSettings({ lang, voiceId, volume }).catch(() => {});
  }, [lang, voiceId, volume]);

  const speak = (message: string) => {
    if (!supportsSpeech()) return alert('Speech not supported in this browser.');
    const utter = new SpeechSynthesisUtterance(message);
    utter.volume = Math.min(1, Math.max(0, volume));
    utter.lang = lang;
    const v =
      voices.find((vo) => vo.voiceURI === voiceId) ||
      voices.find((vo) => vo.lang === lang);
    if (v) utter.voice = v;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
    try {
      (navigator as any).vibrate?.(30);
    } catch {}
  };

  const stopSpeaking = () => {
    if (supportsSpeech()) window.speechSynthesis.cancel();
  };

  // styles
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

  // edit mode actions — phrases
  async function addPhrase(text: string) {
    if (!text.trim()) return;
    await upsertPhrase(text.trim());
    const dbPhrases = await listPhrases();
    setQuick([...defaultQuick, ...dbPhrases.map((p) => p.text)]);
  }
  async function removePhrase(textToRemove: string) {
    const dbPhrases = await listPhrases();
    const match = dbPhrases.find((p) => p.text === textToRemove);
    if (match) {
      await deletePhrase(match.id);
      const next = await listPhrases();
      setQuick([...defaultQuick, ...next.map((p) => p.text)]);
    }
  }

  // edit mode actions — PECS (now supports audio)
  async function addPecsCard(input: { label: string; phrase?: string; imageDataURL?: string; audioDataURL?: string }) {
    await upsertPecs({
      label: input.label.trim(),
      phrase: input.phrase?.trim() ?? '',
      imageDataURL: input.imageDataURL ?? '',
      audioBlobURL: input.audioDataURL ?? '', // store recording
    });
    const dbP = await listPecs();
    setPecs([
      ...defaultPecs,
      ...dbP.map((c) => ({
        label: c.label,
        phrase: c.phrase,
        image: c.imageDataURL || '/images/blank.png',
        audioSrc: c.audioBlobURL || undefined,
      })),
    ]);
  }
  async function removePecsCard(label: string) {
    const dbP = await listPecs();
    const match = dbP.find((c) => c.label === label);
    if (match) {
      await deletePecs(match.id);
      const next = await listPecs();
      setPecs([
        ...defaultPecs,
        ...next.map((c) => ({
          label: c.label,
          phrase: c.phrase,
          image: c.imageDataURL || '/images/blank.png',
          audioSrc: c.audioBlobURL || undefined,
        })),
      ]);
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#fafafa',
        padding: 20,
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 820,
          background: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: 16,
          padding: 20,
        }}
      >
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <h1 style={{ fontSize: 26, fontWeight: 700 }}>Communication Bridge</h1>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => setEditMode((v) => !v)} style={btn} aria-pressed={editMode}>
              {editMode ? 'Exit Edit Mode' : 'Enter Edit Mode'}
            </button>
            <button onClick={() => setPecsMode((v) => !v)} style={btn}>
              {pecsMode ? 'Switch to Text Mode' : 'Switch to PECS Mode'}
            </button>
          </div>
        </header>

        <section style={{ marginTop: 16 }}>
          <VoiceSelector value={voiceId} lang={lang} onChange={setVoiceId} onLangChange={setLang} />
        </section>

        {!pecsMode ? (
          <>
            <label htmlFor="say" style={{ display: 'block', marginTop: 16, fontWeight: 600 }}>
              Type what you want to say
            </label>
            <textarea
              id="say"
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Type here…"
              style={{
                width: '100%',
                minHeight: 120,
                padding: 12,
                fontSize: 18,
                borderRadius: 12,
                border: '1px solid #d1d5db',
              }}
            />
            <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
              <button onClick={() => text.trim() && speak(text)} style={primaryBtn}>
                Speak
              </button>
              <button
                onClick={() => {
                  setText('');
                  textareaRef.current?.focus();
                }}
                style={btn}
              >
                Clear
              </button>
              <button onClick={stopSpeaking} style={dangerBtn}>
                Stop
              </button>
            </div>

            <div style={{ marginTop: 16, border: '1px solid #e5e7eb', borderRadius: 12, padding: 12 }}>
              <label htmlFor="vol" style={{ fontWeight: 600 }}>
                Volume: {Math.round(volume * 100)}%
              </label>
              <input
                id="vol"
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                style={{ width: '100%' }}
              />
            </div>

            <QuickPhrases phrases={quick} onChoose={(p) => speak(p)} />

            {editMode && (
              <section style={{ marginTop: 16, borderTop: '1px solid #eee', paddingTop: 16 }}>
                <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Manage Phrases</h3>
                <AddPhraseForm onAdd={addPhrase} />
                <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {quick
                    .filter((p) => !defaultQuick.includes(p))
                    .map((p) => (
                      <button key={p} onClick={() => removePhrase(p)} style={dangerBtn}>
                        Delete “{p}”
                      </button>
                    ))}
                </div>
              </section>
            )}
          </>
        ) : (
          <>
            <PecsBoard items={pecs} onSpeak={speak} />
            {editMode && (
              <section style={{ marginTop: 16, borderTop: '1px solid #eee', paddingTop: 16 }}>
                <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Manage PECS</h3>
                <AddPecsForm onAdd={addPecsCard} />
                <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {pecs
                    .filter((c) => !defaultPecs.find((d) => d.label === c.label))
                    .map((c) => (
                      <button key={c.label} onClick={() => removePecsCard(c.label)} style={dangerBtn}>
                        Delete “{c.label}”
                      </button>
                    ))}
                </div>
              </section>
            )}
          </>
        )}

        <footer style={{ marginTop: 16, fontSize: 12, color: '#6b7280' }}>
          v0.5 • PECS audio recording & playback • Edit Mode persisted
        </footer>
      </div>
    </main>
  );
}