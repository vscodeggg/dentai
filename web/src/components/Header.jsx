// Clinic Header & Global App Navigation
import React, { useState, useEffect } from 'react';

export default function Header({
  activeView,
  onNavigate,
  isListening,
  candidateCount,
  onOpenPatientSelector,
  currentPatient
}) {
  const [elapsedSeconds, setElapsedSeconds] = useState(145);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <header className="main-header">
      {/* Brand Logo & Name */}
      <div className="header-brand">
        <div className="logo-badge">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M12 2C8 2 6 5 6 9c0 4 2 8 3 11 1 3 3 3 3 3s2 0 3-3c1-3 3-7 3-11 0-4-2-7-6-7z"/>
            <path d="M9 11c1-1 2-1 3 0 1-1 2-1 3 0" strokeWidth="1.5" />
          </svg>
        </div>
        <div className="brand-info">
          <h1>
            AuraDent AI
            <span className="brand-badge">Voice-First v2.4</span>
          </h1>
          <p>Real-Time Natural Speech Dental Charting & Patient Communicator</p>
        </div>
      </div>

      {/* Center View Tabs */}
      <div className="nav-tabs-pill">
        <button
          className={`nav-tab-btn ${activeView === 'charting' ? 'active' : ''}`}
          onClick={() => onNavigate('charting')}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M9 21V9" />
          </svg>
          Interactive Charting
          {candidateCount > 0 && (
            <span
              style={{
                background: '#f43f5e',
                color: '#ffffff',
                fontSize: '0.65rem',
                padding: '1px 5px',
                borderRadius: '999px',
                fontWeight: 800
              }}
            >
              {candidateCount}
            </span>
          )}
        </button>

        <button
          className={`nav-tab-btn ${activeView === 'approval' ? 'active' : ''}`}
          onClick={() => onNavigate('approval')}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          Dentist Approval & Patient Report
        </button>
      </div>

      {/* Right Controls */}
      <div className="header-actions">
        {/* Visit Timer */}
        <div style={{ fontSize: '0.75rem', fontFamily: 'JetBrains Mono', color: 'var(--text-secondary)' }}>
          Exam Time: <strong style={{ color: 'var(--text-primary)' }}>{formatTime(elapsedSeconds)}</strong>
        </div>

        {/* AI Engine Status */}
        <div className="engine-status-pill">
          <span className="status-indicator-dot"></span>
          <span>Context-Engine Active</span>
        </div>

        {/* Doctor Info */}
        <div className="doctor-pill">
          <div className="doctor-avatar">SL</div>
          <span>Dr. Sarah Lin, DDS</span>
        </div>
      </div>
    </header>
  );
}
