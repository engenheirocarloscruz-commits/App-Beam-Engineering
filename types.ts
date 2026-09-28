/**
 * BeamSolid Pro - Structural Engineering Type Definitions
 */

export type SupportType = 'biapoiada' | 'cantilever' | 'biengastada' | 'continua';

export type NormCode = 'NBR 8800:2008' | 'AISC 360-16';

export type ProfileFamily = 'W' | 'I' | 'U' | 'HSS';

export interface SteelGrade {
  name: string;
  category: 'AÇO CARBONO' | 'ALTA RESISTÊNCIA';
  fy: number; // MPa
  fu: number; // MPa
  E: number;  // GPa (typically 200)
  G: number;  // GPa (typically 77.2)
  nu: number; // 0.30
}

export interface SteelProfile {
  id: string;
  designation: string;
  family: ProfileFamily;
  typeDescription: string;
  massLinear: number; // kg/m
  depth_d: number; // mm
  flangeWidth_bf: number; // mm
  webThickness_tw: number; // mm
  flangeThickness_tf: number; // mm
  area_A: number; // cm²
  inertia_Ix: number; // cm⁴
  inertia_Iy: number; // cm⁴
  elasticModulus_Wx: number; // cm³
  plasticModulus_Zx: number; // cm³
  radiusGyration_rx: number; // cm
  radiusGyration_ry: number; // cm
  webCompact: boolean;
  flangeCompact: boolean;
  tag?: string;
  savingsVsW250?: string;
}

export type LoadType = 'distributed' | 'point' | 'moment';

export interface SupportPositions {
  posA: number; // m from left edge (default 0)
  posB: number; // m from left edge (default spanLength)
  posC?: number; // m for continuous beam (default spanLength / 2)
}

export interface LoadItem {
  id: string;
  type: LoadType;
  name: string;
  value: number; // In SI: kN/m or kN or kNm
  positionX: number; // In SI: m
  length?: number; // In SI: m (for distributed loads)
  direction: '-Y' | '+Y';
  gammaF: number; // load factor e.g. 1.25 or 1.40 or 1.50
  preferredLoadUnit?: string; // e.g. 'tf', 'kgf', 'kN', 'tf/m'
  preferredDistUnit?: string; // e.g. 'm', 'cm', 'mm', 'ft'
}

export interface CalculationResults {
  reactionA: number; // kN
  reactionB: number; // kN
  reactionC?: number; // kN (for continuous)
  totalVerticalLoad: number; // kN
  maxMoment: number; // kNm
  maxMomentX: number; // m
  maxShearPos: number; // kN
  maxShearNeg: number; // kN
  shearZeroX: number; // m
  maxDeflection: number; // mm
  maxDeflectionX: number; // m
  allowableDeflection: number; // mm
  deflectionRatio: number; // %
  momentCapacity_Mrd: number; // kNm
  shearCapacity_Vrd: number; // kN
  momentRatio: number; // %
  shearRatio: number; // %
  normalStressMax: number; // MPa (tensão normal máxima de flexão σ)
  normalStressMaxX: number; // m
  shearStressMax: number; // MPa (tensão cisalhante máxima de corte τ)
  shearStressMaxX: number; // m
  vonMisesMax: number; // MPa (tensão equivalente máxima de Von Mises σ_VM)
  vonMisesMaxX: number; // m
  allowableStress_fyd: number; // MPa (tensão admissível de escoamento f_yd = fy / γ_a1)
  vonMisesRatio: number; // % (taxa de utilização de Von Mises σ_VM / f_yd * 100)
  status: 'PASS' | 'ALERT' | 'FAIL' | 'NONE' | 'INVALID'; // INVALID = entrada inválida/falha de integridade (fail-closed)
  errors?: string[]; // motivos de INVALID
  warnings?: string[]; // avisos não bloqueantes
  engineVersion?: string;
  fixedEndMomentA?: number; // kNm (momento interno na seção do engaste A; negativo = tração em cima)
  fixedEndMomentB?: number; // kNm
  shearCurve: { x: number; v: number }[];
  momentCurve: { x: number; m: number }[];
  deflectionCurve: { x: number; d: number }[];
  vonMisesCurve: { x: number; vm: number; sigma: number; tau: number }[];
}

export interface ProjectData {
  id: string;
  name: string;
  profileDesignation: string;
  steelGradeName: string;
  spanType: SupportType;
  spanLength: number; // m
  norm: NormCode;
  lastModified: string;
  capacityRatio: number;
  statusText: string;
  statusVariant: 'pass' | 'alert' | 'success';
  loads: LoadItem[];
}
