/**
 * BeamSolid Pro - Motor de cálculo estrutural v2
 *
 * Método: elementos finitos de viga de Euler-Bernoulli (2 GDL por nó: w, θ), com nós em todos os
 * pontos singulares (apoios, início/fim de cargas, cargas pontuais e momentos). Com cargas
 * uniformes por trecho, o resultado é EXATO (esforços e flecha), sem amostragem.
 *
 * Convenções de saída (compatíveis com a interface):
 *  - V(x) > 0 : soma das forças verticais à esquerda da seção, para cima
 *  - M(x) > 0 : momento fletor que traciona a fibra inferior (sagging); engaste = negativo
 *  - flecha   : positiva para baixo (mm)
 *  - carga distribuída/pontual: valor ≥ 0, direção '-Y' (para baixo) ou '+Y' (para cima)
 *  - momento aplicado: valor ≥ 0, horário em '-Y' (anti-horário em '+Y')
 *
 * Segurança: entradas inválidas (NaN, Infinity, fora do vão, perfil/aço corrompido) NUNCA
 * produzem PASS. O resultado é status 'INVALID' com a lista de erros (fail-closed).
 * O motor também confere o equilíbrio global (forças e momentos) de cada resolução.
 */
import { CalculationResults, LoadItem, SteelGrade, SteelProfile, SupportPositions, SupportType } from '../types';

export const ENGINE_VERSION = '2.0.0';
export const GAMMA_A1 = 1.10; // NBR 8800:2008 - escoamento
export const DEFLECTION_DIVISOR = 350; // NBR 8800:2008 Anexo C (vigas de piso: L/350)
const MIN_SPAN = 0.5;
const MAX_SPAN = 200;
const TOL_X = 1e-9;
const TARGET_SAMPLES = 240;
const SNAP = 1e-3; // m: posições de carga a menos de 1 mm de um nó existente são alinhadas a ele (evita elementos degenerados)

const isFin = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const SUPPORT_TYPES: SupportType[] = ['biapoiada', 'cantilever', 'biengastada', 'continua'];

// ----------------------------------------------------------------------------------------------
// Validação (fail-closed)
// ----------------------------------------------------------------------------------------------
interface Geometry {
  L: number;
  posA: number;
  posB: number;
  posC?: number;
}

