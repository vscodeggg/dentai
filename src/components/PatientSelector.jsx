// Patient Selector Modal & Demographic Switcher
import React from 'react';
import { INITIAL_PATIENTS } from '../data/initialPatients.js';

export default function PatientSelector({
  isOpen,
  currentPatient,
  onSelectPatient,
  onClose
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Select Active Dental Patient</h3>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Switching patient will isolate and restore their individual dental chart, past findings, and clinical voice session.
          </p>

          <div className="patient-select-list">
            {INITIAL_PATIENTS.map(patient => {
              const isSelected = patient.id === currentPatient.id;

              return (
                <div
                  key={patient.id}
                  className={`patient-choice-card ${isSelected ? 'active' : ''}`}
                  onClick={() => {
                    onSelectPatient(patient);
                    onClose();
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div className="patient-avatar">
                      {patient.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                        {patient.name} {isSelected && <span style={{ color: 'var(--primary-cyan)', fontSize: '0.75rem' }}>(Current)</span>}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                        Age {patient.age} • DOB: {patient.dob} • Last: {patient.lastVisit}
                      </div>
                      <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                        {patient.medicalAlerts.map((alt, i) => (
                          <span key={i} className={`alert-chip ${alt.type}`}>
                            {alt.text}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button className="btn-secondary">
                    {isSelected ? 'Selected' : 'Load Chart'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
