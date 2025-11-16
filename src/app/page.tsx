'use client'; // allows browser features like speech synthesis

import { useState } from 'react';

export default function Home() {
  // state variables to store input text and volume
  const [text, setText] = useState('');
  const [volume, setVolume] = useState(1);

  // list of quick phrases
  const quickPhrases = [
    'I need help.',
    'Thank you.',
    'Please repeat that.',
    'Can you write it down?',
    "I'm calling about..."
  ];

  // helper: speak out loud using browser's Web Speech API
  const speak = (message: string) => {
    if (!window.speechSynthesis) {
      alert('Speech synthesis not supported on this browser.');
      return;
    }
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.volume = volume;
    window.speechSynthesis.cancel(); // stop any ongoing speech
    window.speechSynthesis.speak(utterance);
  };

  return (
    <main style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: '#fafafa',
      padding: 20
    }}>
      <h1 style={{ fontSize: 28, fontWeight: 600, marginBottom: 20 }}>
        Communication Bridge
      </h1>

      <textarea
        placeholder="Type what you want to say..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{
          width: '80%',
          height: 100,
          fontSize: 18,
          padding: 10,
          borderRadius: 10,
          border: '1px solid #ccc'
        }}
      />

      <div style={{ marginTop: 10, display: 'flex', gap: 10 }}>
        <button
          onClick={() => speak(text)}
          style={{
            padding: '10px 20px',
            fontSize: 16,
            borderRadius: 8,
            background: '#2563eb',
            color: 'white',
            border: 'none'
          }}
        >
          Speak
        </button>
        <button
          onClick={() => setText('')}
          style={{
            padding: '10px 20px',
            fontSize: 16,
            borderRadius: 8,
            background: '#e5e7eb',
            border: 'none'
          }}
        >
          Clear
        </button>
      </div>

      <div style={{
        marginTop: 20,
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 10,
        width: '80%'
      }}>
        {quickPhrases.map((phrase, i) => (
          <button
            key={i}
            onClick={() => speak(phrase)}
            style={{
              padding: '10px',
              fontSize: 16,
              borderRadius: 8,
              background: '#f1f5f9',
              border: '1px solid #d1d5db'
            }}
          >
            {phrase}
          </button>
        ))}
      </div>

      <div style={{ marginTop: 30 }}>
        <label>Volume: {Math.round(volume * 100)}%</label><br />
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
        />
      </div>
    </main>
  );
}