function validate(
  spanLength: number,
  supportType: SupportType,
  loads: LoadItem[],
  profile: SteelProfile,
  grade: SteelGrade,
  sp?: SupportPositions
): { errors: string[]; warnings: string[]; geo?: Geometry } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isFin(spanLength) || spanLength < MIN_SPAN || spanLength > MAX_SPAN) {
    errors.push(`Vão inválido (${String(spanLength)}). Use valores entre ${MIN_SPAN} m e ${MAX_SPAN} m.`);
  }
  if (!SUPPORT_TYPES.includes(supportType)) errors.push(`Tipo de apoio desconhecido: ${String(supportType)}.`);

  const profKeys: (keyof SteelProfile)[] = [
    'depth_d', 'webThickness_tw', 'flangeThickness_tf', 'inertia_Ix', 'elasticModulus_Wx', 'plasticModulus_Zx', 'area_A',
  ];
  if (!profile) errors.push('Perfil não informado.');
  else
    profKeys.forEach((k) => {
      const v = profile[k];
      if (!isFin(v) || v <= 0) errors.push(`Propriedade do perfil inválida: ${k} = ${String(v)}.`);
    });
  if (!grade) errors.push('Aço não informado.');
  else {
    if (!isFin(grade.fy) || grade.fy < 100 || grade.fy > 1500) errors.push(`fy inválido: ${String(grade.fy)} MPa.`);
    if (!isFin(grade.E) || grade.E < 50 || grade.E > 400) errors.push(`E inválido: ${String(grade.E)} GPa.`);
  }
  if (errors.length) return { errors, warnings };

  const L = spanLength;
  const posA = sp?.posA ?? 0;
  const posB = sp?.posB ?? L;
  let posC = sp?.posC;

  if (!isFin(posA) || posA < -TOL_X || posA > L + TOL_X) errors.push(`Posição do apoio A inválida (${String(posA)}).`);
  if (supportType === 'cantilever') {
    if (isFin(posA) && posA > L - 0.1) errors.push('Engaste muito próximo da extremidade livre da viga.');
  } else {
    if (!isFin(posB) || posB > L + TOL_X) errors.push(`Posição do apoio B inválida (${String(posB)}), fora do vão ${L} m.`);
    else if (isFin(posA) && posB - posA < 0.1) errors.push('A distância entre os apoios A e B deve ser de pelo menos 0,1 m.');
  }
  if (supportType === 'continua' && errors.length === 0) {
    if (posC === undefined) posC = (posA + posB) / 2;
    if (!isFin(posC) || posC < posA + 0.05 || posC > posB - 0.05) errors.push(`Posição do apoio intermediário C inválida (${String(posC)}).`);
  }

  loads.forEach((ld, i) => {
    const tag = `Carga ${i + 1}${ld?.name ? ` (${ld.name})` : ''}`;
    if (!ld || !['distributed', 'point', 'moment'].includes(ld.type)) return void errors.push(`${tag}: tipo desconhecido.`);
    if (!isFin(ld.value) || ld.value < 0) errors.push(`${tag}: valor inválido (${String(ld.value)}). Use valor ≥ 0 e a direção para o sentido.`);
    if (!isFin(ld.gammaF) || ld.gammaF <= 0 || ld.gammaF > 3) errors.push(`${tag}: coeficiente γf inválido (${String(ld.gammaF)}).`);
    if (ld.direction !== '-Y' && ld.direction !== '+Y') errors.push(`${tag}: direção inválida.`);
    if (!isFin(ld.positionX) || ld.positionX < -TOL_X || ld.positionX > L + TOL_X) {
      errors.push(`${tag}: posição ${String(ld.positionX)} m fora da viga (0 a ${L} m).`);
    } else if (ld.type === 'distributed') {
      if (ld.length !== undefined && (!isFin(ld.length) || ld.length < 0)) errors.push(`${tag}: comprimento inválido (${String(ld.length)}).`);
      else if (ld.positionX + (ld.length ?? L) > L + TOL_X) {
        warnings.push(`${tag}: estende além da viga e foi limitada ao comprimento de ${L} m.`);
      }
    }
  });

  if (errors.length) return { errors, warnings };
  return { errors, warnings, geo: { L, posA: Math.max(0, posA), posB: supportType === 'cantilever' ? L : Math.min(posB, L), posC } };
}

