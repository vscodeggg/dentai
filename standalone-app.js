// ==========================================================================
// AuraDent AI - Standalone React 18 Application
// Complete Voice-First Dental Assistant & Charting System
// ==========================================================================

const { useState, useEffect, useRef, useCallback } = React;

// --------------------------------------------------------------------------
// 1. DENTAL CONSTANTS & TAXONOMY
// --------------------------------------------------------------------------

const QUADRANTS = {
  UR: 'Upper Right (Maxillary)',
  UL: 'Upper Left (Maxillary)',
  LL: 'Lower Left (Mandibular)',
  LR: 'Lower Right (Mandibular)',
};

const SURFACES = {
  O: { id: 'O', name: 'Occlusal', short: 'O', description: 'Biting surface (posterior teeth)' },
  I: { id: 'I', name: 'Incisal', short: 'I', description: 'Cutting edge (anterior teeth)' },
  M: { id: 'M', name: 'Mesial', short: 'M', description: 'Surface facing toward dental midline' },
  D: { id: 'D', name: 'Distal', short: 'D', description: 'Surface facing away from dental midline' },
  B: { id: 'B', name: 'Buccal', short: 'B', description: 'Cheek-facing surface (posterior teeth)' },
  F: { id: 'F', name: 'Facial', short: 'F', description: 'Lip-facing surface (anterior teeth)' },
  L: { id: 'L', name: 'Lingual', short: 'L', description: 'Tongue/palate-facing surface' },
};

const CONDITIONS = {
  sound: { id: 'sound', label: 'Sound / Healthy', color: '#10b981', description: 'No active pathology, healthy enamel' },
  caries: { id: 'caries', label: 'Caries / Active Decay', color: '#ef4444', description: 'Active demineralization and cavitation' },
  recurrent_decay: { id: 'recurrent_decay', label: 'Recurrent Decay', color: '#f97316', description: 'Secondary decay undermining existing restoration margin' },
  composite_restoration: { id: 'composite_restoration', label: 'Existing Composite', color: '#3b82f6', description: 'Existing tooth-colored resin composite filling' },
  amalgam_restoration: { id: 'amalgam_restoration', label: 'Existing Amalgam', color: '#64748b', description: 'Existing silver amalgam restoration' },
  crown: { id: 'crown', label: 'Full Crown', color: '#eab308', description: 'Full-coverage prosthetic crown' },
  root_canal: { id: 'root_canal', label: 'Root Canal Treated', color: '#8b5cf6', description: 'Endodontically treated root canal' },
  missing: { id: 'missing', label: 'Missing / Extracted', color: '#94a3b8', description: 'Tooth absent or surgically extracted' },
  implant: { id: 'implant', label: 'Dental Implant', color: '#06b6d4', description: 'Osseointegrated titanium implant fixture' },
  fracture: { id: 'fracture', label: 'Fractured / Chipped', color: '#ec4899', description: 'Structural fracture or chipped cuspal ridge' },
  perio_pocket: { id: 'perio_pocket', label: 'Periodontal Pocket (≥4mm)', color: '#f43f5e', description: 'Elevated probing depth indicating bone loss' }
};

const CDT_CODES = {
  D0120: { code: 'D0120', fee: 65, desc: 'Periodic oral evaluation - established patient' },
  D0150: { code: 'D0150', fee: 110, desc: 'Comprehensive oral evaluation - new/established' },
  D2391: { code: 'D2391', fee: 215, desc: 'Resin-based composite - 1 surface, posterior' },
  D2392: { code: 'D2392', fee: 285, desc: 'Resin-based composite - 2 surfaces, posterior' },
  D2393: { code: 'D2393', fee: 350, desc: 'Resin-based composite - 3 surfaces, posterior' },
  D2394: { code: 'D2394', fee: 410, desc: 'Resin-based composite - 4+ surfaces, posterior' },
  D2330: { code: 'D2330', fee: 195, desc: 'Resin-based composite - 1 surface, anterior' },
  D2331: { code: 'D2331', fee: 245, desc: 'Resin-based composite - 2 surfaces, anterior' },
  D2740: { code: 'D2740', fee: 1250, desc: 'Crown - porcelain/ceramic substrate' },
  D3330: { code: 'D3330', fee: 1180, desc: 'Endodontic therapy, molar tooth' },
  D4341: { code: 'D4341', fee: 290, desc: 'Periodontal scaling & root planing - per quadrant' },
  D7140: { code: 'D7140', fee: 220, desc: 'Extraction, erupted tooth or exposed root' },
  D6010: { code: 'D6010', fee: 2100, desc: 'Surgical placement of implant body' }
};

const TEETH_DATA = [
  // Upper Maxillary Arch: 1 to 16
  { id: 1, fdi: 18, name: 'Upper Right 3rd Molar (Wisdom)', shortName: 'UR 3rd Molar', arch: 'maxillary', quadrant: 'UR', isAnterior: false },
  { id: 2, fdi: 17, name: 'Upper Right 2nd Molar', shortName: 'UR 2nd Molar', arch: 'maxillary', quadrant: 'UR', isAnterior: false },
  { id: 3, fdi: 16, name: 'Upper Right 1st Molar', shortName: 'UR 1st Molar', arch: 'maxillary', quadrant: 'UR', isAnterior: false },
  { id: 4, fdi: 15, name: 'Upper Right 2nd Premolar', shortName: 'UR 2nd Premolar', arch: 'maxillary', quadrant: 'UR', isAnterior: false },
  { id: 5, fdi: 14, name: 'Upper Right 1st Premolar', shortName: 'UR 1st Premolar', arch: 'maxillary', quadrant: 'UR', isAnterior: false },
  { id: 6, fdi: 13, name: 'Upper Right Canine', shortName: 'UR Canine', arch: 'maxillary', quadrant: 'UR', isAnterior: true },
  { id: 7, fdi: 12, name: 'Upper Right Lateral Incisor', shortName: 'UR Lateral Incisor', arch: 'maxillary', quadrant: 'UR', isAnterior: true },
  { id: 8, fdi: 11, name: 'Upper Right Central Incisor', shortName: 'UR Central Incisor', arch: 'maxillary', quadrant: 'UR', isAnterior: true },
  { id: 9, fdi: 21, name: 'Upper Left Central Incisor', shortName: 'UL Central Incisor', arch: 'maxillary', quadrant: 'UL', isAnterior: true },
  { id: 10, fdi: 22, name: 'Upper Left Lateral Incisor', shortName: 'UL Lateral Incisor', arch: 'maxillary', quadrant: 'UL', isAnterior: true },
  { id: 11, fdi: 23, name: 'Upper Left Canine', shortName: 'UL Canine', arch: 'maxillary', quadrant: 'UL', isAnterior: true },
  { id: 12, fdi: 24, name: 'Upper Left 1st Premolar', shortName: 'UL 1st Premolar', arch: 'maxillary', quadrant: 'UL', isAnterior: false },
  { id: 13, fdi: 25, name: 'Upper Left 2nd Premolar', shortName: 'UL 2nd Premolar', arch: 'maxillary', quadrant: 'UL', isAnterior: false },
  { id: 14, fdi: 26, name: 'Upper Left 1st Molar', shortName: 'UL 1st Molar', arch: 'maxillary', quadrant: 'UL', isAnterior: false },
  { id: 15, fdi: 27, name: 'Upper Left 2nd Molar', shortName: 'UL 2nd Molar', arch: 'maxillary', quadrant: 'UL', isAnterior: false },
  { id: 16, fdi: 28, name: 'Upper Left 3rd Molar (Wisdom)', shortName: 'UL 3rd Molar', arch: 'maxillary', quadrant: 'UL', isAnterior: false },

  // Lower Mandibular Arch: 17 to 32
  { id: 17, fdi: 38, name: 'Lower Left 3rd Molar (Wisdom)', shortName: 'LL 3rd Molar', arch: 'mandibular', quadrant: 'LL', isAnterior: false },
  { id: 18, fdi: 37, name: 'Lower Left 2nd Molar', shortName: 'LL 2nd Molar', arch: 'mandibular', quadrant: 'LL', isAnterior: false },
  { id: 19, fdi: 36, name: 'Lower Left 1st Molar', shortName: 'LL 1st Molar', arch: 'mandibular', quadrant: 'LL', isAnterior: false },
  { id: 20, fdi: 35, name: 'Lower Left 2nd Premolar', shortName: 'LL 2nd Premolar', arch: 'mandibular', quadrant: 'LL', isAnterior: false },
  { id: 21, fdi: 34, name: 'Lower Left 1st Premolar', shortName: 'LL 1st Premolar', arch: 'mandibular', quadrant: 'LL', isAnterior: false },
  { id: 22, fdi: 33, name: 'Lower Left Canine', shortName: 'LL Canine', arch: 'mandibular', quadrant: 'LL', isAnterior: true },
  { id: 23, fdi: 32, name: 'Lower Left Lateral Incisor', shortName: 'LL Lateral Incisor', arch: 'mandibular', quadrant: 'LL', isAnterior: true },
  { id: 24, fdi: 31, name: 'Lower Left Central Incisor', shortName: 'LL Central Incisor', arch: 'mandibular', quadrant: 'LL', isAnterior: true },
  { id: 25, fdi: 41, name: 'Lower Right Central Incisor', shortName: 'LR Central Incisor', arch: 'mandibular', quadrant: 'LR', isAnterior: true },
  { id: 26, fdi: 42, name: 'Lower Right Lateral Incisor', shortName: 'LR Lateral Incisor', arch: 'mandibular', quadrant: 'LR', isAnterior: true },
  { id: 27, fdi: 43, name: 'Lower Right Canine', shortName: 'LR Canine', arch: 'mandibular', quadrant: 'LR', isAnterior: true },
  { id: 28, fdi: 44, name: 'Lower Right 1st Premolar', shortName: 'LR 1st Premolar', arch: 'mandibular', quadrant: 'LR', isAnterior: false },
  { id: 29, fdi: 45, name: 'Lower Right 2nd Premolar', shortName: 'LR 2nd Premolar', arch: 'mandibular', quadrant: 'LR', isAnterior: false },
  { id: 30, fdi: 46, name: 'Lower Right 1st Molar', shortName: 'LR 1st Molar', arch: 'mandibular', quadrant: 'LR', isAnterior: false },
  { id: 31, fdi: 47, name: 'Lower Right 2nd Molar', shortName: 'LR 2nd Molar', arch: 'mandibular', quadrant: 'LR', isAnterior: false },
  { id: 32, fdi: 48, name: 'Lower Right 3rd Molar (Wisdom)', shortName: 'LR 3rd Molar', arch: 'mandibular', quadrant: 'LR', isAnterior: false },
];

