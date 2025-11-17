'use client';
import { useEffect, useRef, useState } from 'react';

type AddPecsInput = {
  label: string;
  phrase?: string;
  imageDataURL?: string;
  /** recorded audio as data URL (we'll store it), optional */
  audioDataURL?: string;
};

export default function AddPecsForm({
  onAdd,
}: {
  onAdd: (i: AddPecsInput) => Promise<void> | void;
}) {
  const [label, setLabel] = useState('');
  const [phrase, setPhrase] = useState('');
  const [imageDataURL, setImageDataURL] = useState<string>('');
  const [audioDataURL, setAudioDataURL] = useState<string>('');

  // --- image upload ---
  function fileToDataURL(file: File): Promise<string> {
    return new Promise((res) => {
      const r = new FileReader();
      r.onload = () => res(r.result as string);
      r.readAsDataURL(file);
    });
  }
  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setImageDataURL(await fileToDataURL(f));
  }

  // --- audio recording (MediaRecorder) ---
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || 'audio/webm' });
        // Convert blob to data URL for persistence in IndexedDB
        const reader = new FileReader();
        reader.onloadend = () => setAudioDataURL(reader.result as string);
        reader.readAsDataURL(blob);
        // stop tracks
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setRecording(true);
    } catch (err) {
      alert('Microphone permission denied or unsupported in this browser.');
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  // cleanup if unmount during recording
  useEffect(() => {
    return () => {
      try {
        mediaRecorderRef.current?.stream.getTracks().forEach((t) => t.stop());
      } catch {}
    };
  }, []);

  // --- submit ---
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const l = label.trim();
    if (!l) return;
    await onAdd({ label: l, phrase: phrase.trim(), imageDataURL, audioDataURL });
    setLabel('');
    setPhrase('');
    setImageDataURL('');
    setAudioDataURL('');
  }

  return (
    <form
      onSubmit={submit}
      style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 8 }}
    >
      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        placeholder="Card label (e.g., Water)"
        aria-label="PECS label"
        style={{ padding: 10, borderRadius: 10, border: '1px solid #d1d5db' }}
      />
      <input
        value={phrase}
        onChange={(e) => setPhrase(e.target.value)}
        placeholder="Optional phrase (e.g., I want water.)"
        aria-label="PECS phrase"
        style={{ padding: 10, borderRadius: 10, border: '1px solid #d1d5db' }}
      />
      <label style={{ alignSelf: 'center' }}>
        <input type="file" accept="image/*" onChange={onFile} />
      </label>

      {imageDataURL && (
        <div style={{ gridColumn: '1 / -1', marginTop: 8 }}>
          <img src={imageDataURL} alt="Preview" style={{ height: 96, objectFit: 'contain' }} />
        </div>
      )}

      <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, alignItems: 'center' }}>
        {!recording ? (
          <button type="button" onClick={startRecording} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db' }}>
            🎙️ Start Recording
          </button>
        ) : (
          <button type="button" onClick={stopRecording} style={{ padding: '8px 12px', borderRadius: 8, background: '#ef4444', color: '#fff', border: 'none' }}>
            ⏹ Stop
          </button>
        )}
        {audioDataURL && (
          <>
            <audio controls src={audioDataURL} />
            <button type="button" onClick={() => setAudioDataURL('')} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #d1d5db' }}>
              Remove audio
            </button>
          </>
        )}
      </div>

      <div style={{ gridColumn: '1 / -1', marginTop: 4 }}>
        <button
          type="submit"
          style={{
            padding: '10px 16px',
            borderRadius: 10,
            background: '#16a34a',
            color: '#fff',
            border: 'none',
          }}
        >
          Add Card
        </button>
      </div>
    </form>
  );
}