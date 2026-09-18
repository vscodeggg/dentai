// Preset Clinical Dictation Scenarios for Interactive Testing

export const CLINICAL_SCENARIOS = [
  {
    id: 'routine-restorative',
    title: 'Routine Restorative Exam',
    subtitle: 'Extracts occlusal decay, defective margin, and periodontal pocket',
    utterances: [
      {
        text: "Tooth number fourteen occlusal caries into dentin, recommend one surface composite.",
        delay: 800
      },
      {
        text: "Tooth number three distal margin breakdown recurrent decay underneath amalgam.",
        delay: 2400
      },
      {
        text: "Tooth nineteen probing depth buccal five millimeters with bleeding on probing.",
        delay: 4200
      }
    ]
  },
  {
    id: 'ambiguity-crown-conflict',
    title: 'Ambiguity Check: Crown vs Adjacent Molar',
    subtitle: 'Triggers context-aware disambiguation between #14 (crowned) and #15 (decayed pit)',
    utterances: [
      {
        text: "Upper left molar deep occlusal caries on tooth fourteen.",
        delay: 900
      }
    ],
    expectedAmbiguity: {
      toothId: 14,
      suggestedToothId: 15,
      reason: "Tooth #14 already has an intact full porcelain crown. Tooth #15 (2nd Molar) has untreated deep occlusal pits. Did you mean Tooth #15?"
    }
  },
  {
    id: 'missing-tooth-alert',
    title: 'Conflict Alert: Missing Tooth Charted',
    subtitle: 'Alerts when decay is voiced on a previously extracted wisdom/molar tooth',
    utterances: [
      {
        text: "Tooth eighteen deep mesial decay with cold sensitivity.",
        delay: 900
      }
    ],
    expectedAmbiguity: {
      toothId: 18,
      reason: "Conflict: Tooth #18 is currently recorded as EXTRACTED / MISSING on Marcus's baseline chart. Verify if patient has retained root tip or if another tooth was intended."
    }
  },
  {
    id: 'anterior-esthetic',
    title: 'Anterior Incisal & Cosmetic Exam',
    subtitle: 'Parses incisal edge chips, facial composite, and anterior teeth numbering',
    utterances: [
      {
        text: "Tooth number eight incisal chip class four fracture mild enamel defect.",
        delay: 900
      },
      {
        text: "Tooth number nine mesial incisal angle recurrent stain along margin.",
        delay: 2500
      }
    ]
  },
  {
    id: 'periodontal-charting',
    title: 'Full Periodontal Probing Sequence',
    subtitle: 'Rapid multi-site pocket depths and bleeding on probing indicators',
    utterances: [
      {
        text: "Probing tooth thirty buccal five four five millimeters bleeding positive.",
        delay: 800
      },
      {
        text: "Tooth thirty-one buccal four three four no bleeding.",
        delay: 2400
      },
      {
        text: "Tooth two lingual six five six bleeding on probing localized stage three pocket.",
        delay: 4100
      }
    ]
  }
];
