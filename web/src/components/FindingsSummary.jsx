// Findings Summary Sidebar: Confirmed Diagnoses & CDT Cost Tally
import React from 'react';
import { CONDITIONS, CDT_CODES } from '../data/dentalConstants.js';

export default function FindingsSummary({
  findings = [],
  onSelectToothById,
  onNavigateToApproval
}) {
  // Compute diagnostic metrics
  const cariesCount = findings.filter(f => f.condition === 'caries' || f.condition === 'recurrent_decay').length;
  const crownsCount = findings.filter(f => f.condition === 'crown').length;
  const perioPockets = findings.filter(f => f.condition === 'perio_pocket').length;

  // Calculate estimated treatment total from CDT codes
  const totalEstimatedCost = findings.reduce((sum, f) => {
    const fee = CDT_CODES[f.cdtCode]?.fee || 0;
    return sum + fee;
  }, 0);

  return (
    <div className="findings-sidebar">
      {/* Quick Diagnostic Metrics */}
      <div className="clinical-card">
        <div className="card-header">
          <h3 className="card-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 20V10M12 20V4M6 20v-6" />
            </svg>
            Exam Analytics
          </h3>
          <span className="card-subtitle">{findings.length} findings</span>
        </div>

        <div className="stats-grid">
          <div className="stat-box">
            <div className="stat-val" style={{ color: '#ef4444' }}>{cariesCount}</div>
            <div className="stat-label">Active Caries</div>
          </div>
          <div className="stat-box">
            <div className="stat-val" style={{ color: '#eab308' }}>{crownsCount}</div>
            <div className="stat-label">Crowns / Caps</div>
          </div>
          <div className="stat-box">
            <div className="stat-val" style={{ color: '#f43f5e' }}>{perioPockets}</div>
            <div className="stat-label">Perio Pockets</div>
          </div>
          <div className="stat-box">
            <div className="stat-val" style={{ color: '#38bdf8' }}>${totalEstimatedCost}</div>
            <div className="stat-label">Est. CDT Value</div>
          </div>
        </div>
      </div>

      {/* Confirmed Findings Chart List */}
      <div className="clinical-card" style={{ flex: 1 }}>
        <div className="card-header">
          <h3 className="card-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Confirmed Chart Items
          </h3>
          <span className="card-subtitle">Click to edit</span>
        </div>

        <div className="findings-list">
          {findings.length === 0 ? (
            <div className="transcript-empty">
              No clinical findings charted yet. Speak findings or accept from queue.
            </div>
          ) : (
            findings.map((f, i) => {
              const cond = CONDITIONS[f.condition] || { label: f.condition, color: '#94a3b8' };
              const cdt = CDT_CODES[f.cdtCode];

              return (
                <div
                  key={f.id || i}
                  className="finding-item-row"
                  onClick={() => onSelectToothById(f.toothId)}
                  style={{ cursor: 'pointer' }}
                  title="Click to view/edit this tooth"
                >
                  <div className="finding-header-line">
                    <span className="finding-title">
                      <span className="tooth-badge-large">#{f.toothId}</span>
                      <span>{f.toothName || `Tooth #${f.toothId}`}</span>
                    </span>

                    {cdt && (
                      <span className="cdt-chip">
                        {cdt.code} (${cdt.fee})
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: cond.color
                      }}
                    >
                      <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: cond.color }}></span>
                      {cond.label}
                    </span>

                    {f.surfaces && f.surfaces.length > 0 && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                        • Surfaces: <strong>{f.surfaces.join('')}</strong>
                      </span>
                    )}

                    {f.perio && (
                      <span style={{ fontSize: '0.75rem', color: '#f43f5e' }}>
                        • Probing: {f.perio.depths.join('-')}mm {f.perio.bleeding ? '(BOP)' : ''}
                      </span>
                    )}
                  </div>

                  {f.clinicalNote && (
                    <div className="finding-desc">
                      "{f.clinicalNote}"
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Dentist Approval Action Button */}
      <button className="btn-primary-glow" onClick={onNavigateToApproval}>
        <span>Review & Dentist Approval</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      </button>
    </div>
  );
}
