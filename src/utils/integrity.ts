/**
 * Integridade do catálogo (perfis, aços e constantes normativas do motor).
 * O hash esperado fica em integrityManifest.ts (gerado por `npm run integrity:update`, sempre
 * revisado pelo engenheiro responsável). Detecta edição acidental ou casual dos dados; NÃO
 * substitui a assinatura no servidor contra um atacante com controle total do código do cliente.
 */
import { STEEL_GRADES, STEEL_PROFILES } from '../data/profiles';
import { DEFLECTION_DIVISOR, ENGINE_VERSION, GAMMA_A1 } from './structuralSolver';
import { EXPECTED_CATALOG_SHA256 } from './integrityManifest';

const sortKeys = (v: unknown): unknown =>
  Array.isArray(v)
    ? v.map(sortKeys)
    : v && typeof v === 'object'
    ? Object.fromEntries(Object.keys(v as object).sort().map((k) => [k, sortKeys((v as Record<string, unknown>)[k])]))
    : v;

export function canonicalCatalog(): string {
  return JSON.stringify(
    sortKeys({ engine: ENGINE_VERSION, gammaA1: GAMMA_A1, deflectionDivisor: DEFLECTION_DIVISOR, grades: STEEL_GRADES, profiles: STEEL_PROFILES })
  );
}

export async function sha256Hex(text: string): Promise<string | null> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) return null;
  const buf = await subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export type IntegrityState = 'checking' | 'ok' | 'failed' | 'unavailable';

export async function verifyCatalogIntegrity(): Promise<{ state: IntegrityState; actual?: string }> {
  try {
    const actual = await sha256Hex(canonicalCatalog());
    if (actual === null) return { state: 'unavailable' }; // ex.: página servida em http sem contexto seguro
    return { state: actual === EXPECTED_CATALOG_SHA256 ? 'ok' : 'failed', actual };
  } catch {
    return { state: 'unavailable' };
  }
}
