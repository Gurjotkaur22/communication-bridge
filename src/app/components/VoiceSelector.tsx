'use client';
import { useEffect, useMemo, useState } from 'react';

type Props = {
  /** selected voice id (voiceURI), or '' for auto */
  value?: string;
  /** selected language filter, e.g. 'en-US' */
  lang?: string;
  /** returns the selected voice id (voiceURI) */
  onChange: (voiceId: string) => void;
  onLangChange?: (lang: string) => void;
};

export default function VoiceSelector({ value = '', lang = 'en-US', onChange, onLangChange }: Props) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener('voiceschanged', load);
    return () => window.speechSynthesis.removeEventListener('voiceschanged', load);
  }, []);

  // All languages available (deduped)
  const langs = useMemo(
    () => Array.from(new Set(voices.map(v => v.lang))).sort(),
    [voices]
  );

  // Filter by chosen language
  const filtered = useMemo(
    () => voices.filter(v => !lang || v.lang === lang),
    [voices, lang]
  );

  // De-duplicate voices (macOS can return dup entries)
  const uniqueFiltered = useMemo(() => {
    const seen = new Set<string>();
    const out: SpeechSynthesisVoice[] = [];
    for (const v of filtered) {
      // combine multiple fields to be extra safe
      const key = `${v.voiceURI}||${v.name}||${v.lang}`;
      if (!seen.has(key)) {
        seen.add(key);
        out.push(v);
      }
    }
    return out;
  }, [filtered]);

  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
      {/* Language selector */}
      <label>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Language</div>
        <select
          value={lang}
          onChange={(e) => onLangChange?.(e.target.value)}
          style={{ padding: 6, borderRadius: 6 }}
        >
          {langs.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </label>

      {/* Voice selector */}
      <label>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Voice</div>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}   // returns voiceURI
          style={{ padding: 6, borderRadius: 6 }}
        >
          <option value="">(auto)</option>
          {uniqueFiltered.map((v, i) => (
            <option key={`${v.voiceURI}-${i}`} value={v.voiceURI}>
              {v.name} ({v.lang})
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}