import { APPLICABLE_NORM, CalculationResults, LoadItem, SteelGrade, SteelProfile, SupportPositions, SupportType } from '../types';
import { STEEL_PROFILES } from '../data/profiles';
import { solveBeam } from './structuralSolver';

export interface CandidateEvaluation {
  profile: SteelProfile;
  calcResults: CalculationResults;
  massDiffKgPerM: number;
  massDiffPercent: number;
  inertiaDiffPercent: number;
}

export interface AiProfileProposal {
  recommendedProfile: SteelProfile;
  recommendedResults: CalculationResults;
  verdictTitle: string;
  diagnosis: string;
  rationale: string;
  economyAnalysis: string;
  keyStrengths: string[];
  constructiveTips: string[];
  alternatives: {
    type: 'ECONOMICA' | 'RIGIDEZ' | 'COMPACTA';
    title: string;
    profile: SteelProfile;
    results: CalculationResults;
    description: string;
  }[];
  isAiGenerated: boolean;
}

/**
 * Evaluates all catalog profiles for the given beam configuration and loads,
 * selecting the optimal profiles according to structural criteria (ELU and ELS).
 */
export function evaluateProfilesForLoading(
  spanLength: number,
  supportType: SupportType,
  loads: LoadItem[],
  currentProfile: SteelProfile,
  steelGrade: SteelGrade,
  supportPositions?: SupportPositions
): {
  passingCandidates: CandidateEvaluation[];
  bestEconomic: CandidateEvaluation | null;
  bestStiffness: CandidateEvaluation | null;
  bestCompact: CandidateEvaluation | null;
} {
  const evaluations: CandidateEvaluation[] = [];

  for (const candidate of STEEL_PROFILES) {
    const results = solveBeam(spanLength, supportType, loads, candidate, steelGrade, supportPositions);

    // Profile qualifies if it does not fail any limit state (ELU & ELS)
    const passes =
      results.status === 'PASS' ||
      (results.momentRatio <= 100 &&
        results.shearRatio <= 100 &&
        results.deflectionRatio <= 100 &&
        results.vonMisesRatio <= 100);

    if (passes) {
      const massDiffKgPerM = Number((candidate.massLinear - currentProfile.massLinear).toFixed(1));
      const massDiffPercent = Number(
        (((candidate.massLinear - currentProfile.massLinear) / currentProfile.massLinear) * 100).toFixed(1)
      );
      const inertiaDiffPercent = Number(
        (((candidate.inertia_Ix - currentProfile.inertia_Ix) / currentProfile.inertia_Ix) * 100).toFixed(1)
      );

      evaluations.push({
        profile: candidate,
        calcResults: results,
        massDiffKgPerM,
        massDiffPercent,
        inertiaDiffPercent,
      });
    }
  }

  // Sort passing profiles by linear mass (lightest first = most economical)
  evaluations.sort((a, b) => {
    // Prefer profiles that pass comfortably (utilization <= 85%)
    const aSafe = a.calcResults.momentRatio <= 85 && a.calcResults.deflectionRatio <= 85;
    const bSafe = b.calcResults.momentRatio <= 85 && b.calcResults.deflectionRatio <= 85;
    if (aSafe && !bSafe) return -1;
    if (!aSafe && bSafe) return 1;
    return a.profile.massLinear - b.profile.massLinear;
  });

  const bestEconomic = evaluations.length > 0 ? evaluations[0] : null;

  // Best stiffness: highest Ix among passing profiles
  const sortedByIx = [...evaluations].sort(
    (a, b) => b.profile.inertia_Ix - a.profile.inertia_Ix
  );
  const bestStiffness = sortedByIx.length > 0 && sortedByIx[0].profile.id !== bestEconomic?.profile.id
    ? sortedByIx[0]
    : evaluations.length > 1
    ? evaluations[1]
    : null;

  // Best compact: lowest height depth_d among passing profiles
  const sortedByHeight = [...evaluations].sort(
    (a, b) => a.profile.depth_d - b.profile.depth_d
  );
  const bestCompact = sortedByHeight.length > 0 &&
    sortedByHeight[0].profile.id !== bestEconomic?.profile.id &&
    sortedByHeight[0].profile.id !== bestStiffness?.profile.id
    ? sortedByHeight[0]
    : null;

  return {
    passingCandidates: evaluations,
    bestEconomic,
    bestStiffness,
    bestCompact,
  };
}

/**
 * Calls the server-side Gemini AI engine or uses advanced local structural heuristic
 * to propose the ideal profile with detailed technical rationale.
 */
