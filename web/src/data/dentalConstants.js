// 32 Adult Permanent Teeth definitions (Universal Numbering System 1-32 & FDI equivalents)

export const QUADRANTS = {
  UR: 'Upper Right (Maxillary)',
  UL: 'Upper Left (Maxillary)',
  LL: 'Lower Left (Mandibular)',
  LR: 'Lower Right (Mandibular)',
};

export const SURFACES = {
  O: { id: 'O', name: 'Occlusal', short: 'O', description: 'Biting surface (posterior teeth)' },
  I: { id: 'I', name: 'Incisal', short: 'I', description: 'Cutting edge (anterior teeth)' },
  M: { id: 'M', name: 'Mesial', short: 'M', description: 'Surface facing toward dental midline' },
  D: { id: 'D', name: 'Distal', short: 'D', description: 'Surface facing away from dental midline' },
  B: { id: 'B', name: 'Buccal', short: 'B', description: 'Cheek-facing surface (posterior teeth)' },
  F: { id: 'F', name: 'Facial', short: 'F', description: 'Lip-facing surface (anterior teeth)' },
  L: { id: 'L', name: 'Lingual', short: 'L', description: 'Tongue/palate-facing surface' },
};

export const CONDITIONS = {
  sound: {
    id: 'sound',
    label: 'Sound / Healthy',
    color: '#10b981',
    badgeClass: 'badge-sound',
    description: 'No active pathology, healthy enamel and restoration margins'
  },
  caries: {
    id: 'caries',
    label: 'Caries / Active Decay',
    color: '#ef4444',
    badgeClass: 'badge-caries',
    description: 'Active demineralization and cavitation into enamel/dentin'
  },
  recurrent_decay: {
    id: 'recurrent_decay',
    label: 'Recurrent Decay',
    color: '#f97316',
    badgeClass: 'badge-recurrent',
    description: 'Secondary decay undermining existing restoration margin'
  },
  composite_restoration: {
    id: 'composite_restoration',
    label: 'Existing Composite',
    color: '#3b82f6',
    badgeClass: 'badge-composite',
    description: 'Existing tooth-colored resin composite filling'
  },
  amalgam_restoration: {
    id: 'amalgam_restoration',
    label: 'Existing Amalgam',
    color: '#64748b',
    badgeClass: 'badge-amalgam',
    description: 'Existing silver amalgam restoration'
  },
  crown: {
    id: 'crown',
    label: 'Full Crown',
    color: '#eab308',
    badgeClass: 'badge-crown',
    description: 'Full-coverage prosthetic crown (Porcelain/Zirconia/PFM)'
  },
  root_canal: {
    id: 'root_canal',
    label: 'Root Canal Treated',
    color: '#8b5cf6',
    badgeClass: 'badge-rct',
    description: 'Endodontically treated root canal system'
  },
  missing: {
    id: 'missing',
    label: 'Missing / Extracted',
    color: '#94a3b8',
    badgeClass: 'badge-missing',
    description: 'Tooth absent or surgically extracted'
  },
  implant: {
    id: 'implant',
    label: 'Dental Implant',
    color: '#06b6d4',
    badgeClass: 'badge-implant',
    description: 'Osseointegrated titanium implant fixture with abutment'
  },
  fracture: {
    id: 'fracture',
    label: 'Fractured / Chipped',
    color: '#ec4899',
    badgeClass: 'badge-fracture',
    description: 'Structural fracture or cracked cuspal ridge'
  },
  perio_pocket: {
    id: 'perio_pocket',
    label: 'Periodontal Pocket (≥4mm)',
    color: '#f43f5e',
    badgeClass: 'badge-perio',
    description: 'Elevated probing depth indicating bone loss or inflammation'
  }
};

