// Dentist Approval Screen & Patient-Friendly Report Generator
import React, { useState } from 'react';
import { CDT_CODES } from '../data/dentalConstants.js';
import { generatePatientReport } from '../utils/patientTranslator.js';

export default function DentistApproval({
  patient,
  approvedFindings = [],
  isApproved,
  approvedAt,
  onApproveVisit,
  onBackToChart,
  onDispatchReport
}) {
  const [activeTab, setActiveTab] = useState('patient-friendly'); // 'patient-friendly' | 'clinical-summary'
  const [doctorPin, setDoctorPin] = useState('');
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchChannel, setDispatchChannel] = useState(null);

  const report = generatePatientReport(patient, approvedFindings);

  const handleSignOffClick = () => {
    if (!isApproved) {
      setShowPinDialog(true);
    }
  };

  const handleConfirmApproval = (e) => {
    e.preventDefault();
    onApproveVisit();
    setShowPinDialog(false);
    setDoctorPin('');
  };

  const handleDispatch = (channel) => {
    setIsDispatching(true);
    setDispatchChannel(channel);

    setTimeout(() => {
      setIsDispatching(false);
      onDispatchReport(channel);
    }, 1200);
  };

  return (
    <div className="approval-view-container">
      {/* Top Controls Header */}
      <div className="approval-header-card">
        <div>
          <button
            className="btn-secondary"
            onClick={onBackToChart}
            style={{ marginBottom: '0.5rem', display: 'inline-flex' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back to Interactive Tooth Chart
          </button>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>
            Clinical Sign-Off & Patient Delivery
          </h2>
          <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
            Patient: <strong>{patient.name}</strong> • DOB: {patient.dob} • Exam Date: {report.examDate}
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="report-mode-toggle">
          <button
            className={`report-mode-btn ${activeTab === 'patient-friendly' ? 'active' : ''}`}
            onClick={() => setActiveTab('patient-friendly')}
          >
            Patient-Friendly Report
          </button>
          <button
            className={`report-mode-btn ${activeTab === 'clinical-summary' ? 'active' : ''}`}
            onClick={() => setActiveTab('clinical-summary')}
          >
            Clinical Chart Summary
          </button>
        </div>
      </div>

      {/* Dentist Sign-off & Dispatch Bar */}
      <div className="dispatch-action-bar">
        <div className="signoff-status">
          {isApproved ? (
            <div className="signoff-stamp approved">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <polyline points="9 12 11 14 15 10" />
              </svg>
              <span>Approved & Signed by Dr. Sarah Lin, DDS ({approvedAt})</span>
            </div>
          ) : (
            <div className="signoff-stamp pending">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>Pending Dentist Clinical Approval</span>
            </div>
          )}
        </div>

        <div className="dispatch-buttons-group">
          {!isApproved ? (
            <button className="btn-accept" style={{ padding: '0.65rem 1.5rem', fontSize: '0.85rem' }} onClick={handleSignOffClick}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Approve & Sign Chart
            </button>
          ) : (
            <>
              <button
                className="btn-portal"
                onClick={() => handleDispatch('portal')}
                disabled={isDispatching}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M22 2L11 13" />
                  <polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
                {isDispatching && dispatchChannel === 'portal' ? 'Sending to Portal...' : 'Send to Patient Portal'}
              </button>

              <button
                className="btn-email"
                onClick={() => handleDispatch('email')}
                disabled={isDispatching}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                {isDispatching && dispatchChannel === 'email' ? 'Generating PDF...' : `Email PDF to ${patient.email}`}
              </button>
            </>
          )}
        </div>
      </div>

      {/* TAB 1: PATIENT-FRIENDLY REPORT */}
      {activeTab === 'patient-friendly' && (
        <div className="patient-report-grid">
          {/* Friendly Greeting & Layperson Intro */}
          <div className="patient-intro-banner">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="patient-intro-title">Your Personalized Smile Care Plan</h3>
              <span className="brand-badge">Verified by AI & Approved by Doctor</span>
            </div>
            <p className="patient-intro-text">
              {report.overallSummary}
            </p>
            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '0.5rem', fontSize: '0.85rem' }}>
              <div>
                <strong>High Priority:</strong>{' '}
                <span style={{ color: '#f87171' }}>{report.stats.urgentCount} item(s)</span>
              </div>
              <div>
                <strong>Recommended Soon:</strong>{' '}
                <span style={{ color: '#fbbf24' }}>{report.stats.recommendedCount} item(s)</span>
              </div>
              <div>
                <strong>Routine Care:</strong>{' '}
                <span style={{ color: '#34d399' }}>{report.stats.routineCount} item(s)</span>
              </div>
            </div>
          </div>

          {/* Cards for each finding translated into plain English */}
          <div className="patient-cards-list">
            {report.items.map(item => (
              <div key={item.id} className="patient-explanation-card">
                <div className="patient-card-header">
                  <h4 className="patient-card-title">{item.title}</h4>
                  <span
                    className={`urgency-badge ${
                      item.urgency === 'Immediate'
                        ? 'urgency-immediate'
                        : item.urgency === 'Recommended Soon'
                        ? 'urgency-soon'
                        : 'urgency-routine'
                    }`}
                  >
                    {item.urgency}
                  </span>
                </div>

                <div className="explanation-section">
                  <div className="explanation-heading">What is happening</div>
                  <div className="explanation-body">{item.whatIsHappening}</div>
                </div>

                <div className="explanation-section">
                  <div className="explanation-heading">Why it matters</div>
                  <div className="explanation-body">{item.whyItMatters}</div>
                </div>

                <div className="explanation-section" style={{ background: 'rgba(6, 182, 212, 0.08)', padding: '0.6rem', borderRadius: 'var(--radius-sm)' }}>
                  <div className="explanation-heading" style={{ color: '#38bdf8' }}>
                    Recommended Next Step
                  </div>
                  <div className="explanation-body" style={{ color: '#f8fafc', fontWeight: 500 }}>
                    {item.recommendedCare}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Home Care Tips Card */}
          <div className="clinical-card" style={{ marginTop: '0.5rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', color: '#34d399' }}>
              💡 Dr. Lin's Custom Oral Care Advice for {patient.name.split(' ')[0]}
            </h4>
            <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
              {report.homeCareTips.map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* TAB 2: CLINICAL CHART SUMMARY (FOR DENTIST & INSURANCE) */}
      {activeTab === 'clinical-summary' && (
        <div className="clinical-card">
          <div className="card-header">
            <h3 className="card-title">Comprehensive Clinical Visit Documentation</h3>
            <span className="card-subtitle">CDT / ADA Standard Billing Codes</span>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginTop: '0.5rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-medium)', textAlign: 'left', color: 'var(--text-tertiary)' }}>
                <th style={{ padding: '0.6rem' }}>Tooth #</th>
                <th style={{ padding: '0.6rem' }}>Surfaces</th>
                <th style={{ padding: '0.6rem' }}>Clinical Diagnosis</th>
                <th style={{ padding: '0.6rem' }}>CDT Code</th>
                <th style={{ padding: '0.6rem' }}>Description</th>
                <th style={{ padding: '0.6rem', textAlign: 'right' }}>Standard Fee</th>
              </tr>
            </thead>
            <tbody>
              {approvedFindings.map(f => {
                const cdt = CDT_CODES[f.cdtCode];
                return (
                  <tr key={f.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.75rem 0.6rem', fontWeight: 700, color: '#38bdf8' }}>
                      #{f.toothId} ({f.toothName})
                    </td>
                    <td style={{ padding: '0.75rem 0.6rem', fontFamily: 'JetBrains Mono', fontWeight: 600 }}>
                      {f.surfaces?.join('') || '—'}
                    </td>
                    <td style={{ padding: '0.75rem 0.6rem' }}>
                      {f.conditionLabel}
                      {f.severity && <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}> ({f.severity})</span>}
                    </td>
                    <td style={{ padding: '0.75rem 0.6rem', fontFamily: 'JetBrains Mono', color: '#a5b4fc' }}>
                      {f.cdtCode}
                    </td>
                    <td style={{ padding: '0.75rem 0.6rem', color: 'var(--text-secondary)' }}>
                      {cdt?.desc || f.clinicalNote || 'Restorative procedure'}
                    </td>
                    <td style={{ padding: '0.75rem 0.6rem', textAlign: 'right', fontWeight: 700 }}>
                      ${cdt?.fee || 0}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid var(--border-medium)', fontWeight: 800 }}>
                <td colSpan="5" style={{ padding: '0.85rem 0.6rem', textAlign: 'right' }}>
                  Total Estimated Exam & Treatment:
                </td>
                <td style={{ padding: '0.85rem 0.6rem', textAlign: 'right', color: 'var(--primary-cyan)', fontSize: '1rem' }}>
                  ${approvedFindings.reduce((s, f) => s + (CDT_CODES[f.cdtCode]?.fee || 0), 0)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* PIN Confirmation Modal */}
      {showPinDialog && (
        <div className="modal-overlay" onClick={() => setShowPinDialog(false)}>
          <div className="modal-dialog" style={{ maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Dentist Electronic Signature</h3>
              <button className="modal-close-btn" onClick={() => setShowPinDialog(false)}>✕</button>
            </div>
            <form onSubmit={handleConfirmApproval}>
              <div className="modal-body">
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Enter your clinician PIN or confirm to certify that all charted diagnoses, surfaces, and treatment plans for <strong>{patient.name}</strong> have been reviewed and approved.
                </p>
                <div style={{ marginTop: '0.5rem' }}>
                  <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>
                    Dentist PIN / Passcode (Demo: 1234)
                  </label>
                  <input
                    type="password"
                    autoFocus
                    placeholder="••••"
                    value={doctorPin}
                    onChange={e => setDoctorPin(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-medium)',
                      borderRadius: 'var(--radius-md)',
                      color: 'var(--text-primary)',
                      fontSize: '1.1rem',
                      textAlign: 'center',
                      letterSpacing: '0.3em'
                    }}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowPinDialog(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-accept" style={{ padding: '0.55rem 1.25rem' }}>
                  Confirm & Lock Chart
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
