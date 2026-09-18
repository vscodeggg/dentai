// Live Voice Transcript with Recognized Dental Entity Highlighting
import React, { useRef, useEffect } from 'react';

/**
 * Highlights clinical keywords within the raw speech text
 */
function highlightTranscriptText(text) {
  if (!text) return null;

  // Split into tokens while identifying dental terms
  const words = text.split(/(\s+)/);

  return words.map((token, i) => {
    const lower = token.toLowerCase();

    // Tooth numbers or digits
    if (/^(?:tooth|number|#|\d{1,2})$/i.test(lower) || /^(?:fourteen|fifteen|three|eight|nineteen|thirty)$/i.test(lower)) {
      return <span key={i} style={{ color: '#38bdf8', fontWeight: 'bold' }}>{token}</span>;
    }
    // Surfaces
    if (/^(?:occlusal|incisal|mesial|distal|buccal|facial|lingual|mod|mo|do)$/i.test(lower)) {
      return <span key={i} style={{ color: '#c084fc', fontWeight: 'bold' }}>{token}</span>;
    }
    // Conditions
    if (/^(?:caries|decay|cavity|fracture|chip|missing|extracted|pocket|bleeding|recurrent)$/i.test(lower)) {
      return <span key={i} style={{ color: '#f87171', fontWeight: 'bold' }}>{token}</span>;
    }
    // Measurements
    if (/^(?:\d+mm|\d+-\d+-\d+|\d)$/.test(lower)) {
      return <span key={i} style={{ color: '#34d399', fontWeight: 'bold' }}>{token}</span>;
    }

    return token;
  });
}

export default function LiveTranscript({ transcripts = [] }) {
  const boxRef = useRef(null);

  useEffect(() => {
    if (boxRef.current) {
      boxRef.current.scrollTop = boxRef.current.scrollHeight;
    }
  }, [transcripts]);

  return (
    <div className="clinical-card">
      <div className="card-header">
        <h3 className="card-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          Live Speech Stream
        </h3>
        <span className="card-subtitle">{transcripts.length} utterances</span>
      </div>

      <div className="transcript-box" ref={boxRef}>
        {transcripts.length === 0 ? (
          <div className="transcript-empty">
            Ready for dictation. Click microphone or select a clinical speech scenario above...
          </div>
        ) : (
          transcripts.map((item, idx) => (
            <div key={idx} className="live-stream-line">
              <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginRight: '0.5rem' }}>
                [{item.timestamp}]
              </span>
              <span>{highlightTranscriptText(item.text)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
