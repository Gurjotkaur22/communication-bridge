'use client';

type Props = {
  phrases: string[];
  onChoose: (text: string) => void;
};

export default function QuickPhrases({ phrases, onChoose }: Props) {
  return (
    <div>
      <h2 style={{ fontSize: 18, fontWeight: 700, margin: '18px 0 8px' }}>Quick phrases</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px,1fr))', gap: 10 }}>
        {phrases.map((p, i) => (
          <button key={i}
            onClick={() => onChoose(p)}
            style={{ padding: 10, fontSize: 16, borderRadius: 12, border: '1px solid #d1d5db', background: '#f8fafc' }}
            aria-label={`Say: ${p}`}
          >{p}</button>
        ))}
      </div>
    </div>
  );
}