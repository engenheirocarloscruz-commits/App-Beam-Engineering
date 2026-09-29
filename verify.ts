import { solveBeam } from '../src/utils/structuralSolver';
import { STEEL_GRADES, STEEL_PROFILES } from '../src/data/profiles';
import { LoadItem, SupportType } from '../src/types';

const prof = STEEL_PROFILES.find((p) => p.id === 'w-250-32-7')!;
const grade = STEEL_GRADES.find((g) => g.name.includes('A572'))!;
const EI = grade.E * 1e6 * prof.inertia_Ix * 1e-8; // kN·m²

const ld = (
  type: LoadItem['type'], value: number, positionX: number, length?: number, gammaF = 1.4
): LoadItem => ({ id: Math.random().toString(36).slice(2), type, name: type, value, positionX, length, direction: '-Y', gammaF });

let total = 0, ok = 0;
const rows: string[] = [];
function check(caso: string, grandeza: string, esperado: number, obtido: number, tol = 0.01, unid = '') {
  total++;
  const err = esperado === 0 ? Math.abs(obtido) : Math.abs(obtido - esperado) / Math.abs(esperado);
  const pass = Number.isFinite(obtido) && err <= tol;
  if (pass) ok++;
  rows.push(`${pass ? 'OK   ' : 'ERRO '} | ${caso.padEnd(34)} | ${grandeza.padEnd(18)} | esp=${esperado.toFixed(3).padStart(10)} | obt=${String(Number.isFinite(obtido) ? obtido.toFixed(3) : obtido).padStart(10)} ${unid.padEnd(4)}| desvio=${(err * 100).toFixed(2)}%`);
}

console.log(`Perfil: ${prof.designation} | fy=${grade.fy} MPa | E=${grade.E} GPa | EI=${EI.toFixed(1)} kN·m²\n`);

// ---------- CASO 1: biapoiada, carga uniforme ----------
{
  const L = 6, q = 10, g = 1.4, qd = q * g;
  const r = solveBeam(L, 'biapoiada', [ld('distributed', q, 0, L)], prof, grade);
  const c = 'C1 biapoiada q=10kN/m L=6';
  check(c, 'R_A (kN)', qd * L / 2, r.reactionA);
  check(c, 'R_B (kN)', qd * L / 2, r.reactionB);
  check(c, 'M_max (kNm)', qd * L * L / 8, r.maxMoment);
  check(c, 'V_max (kN)', qd * L / 2, r.maxShearPos);
  check(c, 'flecha (mm)', 5 * q * L ** 4 / (384 * EI) * 1000, r.maxDeflection);
  check(c, 'M_Rd (kNm)', prof.plasticModulus_Zx * grade.fy / (1.1 * 1000), r.momentCapacity_Mrd);
  check(c, 'V_Rd (kN)', 0.6 * (prof.depth_d * prof.webThickness_tw / 100) * (grade.fy / 10) / 1.1, r.shearCapacity_Vrd);
  check(c, 'sigma (MPa)', (qd * L * L / 8) * 1000 / prof.elasticModulus_Wx, r.normalStressMax);
  check(c, 'tau (MPa)', (qd * L / 2) * 1000 / (prof.depth_d * prof.webThickness_tw), r.shearStressMax);
}

// ---------- CASO 2: biapoiada, carga pontual excêntrica ----------
{
  const L = 6, P = 50, a = 2, b = L - a, g = 1.4, Pd = P * g;
  const r = solveBeam(L, 'biapoiada', [ld('point', P, a)], prof, grade);
  const c = 'C2 biapoiada P=50kN a=2 L=6';
  check(c, 'R_A (kN)', Pd * b / L, r.reactionA);
  check(c, 'R_B (kN)', Pd * a / L, r.reactionB);
  check(c, 'M_max (kNm)', Pd * a * b / L, r.maxMoment);
  // flecha máxima analítica (varredura fina, carga não majorada) para x>a
  let wmax = 0;
  for (let x = 0; x <= L; x += 0.0005) {
    const w = x <= a
      ? P * b * x * (L * L - b * b - x * x) / (6 * EI * L)
      : P * a * (L - x) * (2 * L * x - x * x - a * a) / (6 * EI * L);
    wmax = Math.max(wmax, w);
  }
  check(c, 'flecha (mm)', wmax * 1000, r.maxDeflection);
}

