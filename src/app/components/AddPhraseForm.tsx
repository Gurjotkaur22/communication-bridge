'use client';
import { useState } from 'react';

export default function AddPhraseForm({
  onAdd,
}: {
  onAdd: (text: string) => Promise<void> | void;
}) {
  const [val, setVal] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = val.trim();
    if (!t) return;
    await onAdd(t);
    setVal('');
  }

  return (
    <form onSubmit={submit} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="New quick phrase"
        aria-label="New quick phrase"
        style={{
          flex: 1,
          minWidth: 220,
          padding: 10,
          borderRadius: 10,
          border: '1px solid #d1d5db',
        }}
      />
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
        Add
      </button>
    </form>
  );
}