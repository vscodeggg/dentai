// Interactive 32-Tooth Chart Component (Universal Numbering 1-32 & FDI System)
import React, { useState } from 'react';
import { TEETH_DATA, CONDITIONS } from '../data/dentalConstants.js';

/**
 * Renders an anatomically accurate SVG multi-surface tooth diagram
 */
function ToothSurfaceMap({ tooth, activeFindings, perioData, isSelected, onClick }) {
  // Determine color for each surface
  const getSurfaceColor = (surfaceId) => {
    // Check if tooth is missing
    const isMissing = activeFindings.some(f => f.condition === 'missing');
    if (isMissing) return 'var(--tooth-missing)';

    // Check if tooth has a full crown
    const hasCrown = activeFindings.some(f => f.condition === 'crown');
    if (hasCrown) return 'var(--tooth-crown)';

    // Find any specific finding on this surface
    const finding = activeFindings.find(f => f.surfaces && f.surfaces.includes(surfaceId));
    if (finding) {
      if (finding.condition === 'caries') return 'var(--tooth-caries)';
      if (finding.condition === 'recurrent_decay') return 'var(--tooth-recurrent)';
      if (finding.condition === 'composite_restoration') return 'var(--tooth-composite)';
      if (finding.condition === 'amalgam_restoration') return 'var(--tooth-amalgam)';
      if (finding.condition === 'fracture') return 'var(--tooth-fracture)';
    }

    return 'var(--tooth-enamel)';
  };

  const isMissing = activeFindings.some(f => f.condition === 'missing');
  const isImplant = activeFindings.some(f => f.condition === 'implant');
  const hasRCT = activeFindings.some(f => f.condition === 'root_canal');

  // Surface identifiers based on tooth position
  const centerId = tooth.isAnterior ? 'I' : 'O';
  const topId = tooth.isAnterior ? 'F' : 'B';
  const bottomId = 'L';
  // Mesial is towards midline:
  // For Quadrants UR (1-8) and LR (25-32), midline is to the right of the tooth.
  // For Quadrants UL (9-16) and LL (17-24), midline is to the left of the tooth.
  const isRightSide = tooth.quadrant === 'UR' || tooth.quadrant === 'LR';
  const leftId = isRightSide ? 'D' : 'M';
  const rightId = isRightSide ? 'M' : 'D';

  const maxPerio = perioData?.depths ? Math.max(...perioData.depths) : null;

  return (
    <div
      className={`tooth-widget ${isSelected ? 'selected' : ''}`}
      onClick={() => onClick(tooth)}
      title={`${tooth.name} (#${tooth.id}) - Click to inspect or edit`}
    >
      <div className="tooth-number-tag">{tooth.id}</div>

      <div className="tooth-surface-map">
        <svg viewBox="0 0 100 100" className="tooth-svg">
          {/* Outer Rounded Container */}
          <rect x="2" y="2" width="96" height="96" rx="20" fill="#0f172a" stroke="var(--border-subtle)" strokeWidth="2" />

          {isMissing ? (
            /* Missing Tooth Indicator */
            <g>
              <line x1="15" y1="15" x2="85" y2="85" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
              <line x1="85" y1="15" x2="15" y2="85" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" opacity="0.7" />
              <text x="50" y="55" textAnchor="middle" fill="#94a3b8" fontSize="18" fontWeight="bold">EXT</text>
            </g>
          ) : (
            <g>
              {/* Top Surface (Buccal/Facial) */}
              <polygon
                points="15,15 85,15 68,32 32,32"
                fill={getSurfaceColor(topId)}
                className="surface-polygon"
              />

              {/* Bottom Surface (Lingual) */}
              <polygon
                points="32,68 68,68 85,85 15,85"
                fill={getSurfaceColor(bottomId)}
                className="surface-polygon"
              />

              {/* Left Surface (Mesial or Distal) */}
              <polygon
                points="15,15 32,32 32,68 15,85"
                fill={getSurfaceColor(leftId)}
                className="surface-polygon"
              />

              {/* Right Surface (Distal or Mesial) */}
              <polygon
                points="85,15 68,32 68,68 85,85"
                fill={getSurfaceColor(rightId)}
                className="surface-polygon"
              />

              {/* Center Surface (Occlusal or Incisal) */}
              <polygon
                points="32,32 68,32 68,68 32,68"
                fill={getSurfaceColor(centerId)}
                className="surface-polygon"
              />

              {/* Special Badges: Implant or RCT */}
              {isImplant && (
                <circle cx="50" cy="50" r="12" fill="#06b6d4" stroke="#ffffff" strokeWidth="2" />
              )}
              {hasRCT && !isImplant && (
                <line x1="50" y1="25" x2="50" y2="75" stroke="#8b5cf6" strokeWidth="3" strokeLinecap="round" />
              )}
            </g>
          )}
        </svg>
      </div>

      {/* Periodontal Probing Depth Indicator */}
      {maxPerio && (
        <div
          className={`perio-gauge ${
            maxPerio >= 5 ? 'perio-severe' : maxPerio === 4 ? 'perio-warning' : 'perio-normal'
          }`}
          title={`Probing depth: ${perioData.depths.join('-')}mm`}
        >
          {maxPerio}mm
        </div>
      )}

      {/* Bleeding on Probing (BOP) Dot */}
      {perioData?.bleeding && (
        <div className="bop-dot" title="Bleeding on probing (BOP) observed"></div>
      )}
    </div>
  );
}