// ---------- CASO 2b: erro de amostragem (120 pontos) ----------
{
  const L = 6, P = 50, a = 2.51, b = L - a, Pd = P * 1.4;
  const r = solveBeam(L, 'biapoiada', [ld('point', P, a)], prof, grade);
  check('C2b pontual em x=2.51 (fora da malha)', 'M_max (kNm)', Pd * a * b / L, r.maxMoment, 0.001);
}

// ---------- CASO 3: balanço ----------
{
  const L = 3, P = 20, g = 1.4;
  let r = solveBeam(L, 'cantilever', [ld('point', P, L)], prof, grade);
  let c = 'C3a balanço P=20 na ponta L=3';
  check(c, 'R_A (kN)', P * g, r.reactionA);
  check(c, '|M_engaste| (kNm)', P * g * L, Math.abs(r.maxMoment));
  check(c, 'flecha ponta (mm)', P * L ** 3 / (3 * EI) * 1000, Math.abs(r.maxDeflection));
  r = solveBeam(L, 'cantilever', [ld('distributed', 10, 0, L)], prof, grade);
  c = 'C3b balanço q=10 L=3';
  check(c, '|M_engaste| (kNm)', 10 * g * L * L / 2, Math.abs(r.maxMoment));
  check(c, 'flecha ponta (mm)', 10 * L ** 4 / (8 * EI) * 1000, Math.abs(r.maxDeflection));
  check(c, 'flecha limite (mm)', 2 * L * 1000 / 350, r.allowableDeflection); // NBR 8800 T.C.1: balanço = 2·L
}

// ---------- CASO 4: biengastada ----------
{
  const L = 6, g = 1.4;
  let r = solveBeam(L, 'biengastada', [ld('distributed', 10, 0, L)], prof, grade);
  let c = 'C4a biengastada q=10 L=6';
  check(c, 'R_A (kN)', 10 * g * L / 2, r.reactionA);
  check(c, '|M_engaste| (kNm)', 10 * g * L * L / 12, Math.abs(Math.min(...r.momentCurve.map((p) => p.m))));
  check(c, 'flecha (mm)', 10 * L ** 4 / (384 * EI) * 1000, r.maxDeflection);

  const P = 50, a = 1.5, b = L - a, Pd = P * g; // carga pontual excêntrica
  r = solveBeam(L, 'biengastada', [ld('point', P, a)], prof, grade);
  c = 'C4b biengastada P=50 a=1.5 L=6';
  const RA = Pd * b * b * (3 * a + b) / L ** 3;
  const MA = Pd * a * b * b / (L * L);
  check(c, 'R_A (kN)', RA, r.reactionA);
  check(c, '|M_engaste A| (kNm)', MA, Math.abs(Math.min(...r.momentCurve.map((p) => p.m))));
}

// ---------- CASO 5: contínua (2 vãos iguais, UDL) ----------
{
  const L = 6, l = L / 2, q = 10 * 1.4;
  const r = solveBeam(L, 'continua', [ld('distributed', 10, 0, L)], prof, grade);
  const c = 'C5 contínua 2 vãos de 3m q=10';
  check(c, 'R_A (kN)', 3 * q * l / 8, r.reactionA);
  check(c, 'R_C central (kN)', 10 * q * l / 8, r.reactionC ?? NaN);
  check(c, 'R_A+R_B+R_C = q·L', q * L, r.reactionA + r.reactionB + (r.reactionC ?? 0));
  check(c, 'R_B (extremo dir.)', 3 * q * l / 8, r.reactionB);
  check(c, '|M| máx (kNm)', q * l * l / 8, Math.abs(r.maxMoment));
}

// ---------- CASO 6: momento aplicado ----------
{
  const L = 6, M0 = 10, g = 1.4, Md = M0 * g;
  const r = solveBeam(L, 'biapoiada', [ld('moment', M0, 3)], prof, grade);
  const c = 'C6 biapoiada M0=10kNm em x=3';
  check(c, '|R_A| (kN)', Md / L, Math.abs(r.reactionA));
  check(c, 'M(L) fecha em 0', 0, r.momentCurve[r.momentCurve.length - 1].m, 0.01);
  check(c, '|M| máx (kNm)', Md / 2, Math.abs(r.maxMoment));
}