// ----------------------------------------------------------------------------------------------
// Álgebra linear mínima
// ----------------------------------------------------------------------------------------------
function solveLinear(A0: number[][], b0: number[]): number[] | null {
  const n = b0.length;
  // Equilíbrio diagonal (Jacobi): A' = D^-1/2 A D^-1/2 — mantém o pivotamento robusto com elementos de tamanhos diferentes
  const dsc = A0.map((row, i) => Math.sqrt(Math.abs(row[i])));
  if (dsc.some((d) => !(d > 0) || !Number.isFinite(d))) return null;
  const M = A0.map((row, i) => [...row.map((v, j) => v / (dsc[i] * dsc[j])), b0[i] / dsc[i]]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (Math.abs(M[p][c]) < 1e-9) return null; // singular => estrutura instável
    [M[c], M[p]] = [M[p], M[c]];
    for (let r = c + 1; r < n; r++) {
      const f = M[r][c] / M[c][c];
      if (f === 0) continue;
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  const y = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let s = M[i][n];
    for (let k = i + 1; k < n; k++) s -= M[i][k] * y[k];
    y[i] = s / M[i][i];
  }
  return y.map((v, i) => v / dsc[i]);
}

// ----------------------------------------------------------------------------------------------
// Núcleo: resolve um caso de carga (ELU majorado ou ELS característico)
// ----------------------------------------------------------------------------------------------
interface Elem { x0: number; l: number; q: number } // q: kN/m, positivo para baixo

interface CaseSolution {
  u: number[];
  p: number[][]; // forças nodais no elemento [F1, M1, F2, M2] (F↑, M anti-horário)
  reactionsV: number[]; // por nó
  reactionsM: number[]; // por nó (anti-horário)
  totalDown: number;
  errors: string[];
}

function ke(EI: number, l: number): number[][] {
  const c = EI / (l * l * l);
  return [
    [12 * c, 6 * l * c, -12 * c, 6 * l * c],
    [6 * l * c, 4 * l * l * c, -6 * l * c, 2 * l * l * c],
    [-12 * c, -6 * l * c, 12 * c, -6 * l * c],
    [6 * l * c, 2 * l * l * c, -6 * l * c, 4 * l * l * c],
  ];
}

function feq(q: number, l: number): number[] {
  return [-q * l / 2, -q * l * l / 12, -q * l / 2, q * l * l / 12];
}

function buildElems(xs: number[], loads: LoadItem[], L: number, factorOf: (ld: LoadItem) => number): Elem[] {
  const es: Elem[] = [];
  for (let i = 0; i < xs.length - 1; i++) es.push({ x0: xs[i], l: xs[i + 1] - xs[i], q: 0 });
  loads.forEach((ld) => {
    if (ld.type !== 'distributed') return;
    const q = ld.value * factorOf(ld) * (ld.direction === '+Y' ? -1 : 1);
    const xa = ld.positionX;
    const xb = Math.min(ld.positionX + (ld.length ?? L), L);
    es.forEach((e) => {
      if (e.x0 >= xa - TOL_X && e.x0 + e.l <= xb + TOL_X) e.q += q;
    });
  });
  return es;
}

function solveCase(
  xs: number[],
  EI: number,
  loads: LoadItem[],
  L: number,
  factorOf: (ld: LoadItem) => number,
  supports: { node: number; fixed: boolean }[]
): CaseSolution & { elems: Elem[] } {
  const nN = xs.length;
  const nD = 2 * nN;
  const elems = buildElems(xs, loads, L, factorOf);
  const nodeAt = (x: number) => xs.findIndex((v) => Math.abs(v - x) < 1e-7);

  const F = new Array(nD).fill(0);
  let totalDown = 0;
  let momentAbout0 = 0; // só para a checagem de equilíbrio (anti-horário +)

  loads.forEach((ld) => {
    const f = factorOf(ld);
    const s = ld.direction === '+Y' ? -1 : 1; // s = +1: para baixo
    if (ld.type === 'distributed') {
      const xa = ld.positionX;
      const xb = Math.min(ld.positionX + (ld.length ?? L), L);
      const q = ld.value * f * s;
      totalDown += q * (xb - xa);
      momentAbout0 += -q * (xb - xa) * ((xa + xb) / 2);
    } else if (ld.type === 'point') {
      const P = ld.value * f * s;
      F[2 * nodeAt(ld.positionX)] += -P;
      totalDown += P;
      momentAbout0 += -P * ld.positionX;
    } else if (ld.type === 'moment') {
      const M0 = ld.value * f * s; // horário positivo quando s=+1
      F[2 * nodeAt(ld.positionX) + 1] += -M0;
      momentAbout0 += -M0;
    }
  });

  const K: number[][] = Array.from({ length: nD }, () => new Array(nD).fill(0));
  elems.forEach((e, i) => {
    const k = ke(EI, e.l);
    const fe = feq(e.q, e.l);
    const dof = [2 * i, 2 * i + 1, 2 * i + 2, 2 * i + 3];
    for (let a = 0; a < 4; a++) {
      F[dof[a]] += fe[a];
      for (let b = 0; b < 4; b++) K[dof[a]][dof[b]] += k[a][b];
    }
  });

  const fixedDof = new Set<number>();
  supports.forEach((s) => {
    fixedDof.add(2 * s.node);
    if (s.fixed) fixedDof.add(2 * s.node + 1);
  });
  const free = Array.from({ length: nD }, (_, i) => i).filter((i) => !fixedDof.has(i));
  const uf = solveLinear(free.map((i) => free.map((j) => K[i][j])), free.map((i) => F[i]));
  const errors: string[] = [];
  const u = new Array(nD).fill(0);
  if (!uf) {
    errors.push('Estrutura instável ou mal condicionada (verifique os apoios).');
    return { u, p: [], reactionsV: [], reactionsM: [], totalDown, errors, elems };
  }
  free.forEach((d, i) => (u[d] = uf[i]));

  // Reações: R = K·u − F nos GDL restritos
  const reactionsV = new Array(nN).fill(0);
  const reactionsM = new Array(nN).fill(0);
  let termScale = 0; // magnitude dos termos somados em R = K·u − F (para a folga de arredondamento)
  fixedDof.forEach((d) => {
    let r = -F[d];
    let t = Math.abs(F[d]);
    for (let j = 0; j < nD; j++) {
      r += K[d][j] * u[j];
      t += Math.abs(K[d][j] * u[j]);
    }
    termScale = Math.max(termScale, t);
    if (d % 2 === 0) reactionsV[d / 2] = r;
    else reactionsM[(d - 1) / 2] = r;
  });

  // Forças nodais nos elementos: p = Ke·u − fe
  const p = elems.map((e, i) => {
    const k = ke(EI, e.l);
    const fe = feq(e.q, e.l);
    const ue = [u[2 * i], u[2 * i + 1], u[2 * i + 2], u[2 * i + 3]];
    return k.map((row, a) => row.reduce((s, v, b) => s + v * ue[b], 0) - fe[a]);
  });

  // Conferência de equilíbrio global (forças e momentos)
  const sumR = reactionsV.reduce((a, b) => a + b, 0);
  const scaleF = Math.max(1, Math.abs(totalDown), ...reactionsV.map(Math.abs));
  // Folga de arredondamento (ponto flutuante) proporcional à escala dos termos, limitada a 1 N:
  // evita falso positivo em malhas com elementos muito curtos, sem mascarar erros reais (≥ 1 N).
  const roundoff = Math.min(1e-8 * termScale, 1e-3);
  if (Math.abs(sumR - totalDown) > 1e-6 * scaleF + roundoff) errors.push('Falha de equilíbrio de forças no motor de cálculo.');
  let sumM0 = momentAbout0;
  reactionsV.forEach((r, i) => (sumM0 += r * xs[i]));
  reactionsM.forEach((m) => (sumM0 += m));
  const scaleM = Math.max(1, Math.abs(momentAbout0), ...reactionsV.map((r, i) => Math.abs(r * xs[i])));
  if (Math.abs(sumM0) > 1e-6 * scaleM + roundoff * Math.max(1, L)) errors.push('Falha de equilíbrio de momentos no motor de cálculo.');

  return { u, p, reactionsV, reactionsM, totalDown, errors, elems };
}

// Funções exatas dentro de um elemento (s ∈ [0, l])
const V_at = (p: number[], q: number, s: number) => p[0] - q * s;
const M_at = (p: number[], q: number, s: number) => -p[1] + p[0] * s - (q * s * s) / 2;
function w_up(u: number[], i: number, l: number, q: number, EI: number, s: number): number {
  const xi = s / l;
  const H1 = 1 - 3 * xi * xi + 2 * xi ** 3;
  const H2 = l * (xi - 2 * xi * xi + xi ** 3);
  const H3 = 3 * xi * xi - 2 * xi ** 3;
  const H4 = l * (-xi * xi + xi ** 3);
  const herm = H1 * u[2 * i] + H2 * u[2 * i + 1] + H3 * u[2 * i + 2] + H4 * u[2 * i + 3];
  return herm - (q * s * s * (l - s) * (l - s)) / (24 * EI);
}

// ----------------------------------------------------------------------------------------------
// Resultado inválido (fail-closed)
// ----------------------------------------------------------------------------------------------
function invalidResult(L: number, errors: string[], warnings: string[] = []): CalculationResults {
  const Lx = Number((isFin(L) && L > 0 ? L : 1).toFixed(3));
  return {
    reactionA: 0, reactionB: 0, totalVerticalLoad: 0, maxMoment: 0, maxMomentX: 0, maxShearPos: 0, maxShearNeg: 0,
    shearZeroX: 0, maxDeflection: 0, maxDeflectionX: 0, allowableDeflection: 0, deflectionRatio: 0,
    momentCapacity_Mrd: 0, shearCapacity_Vrd: 0, momentRatio: 0, shearRatio: 0,
    normalStressMax: 0, normalStressMaxX: 0, shearStressMax: 0, shearStressMaxX: 0, vonMisesMax: 0, vonMisesMaxX: 0,
    allowableStress_fyd: 0, vonMisesRatio: 0, status: 'INVALID', errors, warnings, engineVersion: ENGINE_VERSION,
    shearCurve: [{ x: 0, v: 0 }, { x: Lx, v: 0 }],
    momentCurve: [{ x: 0, m: 0 }, { x: Lx, m: 0 }],
    deflectionCurve: [{ x: 0, d: 0 }, { x: Lx, d: 0 }],
    vonMisesCurve: [{ x: 0, vm: 0, sigma: 0, tau: 0 }, { x: Lx, vm: 0, sigma: 0, tau: 0 }],
  };
}

const ceil1 = (v: number) => Math.ceil(v * 10 - 1e-9) / 10; // arredondamento conservador (nunca reduz a razão)

// ----------------------------------------------------------------------------------------------
// API pública
// ----------------------------------------------------------------------------------------------
export function solveBeam(
  spanLength: number,
  supportType: SupportType,
  loads: LoadItem[],
  profile: SteelProfile,
  steelGrade: SteelGrade,
  supportPositions?: SupportPositions
): CalculationResults {
  const v = validate(spanLength, supportType, loads, profile, steelGrade, supportPositions);
  if (v.errors.length || !v.geo) return invalidResult(spanLength, v.errors, v.warnings);
  const { L, posA, posB } = v.geo;
  const posC = v.geo.posC;

  // Malha: âncoras exatas (extremos e apoios) + pontos de carga alinhados a ≤ 1 mm
  const xs: number[] = [];
  const addNode = (x: number) => {
    const c = Math.min(Math.max(x, 0), L);
    const near = xs.findIndex((t) => Math.abs(t - c) < SNAP);
    if (near >= 0) return near;
    xs.push(c);
    xs.sort((a, b) => a - b);
    return xs.findIndex((t) => t === c);
  };
  [0, L, posA, ...(supportType !== 'cantilever' ? [posB] : []), ...(supportType === 'continua' && posC !== undefined ? [posC] : [])].forEach(addNode);
  const snapPos = (x: number) => xs[addNode(x)];
  let maxShift = 0;
  const effLoads: LoadItem[] = loads.map((ld) => {
    const xa = snapPos(ld.positionX);
    maxShift = Math.max(maxShift, Math.abs(xa - ld.positionX));
    if (ld.type !== 'distributed') return { ...ld, positionX: xa };
    const xbRaw = Math.min(ld.positionX + (ld.length ?? L), L);
    const xb = snapPos(xbRaw);
    maxShift = Math.max(maxShift, Math.abs(xb - xbRaw));
    return { ...ld, positionX: xa, length: Math.max(0, xb - xa) };
  });
  if (maxShift > 1e-6) v.warnings.push(`Posições de carga alinhadas à malha de cálculo (deslocamento máximo ${(maxShift * 1000).toFixed(2)} mm).`);
  const nodeAt = (x: number) => xs.findIndex((t) => Math.abs(t - x) < SNAP);

  const supports: { node: number; fixed: boolean }[] = [];
  if (supportType === 'biapoiada') supports.push({ node: nodeAt(posA), fixed: false }, { node: nodeAt(posB), fixed: false });
  else if (supportType === 'cantilever') supports.push({ node: nodeAt(posA), fixed: true });
  else if (supportType === 'biengastada') supports.push({ node: nodeAt(posA), fixed: true }, { node: nodeAt(posB), fixed: true });
  else supports.push({ node: nodeAt(posA), fixed: false }, { node: nodeAt(posC as number), fixed: false }, { node: nodeAt(posB), fixed: false });

  const EI = steelGrade.E * 1e6 * profile.inertia_Ix * 1e-8; // kN·m²

  // ELU (majorado) para V, M e reações; ELS (γf = 1) para flecha
  const uls = solveCase(xs, EI, effLoads, L, (ld) => ld.gammaF, supports);
  const sls = solveCase(xs, EI, effLoads, L, () => 1, supports);
  const errs = [...uls.errors, ...sls.errors];
  if (errs.length) return invalidResult(L, errs, v.warnings);
  const elU = uls.elems;
  const elS = sls.elems;

  // Pontos de amostragem (extremos de cada elemento e pontos de V = 0)
  interface Sample { e: number; s: number; x: number }
  const samples: Sample[] = [];
  elU.forEach((e, i) => {
    const n = Math.max(4, Math.ceil((TARGET_SAMPLES * e.l) / L));
    const ss = new Set<number>();
    for (let k = 0; k <= n; k++) ss.add((k * e.l) / n);
    if (Math.abs(e.q) > 1e-12) {
      const s0 = uls.p[i][0] / e.q;
      if (s0 > 1e-9 && s0 < e.l - 1e-9) ss.add(s0);
    }
    [...ss].sort((a, b) => a - b).forEach((s) => samples.push({ e: i, s, x: e.x0 + s }));
  });

  const Vs = samples.map((sm) => V_at(uls.p[sm.e], elU[sm.e].q, sm.s));
  const Ms = samples.map((sm) => M_at(uls.p[sm.e], elU[sm.e].q, sm.s));
  const Ws = samples.map((sm) => -w_up(sls.u, sm.e, elS[sm.e].l, elS[sm.e].q, EI, sm.s) * 1000); // mm, + para baixo

  // Extremos
  let maxShearPos = 0, maxShearNeg = 0, maxMoment = 0, maxMomentX = (posA + posB) / 2;
  samples.forEach((sm, i) => {
    if (Vs[i] > maxShearPos) maxShearPos = Vs[i];
    if (Vs[i] < maxShearNeg) maxShearNeg = Vs[i];
    if (Math.abs(Ms[i]) > Math.abs(maxMoment)) { maxMoment = Ms[i]; maxMomentX = sm.x; }
  });

  // Flecha máxima com refinamento (seção áurea) em torno da melhor amostra
  let kBest = 0;
  Ws.forEach((w, i) => { if (Math.abs(w) > Math.abs(Ws[kBest])) kBest = i; });
  let maxDeflection = Ws[kBest];
  let maxDeflectionX = samples[kBest].x;
  {
    const e = samples[kBest].e;
    const wAbs = (s: number) => Math.abs(w_up(sls.u, e, elS[e].l, elS[e].q, EI, s) * 1000);
    let a = Math.max(0, samples[kBest].s - elS[e].l / 4);
    let b = Math.min(elS[e].l, samples[kBest].s + elS[e].l / 4);
    const g = (Math.sqrt(5) - 1) / 2;
    for (let it = 0; it < 60; it++) {
      const c1 = b - g * (b - a), c2 = a + g * (b - a);
      if (wAbs(c1) > wAbs(c2)) b = c2; else a = c1;
    }
    const sMid = (a + b) / 2;
    const wMid = -w_up(sls.u, e, elS[e].l, elS[e].q, EI, sMid) * 1000;
    if (Math.abs(wMid) > Math.abs(maxDeflection)) { maxDeflection = wMid; maxDeflectionX = elS[e].x0 + sMid; }
  }

  // Cruzamento de cortante (+ → −) com maior |M|
  let shearZeroX = (posA + posB) / 2;
  let bestAbsM = -1;
  for (let i = 1; i < samples.length; i++) {
    if (Vs[i - 1] >= 0 && Vs[i] < 0) {
      const dx = samples[i].x - samples[i - 1].x;
      const xz = dx < 1e-9 ? samples[i].x : samples[i - 1].x + (dx * Vs[i - 1]) / (Vs[i - 1] - Vs[i]);
      const mAbs = Math.max(Math.abs(Ms[i - 1]), Math.abs(Ms[i]));
      if (mAbs > bestAbsM) { bestAbsM = mAbs; shearZeroX = xz; }
    }
  }

  // Capacidades resistentes (seção compacta, contenção lateral contínua — ver docs/LIMITACOES.md)
  const allowableStress_fyd = steelGrade.fy / GAMMA_A1;
  const momentCapacity_Mrd = (profile.plasticModulus_Zx * steelGrade.fy) / (GAMMA_A1 * 1000);
  const Aw_mm2 = profile.depth_d * profile.webThickness_tw;
  const shearCapacity_Vrd = (0.6 * (Aw_mm2 / 100) * steelGrade.fy) / (GAMMA_A1 * 10);
  const Wx = profile.elasticModulus_Wx;

  const d = Math.max(profile.depth_d, 10);
  const tf = Math.max(profile.flangeThickness_tf, 1);
  const webFlangeRatio = d > 2 * tf ? (d - 2 * tf) / d : 0.85;

  let normalStressMax = 0, normalStressMaxX = maxMomentX, shearStressMax = 0, shearStressMaxX = posA;
  let vonMisesMax = 0, vonMisesMaxX = maxMomentX;
  const vonMisesCurve: CalculationResults['vonMisesCurve'] = [];
  samples.forEach((sm, i) => {
    const sigma = (Math.abs(Ms[i]) * 1000) / Wx;
    const tau = (Math.abs(Vs[i]) * 1000) / Aw_mm2;
    const vmJ = Math.sqrt((sigma * webFlangeRatio) ** 2 + 3 * tau * tau);
    const vm = Math.max(sigma, Math.sqrt(3) * tau, vmJ);
    if (sigma > normalStressMax) { normalStressMax = sigma; normalStressMaxX = sm.x; }
    if (tau > shearStressMax) { shearStressMax = tau; shearStressMaxX = sm.x; }
    if (vm > vonMisesMax) { vonMisesMax = vm; vonMisesMaxX = sm.x; }
    vonMisesCurve.push({ x: Number(sm.x.toFixed(3)), vm: Number(vm.toFixed(2)), sigma: Number(sigma.toFixed(2)), tau: Number(tau.toFixed(2)) });
  });

  // Flecha admissível (L/350). Balanço: o L da Tabela C.1 é o dobro do comprimento do balanço.
  let Lref: number;
  if (supportType === 'cantilever') Lref = 2 * (L - posA);
  else if (supportType === 'continua') Lref = Math.max((posC as number) - posA, posB - (posC as number));
  else Lref = posB - posA;
  const allowableDeflection = (Lref * 1000) / DEFLECTION_DIVISOR;

  // Razões SEM arredondamento para decidir o status; exibição com arredondamento conservador
  const rM = (Math.abs(maxMoment) / momentCapacity_Mrd) * 100;
  const rV = (Math.max(Math.abs(maxShearPos), Math.abs(maxShearNeg)) / shearCapacity_Vrd) * 100;
  const rD = (Math.abs(maxDeflection) / allowableDeflection) * 100;
  const rVM = (vonMisesMax / allowableStress_fyd) * 100;
  const hasLoads = loads.some((l) => l.value > 0);
  const ratios = [rM, rV, rD, rVM];
  let status: CalculationResults['status'];
  if (!ratios.every(isFin)) status = 'INVALID';
  else if (!hasLoads) status = 'NONE';
  else if (ratios.some((r) => r > 100)) status = 'FAIL';
  else if (ratios.some((r) => r > 85)) status = 'ALERT';
  else status = 'PASS';

  // Reações
  const rAv = uls.reactionsV[nodeAt(posA)];
  const rBv = supportType === 'cantilever' ? 0 : uls.reactionsV[nodeAt(posB)];
  const rCv = supportType === 'continua' ? uls.reactionsV[nodeAt(posC as number)] : undefined;

  // Momentos nas seções de engaste (interno: negativo = tração em cima)
  let fixedEndMomentA: number | undefined, fixedEndMomentB: number | undefined;
  if (supportType === 'cantilever' || supportType === 'biengastada') {
    const iA = nodeAt(posA);
    if (iA >= 0 && iA < elU.length) fixedEndMomentA = M_at(uls.p[iA], elU[iA].q, 0);
  }
  if (supportType === 'biengastada') {
    const iB = nodeAt(posB);
    if (iB > 0) fixedEndMomentB = M_at(uls.p[iB - 1], elU[iB - 1].q, elU[iB - 1].l);
  }

  const r2 = (n: number) => Number(n.toFixed(2));
  const out: CalculationResults = {
    reactionA: r2(rAv), reactionB: r2(rBv), reactionC: rCv !== undefined ? r2(rCv) : undefined,
    totalVerticalLoad: r2(uls.totalDown),
    maxMoment: r2(maxMoment), maxMomentX: r2(maxMomentX),
    maxShearPos: r2(maxShearPos), maxShearNeg: r2(maxShearNeg), shearZeroX: r2(shearZeroX),
    maxDeflection: r2(maxDeflection), maxDeflectionX: r2(maxDeflectionX),
    allowableDeflection: Number(allowableDeflection.toFixed(1)),
    deflectionRatio: ceil1(rD), momentCapacity_Mrd: r2(momentCapacity_Mrd), shearCapacity_Vrd: r2(shearCapacity_Vrd),
    momentRatio: ceil1(rM), shearRatio: ceil1(rV),
    normalStressMax: r2(normalStressMax), normalStressMaxX: r2(normalStressMaxX),
    shearStressMax: r2(shearStressMax), shearStressMaxX: r2(shearStressMaxX),
    vonMisesMax: r2(vonMisesMax), vonMisesMaxX: r2(vonMisesMaxX),
    allowableStress_fyd: Number(allowableStress_fyd.toFixed(1)), vonMisesRatio: ceil1(rVM),
    status,
    warnings: v.warnings,
    engineVersion: ENGINE_VERSION,
    fixedEndMomentA: fixedEndMomentA !== undefined ? r2(fixedEndMomentA) : undefined,
    fixedEndMomentB: fixedEndMomentB !== undefined ? r2(fixedEndMomentB) : undefined,
    shearCurve: samples.map((sm, i) => ({ x: Number(sm.x.toFixed(3)), v: r2(Vs[i]) })),
    momentCurve: samples.map((sm, i) => ({ x: Number(sm.x.toFixed(3)), m: r2(Ms[i]) })),
    deflectionCurve: samples.map((sm, i) => ({ x: Number(sm.x.toFixed(3)), d: Number(Ws[i].toFixed(3)) })),
    vonMisesCurve,
  };

  // Última barreira: qualquer número não finito na saída => INVALID
  const numericOk = Object.values(out).every((val) => typeof val !== 'number' || Number.isFinite(val));
  if (!numericOk) return invalidResult(L, ['Resultado numérico não finito (NaN/Infinity).'], v.warnings);
  return out;
}
