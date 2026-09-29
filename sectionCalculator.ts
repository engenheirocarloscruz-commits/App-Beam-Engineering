import { ProfileFamily, SteelProfile } from '../types';

export type MainProfileType = 'I' | 'U' | 'L' | 'TUB_CIRC' | 'TUB_RET';

export interface SectionDimensions {
  d: number;  // mm (Height, Depth, Outer Diameter, or Leg a)
  bf: number; // mm (Flange Width, Outer Width, or Leg b)
  tw: number; // mm (Web Thickness or Wall Thickness)
  tf: number; // mm (Flange Thickness or Wall Thickness)
}

export const PROFILE_TYPE_DEFINITIONS: {
  key: MainProfileType;
  label: string;
  sub: string;
  symbol: string;
  family: ProfileFamily;
}[] = [
  { key: 'I', label: 'Perfil I', sub: 'Viga I Estrutural', symbol: 'I', family: 'I' },
  { key: 'U', label: 'Perfil U', sub: 'Canal Estrutural', symbol: '[', family: 'U' },
  { key: 'L', label: 'Perfil L', sub: 'Cantoneira', symbol: 'L', family: 'L' },
  { key: 'TUB_CIRC', label: 'Perfil circular', sub: 'Tubo Redondo / CHS', symbol: '○', family: 'TUB_CIRC' },
  { key: 'TUB_RET', label: 'Perfil quadrado/retangular', sub: 'Tubo RHS / SHS', symbol: '▭', family: 'TUB_RET' },
];

export const DEFAULT_MANUAL_DIMENSIONS: Record<MainProfileType, SectionDimensions> = {
  I: { d: 200, bf: 100, tw: 5.5, tf: 8.0 },
  U: { d: 200, bf: 70, tw: 6.0, tf: 8.5 },
  L: { d: 75, bf: 75, tw: 6.35, tf: 6.35 },
  TUB_CIRC: { d: 114.3, bf: 114.3, tw: 4.5, tf: 4.5 },
  TUB_RET: { d: 150, bf: 100, tw: 4.75, tf: 4.75 },
};

/**
 * Calculates all structural and geometrical properties of a steel cross section
 * according to NBR 8800:2008 and AISC 360-16 principles.
 */
