'use client';

export type PecsItem = {
  label: string;
  image: string;
  phrase?: string;
  /** Optional recorded audio (data URL or blob URL) */
  audioSrc?: string;
};

type Props = {
  items: PecsItem[];
  onSpeak: (text: string) => void;
};

export default function PecsBoard({ items, onSpeak }: Props) {
  function handleClick(item: PecsItem) {
    if (item.audioSrc) {
      const a = new Audio(item.audioSrc);
      a.play().catch(() => {
        // fallback to TTS if playback fails
        onSpeak(item.phrase ?? item.label);
      });
    } else {
      onSpeak(item.phrase ?? item.label);
    }
  }

  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, margin: '18px 0 8px' }}>PECS Board</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px,1fr))', gap: 12 }}>
        {items.map((c) => (
          <button
            key={c.label}
            onClick={() => handleClick(c)}
            style={{ border: '1px solid #e5e7eb', borderRadius: 14, padding: 12, background: 'white' }}
          >
            <img src={c.image} alt={c.label} style={{ width: 96, height: 96, objectFit: 'contain' }} />
            <div style={{ marginTop: 8, fontSize: 16, fontWeight: 600 }}>{c.label}</div>
            {c.audioSrc && (
              <div style={{ marginTop: 4, fontSize: 12, color: '#6b7280' }}>has recording</div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}