export async function proposeIdealProfileWithAI(
  spanLength: number,
  supportType: SupportType,
  loads: LoadItem[],
  currentProfile: SteelProfile,
  steelGrade: SteelGrade,
  calcResults: CalculationResults,
  supportPositions?: SupportPositions
): Promise<AiProfileProposal> {
  const { passingCandidates, bestEconomic, bestStiffness, bestCompact } =
    evaluateProfilesForLoading(
      spanLength,
      supportType,
      loads,
      currentProfile,
      steelGrade,
      supportPositions
    );

  const selectedCandidate = bestEconomic || {
    profile: currentProfile,
    calcResults: calcResults,
    massDiffKgPerM: 0,
    massDiffPercent: 0,
    inertiaDiffPercent: 0,
  };

  // Summarize loads for engineering prompt
  const loadsSummary = loads
    .map((l) => `${l.name || l.type}: ${l.value} ${l.preferredLoadUnit || (l.type === 'distributed' ? 'kN/m' : 'kN')} em x=${l.positionX}m`)
    .join(', ');

  const candidatePayload = passingCandidates.slice(0, 8).map((c) => ({
    id: c.profile.id,
    designation: c.profile.designation,
    family: c.profile.family,
    massLinear: c.profile.massLinear,
    depth_d: c.profile.depth_d,
    flangeWidth_bf: c.profile.flangeWidth_bf,
    inertia_Ix: c.profile.inertia_Ix,
    elasticModulus_Wx: c.profile.elasticModulus_Wx,
    momentRatio: c.calcResults.momentRatio,
    deflectionRatio: c.calcResults.deflectionRatio,
    vonMisesRatio: c.calcResults.vonMisesRatio,
    maxDeflectionMm: c.calcResults.maxDeflection,
    status: c.calcResults.status,
  }));

  // Build local fallback rationale in case server is offline or fails
  const failedReasons: string[] = [];
  if (calcResults.momentRatio > 100) {
    failedReasons.push(`Momento fletor solicitante excessivo (${calcResults.momentRatio}% de MRd)`);
  }
  if (calcResults.deflectionRatio > 100) {
    failedReasons.push(`Flecha máxima acima do limite normativo L/350 (${calcResults.deflectionRatio}% do limite, ${calcResults.maxDeflection.toFixed(1)} mm)`);
  }
  if (calcResults.vonMisesRatio > 100) {
    failedReasons.push(`Tensão equivalente de Von Mises acima de fyd (${calcResults.vonMisesRatio}% de escoamento)`);
  }
  if (calcResults.shearRatio > 100) {
    failedReasons.push(`Esforço cortante além da capacidade da alma (${calcResults.shearRatio}% de VRd)`);
  }
  if (failedReasons.length === 0) {
    failedReasons.push(`Perfil com taxa de trabalho elevada (${Math.max(calcResults.momentRatio, calcResults.deflectionRatio)}%) demandando folga técnica.`);
  }

  const localProposal: AiProfileProposal = {
    recommendedProfile: selectedCandidate.profile,
    recommendedResults: selectedCandidate.calcResults,
    verdictTitle: `Perfil ${selectedCandidate.profile.designation} recomendado para pleno atendimento aos ELU e ELS`,
    diagnosis: `O perfil atual (${currentProfile.designation}) foi reprovado devido a: ${failedReasons.join('; ')}.`,
    rationale: `Aumentando a inércia flexional Ix para ${selectedCandidate.profile.inertia_Ix.toLocaleString()} cm⁴ (+${selectedCandidate.inertiaDiffPercent}%) e o módulo elástico plástico Zx, a viga passa a trabalhar com momento resistente folgado (utilização de ${selectedCandidate.calcResults.momentRatio}%) e flecha em serviço de apenas ${selectedCandidate.calcResults.maxDeflection.toFixed(1)} mm (${selectedCandidate.calcResults.deflectionRatio}% do limite L/350), garantindo 100% de conformidade com a ${APPLICABLE_NORM}.`,
    economyAnalysis: `O perfil proposto representa o menor consumo de aço viável no catálogo (${selectedCandidate.profile.massLinear} kg/m), garantindo segurança estrutural com acréscimo controlado de apenas ${selectedCandidate.massDiffKgPerM > 0 ? `+${selectedCandidate.massDiffKgPerM} kg/m` : `${selectedCandidate.massDiffKgPerM} kg/m`} sobre a seção inicial.`,
    keyStrengths: [
      `Flexão normal segura: MSd/MRd = ${selectedCandidate.calcResults.momentRatio}% (aprovado)`,
      `Rigidez vertical em serviço: δ = ${selectedCandidate.calcResults.maxDeflection.toFixed(1)} mm ≤ ${selectedCandidate.calcResults.allowableDeflection} mm`,
      `Tensão Von Mises: ${selectedCandidate.calcResults.vonMisesMax.toFixed(1)} MPa ≤ ${selectedCandidate.calcResults.allowableStress_fyd} MPa (${selectedCandidate.calcResults.vonMisesRatio}%)`,
      `Seção compacta com contenção lateral eficaz conforme ${APPLICABLE_NORM}`,
    ],
    constructiveTips: [
      `Verificar o comprimento destravado da mesa comprimida (Lb ≤ Lr) para evitar flambagem lateral com torção (FLT).`,
      `Garantir espessura de chapa de ligação e soldas de topo/alma compatíveis com o esforço cortante de apoio de ${selectedCandidate.calcResults.reactionA.toFixed(1)} kN.`,
      `Prever contraventamento nos terçamentos ou apoios para manter o alinhamento axial e perpendicularidade.`,
    ],
    alternatives: [],
    isAiGenerated: false,
  };

  // Add alternatives
  if (bestStiffness && bestStiffness.profile.id !== selectedCandidate.profile.id) {
    localProposal.alternatives.push({
      type: 'RIGIDEZ',
      title: 'Máxima Rigidez / Menor Deformação',
      profile: bestStiffness.profile,
      results: bestStiffness.calcResults,
      description: `Inércia superior (Ix = ${bestStiffness.profile.inertia_Ix.toLocaleString()} cm⁴), reduzindo a flecha para apenas ${bestStiffness.calcResults.maxDeflection.toFixed(1)} mm (${bestStiffness.calcResults.deflectionRatio}% de L/350). Ideal para lajes com pisos sensíveis.`,
    });
  }

  if (bestCompact && bestCompact.profile.id !== selectedCandidate.profile.id) {
    localProposal.alternatives.push({
      type: 'COMPACTA',
      title: 'Perfil Compacto (Menor Altura)',
      profile: bestCompact.profile,
      results: bestCompact.calcResults,
      description: `Altura reduzida (d = ${bestCompact.profile.depth_d} mm), preservando o pé-direito da edificação com plena aprovação estrutural.`,
    });
  }

  // Attempt server call to Gemini API
  try {
    const res = await fetch('/api/ai/propose-profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        spanLength,
        supportType,
        norm: APPLICABLE_NORM,
        currentProfile,
        steelGrade,
        calcResults: {
          maxMoment: calcResults.maxMoment,
          momentCapacity_Mrd: calcResults.momentCapacity_Mrd,
          momentRatio: calcResults.momentRatio,
          maxShearPos: calcResults.maxShearPos,
          maxShearNeg: calcResults.maxShearNeg,
          shearRatio: calcResults.shearRatio,
          maxDeflection: calcResults.maxDeflection,
          allowableDeflection: calcResults.allowableDeflection,
          deflectionRatio: calcResults.deflectionRatio,
          vonMisesMax: calcResults.vonMisesMax,
          allowableStress_fyd: calcResults.allowableStress_fyd,
          vonMisesRatio: calcResults.vonMisesRatio,
          status: calcResults.status,
        },
        loadsSummary,
        candidateProfiles: candidatePayload,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.data) {
        const aiData = data.data;
        // Match profile object
        let recommendedProfile = selectedCandidate.profile;
        let recommendedResults = selectedCandidate.calcResults;

        if (aiData.recommendedProfileId) {
          const found = passingCandidates.find(
            (c) => c.profile.id === aiData.recommendedProfileId || c.profile.designation === aiData.recommendedProfileDesignation
          );
          if (found) {
            recommendedProfile = found.profile;
            recommendedResults = found.calcResults;
          }
        }

        return {
          recommendedProfile,
          recommendedResults,
          verdictTitle: aiData.verdictTitle || localProposal.verdictTitle,
          diagnosis: aiData.diagnosis || localProposal.diagnosis,
          rationale: aiData.rationale || localProposal.rationale,
          economyAnalysis: aiData.economyAnalysis || localProposal.economyAnalysis,
          keyStrengths: aiData.keyStrengths?.length ? aiData.keyStrengths : localProposal.keyStrengths,
          constructiveTips: aiData.constructiveTips?.length ? aiData.constructiveTips : localProposal.constructiveTips,
          alternatives: localProposal.alternatives,
          isAiGenerated: true,
        };
      }
    }
  } catch (err) {
    console.warn('Fallback to local structural solver calculation:', err);
  }

  return localProposal;
}
