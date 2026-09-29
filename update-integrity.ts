// Regenera src/utils/integrityManifest.ts. Rode SOMENTE após revisar mudanças em profiles.ts / constantes.
import { writeFileSync } from 'node:fs';
import { canonicalCatalog, sha256Hex } from '../src/utils/integrity';

const h = await sha256Hex(canonicalCatalog());
if (!h) throw new Error('crypto.subtle indisponível');
writeFileSync(new URL('../src/utils/integrityManifest.ts', import.meta.url), `// Gerado por scripts/update-integrity.ts — NÃO editar à mão.\nexport const EXPECTED_CATALOG_SHA256 = '${h}';\n`);
console.log('Manifesto atualizado:', h);