export function computeSectionProperties(
  typeKey: MainProfileType,
  rawDims: SectionDimensions,
  customDesignation?: string
): SteelProfile {
  let designation = customDesignation;
  let family: ProfileFamily = 'I';
  let typeDescription = '';

  let A_cm2 = 0;
  let Ix_cm4 = 0;
  let Iy_cm4 = 0;
  let Wx_cm3 = 0;
  let Zx_cm3 = 0;
  let rx_cm = 0;
  let ry_cm = 0;
  let webCompact = true;
  let flangeCompact = true;

  const d = Math.max(Number(rawDims.d) || 10, 10);
  const bf = Math.max(Number(rawDims.bf) || 10, 10);
  const tw = Math.max(Number(rawDims.tw) || 0.5, 0.5);
  const tf = Math.max(Number(rawDims.tf) || 0.5, 0.5);

  if (typeKey === 'I') {
    family = 'I';
    const effectiveTf = Math.max(Math.min(tf, d / 2 - 0.5), 0.5);
    const hw = Math.max(d - 2 * effectiveTf, 1);
    const effectiveTw = Math.max(Math.min(tw, bf - 1), 0.5);

    const A_mm2 = Math.max(2 * bf * effectiveTf + hw * effectiveTw, 10);
    A_cm2 = Math.max(A_mm2 / 100, 0.1);

    const Ix_mm4 = Math.max((bf * Math.pow(d, 3) - (bf - effectiveTw) * Math.pow(hw, 3)) / 12, 10);
    const Iy_mm4 = Math.max((2 * effectiveTf * Math.pow(bf, 3) + hw * Math.pow(effectiveTw, 3)) / 12, 10);
    Ix_cm4 = Math.max(Ix_mm4 / 10000, 0.01);
    Iy_cm4 = Math.max(Iy_mm4 / 10000, 0.01);

    Wx_cm3 = Math.max(Ix_cm4 / (d / 20), 0.01);
    Zx_cm3 = Math.max((bf * effectiveTf * (d - effectiveTf) + (effectiveTw * Math.pow(hw, 2)) / 4) / 1000, Wx_cm3);

    rx_cm = Math.sqrt(Math.max(Ix_cm4 / A_cm2, 0.01));
    ry_cm = Math.sqrt(Math.max(Iy_cm4 / A_cm2, 0.01));

    webCompact = hw / effectiveTw <= 90.5;
    flangeCompact = bf / (2 * effectiveTf) <= 9.1;

    typeDescription = `Perfil I estrutural (${d.toFixed(0)}x${bf.toFixed(0)}x${effectiveTw.toFixed(1)}x${effectiveTf.toFixed(1)} mm)`;
    if (!designation) {
      designation = `Perfil I ${d.toFixed(0)}x${bf.toFixed(0)}`;
    }
  } else if (typeKey === 'U') {
    family = 'U';
    const effectiveTf = Math.max(Math.min(tf, d / 2 - 0.5), 0.5);
    const hw = Math.max(d - 2 * effectiveTf, 1);
    const effectiveTw = Math.max(Math.min(tw, bf - 1), 0.5);

    const A_mm2 = Math.max(2 * bf * effectiveTf + hw * effectiveTw, 10);
    A_cm2 = Math.max(A_mm2 / 100, 0.1);

    const Ix_mm4 = Math.max((bf * Math.pow(d, 3) - (bf - effectiveTw) * Math.pow(hw, 3)) / 12, 10);
    Ix_cm4 = Math.max(Ix_mm4 / 10000, 0.01);

    // Center of gravity xG from back face of web
    const xG_mm = Math.max(
      (2 * (bf * effectiveTf) * (bf / 2) + hw * effectiveTw * (effectiveTw / 2)) / A_mm2,
      effectiveTw / 2
    );

    const Iy_mm4 = Math.max(
      2 * ((effectiveTf * Math.pow(bf, 3)) / 12 + bf * effectiveTf * Math.pow(bf / 2 - xG_mm, 2)) +
      (hw * Math.pow(effectiveTw, 3)) / 12 +
      hw * effectiveTw * Math.pow(xG_mm - effectiveTw / 2, 2),
      10
    );
    Iy_cm4 = Math.max(Iy_mm4 / 10000, 0.01);

    Wx_cm3 = Math.max(Ix_cm4 / (d / 20), 0.01);
    Zx_cm3 = Math.max((bf * effectiveTf * (d - effectiveTf) + (effectiveTw * Math.pow(hw, 2)) / 4) / 1000, Wx_cm3);

    rx_cm = Math.sqrt(Math.max(Ix_cm4 / A_cm2, 0.01));
    ry_cm = Math.sqrt(Math.max(Iy_cm4 / A_cm2, 0.01));

    webCompact = hw / effectiveTw <= 90.5;
    flangeCompact = bf / effectiveTf <= 10.8;

    typeDescription = `Perfil U canal estrutural (${d.toFixed(0)}x${bf.toFixed(0)}x${effectiveTw.toFixed(1)}x${effectiveTf.toFixed(1)} mm)`;
    if (!designation) {
      designation = `Perfil U ${d.toFixed(0)}x${bf.toFixed(0)}`;
    }
  } else if (typeKey === 'L') {
    family = 'L';
    const a = d;
    const b = bf;
    const tRaw = Number(rawDims.tf || rawDims.tw) || 3;
    const t = Math.max(Math.min(tRaw, Math.min(a, b) / 2), 0.5);

    const A_mm2 = Math.max(a * t + (b - t) * t, 10);
    A_cm2 = Math.max(A_mm2 / 100, 0.1);

    // Centroid
    const yG_mm = (a * t * (a / 2) + (b - t) * t * (t / 2)) / A_mm2;
    const xG_mm = (a * t * (t / 2) + (b - t) * t * (t + (b - t) / 2)) / A_mm2;

    const Ix_mm4 = Math.max(
      (t * Math.pow(a, 3)) / 12 +
      a * t * Math.pow(a / 2 - yG_mm, 2) +
      ((b - t) * Math.pow(t, 3)) / 12 +
      (b - t) * t * Math.pow(yG_mm - t / 2, 2),
      10
    );
    Ix_cm4 = Math.max(Ix_mm4 / 10000, 0.01);

    const Iy_mm4 = Math.max(
      (a * Math.pow(t, 3)) / 12 +
      a * t * Math.pow(xG_mm - t / 2, 2) +
      (t * Math.pow(b - t, 3)) / 12 +
      (b - t) * t * Math.pow(t + (b - t) / 2 - xG_mm, 2),
      10
    );
    Iy_cm4 = Math.max(Iy_mm4 / 10000, 0.01);

    const cy_max = Math.max(yG_mm, a - yG_mm, 1);
    Wx_cm3 = Math.max(Ix_cm4 / (cy_max / 10), 0.01);
    Zx_cm3 = Math.max(Wx_cm3 * 1.5, 0.01);

    rx_cm = Math.sqrt(Math.max(Ix_cm4 / A_cm2, 0.01));
    ry_cm = Math.sqrt(Math.max(Iy_cm4 / A_cm2, 0.01));

    webCompact = Math.max(a, b) / t <= 12.8;
    flangeCompact = true;

    typeDescription = `Cantoneira de abas ${a === b ? 'iguais' : 'desiguais'} (${a.toFixed(1)}x${b.toFixed(1)}x${t.toFixed(2)} mm)`;
    if (!designation) {
      designation = `L ${a.toFixed(1)}x${b.toFixed(1)}x${t.toFixed(2)}`;
    }
  } else if (typeKey === 'TUB_CIRC') {
    family = 'TUB_CIRC';
    const D = d;
    const tRaw = Number(rawDims.tw || rawDims.tf) || 2;
    const t = Math.max(Math.min(tRaw, D / 2 - 0.5), 0.5);
    const di = Math.max(D - 2 * t, 0.5);

    const A_mm2 = Math.max((Math.PI / 4) * (Math.pow(D, 2) - Math.pow(di, 2)), 10);
    A_cm2 = Math.max(A_mm2 / 100, 0.1);

    const Ix_mm4 = Math.max((Math.PI * (Math.pow(D, 4) - Math.pow(di, 4))) / 64, 10);
    Ix_cm4 = Math.max(Ix_mm4 / 10000, 0.01);
    Iy_cm4 = Ix_cm4;

    Wx_cm3 = Math.max(Ix_cm4 / (D / 20), 0.01);
    Zx_cm3 = Math.max((Math.pow(D, 3) - Math.pow(di, 3)) / 6000, Wx_cm3);

    rx_cm = Math.sqrt(Math.max(Ix_cm4 / A_cm2, 0.01));
    ry_cm = rx_cm;

    webCompact = D / t <= 40;
    flangeCompact = true;

    typeDescription = `Tubo circular estrutural (Ø${D.toFixed(1)}x${t.toFixed(2)} mm)`;
    if (!designation) {
      designation = `Tubo Circ. Ø${D.toFixed(1)}x${t.toFixed(2)}`;
    }
  } else {
    // TUB_RET (Quadrado ou Retangular)
    const h = d;
    const b = bf;
    const isSquare = Math.abs(h - b) < 0.5;
    family = isSquare ? 'TUB_QUAD' : 'TUB_RET';

    const tRaw = Number(rawDims.tw || rawDims.tf) || 2;
    const t = Math.max(Math.min(tRaw, Math.min(h, b) / 2 - 0.5), 0.5);
    const hi = Math.max(h - 2 * t, 0.5);
    const bi = Math.max(b - 2 * t, 0.5);

    const A_mm2 = Math.max(h * b - hi * bi, 10);
    A_cm2 = Math.max(A_mm2 / 100, 0.1);

    const Ix_mm4 = Math.max((b * Math.pow(h, 3) - bi * Math.pow(hi, 3)) / 12, 10);
    const Iy_mm4 = Math.max((h * Math.pow(b, 3) - hi * Math.pow(bi, 3)) / 12, 10);
    Ix_cm4 = Math.max(Ix_mm4 / 10000, 0.01);
    Iy_cm4 = Math.max(Iy_mm4 / 10000, 0.01);

    Wx_cm3 = Math.max(Ix_cm4 / (h / 20), 0.01);
    Zx_cm3 = Math.max((b * Math.pow(h, 2) - bi * Math.pow(hi, 2)) / 4000, Wx_cm3);

    rx_cm = Math.sqrt(Math.max(Ix_cm4 / A_cm2, 0.01));
    ry_cm = Math.sqrt(Math.max(Iy_cm4 / A_cm2, 0.01));

    webCompact = hi / t <= 35.2;
    flangeCompact = bi / t <= 35.2;

    typeDescription = isSquare
      ? `Tubo estrutural quadrado (${h.toFixed(0)}x${h.toFixed(0)}x${t.toFixed(2)} mm)`
      : `Tubo estrutural retangular (${h.toFixed(0)}x${b.toFixed(0)}x${t.toFixed(2)} mm)`;
    if (!designation) {
      designation = isSquare
        ? `Tubo Quad. ${h.toFixed(0)}x${h.toFixed(0)}x${t.toFixed(2)}`
        : `Tubo Ret. ${h.toFixed(0)}x${b.toFixed(0)}x${t.toFixed(2)}`;
    }
  }

  // Linear mass = Area (cm²) * 0.785 kg/(m*cm²)
  const massLinear = Number((A_cm2 * 0.785).toFixed(2));

  return {
    id: `custom-${typeKey.toLowerCase()}-${d.toFixed(1)}-${bf.toFixed(1)}-${tw.toFixed(2)}-${tf.toFixed(2)}`,
    designation,
    family,
    typeDescription,
    massLinear: Math.max(massLinear, 0.1),
    depth_d: Number(d.toFixed(1)),
    flangeWidth_bf: Number(bf.toFixed(1)),
    webThickness_tw: Number(tw.toFixed(2)),
    flangeThickness_tf: Number(tf.toFixed(2)),
    area_A: Number(A_cm2.toFixed(2)),
    inertia_Ix: Number(Ix_cm4.toFixed(1)),
    inertia_Iy: Number(Iy_cm4.toFixed(1)),
    elasticModulus_Wx: Number(Wx_cm3.toFixed(1)),
    plasticModulus_Zx: Number(Zx_cm3.toFixed(1)),
    radiusGyration_rx: Number(rx_cm.toFixed(2)),
    radiusGyration_ry: Number(ry_cm.toFixed(2)),
    webCompact,
    flangeCompact,
    tag: 'DIMENSÃO MANUAL',
  };
}