export const CDT_CODES = {
  D0120: { code: 'D0120', fee: 65, desc: 'Periodic oral evaluation - established patient' },
  D0150: { code: 'D0150', fee: 110, desc: 'Comprehensive oral evaluation - new or established patient' },
  D2391: { code: 'D2391', fee: 215, desc: 'Resin-based composite - 1 surface, posterior' },
  D2392: { code: 'D2392', fee: 285, desc: 'Resin-based composite - 2 surfaces, posterior' },
  D2393: { code: 'D2393', fee: 350, desc: 'Resin-based composite - 3 surfaces, posterior' },
  D2394: { code: 'D2394', fee: 410, desc: 'Resin-based composite - 4+ surfaces, posterior' },
  D2330: { code: 'D2330', fee: 195, desc: 'Resin-based composite - 1 surface, anterior' },
  D2331: { code: 'D2331', fee: 245, desc: 'Resin-based composite - 2 surfaces, anterior' },
  D2740: { code: 'D2740', fee: 1250, desc: 'Crown - porcelain/ceramic substrate' },
  D3330: { code: 'D3330', fee: 1180, desc: 'Endodontic therapy, molar tooth' },
  D4341: { code: 'D4341', fee: 290, desc: 'Periodontal scaling and root planing - per quadrant' },
  D4910: { code: 'D4910', fee: 165, desc: 'Periodontal maintenance' },
  D7140: { code: 'D7140', fee: 220, desc: 'Extraction, erupted tooth or exposed root' },
  D6010: { code: 'D6010', fee: 2100, desc: 'Surgical placement of implant body: endosteal' }
};