// --------------------------------------------------------------------------
// 2. INITIAL PATIENTS & BASELINE RECORDS
// --------------------------------------------------------------------------

const INITIAL_PATIENTS = [
  {
    id: 'pt-101',
    name: 'Marcus Vance',
    age: 42,
    dob: '1984-03-12',
    phone: '(555) 382-9104',
    email: 'marcus.vance@example.com',
    gender: 'Male',
    lastVisit: '6 months ago',
    insurance: 'Delta Dental Premier (PPO)',
    medicalAlerts: [
      { type: 'warning', text: 'Penicillin Allergy (Hives)' },
      { type: 'info', text: 'Pre-medication NOT required' }
    ],
    perioRisk: 'Moderate',
    existingFindings: [
      { toothId: 1, condition: 'missing', surfaces: [], clinicalNote: 'Extracted wisdom tooth' },
      { toothId: 16, condition: 'missing', surfaces: [], clinicalNote: 'Extracted wisdom tooth' },
      { toothId: 17, condition: 'missing', surfaces: [], clinicalNote: 'Extracted wisdom tooth' },
      { toothId: 32, condition: 'missing', surfaces: [], clinicalNote: 'Extracted wisdom tooth' },
      { toothId: 14, condition: 'crown', surfaces: ['O', 'M', 'D', 'B', 'L'], clinicalNote: 'PFM Crown placed 2021' },
      { toothId: 19, condition: 'amalgam_restoration', surfaces: ['M', 'O', 'D'], clinicalNote: 'MOD Amalgam placed 2018' },
      { toothId: 30, condition: 'composite_restoration', surfaces: ['O'], clinicalNote: 'Occlusal composite 2023' },
    ],
    perioMeasurements: {
      19: { depths: [4, 3, 4], bleeding: false },
      30: { depths: [3, 3, 3], bleeding: false }
    }
  },
  {
    id: 'pt-102',
    name: 'Elena Rostova',
    age: 29,
    dob: '1997-07-24',
    phone: '(555) 749-2041',
    email: 'elena.rostova@example.com',
    gender: 'Female',
    lastVisit: '10 months ago',
    insurance: 'MetLife Dental Guard',
    medicalAlerts: [
      { type: 'info', text: 'No Known Drug Allergies (NKDA)' },
      { type: 'warning', text: 'Nocturnal Bruxism / Wear facets' }
    ],
    perioRisk: 'Low',
    existingFindings: [
      { toothId: 3, condition: 'composite_restoration', surfaces: ['O'], clinicalNote: 'Preventative resin sealant' },
      { toothId: 18, condition: 'composite_restoration', surfaces: ['O'], clinicalNote: 'Composite 2022' }
    ],
    perioMeasurements: {
      18: { depths: [3, 2, 3], bleeding: true }
    }
  },
  {
    id: 'pt-103',
    name: 'Dr. James Chen',
    age: 61,
    dob: '1965-11-04',
    phone: '(555) 912-4482',
    email: 'james.chen@example.com',
    gender: 'Male',
    lastVisit: '8 months ago',
    insurance: 'Cigna Dental Health',
    medicalAlerts: [
      { type: 'danger', text: 'Sulfa Drugs & Latex Allergy' },
      { type: 'danger', text: 'Hypertension - Lisinopril' },
      { type: 'warning', text: 'Bleeding Risk / Stage III Periodontitis' }
    ],
    perioRisk: 'High',
    existingFindings: [
      { toothId: 18, condition: 'missing', surfaces: [], clinicalNote: 'Extracted vertical fracture' },
      { toothId: 19, condition: 'crown', surfaces: ['O', 'M', 'D', 'B', 'L'], clinicalNote: 'Zirconia crown over RCT' },
      { toothId: 30, condition: 'implant', surfaces: [], clinicalNote: 'Titanium Implant fixture' },
      { toothId: 30, condition: 'crown', surfaces: ['O', 'M', 'D', 'B', 'L'], clinicalNote: 'Implant crown' }
    ],
    perioMeasurements: {
      19: { depths: [5, 4, 6], bleeding: true },
      3: { depths: [5, 4, 5], bleeding: true }
    }
  }
];

// --------------------------------------------------------------------------
// 3. CLINICAL SCENARIOS FOR SIMULATED DICTATION
// --------------------------------------------------------------------------

const CLINICAL_SCENARIOS = [
  {
    id: 'routine-restorative',
    title: 'Routine Restorative Exam',
    subtitle: 'Extracts occlusal decay, defective margin, and periodontal pocket',
    utterances: [
      { text: "Tooth number fourteen occlusal caries into dentin, recommend one surface composite.", delay: 600 },
      { text: "Tooth number three distal margin breakdown recurrent decay underneath amalgam.", delay: 2000 },
      { text: "Tooth nineteen probing depth buccal five millimeters with bleeding on probing.", delay: 3500 }
    ]
  },
  {
    id: 'ambiguity-crown-conflict',
    title: 'Ambiguity Check: Crown vs Adjacent Molar',
    subtitle: 'Triggers context-aware disambiguation between #14 (crowned) and #15 (decayed pit)',
    expectedAmbiguity: true,
    utterances: [
      { text: "Upper left molar deep occlusal caries on tooth fourteen.", delay: 700 }
    ]
  },
  {
    id: 'missing-tooth-alert',
    title: 'Conflict Alert: Missing Tooth Charted',
    subtitle: 'Alerts when decay is voiced on a previously extracted wisdom/molar tooth',
    expectedAmbiguity: true,
    utterances: [
      { text: "Tooth eighteen deep mesial decay with cold sensitivity.", delay: 700 }
    ]
  },
  {
    id: 'anterior-esthetic',
    title: 'Anterior Incisal & Cosmetic Exam',
    subtitle: 'Parses incisal edge chips, facial composite, and anterior teeth numbering',
    utterances: [
      { text: "Tooth number eight incisal chip class four fracture mild enamel defect.", delay: 700 },
      { text: "Tooth number nine mesial incisal angle recurrent stain along margin.", delay: 2200 }
    ]
  },
  {
    id: 'periodontal-charting',
    title: 'Full Periodontal Probing Sequence',
    subtitle: 'Rapid multi-site pocket depths and bleeding on probing indicators',
    utterances: [
      { text: "Probing tooth thirty buccal five four five millimeters bleeding positive.", delay: 600 },
      { text: "Tooth thirty-one buccal four three four no bleeding.", delay: 2000 },
      { text: "Tooth two lingual six five six bleeding on probing localized stage three pocket.", delay: 3400 }
    ]
  }
];

// --------------------------------------------------------------------------
// 4. NATURAL LANGUAGE PARSER & AMBIGUITY DETECTOR
// --------------------------------------------------------------------------

const NUMBER_WORDS = {
  'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
  'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15, 'sixteen': 16,
  'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20,
  'twenty-one': 21, 'twenty-two': 22, 'twenty-three': 23, 'twenty-four': 24, 'twenty-five': 25,
  'twenty-six': 26, 'twenty-seven': 27, 'twenty-eight': 28, 'twenty-nine': 29, 'thirty': 30,
  'thirty-one': 31, 'thirty-two': 32
};

