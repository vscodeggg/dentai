// Preloaded Patient Profiles with baseline dental charts and medical alerts

export const INITIAL_PATIENTS = [
  {
    id: 'pt-101',
    name: 'Marcus Vance',
    age: 42,
    dob: '1984-03-12',
    phone: '(555) 382-9104',
    email: 'marcus.vance@example.com',
    gender: 'Male',
    lastVisit: '2026-03-10 (6 months ago)',
    insurance: 'Delta Dental Premier (PPO)',
    medicalAlerts: [
      { type: 'warning', text: 'Penicillin Allergy (Moderate - Hives)' },
      { type: 'info', text: 'Pre-medication NOT required' },
      { type: 'note', text: 'Slight gag reflex on upper molars' }
    ],
    perioRisk: 'Moderate',
    existingFindings: [
      { toothId: 1, condition: 'missing', surfaces: [], note: 'Extracted age 21 (Wisdom)' },
      { toothId: 16, condition: 'missing', surfaces: [], note: 'Extracted age 21 (Wisdom)' },
      { toothId: 17, condition: 'missing', surfaces: [], note: 'Extracted age 21 (Wisdom)' },
      { toothId: 32, condition: 'missing', surfaces: [], note: 'Extracted age 21 (Wisdom)' },
      { toothId: 14, condition: 'crown', surfaces: ['O', 'M', 'D', 'B', 'L'], note: 'PFM Crown placed 2021' },
      { toothId: 19, condition: 'amalgam_restoration', surfaces: ['M', 'O', 'D'], note: 'MOD Amalgam placed 2018' },
      { toothId: 30, condition: 'composite_restoration', surfaces: ['O'], note: 'Occlusal composite 2023' },
    ],
    perioMeasurements: {
      19: { B: [4, 3, 4], L: [3, 2, 3], bleeding: false },
      30: { B: [3, 3, 3], L: [3, 2, 3], bleeding: false },
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
    lastVisit: '2025-11-15 (10 months ago)',
    insurance: 'MetLife Dental Guard',
    medicalAlerts: [
      { type: 'success', text: 'No Known Drug Allergies (NKDA)' },
      { type: 'warning', text: 'Nocturnal Bruxism - Night Guard Recommended' }
    ],
    perioRisk: 'Low (Gingivitis localized)',
    existingFindings: [
      { toothId: 1, condition: 'sound', surfaces: [] },
      { toothId: 16, condition: 'sound', surfaces: [] },
      { toothId: 17, condition: 'sound', surfaces: [] },
      { toothId: 32, condition: 'sound', surfaces: [] },
      { toothId: 3, condition: 'composite_restoration', surfaces: ['O'], note: 'Preventative resin sealant' },
      { toothId: 18, condition: 'composite_restoration', surfaces: ['O'], note: 'Composite 2022' },
    ],
    perioMeasurements: {
      18: { B: [3, 2, 3], L: [3, 2, 2], bleeding: true },
      31: { B: [3, 2, 3], L: [2, 2, 2], bleeding: false },
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
    lastVisit: '2026-01-20 (8 months ago)',
    insurance: 'Cigna Dental Health',
    medicalAlerts: [
      { type: 'danger', text: 'Sulfa Drugs & Latex Allergy' },
      { type: 'danger', text: 'Hypertension - On ACE Inhibitor (Lisinopril)' },
      { type: 'warning', text: 'Bleeding Risk / Stage III Periodontitis' }
    ],
    perioRisk: 'High (Generalized Periodontitis)',
    existingFindings: [
      { toothId: 18, condition: 'missing', surfaces: [], note: 'Extracted due to vertical root fracture 2024' },
      { toothId: 19, condition: 'crown', surfaces: ['O', 'M', 'D', 'B', 'L'], note: 'Zirconia crown over RCT' },
      { toothId: 19, condition: 'root_canal', surfaces: [], note: 'Completed 2022' },
      { toothId: 30, condition: 'implant', surfaces: [], note: 'Straumann Titanium Implant placed 2023' },
      { toothId: 30, condition: 'crown', surfaces: ['O', 'M', 'D', 'B', 'L'], note: 'Screw-retained ceramic crown' },
    ],
    perioMeasurements: {
      19: { B: [5, 4, 6], L: [4, 4, 5], bleeding: true },
      30: { B: [3, 3, 3], L: [3, 3, 3], bleeding: false },
      3: { B: [5, 4, 5], L: [4, 3, 4], bleeding: true }
    }
  }
];
