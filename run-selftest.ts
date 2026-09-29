// Executa o autoteste do motor de cálculo (src/utils/selfTest.ts) via linha de comando.
// Usado por `npm test` e deve rodar no pipeline de build/deploy: se falhar, o deploy não deve prosseguir.
import { runSelfTest } from '../src/utils/selfTest';

const result = runSelfTest();
console.log(`Autoteste do motor: ${result.total - result.failures.length}/${result.total} verificações OK`);
if (!result.ok) {
  console.error('\nFALHAS:');
  result.failures.forEach((f) => console.error(` - ${f}`));
  process.exit(1);
}
console.log('Motor de cálculo íntegro.');
