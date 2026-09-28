# Segurança e integridade do motor de cálculo — BeamSolid Pro

## O que o app faz hoje (defesa em camadas, no cliente)

| Camada | O que detecta | Onde |
|---|---|---|
| Validação fail-closed | Entradas inválidas (NaN, Infinity, cargas fora da viga, apoios instáveis, perfil/aço corrompido): status `INVALID`, **nenhum resultado ou memorial** | `structuralSolver.ts` |
| Equilíbrio interno | Toda resolução confere ΣFy e ΣM; erro ≥ 1 N bloqueia o cálculo | `structuralSolver.ts` |
| Autoteste (known-answer) | Motor alterado ou com regressão: 17 casos de manual, com constantes próprias, na inicialização | `selfTest.ts` |
| Hash do catálogo (SHA-256) | Edição de `profiles.ts`, γa1 ou divisor de flecha sem atualizar o manifesto | `integrity.ts`, `integrityManifest.ts` |
| Suíte de testes no build | `npm run build` roda `npm test`; se falhar, não há build | `tests/verify.ts` |
| Supply chain | Lockfile versionado, dependências mínimas (apenas React + Vite + Tailwind), `npm audit` sem vulnerabilidades | `package.json` |

## Limite honesto

Todo o código roda no navegador. **Quem controla o navegador pode alterar o motor, o autoteste e o manifesto ao mesmo tempo.**
As camadas acima detectam erros, regressões, edição acidental e adulteração parcial. Elas **não** impedem um atacante determinado.

## Garantia forte (recomendado antes de emitir memoriais com responsabilidade técnica)

1. Recalcular no servidor (mesmo `solveBeam`, em Node) a partir das entradas recebidas.
2. Assinar (HMAC ou Ed25519, chave só no servidor) o conjunto: entradas + resultados + `ENGINE_VERSION` + hash do catálogo.
3. Imprimir no memorial o identificador da assinatura e um QR/URL de verificação.
4. Servir com HTTPS, CSP restritiva e SRI; hospedar as fontes localmente.

## Rotina de manutenção

- Alterou perfis ou constantes normativas? Revise e rode `npm run integrity:update`, depois `npm test`.
- Antes de qualquer deploy: `npm test && npm run lint && npm run build`.
- O catálogo de perfis deve ser conferido com o catálogo do fabricante antes do uso profissional.
