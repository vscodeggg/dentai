// Voice Controller: Web Speech API dictation & Clinical Scenario Simulator
import React, { useState, useEffect, useRef } from 'react';
import { CLINICAL_SCENARIOS } from '../data/clinicalScenarios.js';

export default function VoiceController({ isListening, onToggleListening, onSpeechInput }) {
  const [activeScenarioId, setActiveScenarioId] = useState(null);
  const [scenarioProgress, setScenarioProgress] = useState(0);
  const recognitionRef = useRef(null);

  // Initialize Web Speech API if supported
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const lastResultIndex = event.results.length - 1;
        const transcript = event.results[lastResultIndex][0].transcript;
        const isFinal = event.results[lastResultIndex].isFinal;

        if (isFinal && transcript.trim()) {
          onSpeechInput(transcript.trim());
        }
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition warning:', event.error);
      };

      recognitionRef.current = recognition;
    }
  }, [onSpeechInput]);

  // Handle live microphone toggle
  useEffect(() => {
    if (!recognitionRef.current) return;

    if (isListening) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        // Recognition might already be running
      }
    } else {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        // Already stopped
      }
    }
  }, [isListening]);

  // Run a preset clinical scenario
  const handleTriggerScenario = (scenario) => {
    if (activeScenarioId) return; // Busy running scenario

    setActiveScenarioId(scenario.id);
    setScenarioProgress(0);

    const total = scenario.utterances.length;
    let currentIdx = 0;

    scenario.utterances.forEach((utt, idx) => {
      setTimeout(() => {
        onSpeechInput(utt.text);
        currentIdx++;
        setScenarioProgress(Math.round((currentIdx / total) * 100));

        if (currentIdx === total) {
          setTimeout(() => {
            setActiveScenarioId(null);
            setScenarioProgress(0);
          }, 800);
        }
      }, utt.delay);
    });
  };

  return (
    <div className="voice-panel">
      {/* Microphone Main Control Button */}
      <div className="mic-toggle-hero">
        <div className="mic-button-wrapper">
          {isListening && <div className="mic-pulse-ring"></div>}
          <button
            className={`mic-btn ${isListening ? 'active' : ''}`}
            onClick={onToggleListening}
            title={isListening ? 'Click to pause voice listening' : 'Click to activate voice dictation'}
          >
            {isListening ? (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              </svg>
            ) : (
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              </svg>
            )}
          </button>
        </div>

        <div className={`mic-status-label ${isListening ? 'listening' : ''}`}>
          {isListening ? (
            <>
              <span className="status-indicator-dot"></span>
              Live Dictation Active
            </>
          ) : (
            'Microphone Standby (Click to Speak)'
          )}
        </div>

        {/* Dynamic Waveform Visualizer */}
        <div className="waveform-container">
          {Array.from({ length: 24 }).map((_, i) => (
            <div
              key={i}
              className={`waveform-bar ${isListening ? 'active' : ''}`}
              style={{
                animationDelay: `${(i % 6) * 0.15}s`,
                height: isListening ? `${8 + ((i * 7) % 20)}px` : '4px'
              }}
            />
          ))}
        </div>
      </div>

      {/* Preset Clinical Voice Scenarios Simulator */}
      <div className="scenario-selector">
        <div className="scenario-title">
          <span>Clinical Speech Scenarios</span>
          {activeScenarioId && <span style={{ color: 'var(--primary-cyan)' }}>Simulating ({scenarioProgress}%)</span>}
        </div>

        <div className="scenario-chips-grid">
          {CLINICAL_SCENARIOS.map(sc => (
            <button
              key={sc.id}
              className="scenario-btn"
              onClick={() => handleTriggerScenario(sc)}
              disabled={activeScenarioId !== null}
            >
              <div className="scenario-btn-name">
                <span>{sc.title}</span>
                {sc.expectedAmbiguity && (
                  <span style={{ fontSize: '0.65rem', color: '#f59e0b', fontWeight: 'bold' }}>⚠️ Ambiguity Test</span>
                )}
              </div>
              <div className="scenario-btn-desc">{sc.subtitle}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
