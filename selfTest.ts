/**
 * Autoteste do motor (known-answer tests). Roda na inicialização do app e no build (npm test).
 * Usa constantes PRÓPRIAS (independentes de data/profiles.ts) e fórmulas fechadas de manual.
 * Se qualquer teste falhar, o app entra em modo INVALID: nenhum resultado/memorial é liberado.
 *
 * Limite honesto: um atacante com controle total do código do navegador pode alterar este teste
 * também. Ele detecta erros, regressões e adulteração parcial; a garantia forte exige
 * recálculo e assinatura no servidor (ver docs/SEGURANCA.md).
 */
import { LoadItem, SteelGrade, SteelProfile, SupportType } from '../types';
import { solveBeam } from './structuralSolver';

const REF_PROFILE: SteelProfile = {
  id: 'ref', designation: 'REF W 250 x 32.7', family: 'W', typeDescription: 'ref', massLinear: 32.7,
  depth_d: 258, flangeWidth_bf: 146, webThickness_tw: 6.1, flangeThickness_tf: 9.1, area_A: 42.1,
  inertia_Ix: 4890, inertia_Iy: 473, elasticModulus_Wx: 379.3, plasticModulus_Zx: 424.3,
  radiusGyration_rx: 10.78, radiusGyration_ry: 3.35, webCompact: true, flangeCompact: true,
};
const REF_GRADE: SteelGrade = { name: 'REF A572 Gr50', category: 'ALTA RESISTÊNCIA', fy: 345, fu: 450, E: 200, G: 77.2, nu: 0.3 };
const EI = REF_GRADE.E * 1e6 * REF_PROFILE.inertia_Ix * 1e-8; // 9780 kN·m²

const ld = (type: LoadItem['type'], value: number, positionX: number, length?: number, gammaF = 1.4): LoadItem => ({
  id: 'st', type, name: 'st', value, positionX, length, direction: '-Y', gammaF,
});

export interface SelfTestResult { ok: boolean; failures: string[]; total: number }

export function runSelfTest(): SelfTestResult {
  const failures: string[] = [];
  let total = 0;
  const chk = (name: string, expected: number, got: number, tol = 0.003) => {
    total++;
    const err = expected === 0 ? Math.abs(got) : Math.abs(got - expected) / Math.abs(expected);
    if (!Number.isFinite(got) || err > tol) failures.push(`${name}: esperado ${expected.toFixed(3)}, obtido ${String(got)}`);
  };
  const run = (L: number, t: SupportType, loads: LoadItem[]) => solveBeam(L, t, loads, REF_PROFILE, REF_GRADE);

  try {
    // 1) Biapoiada, carga uniforme
    let r = run(6, 'biapoiada', [ld('distributed', 10, 0, 6)]);
    chk('biapoiada R_A', 42, r.reactionA);
    chk('biapoiada M_max', 63, r.maxMoment);
    chk('biapoiada flecha', (5 * 10 * 6 ** 4) / (384 * EI) * 1000, r.maxDeflection);

    // 2) Biapoiada, pontual excêntrica
    r = run(6, 'biapoiada', [ld('point', 50, 2)]);
    chk('pontual R_A', (70 * 4) / 6, r.reactionA);
    chk('pontual M_max', (70 * 2 * 4) / 6, r.maxMoment);

    // 3) Balanço
    r = run(3, 'cantilever', [ld('point', 20, 3)]);
    chk('balanço M_engaste', -84, r.maxMoment);
    chk('balanço flecha', (20 * 27) / (3 * EI) * 1000, r.maxDeflection);

    // 4) Biengastada, pontual excêntrica (a = 1,5; b = 4,5; L = 6)
    r = run(6, 'biengastada', [ld('point', 50, 1.5)]);
    chk('biengastada R_A', (70 * 4.5 ** 2 * (3 * 1.5 + 4.5)) / 6 ** 3, r.reactionA);
    chk('biengastada M_A', -(70 * 1.5 * 4.5 ** 2) / 36, r.fixedEndMomentA ?? NaN);

    // 5) Contínua, 2 vãos iguais, carga uniforme (q majorado = 14 kN/m; l = 3 m)
    r = run(6, 'continua', [ld('distributed', 10, 0, 6)]);
    chk('contínua R_A', (3 * 14 * 3) / 8, r.reactionA);
    chk('contínua R_C (central)', (10 * 14 * 3) / 8, r.reactionC ?? NaN);
    chk('contínua M_apoio central', -(14 * 9) / 8, Math.min(...r.momentCurve.map((p) => p.m)));

    // 6) Momento aplicado: M(L) deve fechar em 0 e |M|max = M/2
    r = run(6, 'biapoiada', [ld('moment', 10, 3)]);
    chk('momento M(L)=0', 0, r.momentCurve[r.momentCurve.length - 1].m, 0);
    chk('momento |M|max', 7, Math.abs(r.maxMoment));

    // 7) Flecha em serviço independe de γf
    r = solveBeam(6, 'biapoiada', [ld('distributed', 10, 0, 6, 1.25)], REF_PROFILE, REF_GRADE);
    chk('flecha ELS com γf=1,25', (5 * 10 * 6 ** 4) / (384 * EI) * 1000, r.maxDeflection);

    // 8) Fail-closed: entradas inválidas nunca aprovam
    total++;
    if (solveBeam(6, 'biapoiada', [ld('point', 30, NaN)], REF_PROFILE, REF_GRADE).status !== 'INVALID') failures.push('entrada NaN não gerou INVALID');
    total++;
    if (solveBeam(NaN, 'biapoiada', [ld('point', 30, 1)], REF_PROFILE, REF_GRADE).status !== 'INVALID') failures.push('vão NaN não gerou INVALID');
  } catch (e) {
    failures.push(`exceção no autoteste: ${String(e)}`);
  }
  return { ok: failures.length === 0, failures, total };
}
