'use client';
import { useState } from 'react';

type AddPecsInput = { label: string; phrase?: string; imageDataURL?: string };

export default function AddPecsForm({
  onAdd,
}: {
  onAdd: (i: AddPecsInput) => Promise<void> | void;
}) {
  const [label, setLabel] = useState('');
  const [phrase, setPhrase] = useState('');
  const [imageDataURL, setImageDataURL] = useState<string>('');

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
    const url = await fileToDataURL(f);
    setImageDataURL(url);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const l = label.trim();
    if (!l) return;
    await onAdd({ label: l, phrase: phrase.trim(), imageDataURL });
    setLabel('');
    setPhrase('');
    setImageDataURL('');
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
          <img
            src={imageDataURL}
            alt="Preview"
            style={{ height: 96, objectFit: 'contain' }}
          />
        </div>
      )}

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