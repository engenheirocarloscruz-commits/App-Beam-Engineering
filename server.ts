import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '10mb' }));

  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({
    apiKey: apiKey || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', hasGeminiKey: Boolean(apiKey) });
  });

  // AI Profile Proposal Endpoint
  app.post('/api/ai/propose-profile', async (req: Request, res: Response) => {
    try {
      const {
        spanLength,
        supportType,
        norm,
        currentProfile,
        steelGrade,
        calcResults,
        loadsSummary,
        candidateProfiles,
      } = req.body;

      if (!apiKey) {
        return res.status(200).json({
          success: false,
          fallbackReason: 'NO_API_KEY',
          message: 'Chave GEMINI_API_KEY não configurada no servidor',
        });
      }

      const prompt = `Você é um engenheiro calculista de estruturas metálicas sênior (especialista em NBR 8800:2008 e AISC 360-16).
Analise a situação de dimensionamento de uma viga de aço que se encontra REPROVADA ou em ALERTA e proponha o perfil ideal.

Dados do projeto:
- Vão da viga: ${spanLength} metros
- Condição de contorno / apoio: ${supportType}
- Norma adotada: ${norm}
- Tipo de aço: ${steelGrade?.name} (fy = ${steelGrade?.fy} MPa, fu = ${steelGrade?.fu} MPa)
- Perfil Atual (Reprovado): ${currentProfile?.designation} (${currentProfile?.massLinear} kg/m, altura d=${currentProfile?.depth_d}mm, Ix=${currentProfile?.inertia_Ix}cm4, Wx=${currentProfile?.elasticModulus_Wx}cm3)
- Resultados da Análise Mecânica do Perfil Atual:
  * Momento Solicitante MSd: ${calcResults?.maxMoment} kNm vs Capacidade MRd: ${calcResults?.momentCapacity_Mrd} kNm (Utilização: ${calcResults?.momentRatio}%)
  * Força Cortante Solicitante VSd: ${calcResults?.maxShearPos} kN (Utilização: ${calcResults?.shearRatio}%)
  * Flecha Máxima ELS: ${calcResults?.maxDeflection} mm vs Limite Normativo L/350: ${calcResults?.allowableDeflection} mm (Utilização: ${calcResults?.deflectionRatio}%)
  * Tensão Von Mises Máxima: ${calcResults?.vonMisesMax} MPa vs fyd: ${calcResults?.allowableStress_fyd} MPa (Utilização: ${calcResults?.vonMisesRatio}%)
  * Status Global Atual: ${calcResults?.status}
- Resumo das cargas aplicadas: ${loadsSummary || 'Cargas atuantes na viga'}

Perfis que atendem estruturalmente a todas as verificações normativas (pré-calculados e ordenados por massa linear kg/m):
${JSON.stringify(candidateProfiles?.slice(0, 10), null, 2)}

Sua tarefa:
1. Escolher o melhor perfil ideal (que equilibre segurança com taxa de trabalho entre 65% e 85%, rigidez para controle de flecha e menor peso de aço kg/m para economia da obra).
2. Fornecer um parecer técnico de engenharia explicando com precisão por que o perfil anterior falhou e por que o novo perfil é o ideal tecnicamente e economicamente.
3. Fornecer recomendações executivas e construtivas práticas (ex: contenção lateral, apoios, enrijecedores).
4. Sugerir também 1 ou 2 alternativas (ex: menor altura útil vs menor consumo de aço).

Responda ESTRITAMENTE em formato JSON com o seguinte schema:
{
  "recommendedProfileId": "string (exatamente o id do perfil candidato escolhido)",
  "recommendedProfileDesignation": "string",
  "verdictTitle": "string",
  "diagnosis": "string",
  "rationale": "string",
  "economyAnalysis": "string",
  "keyStrengths": ["string", "string", "string"],
  "constructiveTips": ["string", "string"],
  "alternativeSuggestion": {
    "profileDesignation": "string",
    "reason": "string"
  }
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          systemInstruction: 'Você é um engenheiro estrutural calculista sênior brasileiro, especialista rigoroso em NBR 8800:2008 e AISC 360-16. Retorne sempre JSON válido sem markdown code fences adicionais.',
        },
      });

      const responseText = response.text?.trim() || '{}';
      let parsedData;
      try {
        parsedData = JSON.parse(responseText);
      } catch {
        const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        parsedData = JSON.parse(cleaned);
      }

      return res.json({
        success: true,
        data: parsedData,
      });
    } catch (err: any) {
      console.error('Error calling Gemini API:', err);
      return res.status(500).json({
        success: false,
        error: err?.message || 'Erro interno no motor IA',
      });
    }
  });

  // Vite middleware in dev or static files in prod
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