// ---------- CASO 6b: carga uniforme + momento (superposição) ----------
{
  const L = 6, q = 10, M0 = 20, g = 1.4, qd = q * g, Md = M0 * g, a = 3;
  const r = solveBeam(L, 'biapoiada', [ld('distributed', q, 0, L), ld('moment', M0, a)], prof, grade);
  let Mmax = 0;
  for (let x = 0; x <= L; x += 0.001) {
    const Mudl = qd * L * x / 2 - qd * x * x / 2;
    const Mm = -Md * x / L + (x >= a ? Md : 0); // momento horário aplicado: salto +M0 em x=a
    Mmax = Math.max(Mmax, Math.abs(Mudl + Mm));
  }
  check('C6b q=10 + M0=20kNm em x=3 (superposição)', '|M| máx (kNm)', Mmax, Math.abs(r.maxMoment));
}

// ---------- CASO 7: γf diferente de 1,4 e flecha ----------
{
  const L = 6, q = 10;
  const r = solveBeam(L, 'biapoiada', [ld('distributed', q, 0, L, 1.25)], prof, grade);
  check('C7 q=10 com γf=1.25 (flecha em serviço)', 'flecha (mm)', 5 * q * L ** 4 / (384 * EI) * 1000, r.maxDeflection);
}

// ---------- CASO 8: robustez / fail-open ----------
console.log('--- Robustez ---');
{
  const r1 = solveBeam(6, 'biapoiada', [ld('point', 30, NaN)], prof, grade);
  console.log(`positionX=NaN  -> status=${r1.status}  M=${r1.maxMoment}  momentRatio=${r1.momentRatio}`);
  const r2 = solveBeam(NaN, 'biapoiada', [ld('distributed', 10, 0, 6)], prof, grade);
  console.log(`vão=NaN        -> status=${r2.status}  M=${r2.maxMoment}`);
  const r3 = solveBeam(6, 'biapoiada', [ld('point', Infinity, 3), ld('point', Infinity, 2)], prof, grade);
  console.log(`P=Infinity x2  -> status=${r3.status}  M=${r3.maxMoment}`);
  const bad = { ...prof, plasticModulus_Zx: prof.plasticModulus_Zx * 3 }; // adulteração silenciosa: Zx x3
  const r4 = solveBeam(6, 'biapoiada', [ld('distributed', 10, 0, 6)], bad, grade);
  const okr = solveBeam(6, 'biapoiada', [ld('distributed', 10, 0, 6)], prof, grade);
  console.log(`Zx x3 adulterado -> M_Rd=${r4.momentCapacity_Mrd} (original ${okr.momentCapacity_Mrd}), momentRatio=${r4.momentRatio}% (original ${okr.momentRatio}%), status=${r4.status} (original ${okr.status}) -> nenhum alerta de integridade`);
  // arredondamento de razões
  const r5 = solveBeam(6, 'biapoiada', [ld('distributed', 9.95, 0, 6)], prof, grade);
  console.log(`q=9.95 -> flecha=${r5.maxDeflection} mm, limite=${r5.allowableDeflection} mm, razão real=${(r5.maxDeflection / r5.allowableDeflection * 100).toFixed(2)}%, razão exibida=${r5.deflectionRatio}%, status=${r5.status}`);
  // posição de carga fora do vão
  const r6 = solveBeam(6, 'biapoiada', [ld('point', 30, 9)], prof, grade);
  console.log(`P em x=9 (vão 6) -> R_A=${r6.reactionA}, R_B=${r6.reactionB}, M(L)=${r6.momentCurve.at(-1)!.m}`);
}

console.log('\n' + rows.join('\n'));


// ---------- PROPRIEDADES (equilíbrio e linearidade em configurações aleatórias) ----------
import { runSelfTest } from '../src/utils/selfTest';
import { verifyCatalogIntegrity } from '../src/utils/integrity';

