'use client';
import { useEffect, useState } from 'react';

type Props = {
  value?: string;          // voice name
  lang?: string;           // e.g. 'en-US'
  onChange: (voiceName: string) => void;
  onLangChange?: (lang: string) => void;
};

export default function VoiceSelector({ value, lang = 'en-US', onChange, onLangChange }: Props) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load);
  }, []);

  const langs = Array.from(new Set(voices.map(v => v.lang))).sort();

  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      <label>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Language</div>
        <select value={lang} onChange={e => onLangChange?.(e.target.value)}>
          {langs.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
      </label>

      <label>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Voice</div>
        <select
          value={value || ''}
          onChange={e => onChange(e.target.value)}
        >
          <option value="">(auto)</option>
          {voices
            .filter(v => !lang || v.lang === lang)
            .map(v => <option key={v.name} value={v.name}>{v.name} ({v.lang})</option>)}
        </select>
      </label>
    </div>
  );
}