export const TEETH_DATA = [
  // Upper Maxillary Arch: 1 to 16
  { id: 1, fdi: 18, name: 'Upper Right 3rd Molar (Wisdom)', shortName: 'UR 3rd Molar', arch: 'maxillary', quadrant: 'UR', type: 'molar', isAnterior: false },
  { id: 2, fdi: 17, name: 'Upper Right 2nd Molar', shortName: 'UR 2nd Molar', arch: 'maxillary', quadrant: 'UR', type: 'molar', isAnterior: false },
  { id: 3, fdi: 16, name: 'Upper Right 1st Molar', shortName: 'UR 1st Molar', arch: 'maxillary', quadrant: 'UR', type: 'molar', isAnterior: false },
  { id: 4, fdi: 15, name: 'Upper Right 2nd Premolar (Bicuspid)', shortName: 'UR 2nd Premolar', arch: 'maxillary', quadrant: 'UR', type: 'premolar', isAnterior: false },
  { id: 5, fdi: 14, name: 'Upper Right 1st Premolar (Bicuspid)', shortName: 'UR 1st Premolar', arch: 'maxillary', quadrant: 'UR', type: 'premolar', isAnterior: false },
  { id: 6, fdi: 13, name: 'Upper Right Canine (Cuspid)', shortName: 'UR Canine', arch: 'maxillary', quadrant: 'UR', type: 'canine', isAnterior: true },
  { id: 7, fdi: 12, name: 'Upper Right Lateral Incisor', shortName: 'UR Lateral Incisor', arch: 'maxillary', quadrant: 'UR', type: 'incisor', isAnterior: true },
  { id: 8, fdi: 11, name: 'Upper Right Central Incisor', shortName: 'UR Central Incisor', arch: 'maxillary', quadrant: 'UR', type: 'incisor', isAnterior: true },
  
  { id: 9, fdi: 21, name: 'Upper Left Central Incisor', shortName: 'UL Central Incisor', arch: 'maxillary', quadrant: 'UL', type: 'incisor', isAnterior: true },
  { id: 10, fdi: 22, name: 'Upper Left Lateral Incisor', shortName: 'UL Lateral Incisor', arch: 'maxillary', quadrant: 'UL', type: 'incisor', isAnterior: true },
  { id: 11, fdi: 23, name: 'Upper Left Canine (Cuspid)', shortName: 'UL Canine', arch: 'maxillary', quadrant: 'UL', type: 'canine', isAnterior: true },
  { id: 12, fdi: 24, name: 'Upper Left 1st Premolar (Bicuspid)', shortName: 'UL 1st Premolar', arch: 'maxillary', quadrant: 'UL', type: 'premolar', isAnterior: false },
  { id: 13, fdi: 25, name: 'Upper Left 2nd Premolar (Bicuspid)', shortName: 'UL 2nd Premolar', arch: 'maxillary', quadrant: 'UL', type: 'premolar', isAnterior: false },
  { id: 14, fdi: 26, name: 'Upper Left 1st Molar', shortName: 'UL 1st Molar', arch: 'maxillary', quadrant: 'UL', type: 'molar', isAnterior: false },
  { id: 15, fdi: 27, name: 'Upper Left 2nd Molar', shortName: 'UL 2nd Molar', arch: 'maxillary', quadrant: 'UL', type: 'molar', isAnterior: false },
  { id: 16, fdi: 28, name: 'Upper Left 3rd Molar (Wisdom)', shortName: 'UL 3rd Molar', arch: 'maxillary', quadrant: 'UL', type: 'molar', isAnterior: false },

  // Lower Mandibular Arch: 17 to 32 (starts from LL 3rd Molar to LR 3rd Molar)
  { id: 17, fdi: 38, name: 'Lower Left 3rd Molar (Wisdom)', shortName: 'LL 3rd Molar', arch: 'mandibular', quadrant: 'LL', type: 'molar', isAnterior: false },
  { id: 18, fdi: 37, name: 'Lower Left 2nd Molar', shortName: 'LL 2nd Molar', arch: 'mandibular', quadrant: 'LL', type: 'molar', isAnterior: false },
  { id: 19, fdi: 36, name: 'Lower Left 1st Molar', shortName: 'LL 1st Molar', arch: 'mandibular', quadrant: 'LL', type: 'molar', isAnterior: false },
  { id: 20, fdi: 35, name: 'Lower Left 2nd Premolar (Bicuspid)', shortName: 'LL 2nd Premolar', arch: 'mandibular', quadrant: 'LL', type: 'premolar', isAnterior: false },
  { id: 21, fdi: 34, name: 'Lower Left 1st Premolar (Bicuspid)', shortName: 'LL 1st Premolar', arch: 'mandibular', quadrant: 'LL', type: 'premolar', isAnterior: false },
  { id: 22, fdi: 33, name: 'Lower Left Canine (Cuspid)', shortName: 'LL Canine', arch: 'mandibular', quadrant: 'LL', type: 'canine', isAnterior: true },
  { id: 23, fdi: 32, name: 'Lower Left Lateral Incisor', shortName: 'LL Lateral Incisor', arch: 'mandibular', quadrant: 'LL', type: 'incisor', isAnterior: true },
  { id: 24, fdi: 31, name: 'Lower Left Central Incisor', shortName: 'LL Central Incisor', arch: 'mandibular', quadrant: 'LL', type: 'incisor', isAnterior: true },

  { id: 25, fdi: 41, name: 'Lower Right Central Incisor', shortName: 'LR Central Incisor', arch: 'mandibular', quadrant: 'LR', type: 'incisor', isAnterior: true },
  { id: 26, fdi: 42, name: 'Lower Right Lateral Incisor', shortName: 'LR Lateral Incisor', arch: 'mandibular', quadrant: 'LR', type: 'incisor', isAnterior: true },
  { id: 27, fdi: 43, name: 'Lower Right Canine (Cuspid)', shortName: 'LR Canine', arch: 'mandibular', quadrant: 'LR', type: 'canine', isAnterior: true },
  { id: 28, fdi: 44, name: 'Lower Right 1st Premolar (Bicuspid)', shortName: 'LR 1st Premolar', arch: 'mandibular', quadrant: 'LR', type: 'premolar', isAnterior: false },
  { id: 29, fdi: 45, name: 'Lower Right 2nd Premolar (Bicuspid)', shortName: 'LR 2nd Premolar', arch: 'mandibular', quadrant: 'LR', type: 'premolar', isAnterior: false },
  { id: 30, fdi: 46, name: 'Lower Right 1st Molar', shortName: 'LR 1st Molar', arch: 'mandibular', quadrant: 'LR', type: 'molar', isAnterior: false },
  { id: 31, fdi: 47, name: 'Lower Right 2nd Molar', shortName: 'LR 2nd Molar', arch: 'mandibular', quadrant: 'LR', type: 'molar', isAnterior: false },
  { id: 32, fdi: 48, name: 'Lower Right 3rd Molar (Wisdom)', shortName: 'LR 3rd Molar', arch: 'mandibular', quadrant: 'LR', type: 'molar', isAnterior: false },
];
