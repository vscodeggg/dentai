// Review Queue: Accept / Edit / Reject AI Findings with Ambiguity Resolution
import React from 'react';

export default function ReviewQueue({
  candidateFindings = [],
  onAccept,
  onEdit,
  onReject,
  onResolveAmbiguity
}) {
  return (
    <div className="clinical-card">
      <div className="card-header">
        <h3 className="card-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 11 12 14 22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
          AI Findings Review Queue
        </h3>
        <span className="card-subtitle">{candidateFindings.length} pending approval</span>
      </div>

      <div className="review-queue-list">
        {candidateFindings.length === 0 ? (
          <div className="transcript-empty">
            Queue clear. Voice findings will populate here for one-click verification.
          </div>
        ) : (
          candidateFindings.map((finding) => {
            const hasAmbiguity = finding.ambiguity?.isAmbiguous;
            const isDanger = finding.ambiguity?.severity === 'high';

            return (
              <div
                key={finding.id}
                className={`review-card ${hasAmbiguity ? (isDanger ? 'has-conflict' : 'has-ambiguity') : ''}`}
              >
                {/* Header row: Tooth number & AI confidence */}
                <div className="review-card-top">
                  <div className="review-tooth-info">
                    <span className="tooth-badge-large">#{finding.toothId}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                      {finding.toothName}
                    </span>
                  </div>

                  <span
                    className={`confidence-pill ${
                      finding.confidence >= 0.9
                        ? 'confidence-high'
                        : finding.confidence >= 0.75
                        ? 'confidence-medium'
                        : 'confidence-low'
                    }`}
                  >
                    {Math.round(finding.confidence * 100)}% Confidence
                  </span>
                </div>

                {/* Extracted Details */}
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <strong>Finding:</strong>{' '}
                  <span style={{ color: '#f8fafc', fontWeight: 600 }}>{finding.conditionLabel}</span>
                  {finding.surfaces?.length > 0 && (
                    <span> ({finding.surfaces.join('')})</span>
                  )}
                  {finding.perio && (
                    <span> - {finding.perio.depths.join('-')}mm {finding.perio.bleeding ? '🩸 BOP' : ''}</span>
                  )}
                </div>

                {/* Ambiguity Alert Card */}
                {hasAmbiguity && (
                  <div className={`ambiguity-alert-box ${isDanger ? 'danger' : ''}`}>
                    <div className="ambiguity-header">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                      {isDanger ? 'Chart Conflict Detected' : 'Clinical Ambiguity Check'}
                    </div>

                    <div>{finding.ambiguity.reason}</div>

                    {/* Quick disambiguation resolution button */}
                    {finding.ambiguity.suggestedToothId && (
                      <div className="disambiguation-actions">
                        <button
                          className="btn-disambiguate"
                          onClick={() =>
                            onResolveAmbiguity(finding, {
                              toothId: finding.ambiguity.suggestedToothId,
                              condition: finding.ambiguity.suggestedCondition || finding.condition,
                              surfaces: finding.ambiguity.suggestedSurfaces || finding.surfaces
                            })
                          }
                        >
                          Switch to #{finding.ambiguity.suggestedToothId}
                        </button>
                        {finding.condition === 'caries' && (
                          <button
                            className="btn-disambiguate"
                            onClick={() =>
                              onResolveAmbiguity(finding, {
                                condition: 'recurrent_decay'
                              })
                            }
                          >
                            Mark as Recurrent Margin Decay
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Raw Transcript Snippet */}
                <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                  "{finding.rawTranscript}"
                </div>

                {/* Action Buttons: Accept / Edit / Reject */}
                <div className="review-actions-bar">
                  <button
                    className="btn-accept"
                    onClick={() => onAccept(finding)}
                    title="Accept finding and commit to dental chart"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Accept
                  </button>

                  <button
                    className="btn-edit-action"
                    onClick={() => onEdit(finding)}
                    title="Edit finding surfaces or codes"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 20h9"/>
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                    </svg>
                    Edit
                  </button>

                  <button
                    className="btn-reject"
                    onClick={() => onReject(finding)}
                    title="Reject and discard finding"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                    Reject
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
