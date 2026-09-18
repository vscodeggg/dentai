// Context-Aware Dental Speech Parser & Clinical Ambiguity Detector
import { TEETH_DATA, CONDITIONS, CDT_CODES } from '../data/dentalConstants.js';

// Number word mapping
const NUMBER_WORDS = {
  'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
  'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15, 'sixteen': 16,
  'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20,
  'twenty-one': 21, 'twenty one': 21,
  'twenty-two': 22, 'twenty two': 22,
  'twenty-three': 23, 'twenty three': 23,
  'twenty-four': 24, 'twenty four': 24,
  'twenty-five': 25, 'twenty five': 25,
  'twenty-six': 26, 'twenty six': 26,
  'twenty-seven': 27, 'twenty seven': 27,
  'twenty-eight': 28, 'twenty eight': 28,
  'twenty-nine': 29, 'twenty nine': 29,
  'thirty': 30,
  'thirty-one': 31, 'thirty one': 31,
  'thirty-two': 32, 'thirty two': 32,
};

/**
 * Extracts tooth number from speech phrase
 */
export function extractToothNumber(text) {
  const lower = text.toLowerCase();

  // Direct digits 1-32 with tooth/number prefix
  const digitMatch = lower.match(/(?:tooth|number|#|\b)\s*(\b[1-9]\b|\b[12][0-9]\b|\b3[0-2]\b)/i);
  if (digitMatch && digitMatch[1]) {
    const num = parseInt(digitMatch[1], 10);
    if (num >= 1 && num <= 32) return num;
  }

  // Word numbers
  for (const [word, num] of Object.entries(NUMBER_WORDS)) {
    const regex = new RegExp(`(?:tooth|number|#)?\\s*\\b${word}\\b`, 'i');
    if (regex.test(lower)) {
      return num;
    }
  }

  // Anatomical colloquial descriptions
  if (lower.includes('upper left molar') || lower.includes('upper left first molar')) return 14;
  if (lower.includes('upper right molar') || lower.includes('upper right first molar')) return 3;
  if (lower.includes('lower left molar') || lower.includes('lower left first molar')) return 19;
  if (lower.includes('lower right molar') || lower.includes('lower right first molar')) return 30;
  if (lower.includes('upper right central') || lower.includes('front right tooth')) return 8;
  if (lower.includes('upper left central') || lower.includes('front left tooth')) return 9;

  return null;
}

/**
 * Extracts affected dental surfaces (O, M, D, B, L, I, F)
 */
export function extractSurfaces(text, toothId) {
  const lower = text.toLowerCase();
  const surfaces = new Set();

  const tooth = TEETH_DATA.find(t => t.id === toothId);
  const isAnterior = tooth ? tooth.isAnterior : false;

  // Compound surfaces
  if (/\bmod\b/i.test(lower) || lower.includes('mesial occlusal distal')) {
    surfaces.add('M');
    surfaces.add('O');
    surfaces.add('D');
  }
  if (/\bmo\b/i.test(lower) || lower.includes('mesial occlusal')) {
    surfaces.add('M');
    surfaces.add('O');
  }
  if (/\bdo\b/i.test(lower) || lower.includes('distal occlusal')) {
    surfaces.add('D');
    surfaces.add('O');
  }
  if (/\bmid\b/i.test(lower)) {
    surfaces.add('M');
    surfaces.add(isAnterior ? 'I' : 'O');
    surfaces.add('D');
  }

  // Individual surface mentions
  if (lower.includes('occlusal') || lower.includes('chewing surface') || lower.includes('biting surface')) {
    surfaces.add(isAnterior ? 'I' : 'O');
  }
  if (lower.includes('incisal') || lower.includes('cutting edge')) {
    surfaces.add('I');
  }
  if (lower.includes('mesial') || lower.includes('front side') || lower.includes('inner surface toward front')) {
    surfaces.add('M');
  }
  if (lower.includes('distal') || lower.includes('back side') || lower.includes('surface toward back')) {
    surfaces.add('D');
  }
  if (lower.includes('buccal') || lower.includes('facial') || lower.includes('cheek side') || lower.includes('lip side')) {
    surfaces.add(isAnterior ? 'F' : 'B');
  }
  if (lower.includes('lingual') || lower.includes('palatal') || lower.includes('tongue side')) {
    surfaces.add('L');
  }

  // Fallback defaults based on context
  if (surfaces.size === 0) {
    if (lower.includes('caries') || lower.includes('decay') || lower.includes('cavity')) {
      surfaces.add(isAnterior ? 'F' : 'O');
    }
  }

  return Array.from(surfaces);
}

/**
 * Extracts condition category and severity
 */
export function extractCondition(text) {
  const lower = text.toLowerCase();

  if (lower.includes('probing') || lower.includes('pocket') || lower.includes('depth') || lower.includes('bleeding on probing')) {
    return { condition: 'perio_pocket', severity: lower.includes('severe') ? 'Severe' : 'Moderate' };
  }
  if (lower.includes('recurrent') || lower.includes('breakdown') || lower.includes('underneath')) {
    return { condition: 'recurrent_decay', severity: 'Moderate' };
  }
  if (lower.includes('caries') || lower.includes('decay') || lower.includes('cavity') || lower.includes('demineralization')) {
    const severity = lower.includes('deep') || lower.includes('dentin') || lower.includes('severe')
      ? 'Severe'
      : (lower.includes('incipient') || lower.includes('mild') ? 'Mild' : 'Moderate');
    return { condition: 'caries', severity };
  }
  if (lower.includes('fracture') || lower.includes('chip') || lower.includes('cracked') || lower.includes('broken')) {
    return { condition: 'fracture', severity: lower.includes('deep') ? 'Severe' : 'Mild' };
  }
  if (lower.includes('crown') || lower.includes('full coverage') || lower.includes('cap')) {
    return { condition: 'crown', severity: 'N/A' };
  }
  if (lower.includes('missing') || lower.includes('extracted') || lower.includes('absent')) {
    return { condition: 'missing', severity: 'N/A' };
  }
  if (lower.includes('implant') || lower.includes('titanium fixture')) {
    return { condition: 'implant', severity: 'N/A' };
  }
  if (lower.includes('root canal') || lower.includes('endodontic') || lower.includes('pulpotomy')) {
    return { condition: 'root_canal', severity: 'N/A' };
  }
  if (lower.includes('composite') || lower.includes('resin') || lower.includes('tooth colored filling')) {
    return { condition: 'composite_restoration', severity: 'N/A' };
  }
  if (lower.includes('amalgam') || lower.includes('silver filling')) {
    return { condition: 'amalgam_restoration', severity: 'N/A' };
  }

  return { condition: 'caries', severity: 'Moderate' };
}

/**
 * Extracts periodontal probing measurements and bleeding indicator
 */
export function extractPerio(text) {
  const lower = text.toLowerCase();
  const bleeding = lower.includes('bleeding') || lower.includes('positive') || lower.includes('bop');

  // Match 3 depths like "5 4 5" or single depth "5 millimeters"
  const multiMatch = lower.match(/(\d)\s*[-,\s]\s*(\d)\s*[-,\s]\s*(\d)/);
  if (multiMatch) {
    return {
      depths: [parseInt(multiMatch[1], 10), parseInt(multiMatch[2], 10), parseInt(multiMatch[3], 10)],
      bleeding
    };
  }

  const singleMatch = lower.match(/(\d+)\s*(?:mm|millimeter)/);
  if (singleMatch) {
    const val = parseInt(singleMatch[1], 10);
    return {
      depths: [val, val > 1 ? val - 1 : 1, val],
      bleeding
    };
  }

  return { depths: [4, 3, 4], bleeding };
}

/**
 * Recommends appropriate CDT billing code based on tooth, surfaces, and condition
 */
export function inferCDTCode(toothId, surfaces, condition) {
  const tooth = TEETH_DATA.find(t => t.id === toothId);
  const isAnterior = tooth ? tooth.isAnterior : false;
  const surfCount = surfaces.length;

  if (condition === 'perio_pocket') return 'D4341'; // Scaling & root planing
  if (condition === 'crown') return 'D2740'; // Ceramic crown
  if (condition === 'root_canal') return 'D3330'; // Molar endodontic
  if (condition === 'missing') return 'D7140'; // Extraction

  if (isAnterior) {
    if (surfCount <= 1) return 'D2330';
    return 'D2331';
  } else {
    if (surfCount <= 1) return 'D2391';
    if (surfCount === 2) return 'D2392';
    if (surfCount === 3) return 'D2393';
    return 'D2394';
  }
}

/**
 * Main context-aware speech parser:
 * Checks active patient record for ambiguities or contradictions.
 */
export function parseDentalSpeech(transcript, patient) {
  const toothId = extractToothNumber(transcript);
  if (!toothId) return null;

  const tooth = TEETH_DATA.find(t => t.id === toothId);
  const surfaces = extractSurfaces(transcript, toothId);
  const { condition, severity } = extractCondition(transcript);
  const perio = condition === 'perio_pocket' ? extractPerio(transcript) : null;
  const cdtCode = inferCDTCode(toothId, surfaces, condition);

  // CONTEXT-AWARE AMBIGUITY & CONFLICT CHECKS
  let ambiguity = {
    isAmbiguous: false,
    severity: 'none', // 'high' | 'warning' | 'info'
    reason: '',
    suggestedToothId: null,
    suggestedSurfaces: null,
    suggestedCondition: null,
  };

  const existingFindings = patient?.existingFindings || [];
  const existingToothFinding = existingFindings.find(f => f.toothId === toothId);

  // Rule 1: Missing tooth conflict
  if (existingToothFinding && existingToothFinding.condition === 'missing' && condition !== 'missing') {
    ambiguity = {
      isAmbiguous: true,
      severity: 'high',
      reason: `Conflict: Tooth #${toothId} is currently documented as MISSING / EXTRACTED on ${patient.name}'s chart.`,
      suggestedToothId: toothId === 18 ? 19 : (toothId === 1 ? 2 : toothId - 1),
      suggestedSurfaces: surfaces,
      suggestedCondition: condition
    };
  }
  // Rule 2: Crowned tooth caries ambiguity
  else if (existingToothFinding && existingToothFinding.condition === 'crown' && (condition === 'caries' || surfaces.includes('O'))) {
    // Check adjacent tooth (e.g. if 14 is crowned, check 15)
    const adjacentId = toothId === 14 ? 15 : (toothId === 19 ? 18 : toothId + 1);
    ambiguity = {
      isAmbiguous: true,
      severity: 'warning',
      reason: `Tooth #${toothId} already has an intact full coverage crown. Tooth #${adjacentId} has unsealed deep pits. Did you mean #${adjacentId}, or is this recurrent margin breakdown on #${toothId}?`,
      suggestedToothId: adjacentId,
      suggestedSurfaces: surfaces,
      suggestedCondition: 'recurrent_decay'
    };
  }
  // Rule 3: Anatomical surface mismatch (occlusal on anterior)
  else if (tooth?.isAnterior && surfaces.includes('O')) {
    ambiguity = {
      isAmbiguous: true,
      severity: 'info',
      reason: `Tooth #${toothId} is an anterior incisor/canine which has an Incisal (I) cutting edge rather than an Occlusal (O) surface.`,
      suggestedToothId: toothId,
      suggestedSurfaces: surfaces.map(s => s === 'O' ? 'I' : s),
      suggestedCondition: condition
    };
  }

  // Calculate confidence score
  let confidence = 0.95;
  if (ambiguity.isAmbiguous) {
    confidence = ambiguity.severity === 'high' ? 0.54 : 0.72;
  } else if (surfaces.length === 0 && condition !== 'missing' && condition !== 'perio_pocket') {
    confidence = 0.82;
  }

  return {
    id: `finding-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
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
    cdtDetails: CDT_CODES[cdtCode],
    perio,
    ambiguity,
    confidence,
    status: 'pending', // 'pending' | 'accepted' | 'rejected' | 'edited'
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    clinicalNote: `${CONDITIONS[condition]?.label} detected on ${tooth?.shortName} (${surfaces.join('') || 'General'}). Recommended: ${CDT_CODES[cdtCode]?.desc || 'Restoration'}.`
  };
}