let seed = 12345;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const types: SupportType[] = ['biapoiada', 'cantilever', 'biengastada', 'continua'];
let propFail = 0;
for (let n = 0; n < 300; n++) {
  const L = 2 + rnd() * 10;
  const t = types[Math.floor(rnd() * 4)];
  const loads: LoadItem[] = [];
  const nl = 1 + Math.floor(rnd() * 4);
  for (let i = 0; i < nl; i++) {
    const k = Math.floor(rnd() * 3);
    const xs = rnd() * L * 0.8;
    if (k === 0) loads.push(ld('distributed', 1 + rnd() * 20, xs, rnd() * (L - xs), 1 + rnd() * 0.4));
    else if (k === 1) loads.push(ld('point', 1 + rnd() * 80, rnd() * L, undefined, 1 + rnd() * 0.4));
    else loads.push(ld('moment', 1 + rnd() * 30, rnd() * L, undefined, 1 + rnd() * 0.4));
  }
  const r = solveBeam(L, t, loads, prof, grade);
  const sumR = r.reactionA + r.reactionB + (r.reactionC ?? 0);
  const okEq = r.status !== 'INVALID' && Math.abs(sumR - r.totalVerticalLoad) < 0.02 + 1e-4 * Math.abs(r.totalVerticalLoad);
  // linearidade: dobrar γf dobra V, M e reações (a flecha não depende de γf)
  const loads2 = loads.map((l) => ({ ...l, gammaF: l.gammaF * 2 }));
  const r2 = solveBeam(L, t, loads2, prof, grade);
  const okLin = Math.abs(r2.maxMoment - 2 * r.maxMoment) < 0.05 + 1e-4 * Math.abs(r.maxMoment) && Math.abs(r2.maxDeflection - r.maxDeflection) < 0.01 + 1e-4 * Math.abs(r.maxDeflection);
  if (!okEq || !okLin) { propFail++; if (propFail < 4) console.log('FALHA propriedade', t, L.toFixed(2), r.status, r.errors, sumR, r.totalVerticalLoad, okEq, okLin); }
}
total++; if (propFail === 0) ok++; else console.log(`ERRO  | propriedades: ${propFail}/300 configurações falharam`);
console.log(`PROP  | 300 configurações aleatórias (equilíbrio + linearidade): ${propFail === 0 ? 'OK' : propFail + ' falhas'}`);

// ---------- FUZZ fail-closed: nenhuma entrada inválida pode resultar em PASS/ALERT/FAIL ----------
const bad = [NaN, Infinity, -Infinity, -5, 1e308, undefined as unknown as number, '3' as unknown as number];
let fuzzFail = 0;
for (const b of bad) {
  const cases = [
    solveBeam(b, 'biapoiada', [ld('point', 10, 1)], prof, grade),
    solveBeam(6, 'biapoiada', [ld('point', b, 1)], prof, grade),
    solveBeam(6, 'biapoiada', [ld('point', 10, b)], prof, grade),
    solveBeam(6, 'biapoiada', [ld('distributed', 10, 0, b)], prof, grade),
    solveBeam(6, 'biapoiada', [{ ...ld('point', 10, 1), gammaF: b }], prof, grade),
    solveBeam(6, 'biapoiada', [ld('point', 10, 1)], { ...prof, inertia_Ix: b }, grade),
    solveBeam(6, 'biapoiada', [ld('point', 10, 1)], { ...prof, plasticModulus_Zx: b }, grade),
    solveBeam(6, 'biapoiada', [ld('point', 10, 1)], prof, { ...grade, fy: b }),
    solveBeam(6, 'biapoiada', [ld('point', 10, 1)], prof, grade, { posA: b, posB: 6 }),
  ];
  const legit = (i: number) => (i === 3 && (b === 1e308 || b === undefined)) || (i === 8 && b === undefined); // comprimento além da viga é limitado com aviso; apoio ausente usa o padrão
  cases.forEach((c, i) => { if (!legit(i) && c.status !== 'INVALID') { fuzzFail++; console.log(`FUZZ falhou: entrada ${String(b)} caso ${i} -> ${c.status}`); } });
}
total++; if (fuzzFail === 0) ok++;
console.log(`FUZZ  | ${bad.length * 9 - 3} entradas inválidas: ${fuzzFail === 0 ? 'todas INVALID (fail-closed)' : fuzzFail + ' passaram indevidamente'}`);

// ---------- Autoteste embutido e integridade do catálogo ----------
const st = runSelfTest();
total++; if (st.ok) ok++;
console.log(`SELF  | autoteste do app: ${st.ok ? `OK (${st.total} verificações)` : 'FALHOU: ' + st.failures.join('; ')}`);
const integ = await verifyCatalogIntegrity();
total++; if (integ.state === 'ok') ok++;
console.log(`HASH  | integridade do catálogo: ${integ.state}${integ.state === 'failed' ? ' (rode npm run integrity:update após revisar)' : ''}`);

console.log(`\nRESULTADO: ${ok}/${total} grupos/verificações dentro da tolerância`);
process.exit(ok === total ? 0 : 1);
