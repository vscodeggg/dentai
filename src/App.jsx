// Master Application: AuraDent AI Voice-First Dental Assistant
import React, { useState, useCallback } from 'react';
import Header from './components/Header.jsx';
import VoiceController from './components/VoiceController.jsx';
import LiveTranscript from './components/LiveTranscript.jsx';
import ReviewQueue from './components/ReviewQueue.jsx';
import ToothChart from './components/ToothChart.jsx';
import ToothDetailModal from './components/ToothDetailModal.jsx';
import FindingsSummary from './components/FindingsSummary.jsx';
import DentistApproval from './components/DentistApproval.jsx';
import PatientSelector from './components/PatientSelector.jsx';

import { INITIAL_PATIENTS } from './data/initialPatients.js';
import { TEETH_DATA } from './data/dentalConstants.js';
import { parseDentalSpeech } from './utils/dentalParser.js';

export default function App() {
  // Active Patient State
  const [currentPatient, setCurrentPatient] = useState(INITIAL_PATIENTS[0]);
  const [isPatientSelectorOpen, setIsPatientSelectorOpen] = useState(false);

  // Active Findings State (Initialized from baseline patient data)
  const [confirmedFindings, setConfirmedFindings] = useState(INITIAL_PATIENTS[0].existingFindings || []);
  const [perioRecords, setPerioRecords] = useState(INITIAL_PATIENTS[0].perioMeasurements || {});

  // Voice & AI Stream State
  const [isListening, setIsListening] = useState(false);
  const [transcripts, setTranscripts] = useState([
    {
      text: "Voice engine initialized. Baseline chart loaded for Marcus Vance.",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [candidateFindings, setCandidateFindings] = useState([]);

  // Navigation & Inspection View State
  const [activeView, setActiveView] = useState('charting'); // 'charting' | 'approval'
  const [selectedTooth, setSelectedTooth] = useState(null);
  const [isToothModalOpen, setIsToothModalOpen] = useState(false);

  // Approval & Dispatch State
  const [isApproved, setIsApproved] = useState(false);
  const [approvedAt, setApprovedAt] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Toast Helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3800);
  };

  // Switch Active Patient
  const handleSelectPatient = (patient) => {
    setCurrentPatient(patient);
    setConfirmedFindings(patient.existingFindings || []);
    setPerioRecords(patient.perioMeasurements || {});
    setCandidateFindings([]);
    setIsApproved(false);
    setApprovedAt(null);
    setTranscripts([
      {
        text: `Loaded patient record for ${patient.name}. Baseline chart ready.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    showToast(`Switched active patient to ${patient.name}`);
  };

  // Speech Input Event Handler: Converts natural language into structured finding
  const handleSpeechInput = useCallback((rawText) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Append to live transcript log
    setTranscripts(prev => [...prev, { text: rawText, timestamp }]);

    // Context-Aware Parse
    const parsedFinding = parseDentalSpeech(rawText, currentPatient);

    if (parsedFinding) {
      setCandidateFindings(prev => [parsedFinding, ...prev]);

      if (parsedFinding.ambiguity?.isAmbiguous) {
        showToast(`⚠️ Ambiguity flagged on Tooth #${parsedFinding.toothId}. Check review queue.`);
      } else {
        showToast(`Parsed Tooth #${parsedFinding.toothId} (${parsedFinding.conditionLabel}). Ready in queue.`);
      }
    } else {
      showToast(`Dictation logged: "${rawText.substring(0, 30)}..."`);
    }
  }, [currentPatient]);

  // Review Queue Actions: Accept
  const handleAcceptFinding = (candidate) => {
    // Commit to confirmed chart findings
    setConfirmedFindings(prev => {
      // Remove any prior conflicting finding on same tooth & surface
      const filtered = prev.filter(f => f.toothId !== candidate.toothId || f.id === candidate.id);
      return [...filtered, candidate];
    });

    // Update periodontal probing records if applicable
    if (candidate.perio) {
      setPerioRecords(prev => ({
        ...prev,
        [candidate.toothId]: candidate.perio
      }));
    }

    // Remove from pending queue
    setCandidateFindings(prev => prev.filter(c => c.id !== candidate.id));
    showToast(`✓ Committed Tooth #${candidate.toothId} finding to official chart`);
  };

  // Review Queue Actions: Edit
  const handleEditFinding = (candidate) => {
    const toothObj = TEETH_DATA.find(t => t.id === candidate.toothId);
    if (toothObj) {
      setSelectedTooth(toothObj);
      setIsToothModalOpen(true);
    }
  };

  // Review Queue Actions: Reject
  const handleRejectFinding = (candidate) => {
    setCandidateFindings(prev => prev.filter(c => c.id !== candidate.id));
    showToast(`Discarded candidate finding for Tooth #${candidate.toothId}`);
  };

  // Resolve Ambiguity Action
  const handleResolveAmbiguity = (candidate, resolution) => {
    const toothObj = TEETH_DATA.find(t => t.id === resolution.toothId);
    const updatedCandidate = {
      ...candidate,
      toothId: resolution.toothId || candidate.toothId,
      toothName: toothObj?.shortName || candidate.toothName,
      arch: toothObj?.arch || candidate.arch,
      quadrant: toothObj?.quadrant || candidate.quadrant,
      condition: resolution.condition || candidate.condition,
      surfaces: resolution.surfaces || candidate.surfaces,
      ambiguity: { isAmbiguous: false, reason: 'Resolved by dentist' },
      confidence: 0.98
    };

    setCandidateFindings(prev =>
      prev.map(c => (c.id === candidate.id ? updatedCandidate : c))
    );
    showToast(`Resolved ambiguity: Switched to Tooth #${updatedCandidate.toothId}`);
  };

  // Manual Tooth Selection on Chart
  const handleSelectTooth = (tooth) => {
    setSelectedTooth(tooth);
    setIsToothModalOpen(true);
  };

  const handleSelectToothById = (toothId) => {
    const toothObj = TEETH_DATA.find(t => t.id === toothId);
    if (toothObj) {
      setSelectedTooth(toothObj);
      setIsToothModalOpen(true);
    }
  };

  // Save manual finding from modal
  const handleSaveToothFinding = (findingData) => {
    setConfirmedFindings(prev => {
      const filtered = prev.filter(f => f.toothId !== findingData.toothId);
      return [...filtered, findingData];
    });

    if (findingData.perio) {
      setPerioRecords(prev => ({
        ...prev,
        [findingData.toothId]: findingData.perio
      }));
    }

    // Also remove any pending review item for this tooth
    setCandidateFindings(prev => prev.filter(c => c.toothId !== findingData.toothId));
    showToast(`Updated Tooth #${findingData.toothId} on chart`);
  };

  // Delete finding
  const handleDeleteFinding = (findingId) => {
    setConfirmedFindings(prev => prev.filter(f => f.id !== findingId));
    showToast(`Removed finding from chart`);
  };

  // Dentist Approval Action
  const handleApproveVisit = () => {
    setIsApproved(true);
    const stamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setApprovedAt(stamp);
    showToast(`Dental chart locked and clinically approved by Dr. Lin at ${stamp}`);
  };

  // Dispatch Patient-Friendly Report
  const handleDispatchReport = (channel) => {
    if (channel === 'portal') {
      showToast(`Report successfully dispatched to HealthVault Patient Portal for ${currentPatient.name}`);
    } else {
      showToast(`PDF care summary and instructions emailed to ${currentPatient.email}`);
    }
  };

  return (
    <div className="app-container">
      {/* Top Clinical Header */}
      <Header
        activeView={activeView}
        onNavigate={setActiveView}
        isListening={isListening}
        candidateCount={candidateFindings.length}
        onOpenPatientSelector={() => setIsPatientSelectorOpen(true)}
        currentPatient={currentPatient}
      />

      {/* Patient Demographic Bar */}
      <div className="patient-bar">
        <div className="patient-info-group">
          <div className="patient-identity">
            <div className="patient-avatar">
              {currentPatient.name.charAt(0)}
            </div>
            <div className="patient-meta">
              <h2>{currentPatient.name}</h2>
              <div className="patient-submeta">
                <span>Age: {currentPatient.age} ({currentPatient.gender})</span>
                <span>• DOB: {currentPatient.dob}</span>
                <span>• Last Exam: {currentPatient.lastVisit}</span>
                <span>• Insurance: {currentPatient.insurance}</span>
              </div>
            </div>
          </div>

          {/* Medical Alerts & Risk Indicators */}
          <div className="medical-alerts-strip">
            {currentPatient.medicalAlerts.map((alert, i) => (
              <span key={i} className={`alert-chip ${alert.type}`}>
                {alert.type === 'danger' && '⚠️ '}
                {alert.type === 'warning' && '⚡ '}
                {alert.text}
              </span>
            ))}
            <span className="alert-chip info">
              Perio Risk: {currentPatient.perioRisk}
            </span>
          </div>
        </div>

        <div className="patient-actions">
          <button className="btn-secondary" onClick={() => setIsPatientSelectorOpen(true)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <line x1="20" y1="8" x2="20" y2="14" />
              <line x1="23" y1="11" x2="17" y2="11" />
            </svg>
            Switch Patient
          </button>
        </div>
      </div>

      {/* VIEW 1: INTERACTIVE CHARTING & VOICE RECOGNITION */}
      {activeView === 'charting' && (
        <main className="workspace-grid">
          {/* Column 1: Voice Controller, Live Transcript, & AI Review Queue */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <VoiceController
              isListening={isListening}
              onToggleListening={() => setIsListening(prev => !prev)}
              onSpeechInput={handleSpeechInput}
            />

            <LiveTranscript transcripts={transcripts} />

            <ReviewQueue
              candidateFindings={candidateFindings}
              onAccept={handleAcceptFinding}
              onEdit={handleEditFinding}
              onReject={handleRejectFinding}
              onResolveAmbiguity={handleResolveAmbiguity}
            />
          </div>

          {/* Column 2: Interactive 32-Tooth Dental Arch Visualizer */}
          <div>
            <ToothChart
              findings={confirmedFindings}
              perioRecords={perioRecords}
              selectedTooth={selectedTooth}
              onSelectTooth={handleSelectTooth}
            />
          </div>

          {/* Column 3: Findings Summary & Dentist Approval Button */}
          <div>
            <FindingsSummary
              findings={confirmedFindings}
              onSelectToothById={handleSelectToothById}
              onNavigateToApproval={() => setActiveView('approval')}
            />
          </div>
        </main>
      )}

      {/* VIEW 2: DENTIST APPROVAL SCREEN & PATIENT-FRIENDLY REPORT */}
      {activeView === 'approval' && (
        <DentistApproval
          patient={currentPatient}
          approvedFindings={confirmedFindings}
          isApproved={isApproved}
          approvedAt={approvedAt}
          onApproveVisit={handleApproveVisit}
          onBackToChart={() => setActiveView('charting')}
          onDispatchReport={handleDispatchReport}
        />
      )}

      {/* Tooth Detail & Manual Findings Editor Modal */}
      <ToothDetailModal
        isOpen={isToothModalOpen}
        tooth={selectedTooth}
        existingFindings={confirmedFindings}
        perioRecord={selectedTooth ? perioRecords[selectedTooth.id] : null}
        onClose={() => setIsToothModalOpen(false)}
        onSaveFinding={handleSaveToothFinding}
        onDeleteFinding={handleDeleteFinding}
      />

      {/* Patient Switcher Modal */}
      <PatientSelector
        isOpen={isPatientSelectorOpen}
        currentPatient={currentPatient}
        onSelectPatient={handleSelectPatient}
        onClose={() => setIsPatientSelectorOpen(false)}
      />

      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="toast-notification">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--primary-cyan)" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