export default function ToothChart({
  findings = [],
  perioRecords = {},
  selectedTooth,
  onSelectTooth
}) {
  const [numberingSystem, setNumberingSystem] = useState('universal'); // 'universal' | 'fdi'

  // Maxillary Arch: Teeth 1 to 16
  const maxillaryTeeth = TEETH_DATA.filter(t => t.arch === 'maxillary');

  // Mandibular Arch: Teeth 17 to 32 (starts from LL 3rd Molar #17 to LR 3rd Molar #32)
  const mandibularTeeth = TEETH_DATA.filter(t => t.arch === 'mandibular');

  // Helper to get active findings for a specific tooth
  const getFindingsForTooth = (toothId) => {
    return findings.filter(f => f.toothId === toothId);
  };

  return (
    <div className="clinical-card tooth-chart-card">
      <div className="card-header">
        <div>
          <h2 className="card-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M7 6h10M7 12h10M7 18h10" />
            </svg>
            Interactive 32-Tooth Dental Chart
          </h2>
          <span className="card-subtitle">Real-time anatomical multi-surface mapping</span>
        </div>

        <div className="chart-controls-strip">
          <div className="nav-tabs-pill">
            <button
              className={`nav-tab-btn ${numberingSystem === 'universal' ? 'active' : ''}`}
              onClick={() => setNumberingSystem('universal')}
            >
              Universal (1-32)
            </button>
            <button
              className={`nav-tab-btn ${numberingSystem === 'fdi' ? 'active' : ''}`}
              onClick={() => setNumberingSystem('fdi')}
            >
              FDI / ISO
            </button>
          </div>
        </div>
      </div>

      {/* Surface Legend */}
      <div className="legend-strip">
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: 'var(--tooth-enamel)' }}></span>
          <span>Sound</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: 'var(--tooth-caries)' }}></span>
          <span>Active Caries</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: 'var(--tooth-composite)' }}></span>
          <span>Composite</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: 'var(--tooth-crown)' }}></span>
          <span>Full Crown</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: 'var(--tooth-missing)' }}></span>
          <span>Missing</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ backgroundColor: 'var(--accent-rose)' }}></span>
          <span>Pocket ≥5mm</span>
        </div>
      </div>

      {/* Arches Visualizer */}
      <div className="arch-container">
        {/* Upper Maxillary Arch (1 - 16) */}
        <div className="arch-section">
          <div className="arch-label">
            <span>Upper Maxillary Arch (UR #1 - UL #16)</span>
            <span>Right Quadrant 1 ↔ Left Quadrant 2</span>
          </div>
          <div className="teeth-row">
            {maxillaryTeeth.map(tooth => (
              <ToothSurfaceMap
                key={tooth.id}
                tooth={tooth}
                activeFindings={getFindingsForTooth(tooth.id)}
                perioData={perioRecords[tooth.id]}
                isSelected={selectedTooth?.id === tooth.id}
                onClick={onSelectTooth}
              />
            ))}
          </div>
        </div>

        {/* Lower Mandibular Arch (32 - 17: Right to Left) */}
        <div className="arch-section">
          <div className="arch-label">
            <span>Lower Mandibular Arch (LR #32 - LL #17)</span>
            <span>Right Quadrant 4 ↔ Left Quadrant 3</span>
          </div>
          <div className="teeth-row">
            {/* Display LR 32 down to 25, then LL 24 down to 17 for anatomically mirrored orientation */}
            {[...mandibularTeeth].reverse().map(tooth => (
              <ToothSurfaceMap
                key={tooth.id}
                tooth={tooth}
                activeFindings={getFindingsForTooth(tooth.id)}
                perioData={perioRecords[tooth.id]}
                isSelected={selectedTooth?.id === tooth.id}
                onClick={onSelectTooth}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
