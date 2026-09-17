// Edit Findings Modal & Tooth Detail Inspector
import React, { useState, useEffect } from 'react';
import { TEETH_DATA, CONDITIONS, CDT_CODES } from '../data/dentalConstants.js';
import { inferCDTCode } from '../utils/dentalParser.js';

export default function ToothDetailModal({
  isOpen,
  tooth,
  existingFindings = [],
  perioRecord,
  onClose,
  onSaveFinding,
  onDeleteFinding
}) {
  if (!isOpen || !tooth) return null;

  // Find if there is an active finding on this tooth, or prepare a new one
  const primaryFinding = existingFindings.find(f => f.toothId === tooth.id) || null;

  const [selectedCondition, setSelectedCondition] = useState('caries');
  const [selectedSurfaces, setSelectedSurfaces] = useState([]);
  const [severity, setSeverity] = useState('Moderate');
  const [cdtCode, setCdtCode] = useState('D2391');
  const [clinicalNote, setClinicalNote] = useState('');
  const [probingDepths, setProbingDepths] = useState([3, 2, 3]);
  const [hasBleeding, setHasBleeding] = useState(false);

  useEffect(() => {
    if (primaryFinding) {
      setSelectedCondition(primaryFinding.condition || 'caries');
      setSelectedSurfaces(primaryFinding.surfaces || []);
      setSeverity(primaryFinding.severity || 'Moderate');
      setCdtCode(primaryFinding.cdtCode || inferCDTCode(tooth.id, primaryFinding.surfaces || [], primaryFinding.condition));
      setClinicalNote(primaryFinding.clinicalNote || primaryFinding.note || '');
    } else {
      setSelectedCondition('caries');
      setSelectedSurfaces(tooth.isAnterior ? ['F'] : ['O']);
      setSeverity('Moderate');
      setCdtCode(tooth.isAnterior ? 'D2330' : 'D2391');
      setClinicalNote('');
    }

    if (perioRecord) {
      setProbingDepths(perioRecord.depths || [3, 2, 3]);
      setHasBleeding(Boolean(perioRecord.bleeding));
    }
  }, [tooth, primaryFinding, perioRecord]);

  // Toggle surface selection
  const toggleSurface = (surf) => {
    let updated;
    if (selectedSurfaces.includes(surf)) {
      updated = selectedSurfaces.filter(s => s !== surf);
    } else {
      updated = [...selectedSurfaces, surf];
    }
    setSelectedSurfaces(updated);
    // Automatically recalculate CDT code based on updated surfaces
    setCdtCode(inferCDTCode(tooth.id, updated, selectedCondition));
  };

  const handleConditionChange = (e) => {
    const newCond = e.target.value;
    setSelectedCondition(newCond);
    setCdtCode(inferCDTCode(tooth.id, selectedSurfaces, newCond));
  };

  const handleSave = () => {
    const findingData = {
      id: primaryFinding?.id || `finding-${Date.now()}`,
      toothId: tooth.id,
      toothName: tooth.shortName,
      arch: tooth.arch,
      quadrant: tooth.quadrant,
      condition: selectedCondition,
      conditionLabel: CONDITIONS[selectedCondition]?.label || selectedCondition,
      surfaces: selectedCondition === 'missing' ? [] : selectedSurfaces,
      severity,
      cdtCode,
      cdtDetails: CDT_CODES[cdtCode],
      clinicalNote,
      perio: selectedCondition === 'perio_pocket' ? { depths: probingDepths, bleeding: hasBleeding } : null,
      confidence: 1.0, // Manually verified by dentist
      status: 'accepted',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    onSaveFinding(findingData);
    onClose();
  };

  const availableSurfaces = tooth.isAnterior
    ? [
        { id: 'I', label: 'Incisal (I)' },
        { id: 'F', label: 'Facial (F)' },
        { id: 'L', label: 'Lingual (L)' },
        { id: 'M', label: 'Mesial (M)' },
        { id: 'D', label: 'Distal (D)' }
      ]
    : [
        { id: 'O', label: 'Occlusal (O)' },
        { id: 'B', label: 'Buccal (B)' },
        { id: 'L', label: 'Lingual (L)' },
        { id: 'M', label: 'Mesial (M)' },
        { id: 'D', label: 'Distal (D)' }
      ];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <h3 className="modal-title">
              Tooth #{tooth.id} - {tooth.name}
            </h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {tooth.quadrant} Quadrant • FDI #{tooth.fdi} • {tooth.arch.toUpperCase()}
            </span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Modal Body Form */}
        <div className="modal-body">
          {/* Condition Selector */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>
              Condition / Diagnosis
            </label>
            <select
              value={selectedCondition}
              onChange={handleConditionChange}
              style={{
                width: '100%',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-primary)',
                padding: '0.6rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem'
              }}
            >
              {Object.entries(CONDITIONS).map(([key, item]) => (
                <option key={key} value={key}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          {/* Surfaces Multi-Selector (if not missing or sound) */}
          {selectedCondition !== 'missing' && selectedCondition !== 'sound' && (
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>
                Affected Surfaces ({selectedSurfaces.join(', ') || 'None selected'})
              </label>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {availableSurfaces.map(surf => {
                  const active = selectedSurfaces.includes(surf.id);
                  return (
                    <button
                      key={surf.id}
                      type="button"
                      onClick={() => toggleSurface(surf.id)}
                      style={{
                        background: active ? 'var(--primary-cyan)' : 'var(--bg-surface)',
                        color: active ? '#0b0f17' : 'var(--text-primary)',
                        border: active ? '1px solid var(--primary-cyan)' : '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '0.4rem 0.75rem',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {surf.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Severity & Procedure Code Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>
                Severity
              </label>
              <select
                value={severity}
                onChange={e => setSeverity(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-primary)',
                  padding: '0.55rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem'
                }}
              >
                <option value="Mild">Mild / Incipient</option>
                <option value="Moderate">Moderate</option>
                <option value="Severe">Severe / Extensive</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>
                CDT Billing Code
              </label>
              <select
                value={cdtCode}
                onChange={e => setCdtCode(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--text-primary)',
                  padding: '0.55rem',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '0.85rem'
                }}
              >
                {Object.entries(CDT_CODES).map(([code, item]) => (
                  <option key={code} value={code}>
                    {item.code} - {item.desc.substring(0, 32)}... (${item.fee})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Periodontal Probing Section */}
          <div style={{ background: 'var(--bg-surface)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Periodontal Probing Depth (mm)</span>
              <label style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#f87171', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={hasBleeding}
                  onChange={e => setHasBleeding(e.target.checked)}
                />
                Bleeding on Probing (BOP)
              </label>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {probingDepths.map((depth, idx) => (
                <input
                  key={idx}
                  type="number"
                  min="1"
                  max="12"
                  value={depth}
                  onChange={e => {
                    const newDepths = [...probingDepths];
                    newDepths[idx] = parseInt(e.target.value, 10) || 1;
                    setProbingDepths(newDepths);
                  }}
                  style={{
                    flex: 1,
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-medium)',
                    color: depth >= 5 ? '#f43f5e' : 'var(--text-primary)',
                    fontWeight: 700,
                    textAlign: 'center',
                    padding: '0.4rem',
                    borderRadius: 'var(--radius-sm)'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Clinical Doctor Notes */}
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>
              Dentist Clinical Notes
            </label>
            <textarea
              rows="3"
              value={clinicalNote}
              onChange={e => setClinicalNote(e.target.value)}
              placeholder="e.g. Active cavitated lesion into dentin. Recommended composite restoration. Patient consented."
              style={{
                width: '100%',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-medium)',
                color: 'var(--text-primary)',
                padding: '0.6rem',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.825rem',
                fontFamily: 'inherit'
              }}
            />
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="modal-footer">
          {primaryFinding && (
            <button
              type="button"
              onClick={() => {
                onDeleteFinding(primaryFinding.id);
                onClose();
              }}
              style={{
                marginRight: 'auto',
                background: 'transparent',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#f87171',
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              Delete Finding
            </button>
          )}

          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>

          <button className="btn-accept" style={{ flex: 'initial', padding: '0.5rem 1.25rem' }} onClick={handleSave}>
            Save to Chart
          </button>
        </div>
      </div>
    </div>
  );
}
