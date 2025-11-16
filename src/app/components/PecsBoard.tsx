'use client';

export type PecsItem = { label: string; image: string; phrase?: string };

type Props = {
  items: PecsItem[];
  onSpeak: (text: string) => void;
};

export default function PecsBoard({ items, onSpeak }: Props) {
  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, margin: '18px 0 8px' }}>PECS Board</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: 12 }}>
        {items.map((c) => (
          <button key={c.label}
            onClick={() => onSpeak(c.phrase ?? c.label)}
            style={{ border: '1px solid #e5e7eb', borderRadius: 14, padding: 12, background: 'white' }}
          >
            <img src={c.image} alt={c.label} style={{ width: 96, height: 96, objectFit: 'contain' }} />
            <div style={{ marginTop: 8, fontSize: 16, fontWeight: 600 }}>{c.label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}