function extractToothNumber(text) {
  const lower = text.toLowerCase();
  const digitMatch = lower.match(/(?:tooth|number|#|\b)\s*(\b[1-9]\b|\b[12][0-9]\b|\b3[0-2]\b)/i);
  if (digitMatch && digitMatch[1]) {
    const num = parseInt(digitMatch[1], 10);
    if (num >= 1 && num <= 32) return num;
  }
  for (const [word, num] of Object.entries(NUMBER_WORDS)) {
    const regex = new RegExp(`(?:tooth|number|#)?\\s*\\b${word}\\b`, 'i');
    if (regex.test(lower)) return num;
  }
  if (lower.includes('upper left molar')) return 14;
  if (lower.includes('upper right molar')) return 3;
  if (lower.includes('lower left molar')) return 19;
  if (lower.includes('lower right molar')) return 30;
  if (lower.includes('upper right central')) return 8;
  if (lower.includes('upper left central')) return 9;
  return null;
}

function extractSurfaces(text, toothId) {
  const lower = text.toLowerCase();
  const surfaces = new Set();
  const tooth = TEETH_DATA.find(t => t.id === toothId);
  const isAnterior = tooth ? tooth.isAnterior : false;

  if (/\bmod\b/i.test(lower)) { surfaces.add('M'); surfaces.add('O'); surfaces.add('D'); }
  if (/\bmo\b/i.test(lower)) { surfaces.add('M'); surfaces.add('O'); }
  if (/\bdo\b/i.test(lower)) { surfaces.add('D'); surfaces.add('O'); }
  if (lower.includes('occlusal') || lower.includes('chewing surface')) surfaces.add(isAnterior ? 'I' : 'O');
  if (lower.includes('incisal') || lower.includes('cutting edge')) surfaces.add('I');
  if (lower.includes('mesial')) surfaces.add('M');
  if (lower.includes('distal')) surfaces.add('D');
  if (lower.includes('buccal') || lower.includes('facial')) surfaces.add(isAnterior ? 'F' : 'B');
  if (lower.includes('lingual') || lower.includes('palatal')) surfaces.add('L');

  if (surfaces.size === 0 && (lower.includes('caries') || lower.includes('decay') || lower.includes('cavity'))) {
    surfaces.add(isAnterior ? 'F' : 'O');
  }
  return Array.from(surfaces);
}

function extractCondition(text) {
  const lower = text.toLowerCase();
  if (lower.includes('probing') || lower.includes('pocket') || lower.includes('bleeding on probing')) {
    return { condition: 'perio_pocket', severity: lower.includes('severe') ? 'Severe' : 'Moderate' };
  }
  if (lower.includes('recurrent') || lower.includes('breakdown')) {
    return { condition: 'recurrent_decay', severity: 'Moderate' };
  }
  if (lower.includes('caries') || lower.includes('decay') || lower.includes('cavity')) {
    const severity = lower.includes('deep') || lower.includes('dentin') ? 'Severe' : 'Moderate';
    return { condition: 'caries', severity };
  }
  if (lower.includes('fracture') || lower.includes('chip')) {
    return { condition: 'fracture', severity: lower.includes('deep') ? 'Severe' : 'Mild' };
  }
  if (lower.includes('crown') || lower.includes('cap')) return { condition: 'crown', severity: 'N/A' };
  if (lower.includes('missing') || lower.includes('extracted')) return { condition: 'missing', severity: 'N/A' };
  if (lower.includes('implant')) return { condition: 'implant', severity: 'N/A' };
  return { condition: 'caries', severity: 'Moderate' };
}

function extractPerio(text) {
  const lower = text.toLowerCase();
  const bleeding = lower.includes('bleeding') || lower.includes('positive') || lower.includes('bop');
  const multiMatch = lower.match(/(\d)\s*[-,\s]\s*(\d)\s*[-,\s]\s*(\d)/);
  if (multiMatch) {
    return { depths: [parseInt(multiMatch[1]), parseInt(multiMatch[2]), parseInt(multiMatch[3])], bleeding };
  }
  const singleMatch = lower.match(/(\d+)\s*(?:mm|millimeter)/);
  if (singleMatch) {
    const val = parseInt(singleMatch[1]);
    return { depths: [val, Math.max(1, val - 1), val], bleeding };
  }
  return { depths: [5, 4, 5], bleeding };
}

function inferCDTCode(toothId, surfaces, condition) {
  const tooth = TEETH_DATA.find(t => t.id === toothId);
  const isAnterior = tooth ? tooth.isAnterior : false;
  const surfCount = surfaces.length;

  if (condition === 'perio_pocket') return 'D4341';
  if (condition === 'crown') return 'D2740';
  if (condition === 'missing') return 'D7140';

  if (isAnterior) {
    return surfCount <= 1 ? 'D2330' : 'D2331';
  } else {
    if (surfCount <= 1) return 'D2391';
    if (surfCount === 2) return 'D2392';
    if (surfCount === 3) return 'D2393';
    return 'D2394';
  }
}

function parseDentalSpeech(transcript, patient) {
  const toothId = extractToothNumber(transcript);
  if (!toothId) return null;

  const tooth = TEETH_DATA.find(t => t.id === toothId);
  const surfaces = extractSurfaces(transcript, toothId);
  const { condition, severity } = extractCondition(transcript);
  const perio = condition === 'perio_pocket' ? extractPerio(transcript) : null;
  const cdtCode = inferCDTCode(toothId, surfaces, condition);

  let ambiguity = {
    isAmbiguous: false,
    severity: 'none',
    reason: '',
    suggestedToothId: null,
    suggestedSurfaces: null,
    suggestedCondition: null,
  };

  const existingFindings = patient?.existingFindings || [];
  const existingToothFinding = existingFindings.find(f => f.toothId === toothId);

  // Ambiguity Rule 1: Missing tooth conflict
  if (existingToothFinding && existingToothFinding.condition === 'missing' && condition !== 'missing') {
    ambiguity = {
      isAmbiguous: true,
      severity: 'high',
      reason: `Conflict: Tooth #${toothId} is documented as EXTRACTED / MISSING on ${patient.name}'s chart. Did you mean adjacent tooth?`,
      suggestedToothId: toothId === 18 ? 19 : toothId - 1,
      suggestedSurfaces: surfaces,
      suggestedCondition: condition
    };
  }
  // Ambiguity Rule 2: Crown conflict
  else if (existingToothFinding && existingToothFinding.condition === 'crown' && (condition === 'caries' || surfaces.includes('O'))) {
    const adjacentId = toothId === 14 ? 15 : toothId + 1;
    ambiguity = {
      isAmbiguous: true,
      severity: 'warning',
      reason: `Tooth #${toothId} already has an intact crown. Tooth #${adjacentId} has unsealed occlusal pits. Did you mean #${adjacentId}, or recurrent margin decay on #${toothId}?`,
      suggestedToothId: adjacentId,
      suggestedSurfaces: surfaces,
      suggestedCondition: 'recurrent_decay'
    };
  }

  let confidence = ambiguity.isAmbiguous ? (ambiguity.severity === 'high' ? 0.58 : 0.74) : 0.96;

  return {
    id: `finding-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    rawTranscript: transcript,
    toothId,
    toothName: tooth?.shortName || `Tooth #${toothId}`,
    arch: tooth?.arch,
    quadrant: tooth?.quadrant,
    surfaces,
    condition,
    conditionLabel: CONDITIONS[condition]?.label || condition,
    severity,
    cdtCode,
    perio,
    ambiguity,
    confidence,
    status: 'pending',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    clinicalNote: `${CONDITIONS[condition]?.label} identified on ${tooth?.shortName} (${surfaces.join('') || 'General'}). Recommended: ${CDT_CODES[cdtCode]?.desc || 'Restoration'}.`
  };
}

// --------------------------------------------------------------------------
// 5. PATIENT-FRIENDLY REPORT TRANSLATOR
// --------------------------------------------------------------------------

function friendlySurfaceNames(surfaces, isAnterior) {
  if (!surfaces || surfaces.length === 0) return 'entire tooth';
  const map = {
    O: 'top chewing surface',
    I: 'front biting edge',
    M: 'inner surface facing the front',
    D: 'back surface facing the rear',
    B: 'outer cheek surface',
    F: 'front lip surface',
    L: 'inner tongue side'
  };
  const names = surfaces.map(s => map[s] || s);
  if (names.length === 1) return names[0];
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return names.slice(0, -1).join(', ') + `, and ${names[names.length - 1]}`;
}

function translateFindingToPatientFriendly(finding) {
  const tooth = TEETH_DATA.find(t => t.id === finding.toothId);
  const toothLocation = tooth ? `${tooth.shortName} (#${finding.toothId})` : `Tooth #${finding.toothId}`;
  const surfacesText = friendlySurfaceNames(finding.surfaces, tooth?.isAnterior);

  let title = '';
  let whatIsHappening = '';
  let whyItMatters = '';
  let recommendedCare = '';
  let urgency = 'Routine';

  switch (finding.condition) {
    case 'caries':
      title = `Cavity on ${toothLocation}`;
      whatIsHappening = `Active tooth decay has softened the enamel and entered the underlying tooth structure on the ${surfacesText}.`;
      whyItMatters = `Tooth decay cannot heal on its own. Early treatment is fast and painless; left untreated, it can reach the nerve and cause a severe toothache.`;
      recommendedCare = `A gentle tooth-colored composite filling to clean away bacteria and seal the tooth permanently.`;
      urgency = finding.severity === 'Severe' ? 'Immediate' : 'Recommended Soon';
      break;

    case 'recurrent_decay':
      title = `Seam breakdown around existing filling on ${toothLocation}`;
      whatIsHappening = `Bacteria have penetrated the margin around an older filling on the ${surfacesText}.`;
      whyItMatters = `Resealing this area prevents deeper decay from spreading beneath the existing restoration and compromising tooth structure.`;
      recommendedCare = `Refresh and replace the older filling with modern adhesive bonding.`;
      urgency = 'Recommended Soon';
      break;

    case 'perio_pocket':
      const maxDepth = finding.perio?.depths ? Math.max(...finding.perio.depths) : 5;
      title = `Gum health concern around ${toothLocation}`;
      whatIsHappening = `The gum pocket around this tooth measures ${maxDepth}mm (healthy gums are 1-3mm), indicating plaque below the gumline.`;
      whyItMatters = `Deep pockets allow bacteria to hide where toothbrushes cannot reach, leading to gum inflammation and gradual bone loss if neglected.`;
      recommendedCare = `Targeted deep cleaning (scaling & root planing) to smooth the root surface and help gums re-attach.`;
      urgency = maxDepth >= 5 ? 'Immediate' : 'Recommended Soon';
      break;

    case 'crown':
      title = `Protective Crown for ${toothLocation}`;
      whatIsHappening = `This tooth requires full-coverage structural reinforcement to withstand daily chewing forces.`;
      whyItMatters = `When a substantial portion of tooth structure is compromised, a crown prevents catastrophic fracture under bite pressure.`;
      recommendedCare = `Custom ceramic crown precision-matched to your natural bite and smile shade.`;
      urgency = 'Recommended Soon';
      break;

    case 'fracture':
      title = `Chipped enamel on ${toothLocation}`;
      whatIsHappening = `There is a crack or chip along the ${surfacesText}.`;
      whyItMatters = `Rough chipped edges trap bacteria and can expand into a deeper break if not stabilized.`;
      recommendedCare = `Cosmetic resin bonding to smooth the edge and seal the enamel.`;
      urgency = 'Recommended Soon';
      break;

    default:
      title = `Clinical finding on ${toothLocation}`;
      whatIsHappening = `Our dental team evaluated this tooth.`;
      whyItMatters = `Preventative care keeps your natural teeth healthy for life.`;
      recommendedCare = finding.clinicalNote || `Routine checkup at next periodic visit.`;
      urgency = 'Routine';
  }

  return { id: finding.id, toothId: finding.toothId, title, whatIsHappening, whyItMatters, recommendedCare, urgency };
}

function generatePatientReport(patient, approvedFindings, doctorName = 'Dr. Sarah Lin, DDS') {
  const items = approvedFindings.map(f => translateFindingToPatientFriendly(f));
  const urgentCount = items.filter(i => i.urgency === 'Immediate').length;
  const recommendedCount = items.filter(i => i.urgency === 'Recommended Soon').length;
  const routineCount = items.filter(i => i.urgency === 'Routine').length;

  let overallSummary = `Hello ${patient.name.split(' ')[0]}, thank you for visiting us today! ${doctorName} reviewed your examination. We identified ${items.length} focus area(s) to maintain your healthy smile.`;
  if (urgentCount > 0) {
    overallSummary += ` There are ${urgentCount} priority item(s) we recommend scheduling promptly to keep you pain-free.`;
  }

  return {
    patientName: patient.name,
    patientEmail: patient.email,
    examDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    doctorName,
    overallSummary,
    items,
    stats: { urgentCount, recommendedCount, routineCount },
    homeCareTips: [
      "Brush twice daily with a soft electric toothbrush for two full minutes.",
      "Floss daily to remove trapped plaque between tight contact points.",
      "Rinse with fluoride mouthwash before bed to remineralize enamel.",
      "Complete recommended restorative care early while treatment is minor and conservative."
    ]
  };
}

// --------------------------------------------------------------------------
// 6. REACT COMPONENTS
// --------------------------------------------------------------------------

// Tooth Surface SVG Diagram
function ToothSurfaceMap({ tooth, activeFindings, perioData, isSelected, onClick }) {
  const isMissing = activeFindings.some(f => f.condition === 'missing');
  const hasCrown = activeFindings.some(f => f.condition === 'crown');
  const isImplant = activeFindings.some(f => f.condition === 'implant');

  const getSurfaceColor = (surfId) => {
    if (isMissing) return 'var(--tooth-missing)';
    if (hasCrown) return 'var(--tooth-crown)';

    const finding = activeFindings.find(f => f.surfaces && f.surfaces.includes(surfId));
    if (finding) {
      if (finding.condition === 'caries') return 'var(--tooth-caries)';
      if (finding.condition === 'recurrent_decay') return 'var(--tooth-recurrent)';
      if (finding.condition === 'composite_restoration') return 'var(--tooth-composite)';
      if (finding.condition === 'amalgam_restoration') return 'var(--tooth-amalgam)';
      if (finding.condition === 'fracture') return 'var(--tooth-fracture)';
    }
    return 'var(--tooth-enamel)';
  };

  const centerId = tooth.isAnterior ? 'I' : 'O';
  const topId = tooth.isAnterior ? 'F' : 'B';
  const bottomId = 'L';
  const isRight = tooth.quadrant === 'UR' || tooth.quadrant === 'LR';
  const leftId = isRight ? 'D' : 'M';
  const rightId = isRight ? 'M' : 'D';

  const maxPerio = perioData?.depths ? Math.max(...perioData.depths) : null;

  return (
    <div
      className={`tooth-widget ${isSelected ? 'selected' : ''}`}
      onClick={() => onClick(tooth)}
      title={`${tooth.name} (#${tooth.id})`}
    >
      <div className="tooth-number-tag">{tooth.id}</div>
      <div className="tooth-surface-map">
        <svg viewBox="0 0 100 100" className="tooth-svg">
          <rect x="2" y="2" width="96" height="96" rx="20" fill="#0f172a" stroke="var(--border-subtle)" strokeWidth="2" />
          {isMissing ? (
            <g>
              <line x1="18" y1="18" x2="82" y2="82" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" opacity="0.8" />
              <line x1="82" y1="18" x2="18" y2="82" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" opacity="0.8" />
              <text x="50" y="55" textAnchor="middle" fill="#94a3b8" fontSize="16" fontWeight="bold">EXT</text>
            </g>
          ) : (
            <g>
              <polygon points="15,15 85,15 68,32 32,32" fill={getSurfaceColor(topId)} className="surface-polygon" />
              <polygon points="32,68 68,68 85,85 15,85" fill={getSurfaceColor(bottomId)} className="surface-polygon" />
              <polygon points="15,15 32,32 32,68 15,85" fill={getSurfaceColor(leftId)} className="surface-polygon" />
              <polygon points="85,15 68,32 68,68 85,85" fill={getSurfaceColor(rightId)} className="surface-polygon" />
              <polygon points="32,32 68,32 68,68 32,68" fill={getSurfaceColor(centerId)} className="surface-polygon" />
              {isImplant && <circle cx="50" cy="50" r="10" fill="#06b6d4" stroke="#ffffff" strokeWidth="2" />}
            </g>
          )}
        </svg>
      </div>

      {maxPerio && (
        <div className={`perio-gauge ${maxPerio >= 5 ? 'perio-severe' : maxPerio === 4 ? 'perio-warning' : 'perio-normal'}`}>
          {maxPerio}mm
        </div>
      )}
      {perioData?.bleeding && <div className="bop-dot" title="Bleeding on probing"></div>}
    </div>
  );
}

// 32-Tooth Chart Arch Visualizer
function ToothChart({ findings = [], perioRecords = {}, selectedTooth, onSelectTooth }) {
  const [numbering, setNumbering] = useState('universal');
  const maxillary = TEETH_DATA.filter(t => t.arch === 'maxillary');
  const mandibular = TEETH_DATA.filter(t => t.arch === 'mandibular');

  const getToothFindings = (id) => findings.filter(f => f.toothId === id);

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
            <button className={`nav-tab-btn ${numbering === 'universal' ? 'active' : ''}`} onClick={() => setNumbering('universal')}>
              Universal (1-32)
            </button>
            <button className={`nav-tab-btn ${numbering === 'fdi' ? 'active' : ''}`} onClick={() => setNumbering('fdi')}>
              FDI / ISO
            </button>
          </div>
        </div>
      </div>

      <div className="legend-strip">
        <div className="legend-item"><span className="legend-dot" style={{ backgroundColor: 'var(--tooth-enamel)' }}></span>Sound</div>
        <div className="legend-item"><span className="legend-dot" style={{ backgroundColor: 'var(--tooth-caries)' }}></span>Active Caries</div>
        <div className="legend-item"><span className="legend-dot" style={{ backgroundColor: 'var(--tooth-composite)' }}></span>Composite</div>
        <div className="legend-item"><span className="legend-dot" style={{ backgroundColor: 'var(--tooth-crown)' }}></span>Full Crown</div>
        <div className="legend-item"><span className="legend-dot" style={{ backgroundColor: 'var(--tooth-missing)' }}></span>Missing</div>
        <div className="legend-item"><span className="legend-dot" style={{ backgroundColor: 'var(--accent-rose)' }}></span>Pocket ≥5mm</div>
      </div>

      <div className="arch-container">
        <div className="arch-section">
          <div className="arch-label">
            <span>Upper Maxillary Arch (UR #1 - UL #16)</span>
            <span>Right Quadrant 1 ↔ Left Quadrant 2</span>
          </div>
          <div className="teeth-row">
            {maxillary.map(t => (
              <ToothSurfaceMap
                key={t.id}
                tooth={t}
                activeFindings={getToothFindings(t.id)}
                perioData={perioRecords[t.id]}
                isSelected={selectedTooth?.id === t.id}
                onClick={onSelectTooth}
              />
            ))}
          </div>
        </div>

        <div className="arch-section">
          <div className="arch-label">
            <span>Lower Mandibular Arch (LR #32 - LL #17)</span>
            <span>Right Quadrant 4 ↔ Left Quadrant 3</span>
          </div>
          <div className="teeth-row">
            {[...mandibular].reverse().map(t => (
              <ToothSurfaceMap
                key={t.id}
                tooth={t}
                activeFindings={getToothFindings(t.id)}
                perioData={perioRecords[t.id]}
                isSelected={selectedTooth?.id === t.id}
                onClick={onSelectTooth}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Voice Engine & Simulator Controller
function VoiceController({ isListening, onToggleListening, onSpeechInput, isPythonRecording, recordCountdown, onRecordPythonMic, backendStatus }) {
  const [activeScenarioId, setActiveScenarioId] = useState(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        const last = event.results[event.results.length - 1];
        if (last.isFinal && last[0].transcript.trim()) {
          onSpeechInput(last[0].transcript.trim());
        }
      };
      recognitionRef.current = recognition;
    }
  }, [onSpeechInput]);

  useEffect(() => {
    if (!recognitionRef.current) return;
    if (isListening) {
      try { recognitionRef.current.start(); } catch (e) {}
    } else {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
  }, [isListening]);

  const handleRunScenario = (sc) => {
    if (activeScenarioId) return;
    setActiveScenarioId(sc.id);

    sc.utterances.forEach((u, i) => {
      setTimeout(() => {
        onSpeechInput(u.text);
        if (i === sc.utterances.length - 1) {
          setTimeout(() => setActiveScenarioId(null), 800);
        }
      }, u.delay);
    });
  };

  return (
    <div className="voice-panel">
      <div className="mic-toggle-hero">
        <div className="mic-button-wrapper">
          {isListening && <div className="mic-pulse-ring"></div>}
          <button
            className={`mic-btn ${isListening ? 'active' : ''}`}
            onClick={onToggleListening}
            title={isListening ? 'Pause dictation' : 'Click to activate mic'}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill={isListening ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
          </button>
        </div>

        <div className={`mic-status-label ${isListening ? 'listening' : ''}`}>
          {isListening ? (
            <>
              <span className="status-indicator-dot"></span>
              Live Dictation Active (Browser Mic)
            </>
          ) : (
            'Browser Mic Standby (Click to Speak)'
          )}
        </div>

        <div className="waveform-container">
          {Array.from({ length: 22 }).map((_, i) => (
            <div
              key={i}
              className={`waveform-bar ${isListening || isPythonRecording ? 'active' : ''}`}
              style={{
                animationDelay: `${(i % 5) * 0.18}s`,
                height: (isListening || isPythonRecording) ? `${8 + ((i * 7) % 20)}px` : '4px'
              }}
            />
          ))}
        </div>

        {/* Python Backend Mic Trigger */}
        <div style={{ marginTop: '0.9rem', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.45rem' }}>
          <button
            type="button"
            className="btn-primary"
            onClick={onRecordPythonMic}
            disabled={isPythonRecording}
            style={{
              width: '92%',
              padding: '0.65rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              borderRadius: '999px',
              fontSize: '0.85rem',
              fontWeight: 700,
              background: isPythonRecording ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #06b6d4, #0284c7)',
              boxShadow: isPythonRecording ? '0 0 20px rgba(239, 68, 68, 0.6)' : '0 4px 14px rgba(6, 182, 212, 0.3)',
              cursor: isPythonRecording ? 'wait' : 'pointer'
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/>
              <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
              <line x1="12" y1="19" x2="12" y2="22"/>
            </svg>
            {isPythonRecording ? `Recording... ${recordCountdown}s (Whisper Processing)` : '🎙️ Record with Python Mic (Whisper)'}
          </button>
          <div style={{ fontSize: '0.72rem', color: backendStatus?.online ? '#10b981' : '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', backgroundColor: backendStatus?.online ? '#10b981' : '#f59e0b' }}></span>
            {backendStatus?.online ? `Python AI Engine: ${backendStatus.chat_model}` : 'Connecting to Python backend...'}
          </div>
        </div>
      </div>

      <div className="scenario-selector">
        <div className="scenario-title">
          <span>Clinical Speech Scenarios</span>
          {activeScenarioId && <span style={{ color: 'var(--primary-cyan)' }}>Simulating...</span>}
        </div>
        <div className="scenario-chips-grid">
          {CLINICAL_SCENARIOS.map(sc => (
            <button
              key={sc.id}
              className="scenario-btn"
              onClick={() => handleRunScenario(sc)}
              disabled={activeScenarioId !== null}
            >
              <div className="scenario-btn-name">
                <span>{sc.title}</span>
                {sc.expectedAmbiguity && <span style={{ fontSize: '0.65rem', color: '#f59e0b' }}>⚠️ Ambiguity Test</span>}
              </div>
              <div className="scenario-btn-desc">{sc.subtitle}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Live Speech Stream Transcript
function LiveTranscript({ transcripts = [] }) {
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
            Ready for dictation. Click mic or choose a preset clinical scenario above...
          </div>
        ) : (
          transcripts.map((item, idx) => (
            <div key={idx} className="live-stream-line">
              <span style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', marginRight: '0.5rem' }}>
                [{item.timestamp}]
              </span>
              <span>{item.text}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// Review Queue: Accept / Edit / Reject
function ReviewQueue({ candidateFindings = [], onAccept, onEdit, onReject, onResolveAmbiguity }) {
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
        <span className="card-subtitle">{candidateFindings.length} pending</span>
      </div>

      <div className="review-queue-list">
        {candidateFindings.length === 0 ? (
          <div className="transcript-empty">
            Queue clear. Dictated findings will populate here for 1-click dentist verification.
          </div>
        ) : (
          candidateFindings.map(f => {
            const hasAmbiguity = f.ambiguity?.isAmbiguous;
            const isDanger = f.ambiguity?.severity === 'high';

            return (
              <div key={f.id} className={`review-card ${hasAmbiguity ? (isDanger ? 'has-conflict' : 'has-ambiguity') : ''}`}>
                <div className="review-card-top">
                  <div className="review-tooth-info">
                    <span className="tooth-badge-large">#{f.toothId}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{f.toothName}</span>
                  </div>
                  <span className={`confidence-pill ${f.confidence >= 0.9 ? 'confidence-high' : f.confidence >= 0.7 ? 'confidence-medium' : 'confidence-low'}`}>
                    {Math.round(f.confidence * 100)}% Confidence
                  </span>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  <strong>Finding:</strong> <span style={{ color: '#f8fafc' }}>{f.conditionLabel}</span>
                  {f.surfaces?.length > 0 && <span> ({f.surfaces.join('')})</span>}
                  {f.perio && <span> - {f.perio.depths.join('-')}mm {f.perio.bleeding ? '🩸 BOP' : ''}</span>}
                </div>

                {hasAmbiguity && (
                  <div className={`ambiguity-alert-box ${isDanger ? 'danger' : ''}`}>
                    <div className="ambiguity-header">
                      ⚠️ {isDanger ? 'Chart Conflict' : 'Clinical Ambiguity'}
                    </div>
                    <div>{f.ambiguity.reason}</div>
                    {f.ambiguity.suggestedToothId && (
                      <div className="disambiguation-actions">
                        <button
                          className="btn-disambiguate"
                          onClick={() => onResolveAmbiguity(f, { toothId: f.ambiguity.suggestedToothId })}
                        >
                          Switch to #{f.ambiguity.suggestedToothId}
                        </button>
                        {f.condition === 'caries' && (
                          <button
                            className="btn-disambiguate"
                            onClick={() => onResolveAmbiguity(f, { condition: 'recurrent_decay' })}
                          >
                            Mark Recurrent Decay
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div style={{ fontSize: '0.72rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>
                  "{f.rawTranscript}"
                </div>

                <div className="review-actions-bar">
                  <button className="btn-accept" onClick={() => onAccept(f)}>
                    ✓ Accept
                  </button>
                  <button className="btn-edit-action" onClick={() => onEdit(f)}>
                    ✎ Edit
                  </button>
                  <button className="btn-reject" onClick={() => onReject(f)}>
                    ✕ Reject
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

// Tooth Detail Inspector & Manual Finding Editor
function ToothDetailModal({ isOpen, tooth, existingFindings = [], perioRecord, onClose, onSaveFinding, onDeleteFinding }) {
  if (!isOpen || !tooth) return null;

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
      setClinicalNote(primaryFinding.clinicalNote || '');
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

  const toggleSurface = (surf) => {
    const updated = selectedSurfaces.includes(surf)
      ? selectedSurfaces.filter(s => s !== surf)
      : [...selectedSurfaces, surf];
    setSelectedSurfaces(updated);
    setCdtCode(inferCDTCode(tooth.id, updated, selectedCondition));
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
      clinicalNote,
      perio: selectedCondition === 'perio_pocket' ? { depths: probingDepths, bleeding: hasBleeding } : null,
      confidence: 1.0,
      status: 'accepted',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    onSaveFinding(findingData);
    onClose();
  };

  const surfacesList = tooth.isAnterior
    ? [{ id: 'I', label: 'Incisal (I)' }, { id: 'F', label: 'Facial (F)' }, { id: 'L', label: 'Lingual (L)' }, { id: 'M', label: 'Mesial (M)' }, { id: 'D', label: 'Distal (D)' }]
    : [{ id: 'O', label: 'Occlusal (O)' }, { id: 'B', label: 'Buccal (B)' }, { id: 'L', label: 'Lingual (L)' }, { id: 'M', label: 'Mesial (M)' }, { id: 'D', label: 'Distal (D)' }];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Tooth #{tooth.id} - {tooth.name}</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              {tooth.quadrant} Quadrant • FDI #{tooth.fdi} • {tooth.arch.toUpperCase()}
            </span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>
              Condition / Diagnosis
            </label>
            <select
              value={selectedCondition}
              onChange={e => {
                const c = e.target.value;
                setSelectedCondition(c);
                setCdtCode(inferCDTCode(tooth.id, selectedSurfaces, c));
              }}
              style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', padding: '0.6rem', borderRadius: 'var(--radius-md)' }}
            >
              {Object.entries(CONDITIONS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>

          {selectedCondition !== 'missing' && selectedCondition !== 'sound' && (
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>
                Affected Surfaces ({selectedSurfaces.join(', ') || 'None selected'})
              </label>
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                {surfacesList.map(s => {
                  const active = selectedSurfaces.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleSurface(s.id)}
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
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>Severity</label>
              <select
                value={severity}
                onChange={e => setSeverity(e.target.value)}
                style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', padding: '0.55rem', borderRadius: 'var(--radius-md)' }}
              >
                <option value="Mild">Mild / Incipient</option>
                <option value="Moderate">Moderate</option>
                <option value="Severe">Severe / Extensive</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>CDT Billing Code</label>
              <select
                value={cdtCode}
                onChange={e => setCdtCode(e.target.value)}
                style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', padding: '0.55rem', borderRadius: 'var(--radius-md)' }}
              >
                {Object.entries(CDT_CODES).map(([code, item]) => (
                  <option key={code} value={code}>{item.code} - {item.desc.substring(0, 30)}... (${item.fee})</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: '0.4rem' }}>Clinical Notes</label>
            <textarea
              rows="3"
              value={clinicalNote}
              onChange={e => setClinicalNote(e.target.value)}
              placeholder="e.g. Cavitated lesion into dentin. Patient consented to restoration."
              style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-medium)', color: 'var(--text-primary)', padding: '0.6rem', borderRadius: 'var(--radius-md)', fontFamily: 'inherit' }}
            />
          </div>
        </div>

        <div className="modal-footer">
          {primaryFinding && (
            <button
              type="button"
              onClick={() => { onDeleteFinding(primaryFinding.id); onClose(); }}
              style={{ marginRight: 'auto', background: 'transparent', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#f87171', padding: '0.45rem 0.85rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
            >
              Delete Finding
            </button>
          )}
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-accept" style={{ flex: 'initial', padding: '0.5rem 1.25rem' }} onClick={handleSave}>
            Save to Chart
          </button>
        </div>
      </div>
    </div>
  );
}

// Findings Summary Sidebar
function FindingsSummary({ findings = [], onSelectToothById, onNavigateToApproval }) {
  const cariesCount = findings.filter(f => f.condition === 'caries' || f.condition === 'recurrent_decay').length;
  const crownsCount = findings.filter(f => f.condition === 'crown').length;
  const perioPockets = findings.filter(f => f.condition === 'perio_pocket').length;

  const totalCost = findings.reduce((sum, f) => sum + (CDT_CODES[f.cdtCode]?.fee || 0), 0);

  return (
    <div className="findings-sidebar">
      <div className="clinical-card">
        <div className="card-header">
          <h3 className="card-title">Exam Analytics</h3>
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
            <div className="stat-val" style={{ color: '#38bdf8' }}>${totalCost}</div>
            <div className="stat-label">Est. CDT Value</div>
          </div>
        </div>
      </div>

      <div className="clinical-card" style={{ flex: 1 }}>
        <div className="card-header">
          <h3 className="card-title">Confirmed Chart Items</h3>
          <span className="card-subtitle">Click to edit</span>
        </div>
        <div className="findings-list">
          {findings.length === 0 ? (
            <div className="transcript-empty">No findings charted yet. Dictate findings or accept from review queue.</div>
          ) : (
            findings.map((f, i) => {
              const cond = CONDITIONS[f.condition] || { label: f.condition, color: '#94a3b8' };
              const cdt = CDT_CODES[f.cdtCode];
              return (
                <div key={f.id || i} className="finding-item-row" onClick={() => onSelectToothById(f.toothId)} style={{ cursor: 'pointer' }}>
                  <div className="finding-header-line">
                    <span className="finding-title">
                      <span className="tooth-badge-large">#{f.toothId}</span>
                      <span>{f.toothName || `Tooth #${f.toothId}`}</span>
                    </span>
                    {cdt && <span className="cdt-chip">{cdt.code} (${cdt.fee})</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <span style={{ color: cond.color, fontSize: '0.75rem', fontWeight: 700 }}>
                      ● {cond.label}
                    </span>
                    {f.surfaces?.length > 0 && <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>• Surfaces: <strong>{f.surfaces.join('')}</strong></span>}
                  </div>
                  {f.clinicalNote && <div className="finding-desc">"{f.clinicalNote}"</div>}
                </div>
              );
            })
          )}
        </div>
      </div>

      <button className="btn-primary-glow" onClick={onNavigateToApproval}>
        <span>Review & Dentist Approval</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
        </svg>
      </button>
    </div>
  );
}

// Dentist Approval & Patient-Friendly Report View
function DentistApproval({ patient, approvedFindings = [], isApproved, approvedAt, onApproveVisit, onBackToChart, onDispatchReport }) {
  const [activeTab, setActiveTab] = useState('patient-friendly');
  const [showPin, setShowPin] = useState(false);
  const [doctorPin, setDoctorPin] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchChannel, setDispatchChannel] = useState(null);

  const report = generatePatientReport(patient, approvedFindings);

  const handleConfirmPin = (e) => {
    e.preventDefault();
    onApproveVisit();
    setShowPin(false);
    setDoctorPin('');
  };

  const handleDispatch = (ch) => {
    setIsDispatching(true);
    setDispatchChannel(ch);
    setTimeout(() => {
      setIsDispatching(false);
      onDispatchReport(ch);
    }, 1200);
  };

  return (
    <div className="approval-view-container">
      <div className="approval-header-card">
        <div>
          <button className="btn-secondary" onClick={onBackToChart} style={{ marginBottom: '0.5rem' }}>
            ← Back to Interactive Chart
          </button>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Clinical Sign-Off & Patient Delivery</h2>
          <div style={{ fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
            Patient: <strong>{patient.name}</strong> • DOB: {patient.dob} • Exam Date: {report.examDate}
          </div>
        </div>

        <div className="report-mode-toggle">
          <button className={`report-mode-btn ${activeTab === 'patient-friendly' ? 'active' : ''}`} onClick={() => setActiveTab('patient-friendly')}>
            Patient-Friendly Report
          </button>
          <button className={`report-mode-btn ${activeTab === 'clinical-summary' ? 'active' : ''}`} onClick={() => setActiveTab('clinical-summary')}>
            Clinical Summary (Dentist View)
          </button>
        </div>
      </div>

      <div className="dispatch-action-bar">
        <div className="signoff-status">
          {isApproved ? (
            <div className="signoff-stamp approved">
              ✓ Approved & Certified by Dr. Sarah Lin, DDS ({approvedAt})
            </div>
          ) : (
            <div className="signoff-stamp pending">
              ⏱ Pending Dentist Clinical Sign-Off
            </div>
          )}
        </div>

        <div className="dispatch-buttons-group">
          {!isApproved ? (
            <button className="btn-accept" style={{ padding: '0.65rem 1.5rem', fontSize: '0.85rem' }} onClick={() => setShowPin(true)}>
              Approve & Sign Chart
            </button>
          ) : (
            <>
              <button className="btn-portal" onClick={() => handleDispatch('portal')} disabled={isDispatching}>
                {isDispatching && dispatchChannel === 'portal' ? 'Dispatching...' : 'Send to Patient Portal'}
              </button>
              <button className="btn-email" onClick={() => handleDispatch('email')} disabled={isDispatching}>
                {isDispatching && dispatchChannel === 'email' ? 'Generating PDF...' : `Email PDF to ${patient.email}`}
              </button>
            </>
          )}
        </div>
      </div>

      {activeTab === 'patient-friendly' && (
        <div className="patient-report-grid">
          <div className="patient-intro-banner">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="patient-intro-title">Your Personalized Smile Care Plan</h3>
              <span className="brand-badge">Clinically Approved by Doctor</span>
            </div>
            <p className="patient-intro-text">{report.overallSummary}</p>
            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem' }}>
              <div>Priority: <strong style={{ color: '#f87171' }}>{report.stats.urgentCount} item(s)</strong></div>
              <div>Recommended Soon: <strong style={{ color: '#fbbf24' }}>{report.stats.recommendedCount} item(s)</strong></div>
              <div>Routine: <strong style={{ color: '#34d399' }}>{report.stats.routineCount} item(s)</strong></div>
            </div>
          </div>

          <div className="patient-cards-list">
            {report.items.map(item => (
              <div key={item.id} className="patient-explanation-card">
                <div className="patient-card-header">
                  <h4 className="patient-card-title">{item.title}</h4>
                  <span className={`urgency-badge ${item.urgency === 'Immediate' ? 'urgency-immediate' : item.urgency === 'Recommended Soon' ? 'urgency-soon' : 'urgency-routine'}`}>
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
                  <div className="explanation-heading" style={{ color: '#38bdf8' }}>Recommended Next Step</div>
                  <div className="explanation-body" style={{ color: '#f8fafc', fontWeight: 500 }}>{item.recommendedCare}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="clinical-card" style={{ marginTop: '0.5rem' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '0.75rem', color: '#34d399' }}>
              💡 Dr. Lin's Custom Oral Care Advice for {patient.name.split(' ')[0]}
            </h4>
            <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.8 }}>
              {report.homeCareTips.map((tip, i) => <li key={i}>{tip}</li>)}
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'clinical-summary' && (
        <div className="clinical-card">
          <div className="card-header">
            <h3 className="card-title">Comprehensive Clinical Visit Documentation</h3>
            <span className="card-subtitle">CDT Billing Codes & Formal Clinical Record</span>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginTop: '0.5rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-medium)', textAlign: 'left', color: 'var(--text-tertiary)' }}>
                <th style={{ padding: '0.6rem' }}>Tooth #</th>
                <th style={{ padding: '0.6rem' }}>Surfaces</th>
                <th style={{ padding: '0.6rem' }}>Diagnosis</th>
                <th style={{ padding: '0.6rem' }}>CDT Code</th>
                <th style={{ padding: '0.6rem' }}>Description</th>
                <th style={{ padding: '0.6rem', textAlign: 'right' }}>Fee</th>
              </tr>
            </thead>
            <tbody>
              {approvedFindings.map(f => {
                const cdt = CDT_CODES[f.cdtCode];
                return (
                  <tr key={f.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '0.75rem 0.6rem', fontWeight: 700, color: '#38bdf8' }}>#{f.toothId}</td>
                    <td style={{ padding: '0.75rem 0.6rem', fontFamily: 'JetBrains Mono' }}>{f.surfaces?.join('') || '—'}</td>
                    <td style={{ padding: '0.75rem 0.6rem' }}>{f.conditionLabel}</td>
                    <td style={{ padding: '0.75rem 0.6rem', fontFamily: 'JetBrains Mono', color: '#a5b4fc' }}>{f.cdtCode}</td>
                    <td style={{ padding: '0.75rem 0.6rem', color: 'var(--text-secondary)' }}>{cdt?.desc || f.clinicalNote}</td>
                    <td style={{ padding: '0.75rem 0.6rem', textAlign: 'right', fontWeight: 700 }}>${cdt?.fee || 0}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid var(--border-medium)', fontWeight: 800 }}>
                <td colSpan="5" style={{ padding: '0.85rem 0.6rem', textAlign: 'right' }}>Total Estimated Procedure Value:</td>
                <td style={{ padding: '0.85rem 0.6rem', textAlign: 'right', color: 'var(--primary-cyan)', fontSize: '1rem' }}>
                  ${approvedFindings.reduce((s, f) => s + (CDT_CODES[f.cdtCode]?.fee || 0), 0)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {showPin && (
        <div className="modal-overlay" onClick={() => setShowPin(false)}>
          <div className="modal-dialog" style={{ maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Dentist Clinical Signature</h3>
              <button className="modal-close-btn" onClick={() => setShowPin(false)}>✕</button>
            </div>
            <form onSubmit={handleConfirmPin}>
              <div className="modal-body">
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Enter PIN to certify that all charted diagnoses and treatment recommendations for <strong>{patient.name}</strong> have been reviewed.
                </p>
                <div style={{ marginTop: '0.5rem' }}>
                  <input
                    type="password"
                    autoFocus
                    placeholder="••••"
                    value={doctorPin}
                    onChange={e => setDoctorPin(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem', background: 'var(--bg-surface)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '1.2rem', textAlign: 'center', letterSpacing: '0.4em' }}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowPin(false)}>Cancel</button>
                <button type="submit" className="btn-accept" style={{ padding: '0.55rem 1.25rem' }}>Confirm & Lock Chart</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Patient Selector Modal
function PatientSelector({ isOpen, currentPatient, onSelectPatient, onClose }) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Select Active Dental Patient</h3>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="patient-select-list">
            {INITIAL_PATIENTS.map(p => {
              const isSelected = p.id === currentPatient.id;
              return (
                <div key={p.id} className={`patient-choice-card ${isSelected ? 'active' : ''}`} onClick={() => { onSelectPatient(p); onClose(); }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div className="patient-avatar">{p.name.charAt(0)}</div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                        {p.name} {isSelected && <span style={{ color: 'var(--primary-cyan)', fontSize: '0.75rem' }}>(Current)</span>}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                        Age {p.age} • DOB: {p.dob} • Last: {p.lastVisit}
                      </div>
                      <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                        {p.medicalAlerts.map((a, i) => (
                          <span key={i} className={`alert-chip ${a.type}`}>{a.text}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button className="btn-secondary">{isSelected ? 'Selected' : 'Load Chart'}</button>
                </div>
              );
            })}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

// Python AI Backend Live Terminal Console Drawer
function PythonTerminalDrawer({ isOpen, onClose, logs = [] }) {
  if (!isOpen) return null;
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: '820px', width: '92%' }}>
        <div className="modal-header" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.8rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <span style={{ fontSize: '1.3rem' }}>🖥️</span>
            <div>
              <h3 className="modal-title" style={{ margin: 0, fontSize: '1.05rem', color: '#38bdf8' }}>Python AI Live Terminal & Event Stream</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Direct feed from Python CLI_dental backend (MicrophoneRecorder, Whisper, LLM)</span>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body" style={{ background: '#090d16', padding: '1rem', borderRadius: 'var(--radius-md)', margin: '1rem 0', maxHeight: '440px', overflowY: 'auto', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
          {logs && logs.length > 0 ? (
            logs.map((l, i) => (
              <div key={i} style={{ padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', display: 'flex', gap: '0.75rem', alignItems: 'baseline' }}>
                <span style={{ color: '#64748b', fontSize: '0.75rem' }}>[{l.time}]</span>
                <span style={{
                  color: l.category === 'mic' ? '#38bdf8' : l.category === 'ai' ? '#34d399' : l.category === 'error' ? '#f87171' : l.category === 'warning' ? '#fbbf24' : '#e2e8f0',
                  fontWeight: 700,
                  fontSize: '0.75rem'
                }}>
                  [{l.category.toUpperCase()}]
                </span>
                <span style={{ color: '#f1f5f9', wordBreak: 'break-word', lineHeight: 1.4 }}>{l.message}</span>
              </div>
            ))
          ) : (
            <div style={{ textAlign: 'center', color: '#64748b', padding: '2.5rem' }}>
              No backend logs received yet. Click "Record with Python Mic" or run dictation.
            </div>
          )}
        </div>
        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Live polling active (every 2.5s)</span>
          <button className="btn-secondary" onClick={onClose}>Close Console</button>
        </div>
      </div>
    </div>
  );
}

// Global Header
function Header({ activeView, onNavigate, isListening, candidateCount, currentPatient, backendStatus, onToggleLogs, logsCount }) {
  const [elapsed, setElapsed] = useState(160);
  useEffect(() => {
    const t = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const formatTimer = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <header className="main-header">
      <div className="header-brand">
        <div className="logo-badge">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M12 2C8 2 6 5 6 9c0 4 2 8 3 11 1 3 3 3 3 3s2 0 3-3c1-3 3-7 3-11 0-4-2-7-6-7z"/>
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

      <div className="nav-tabs-pill">
        <button className={`nav-tab-btn ${activeView === 'charting' ? 'active' : ''}`} onClick={() => onNavigate('charting')}>
          Interactive Charting
          {candidateCount > 0 && (
            <span style={{ background: '#f43f5e', color: '#fff', fontSize: '0.65rem', padding: '1px 5px', borderRadius: '999px', fontWeight: 800 }}>
              {candidateCount}
            </span>
          )}
        </button>
        <button className={`nav-tab-btn ${activeView === 'approval' ? 'active' : ''}`} onClick={() => onNavigate('approval')}>
          Dentist Approval & Patient Report
        </button>
      </div>

      <div className="header-actions">
        <div style={{ fontSize: '0.75rem', fontFamily: 'JetBrains Mono', color: 'var(--text-secondary)' }}>
          Exam Time: <strong style={{ color: 'var(--text-primary)' }}>{formatTimer(elapsed)}</strong>
        </div>

        {/* Python Backend Status Pill */}
        <div
          className="engine-status-pill"
          onClick={onToggleLogs}
          title="Click to view Python live console output"
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.35rem 0.75rem', border: '1px solid rgba(255,255,255,0.12)', borderRadius: '999px', background: 'rgba(15,23,42,0.6)' }}
        >
          <span className="status-indicator-dot" style={{ backgroundColor: backendStatus?.online ? '#10b981' : '#f59e0b', boxShadow: backendStatus?.online ? '0 0 8px #10b981' : 'none' }}></span>
          <span style={{ fontWeight: 600, fontSize: '0.75rem' }}>
            {backendStatus?.online ? 'Python AI Engine Active' : 'Connecting to Python...'}
          </span>
          {logsCount > 0 && (
            <span style={{ background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', fontSize: '0.65rem', padding: '1px 5px', borderRadius: '999px', fontFamily: 'JetBrains Mono' }}>
              🖥️ {logsCount}
            </span>
          )}
        </div>

        <div className="doctor-pill">
          <div className="doctor-avatar">SL</div>
          <span>Dr. Sarah Lin, DDS</span>
        </div>
      </div>
    </header>
  );
}

// Master App Component
function App() {
  const [currentPatient, setCurrentPatient] = useState(INITIAL_PATIENTS[0]);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [confirmedFindings, setConfirmedFindings] = useState(INITIAL_PATIENTS[0].existingFindings || []);
  const [perioRecords, setPerioRecords] = useState(INITIAL_PATIENTS[0].perioMeasurements || {});
  const [isListening, setIsListening] = useState(false);
  const [transcripts, setTranscripts] = useState([
    { text: "Python voice engine online. Baseline chart loaded for Marcus Vance.", timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [candidateFindings, setCandidateFindings] = useState([]);
  const [activeView, setActiveView] = useState('charting');
  const [selectedTooth, setSelectedTooth] = useState(null);
  const [isToothModalOpen, setIsToothModalOpen] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [approvedAt, setApprovedAt] = useState(null);
  const [toast, setToast] = useState(null);

  // Python backend integration state
  const [backendStatus, setBackendStatus] = useState({ online: false, chat_model: 'Detecting...', whisper_model: 'whisper-large-v3-turbo' });
  const [isPythonRecording, setIsPythonRecording] = useState(false);
  const [recordCountdown, setRecordCountdown] = useState(0);
  const [serverLogs, setServerLogs] = useState([]);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3800);
  };

  // Poll Python backend status & logs
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const r = await fetch('/api/status');
        if (r.ok) {
          const d = await r.json();
          setBackendStatus({ online: true, ...d });
        } else {
          setBackendStatus(s => ({ ...s, online: false }));
        }
      } catch (e) {
        setBackendStatus(s => ({ ...s, online: false }));
      }
    };

    const fetchLogs = async () => {
      try {
        const r = await fetch('/api/logs');
        if (r.ok) {
          const d = await r.json();
          setServerLogs(d.logs || []);
        }
      } catch (e) {}
    };

    fetchStatus();
    fetchLogs();

    const statusInterval = setInterval(fetchStatus, 5000);
    const logsInterval = setInterval(fetchLogs, 2500);

    return () => {
      clearInterval(statusInterval);
      clearInterval(logsInterval);
    };
  }, []);

  const handleSelectPatient = (p) => {
    setCurrentPatient(p);
    setConfirmedFindings(p.existingFindings || []);
    setPerioRecords(p.perioMeasurements || {});
    setCandidateFindings([]);
    setIsApproved(false);
    setApprovedAt(null);
    setTranscripts([{ text: `Loaded chart for ${p.name}.`, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
    showToast(`Loaded patient: ${p.name}`);
  };

  const handleSpeechInput = useCallback(async (rawText) => {
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setTranscripts(prev => [...prev, { text: rawText, timestamp }]);

    // Asynchronously call Python backend for real Groq LLM parsing
    try {
      const resp = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: rawText, recent: candidateFindings })
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.findings && data.findings.length > 0) {
          const pyFindings = data.findings.map(f => {
            const toothNum = parseInt(f.tooth_number, 10);
            const tooth = TEETH_DATA.find(t => t.id === toothNum);
            const surf = f.surface && f.surface !== 'unspecified' ? f.surface.toUpperCase().split('') : [];
            const conditionKey = f.finding_type.includes('pocket') ? 'perio_pocket' :
              f.finding_type.includes('caries') || f.finding_type.includes('decay') || f.finding_type.includes('cavity') ? 'caries' :
              f.finding_type.includes('crown') ? 'crown' :
              f.finding_type.includes('composite') ? 'composite_restoration' :
              f.finding_type.includes('missing') ? 'missing' : 'caries';

            return {
              id: 'cand-py-' + Math.random().toString(36).substr(2, 6),
              toothId: toothNum || 14,
              toothName: tooth?.shortName || `Tooth #${toothNum}`,
              condition: conditionKey,
              conditionLabel: CONDITIONS[conditionKey]?.label || f.finding_type,
              surfaces: surf,
              confidence: f.needs_review ? 0.68 : 0.98,
              sourceText: rawText,
              clinicalNote: f.notes || f.display_value || 'Extracted via Python DentalAI',
              perio: f.finding_type.includes('pocket') ? { depths: [parseInt(f.value || '5', 10), 4, 4], bleeding: false } : null,
              ambiguity: f.needs_review ? { isAmbiguous: true, reason: 'Flagged by DentalAI for clinician review' } : { isAmbiguous: false },
              pyFinding: f
            };
          });

          setCandidateFindings(prev => [...pyFindings, ...prev]);
          showToast(`⚡ DentalAI extracted ${pyFindings.length} finding(s) with Groq`);
          return;
        }
      }
    } catch (err) {
      console.warn("Python backend parse fallback:", err);
    }

    // Fallback rule-based parsing
    const parsed = parseDentalSpeech(rawText, currentPatient);
    if (parsed) {
      setCandidateFindings(prev => [parsed, ...prev]);
      if (parsed.ambiguity?.isAmbiguous) {
        showToast(`⚠️ Ambiguity flagged on Tooth #${parsed.toothId}`);
      } else {
        showToast(`Parsed Tooth #${parsed.toothId} (${parsed.conditionLabel})`);
      }
    } else {
      showToast(`Logged: "${rawText.substring(0, 25)}..."`);
    }
  }, [currentPatient, candidateFindings]);

  // Record audio using the Python physical microphone recorder (sounddevice + Groq Whisper)
  const handleRecordPythonMic = async () => {
    if (isPythonRecording) return;
    setIsPythonRecording(true);
    setRecordCountdown(5);
    showToast("🎙️ Python Microphone recording 5s chunk...");

    const countdownTimer = setInterval(() => {
      setRecordCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownTimer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    try {
      const resp = await fetch('/api/record-mic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seconds: 5 })
      });
      const data = await resp.json();
      if (data.success && data.transcript) {
        showToast(`✓ Whisper: "${data.transcript}"`);
        handleSpeechInput(data.transcript);
      } else if (data.success) {
        showToast("No clear speech detected in chunk.");
      } else {
        showToast(`Mic error: ${data.error || 'Failed'}`);
      }
    } catch (err) {
      showToast(`Python mic error: ${err.message}`);
    } finally {
      clearInterval(countdownTimer);
      setIsPythonRecording(false);
      setRecordCountdown(0);
    }
  };

  const handleAcceptFinding = (cand) => {
    setConfirmedFindings(prev => {
      const filtered = prev.filter(f => f.toothId !== cand.toothId || f.id === cand.id);
      return [...filtered, cand];
    });
    if (cand.perio) {
      setPerioRecords(prev => ({ ...prev, [cand.toothId]: cand.perio }));
    }
    setCandidateFindings(prev => prev.filter(c => c.id !== cand.id));
    showToast(`✓ Committed Tooth #${cand.toothId} to chart`);
  };

  const handleEditFinding = (cand) => {
    const tooth = TEETH_DATA.find(t => t.id === cand.toothId);
    if (tooth) {
      setSelectedTooth(tooth);
      setIsToothModalOpen(true);
    }
  };

  const handleRejectFinding = (cand) => {
    setCandidateFindings(prev => prev.filter(c => c.id !== cand.id));
    showToast(`Discarded finding for Tooth #${cand.toothId}`);
  };

  const handleResolveAmbiguity = (cand, resolution) => {
    const tooth = TEETH_DATA.find(t => t.id === resolution.toothId);
    const updated = {
      ...cand,
      toothId: resolution.toothId || cand.toothId,
      toothName: tooth?.shortName || cand.toothName,
      condition: resolution.condition || cand.condition,
      ambiguity: { isAmbiguous: false },
      confidence: 0.98
    };
    setCandidateFindings(prev => prev.map(c => c.id === cand.id ? updated : c));
    showToast(`Resolved: Switched to Tooth #${updated.toothId}`);
  };

  const handleSelectTooth = (tooth) => {
    setSelectedTooth(tooth);
    setIsToothModalOpen(true);
  };

  const handleSaveToothFinding = (finding) => {
    setConfirmedFindings(prev => {
      const filtered = prev.filter(f => f.toothId !== finding.toothId);
      return [...filtered, finding];
    });
    if (finding.perio) {
      setPerioRecords(prev => ({ ...prev, [finding.toothId]: finding.perio }));
    }
    setCandidateFindings(prev => prev.filter(c => c.toothId !== finding.toothId));
    showToast(`Updated Tooth #${finding.toothId}`);
  };

  const handleDeleteFinding = (id) => {
    setConfirmedFindings(prev => prev.filter(f => f.id !== id));
    showToast(`Removed finding from chart`);
  };

  const handleApproveVisit = () => {
    setIsApproved(true);
    const stamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setApprovedAt(stamp);
    showToast(`Chart locked and clinically approved by Dr. Lin at ${stamp}`);
  };

  const handleDispatchReport = async (ch) => {
    if (ch === 'portal') {
      showToast(`Dispatched to HealthVault Patient Portal for ${currentPatient.name}`);
    } else {
      showToast(`PDF report sent to ${currentPatient.email}`);
    }
  };

  return (
    <div className="app-container">
      <Header
        activeView={activeView}
        onNavigate={setActiveView}
        isListening={isListening}
        candidateCount={candidateFindings.length}
        currentPatient={currentPatient}
        backendStatus={backendStatus}
        onToggleLogs={() => setIsTerminalOpen(true)}
        logsCount={serverLogs.length}
      />

      <div className="patient-bar">
        <div className="patient-info-group">
          <div className="patient-identity">
            <div className="patient-avatar">{currentPatient.name.charAt(0)}</div>
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

          <div className="medical-alerts-strip">
            {currentPatient.medicalAlerts.map((a, i) => (
              <span key={i} className={`alert-chip ${a.type}`}>
                {a.type === 'danger' && '⚠️ '}
                {a.type === 'warning' && '⚡ '}
                {a.text}
              </span>
            ))}
            <span className="alert-chip info">Perio Risk: {currentPatient.perioRisk}</span>
          </div>
        </div>

        <div className="patient-actions">
          <button className="btn-secondary" onClick={() => setIsPatientModalOpen(true)}>
            Switch Patient
          </button>
        </div>
      </div>

      {activeView === 'charting' && (
        <main className="workspace-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <VoiceController
              isListening={isListening}
              onToggleListening={() => setIsListening(prev => !prev)}
              onSpeechInput={handleSpeechInput}
              isPythonRecording={isPythonRecording}
              recordCountdown={recordCountdown}
              onRecordPythonMic={handleRecordPythonMic}
              backendStatus={backendStatus}
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

          <div>
            <ToothChart
              findings={confirmedFindings}
              perioRecords={perioRecords}
              selectedTooth={selectedTooth}
              onSelectTooth={handleSelectTooth}
            />
          </div>

          <div>
            <FindingsSummary
              findings={confirmedFindings}
              onSelectToothById={(id) => {
                const tooth = TEETH_DATA.find(t => t.id === id);
                if (tooth) handleSelectTooth(tooth);
              }}
              onNavigateToApproval={() => setActiveView('approval')}
            />
          </div>
        </main>
      )}

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

      <ToothDetailModal
        isOpen={isToothModalOpen}
        tooth={selectedTooth}
        existingFindings={confirmedFindings}
        perioRecord={selectedTooth ? perioRecords[selectedTooth.id] : null}
        onClose={() => setIsToothModalOpen(false)}
        onSaveFinding={handleSaveToothFinding}
        onDeleteFinding={handleDeleteFinding}
      />

      <PatientSelector
        isOpen={isPatientModalOpen}
        currentPatient={currentPatient}
        onSelectPatient={handleSelectPatient}
        onClose={() => setIsPatientModalOpen(false)}
      />

      <PythonTerminalDrawer
        isOpen={isTerminalOpen}
        onClose={() => setIsTerminalOpen(false)}
        logs={serverLogs}
      />

      {toast && (
        <div className="toast-notification">
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}

// Mount to DOM
const rootElement = document.getElementById('root');
const root = ReactDOM.createRoot(rootElement);
root.render(<App />);

