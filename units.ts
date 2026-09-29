/**
 * BeamSolid Pro - Engineering Units & Conversion Engine
 * Supports SI, Metric Heavy (tf, kgf), and Imperial (US Customary)
 */

export type DistanceUnit = 'm' | 'cm' | 'mm' | 'ft' | 'in';
export type PointLoadUnit = 'kN' | 'tf' | 'kgf' | 'N' | 'kip' | 'lbf';
export type DistLoadUnit = 'kN/m' | 'tf/m' | 'kgf/m' | 'kgf/cm' | 'N/m' | 'kip/ft' | 'plf';
export type MomentLoadUnit = 'kN.m' | 'tf.m' | 'kgf.m' | 'kip.ft';

export interface UnitOption<T extends string> {
  value: T;
  label: string;
  symbol: string;
  factorToSI: number; // Multiplied by user value to get SI standard (m, kN, kN/m, kN.m)
}

// Distance units (SI standard: meter 'm')
export const DISTANCE_UNITS: UnitOption<DistanceUnit>[] = [
  { value: 'm', label: 'Metros (m)', symbol: 'm', factorToSI: 1.0 },
  { value: 'cm', label: 'Centímetros (cm)', symbol: 'cm', factorToSI: 0.01 },
  { value: 'mm', label: 'Milímetros (mm)', symbol: 'mm', factorToSI: 0.001 },
  { value: 'ft', label: 'Pés (ft)', symbol: 'ft', factorToSI: 0.3048 },
  { value: 'in', label: 'Polegadas (in)', symbol: 'in', factorToSI: 0.0254 },
];

// Point Load units (SI standard: kilonewton 'kN')
export const POINT_LOAD_UNITS: UnitOption<PointLoadUnit>[] = [
  { value: 'kN', label: 'Quilonewton (kN)', symbol: 'kN', factorToSI: 1.0 },
  { value: 'tf', label: 'Tonelada-força (tf)', symbol: 'tf', factorToSI: 9.80665 },
  { value: 'kgf', label: 'Quilograma-força (kgf)', symbol: 'kgf', factorToSI: 0.00980665 },
  { value: 'N', label: 'Newton (N)', symbol: 'N', factorToSI: 0.001 },
  { value: 'kip', label: 'Kip (kilo-pound)', symbol: 'kip', factorToSI: 4.44822 },
  { value: 'lbf', label: 'Libras-força (lbf)', symbol: 'lbf', factorToSI: 0.00444822 },
];

// Distributed Load units (SI standard: kilonewton/meter 'kN/m')
export const DIST_LOAD_UNITS: UnitOption<DistLoadUnit>[] = [
  { value: 'kN/m', label: 'Quilonewton / metro (kN/m)', symbol: 'kN/m', factorToSI: 1.0 },
  { value: 'tf/m', label: 'Tonelada-força / metro (tf/m)', symbol: 'tf/m', factorToSI: 9.80665 },
  { value: 'kgf/m', label: 'Quilograma-força / metro (kgf/m)', symbol: 'kgf/m', factorToSI: 0.00980665 },
  { value: 'kgf/cm', label: 'Quilograma-força / cm (kgf/cm)', symbol: 'kgf/cm', factorToSI: 0.980665 },
  { value: 'N/m', label: 'Newton / metro (N/m)', symbol: 'N/m', factorToSI: 0.001 },
  { value: 'kip/ft', label: 'Kip / pé (kip/ft)', symbol: 'kip/ft', factorToSI: 14.5939 },
  { value: 'plf', label: 'Pound / linear foot (plf)', symbol: 'plf', factorToSI: 0.0145939 },
];

// Moment Load units (SI standard: kilonewton-meter 'kN.m')
export const MOMENT_LOAD_UNITS: UnitOption<MomentLoadUnit>[] = [
  { value: 'kN.m', label: 'Quilonewton · metro (kN.m)', symbol: 'kN.m', factorToSI: 1.0 },
  { value: 'tf.m', label: 'Tonelada-força · metro (tf.m)', symbol: 'tf.m', factorToSI: 9.80665 },
  { value: 'kgf.m', label: 'Quilograma-força · metro (kgf.m)', symbol: 'kgf.m', factorToSI: 0.00980665 },
  { value: 'kip.ft', label: 'Kip · pé (kip.ft)', symbol: 'kip.ft', factorToSI: 1.35582 },
];

// Helper conversion functions
export function convertDistance(val: number, from: DistanceUnit, to: DistanceUnit): number {
  const fromOpt = DISTANCE_UNITS.find((u) => u.value === from) || DISTANCE_UNITS[0];
  const toOpt = DISTANCE_UNITS.find((u) => u.value === to) || DISTANCE_UNITS[0];
  const inMeters = val * fromOpt.factorToSI;
  return inMeters / toOpt.factorToSI;
}

export function convertPointLoad(val: number, from: PointLoadUnit, to: PointLoadUnit): number {
  const fromOpt = POINT_LOAD_UNITS.find((u) => u.value === from) || POINT_LOAD_UNITS[0];
  const toOpt = POINT_LOAD_UNITS.find((u) => u.value === to) || POINT_LOAD_UNITS[0];
  const inKn = val * fromOpt.factorToSI;
  return inKn / toOpt.factorToSI;
}

export function convertDistLoad(val: number, from: DistLoadUnit, to: DistLoadUnit): number {
  const fromOpt = DIST_LOAD_UNITS.find((u) => u.value === from) || DIST_LOAD_UNITS[0];
  const toOpt = DIST_LOAD_UNITS.find((u) => u.value === to) || DIST_LOAD_UNITS[0];
  const inKnPerM = val * fromOpt.factorToSI;
  return inKnPerM / toOpt.factorToSI;
}

export function convertMomentLoad(val: number, from: MomentLoadUnit, to: MomentLoadUnit): number {
  const fromOpt = MOMENT_LOAD_UNITS.find((u) => u.value === from) || MOMENT_LOAD_UNITS[0];
  const toOpt = MOMENT_LOAD_UNITS.find((u) => u.value === to) || MOMENT_LOAD_UNITS[0];
  const inKnM = val * fromOpt.factorToSI;
  return inKnM / toOpt.factorToSI;
}

/** Formats a distance with equivalent secondary metric (e.g. 6.00 m / 600 cm) */
export function formatDistanceWithAlt(meters: number): string {
  return `${meters.toFixed(2)} m (${(meters * 100).toFixed(0)} cm)`;
}

/** Formats a force with equivalent in metric tons-force (tf) */
export function formatForceWithAlt(kn: number): string {
  const tf = kn / 9.80665;
  return `${kn.toFixed(2)} kN ≈ ${tf.toFixed(2)} tf`;
}

/** Formats distributed load with equivalent in tf/m */
export function formatDistWithAlt(knm: number): string {
  const tfm = knm / 9.80665;
  return `${knm.toFixed(2)} kN/m ≈ ${tfm.toFixed(2)} tf/m`;
}
