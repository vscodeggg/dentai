// Patient-Friendly Report Generator & Plain English Translator
import { TEETH_DATA } from '../data/dentalConstants.js';

/**
 * Translates surface abbreviations into layman spatial descriptions
 */
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

/**
 * Translates clinical dental condition into empathetic, easy-to-understand explanation
 */
export function translateFindingToPatientFriendly(finding) {
  const tooth = TEETH_DATA.find(t => t.id === finding.toothId);
  const toothLocation = tooth ? `${tooth.shortName} (#${finding.toothId})` : `Tooth #${finding.toothId}`;
  const surfacesText = friendlySurfaceNames(finding.surfaces, tooth?.isAnterior);

  let title = '';
  let whatIsHappening = '';
  let whyItMatters = '';
  let recommendedCare = '';
  let urgency = 'Routine'; // 'Immediate' | 'Recommended Soon' | 'Routine'
  let urgencyColor = '#10b981';

  switch (finding.condition) {
    case 'caries':
      title = `Cavity on ${toothLocation}`;
      whatIsHappening = `A spot of active tooth decay has softened the enamel and entered the underlying tooth structure on the ${surfacesText}.`;
      whyItMatters = `Tooth decay does not heal on its own. If treated early, it is quick and painless to repair; if left untreated, it can expand toward the nerve and cause a toothache or require a root canal.`;
      recommendedCare = `A gentle, tooth-colored composite filling to clean away bacteria and permanently seal the tooth with natural-looking resin.`;
      urgency = finding.severity === 'Severe' ? 'Immediate' : 'Recommended Soon';
      urgencyColor = finding.severity === 'Severe' ? '#ef4444' : '#f59e0b';
      break;

    case 'recurrent_decay':
      title = `Wear around existing filling on ${toothLocation}`;
      whatIsHappening = `Microscopic bacteria have found a tiny seam along the margin of an older filling on the ${surfacesText}.`;
      whyItMatters = `Even well-cared-for fillings age over time. Resealing this area now prevents deeper decay from spreading beneath the existing restoration.`;
      recommendedCare = `Refresh and replace the older filling with modern adhesive composite bonding.`;
      urgency = 'Recommended Soon';
      urgencyColor = '#f59e0b';
      break;

    case 'fracture':
      title = `Chipped enamel on ${toothLocation}`;
      whatIsHappening = `There is a small crack or chipped edge along the ${surfacesText}.`;
      whyItMatters = `Rough edges can irritate your tongue and food can catch in the fracture line, making it vulnerable to further chipping.`;
      recommendedCare = `Smooth and restore the edge with conservative cosmetic dental bonding to protect the tooth.`;
      urgency = finding.severity === 'Severe' ? 'Immediate' : 'Recommended Soon';
      urgencyColor = finding.severity === 'Severe' ? '#ef4444' : '#f59e0b';
      break;

    case 'perio_pocket':
      const maxDepth = finding.perio?.depths ? Math.max(...finding.perio.depths) : 5;
      const hasBleed = finding.perio?.bleeding;
      title = `Gum health concern around ${toothLocation}`;
      whatIsHappening = `The small pocket between your gum and tooth measures ${maxDepth}mm (healthy gums measure 1-3mm)${hasBleed ? ', and showed gentle bleeding' : ''}.`;
      whyItMatters = `Deeper pockets allow bacterial plaque to hide beyond where regular brushing and flossing can reach, which can lead to gum recession or bone loss if not addressed.`;
      recommendedCare = `Targeted deep cleaning (scaling and root planing) to remove hardened tartar below the gumline and help the gum tissue re-tighten.`;
      urgency = maxDepth >= 5 ? 'Immediate' : 'Recommended Soon';
      urgencyColor = maxDepth >= 5 ? '#ef4444' : '#f59e0b';
      break;

    case 'crown':
      title = `Protective Crown for ${toothLocation}`;
      whatIsHappening = `The tooth requires full structural reinforcement on all surfaces to withstand daily chewing pressures.`;
      whyItMatters = `When a large portion of a tooth is compromised, a standard filling might not be strong enough to prevent the tooth from cracking under bite forces.`;
      recommendedCare = `A custom ceramic crown precision-crafted to match your natural smile and restore 100% chewing strength.`;
      urgency = 'Recommended Soon';
      urgencyColor = '#f59e0b';
      break;

    case 'missing':
      title = `Tooth replacement options for missing ${toothLocation}`;
      whatIsHappening = `This tooth space is currently vacant.`;
      whyItMatters = `When a space is left open, neighboring teeth can slowly drift and shift out of alignment, which can change your bite over time.`;
      recommendedCare = `Consultation on a titanium dental implant or bridge to restore your complete chewing surface.`;
      urgency = 'Routine';
      urgencyColor = '#10b981';
      break;

    default:
      title = `Observation on ${toothLocation}`;
      whatIsHappening = `Our dentist noted a condition on the ${surfacesText}.`;
      whyItMatters = `Regular preventative monitoring ensures your teeth and gums stay healthy.`;
      recommendedCare = finding.clinicalNote || `Routine observation at your next 6-month checkup.`;
      urgency = 'Routine';
      urgencyColor = '#10b981';
  }

  return {
    id: finding.id,
    toothId: finding.toothId,
    title,
    location: toothLocation,
    whatIsHappening,
    whyItMatters,
    recommendedCare,
    urgency,
    urgencyColor,
    rawFinding: finding
  };
}

/**
 * Generates the full patient care report
 */
export function generatePatientReport(patient, approvedFindings, doctorName = 'Dr. Sarah Lin, DDS') {
  const friendlyItems = approvedFindings.map(f => translateFindingToPatientFriendly(f));

  const totalUrgent = friendlyItems.filter(i => i.urgency === 'Immediate').length;
  const totalRecommended = friendlyItems.filter(i => i.urgency === 'Recommended Soon').length;
  const totalRoutine = friendlyItems.filter(i => i.urgency === 'Routine').length;

  let overallSummary = '';
  if (friendlyItems.length === 0) {
    overallSummary = `Great news, ${patient.name.split(' ')[0]}! Your dental exam showed no active cavities or acute concerns today. Your teeth and restorations are in healthy condition.`;
  } else if (totalUrgent > 0) {
    overallSummary = `Hello ${patient.name.split(' ')[0]}, thank you for visiting us today. ${doctorName} identified ${friendlyItems.length} specific area(s) needing attention, including ${totalUrgent} priority item(s) we recommend addressing promptly to protect your oral health and prevent discomfort.`;
  } else {
    overallSummary = `Hello ${patient.name.split(' ')[0]}, thank you for visiting us today. Overall your oral health is in good shape! We identified ${friendlyItems.length} moderate item(s) that we recommend restoring soon to keep your teeth strong and healthy.`;
  }

  return {
    patientName: patient.name,
    patientEmail: patient.email,
    patientPhone: patient.phone,
    examDate: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    doctorName,
    overallSummary,
    items: friendlyItems,
    stats: {
      totalFindings: friendlyItems.length,
      urgentCount: totalUrgent,
      recommendedCount: totalRecommended,
      routineCount: totalRoutine
    },
    homeCareTips: [
      "Brush twice daily with a soft-bristled electric toothbrush for a full 2 minutes.",
      "Floss daily to keep the contact areas between your teeth free of plaque.",
      "Drink water regularly after meals to naturally rinse away food acids.",
      "Follow up on scheduled restorative visits before minor decay spreads deeper."
    ]
  };
}
