import React, { useState } from 'react';
import { CalculationResults, LoadItem, SteelGrade, SteelProfile } from '../types';
import { AiProfileProposal } from '../utils/aiStructuralEngine';

interface AiProfileProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposal: AiProfileProposal | null;
  isLoading: boolean;
  currentProfile: SteelProfile;
  currentResults: CalculationResults;
  steelGrade: SteelGrade;
  norm: string;
  loads?: LoadItem[];
  onApplyProfile: (profile: SteelProfile) => void;
  onRefreshAi: () => void;
}

export const AiProfileProposalModal: React.FC<AiProfileProposalModalProps> = ({
  isOpen,
  onClose,
  proposal,
  isLoading,
  currentProfile,
  currentResults,
  steelGrade,
  norm,
  loads,
  onApplyProfile,
  onRefreshAi,
}) => {
  const [selectedAlternativeIndex, setSelectedAlternativeIndex] = useState<number | null>(null);

  if (!isOpen) return null;

  const activeProfile =
    selectedAlternativeIndex !== null && proposal?.alternatives?.[selectedAlternativeIndex]
      ? proposal.alternatives[selectedAlternativeIndex].profile
      : proposal?.recommendedProfile;

  const activeResults =
    selectedAlternativeIndex !== null && proposal?.alternatives?.[selectedAlternativeIndex]
      ? proposal.alternatives[selectedAlternativeIndex].results
      : proposal?.recommendedResults;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-[#121620] border border-purple-500/40 rounded-xl shadow-2xl shadow-purple-950/60 overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#171b26] via-[#1b1c2e] to-[#131b2c] border-b border-[#3e4850]/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-600 to-sky-600 flex items-center justify-center shadow-lg shadow-purple-900/40 border border-purple-400/40">
              <span className="material-symbols-outlined text-white text-2xl animate-pulse">
                auto_awesome
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-headline font-bold text-white tracking-tight">
                  Motor de Inteligência Artificial • Perfil Ideal
                </h2>
                <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-purple-950/80 text-purple-300 border border-purple-500/40">
                  {proposal?.isAiGenerated ? 'Gemini 3.8 Flash' : 'Solver Estrutural IA'}
                </span>
              </div>
              <p className="text-xs text-[#bec8d2]">
                Otimização automática e dimensionamento estático conforme {norm} e {steelGrade.name}.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#262a33]/60 hover:bg-[#31353e] text-[#bec8d2] hover:text-white flex items-center justify-center border border-[#3e4850] transition-colors"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-sm font-sans flex-1">
          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin"></div>
                <span className="material-symbols-outlined text-purple-400 text-2xl absolute inset-0 flex items-center justify-center animate-pulse">
                  psychology
                </span>
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">
                  Motor IA analisando carregamento e rigidez...
                </h3>
                <p className="text-xs text-[#bec8d2] mt-1 max-w-md mx-auto">
                  Testando perfis laminados contra os limites de flexão normal (ELU), escoamento de Von Mises e flecha L/350 (ELS).
                </p>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-mono text-purple-300/80 bg-purple-950/30 px-3 py-1.5 rounded-full border border-purple-500/20">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping"></span>
                <span>Otimizando para menor consumo de aço com segurança plena</span>
              </div>
            </div>
          ) : proposal ? (
            <>
              {/* Failure Diagnosis Banner */}
              <div className="bg-[#1f1720] border border-red-500/40 rounded-lg p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-red-950/80 border border-red-500/50 flex items-center justify-center text-red-400 shrink-0 mt-0.5 sm:mt-0">
                    <span className="material-symbols-outlined text-lg">cancel</span>
                  </div>
                  <div>
                    <span className="font-mono text-xs font-bold text-red-300 block">
                      DIAGNÓSTICO: Perfil Anterior Reprovado ({currentProfile.designation})
                    </span>
                    <p className="text-xs text-[#e1ccd0] mt-0.5">
                      {proposal.diagnosis}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 font-mono text-[11px] bg-red-950/50 px-2.5 py-1.5 rounded border border-red-500/30">
                  <span className="text-red-400">Flexão: {currentResults.momentRatio}%</span>
                  <span className="text-[#88929b]">•</span>
                  <span className="text-yellow-400">Flecha: {currentResults.deflectionRatio}%</span>
                </div>
              </div>

              {/* Recommended Ideal Profile Hero Card */}
              {activeProfile && activeResults && (
                <div className="bg-gradient-to-br from-[#161a27] to-[#121622] border-2 border-purple-500/60 rounded-xl p-4 sm:p-5 relative overflow-hidden shadow-xl shadow-purple-950/40">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#3e4850]/60">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-green-950/80 text-green-300 border border-green-500/40">
                          {selectedAlternativeIndex === null ? '★ PERFIL IDEAL PROPOSTO' : '★ ALTERNATIVA SELECIONADA'}
                        </span>
                        <span className="px-2 py-0.5 rounded font-mono text-[10px] text-purple-300 bg-purple-950/60 border border-purple-500/30">
                          {activeProfile.family === 'W' ? 'Flange Larga (W)' : activeProfile.family}
                        </span>
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-mono font-bold text-white mt-1">
                        {activeProfile.designation}
                      </h3>
                      <p className="text-xs text-[#bec8d2]">
                        {activeProfile.typeDescription} • {activeProfile.massLinear} kg/m • Altura d = {activeProfile.depth_d} mm
                      </p>
                    </div>

                    <div className="flex items-center gap-2 bg-[#1b202d] px-3.5 py-2 rounded-lg border border-[#3e4850]">
                      <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500/50 flex items-center justify-center text-green-400">
                        <span className="material-symbols-outlined text-lg">check_circle</span>
                      </div>
                      <div className="text-left font-mono">
                        <span className="text-[10px] text-[#bec8d2] block leading-none">Status Estrutural</span>
                        <span className="text-xs font-bold text-green-400">100% APROVADO</span>
                      </div>
                    </div>
                  </div>

                  {/* Verification Metric Comparison Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 my-4">
                    <div className="bg-[#121620] p-2.5 rounded border border-[#3e4850]/60">
                      <span className="text-[10px] font-mono text-[#bec8d2] block">Flexão (MSd / MRd)</span>
                      <div className="text-base font-mono font-bold text-green-400">
                        {activeResults.momentRatio}%
                      </div>
                      <div className="text-[10px] font-mono text-[#bec8d2]">
                        MRd = {activeResults.momentCapacity_Mrd.toFixed(1)} kNm
                      </div>
                    </div>

                    <div className="bg-[#121620] p-2.5 rounded border border-[#3e4850]/60">
                      <span className="text-[10px] font-mono text-[#bec8d2] block">Flecha Máx (ELS)</span>
                      <div className="text-base font-mono font-bold text-green-400">
                        {activeResults.maxDeflection.toFixed(1)} mm
                      </div>
                      <div className="text-[10px] font-mono text-[#bec8d2]">
                        Limite: {activeResults.allowableDeflection.toFixed(1)} mm ({activeResults.deflectionRatio}%)
                      </div>
                    </div>

                    <div className="bg-[#121620] p-2.5 rounded border border-[#3e4850]/60">
                      <span className="text-[10px] font-mono text-[#bec8d2] block">Tensão Von Mises</span>
                      <div className="text-base font-mono font-bold text-purple-300">
                        {activeResults.vonMisesMax.toFixed(1)} MPa
                      </div>
                      <div className="text-[10px] font-mono text-[#bec8d2]">
                        {activeResults.vonMisesRatio}% de fyd
                      </div>
                    </div>

                    <div className="bg-[#121620] p-2.5 rounded border border-[#3e4850]/60">
                      <span className="text-[10px] font-mono text-[#bec8d2] block">Inércia Flexional (Ix)</span>
                      <div className="text-base font-mono font-bold text-sky-400">
                        {activeProfile.inertia_Ix.toLocaleString()} cm⁴
                      </div>
                      <div className="text-[10px] font-mono text-green-400">
                        +{(((activeProfile.inertia_Ix - currentProfile.inertia_Ix) / currentProfile.inertia_Ix) * 100).toFixed(0)}% vs anterior
                      </div>
                    </div>
                  </div>

                  {/* AI Engineering Rationale Text */}
                  <div className="bg-[#10141d]/90 p-3.5 rounded-lg border border-purple-500/25 space-y-2">
                    <div className="flex items-center gap-1.5 text-purple-300 font-mono text-xs font-semibold">
                      <span className="material-symbols-outlined text-base">psychology</span>
                      <span>Parecer Técnico do Motor IA</span>
                    </div>
                    <p className="text-xs text-[#dfe2ee] leading-relaxed">
                      {proposal.rationale}
                    </p>
                    <div className="pt-2 border-t border-[#3e4850]/50 flex items-center justify-between text-[11px] font-mono text-[#bec8d2]">
                      <span className="text-green-300">
                        Economia: {proposal.economyAnalysis}
                      </span>
                    </div>
                  </div>

                  {/* Key Strengths & Constructive Tips */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    <div className="bg-[#141824] p-3 rounded border border-[#3e4850]/50">
                      <span className="text-[11px] font-mono text-[#89ceff] font-bold block mb-1.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">verified</span>
                        Pontos Fortes da Solução
                      </span>
                      <ul className="space-y-1 text-xs text-[#bec8d2]">
                        {proposal.keyStrengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-green-400 font-bold">•</span>
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-[#141824] p-3 rounded border border-[#3e4850]/50">
                      <span className="text-[11px] font-mono text-purple-300 font-bold block mb-1.5 flex items-center gap-1">
                        <span className="material-symbols-outlined text-sm">engineering</span>
                        Recomendações Construtivas
                      </span>
                      <ul className="space-y-1 text-xs text-[#bec8d2]">
                        {proposal.constructiveTips.map((tip, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-purple-400 font-bold">•</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Alternative Options Section */}
              {proposal.alternatives && proposal.alternatives.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#dfe2ee] flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-base text-[#89ceff]">alt_route</span>
                      Alternativas Avaliadas pelo Motor IA
                    </span>
                    {selectedAlternativeIndex !== null && (
                      <button
                        type="button"
                        onClick={() => setSelectedAlternativeIndex(null)}
                        className="text-[11px] font-mono text-purple-300 hover:underline"
                      >
                        ← Voltar ao Perfil Ideal Principal
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {proposal.alternatives.map((alt, idx) => {
                      const isSelected = selectedAlternativeIndex === idx;
                      return (
                        <div
                          key={alt.profile.id}
                          onClick={() => setSelectedAlternativeIndex(isSelected ? null : idx)}
                          className={`p-3 rounded-lg border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-purple-950/40 border-purple-400 shadow-md'
                              : 'bg-[#181c24] border-[#3e4850] hover:border-[#89ceff]/60'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-[#262a33] text-[#89ceff]">
                              {alt.title}
                            </span>
                            <span className="font-mono text-[10px] text-green-400 font-bold">
                              PASS ({alt.results.momentRatio}%)
                            </span>
                          </div>
                          <div className="font-mono font-bold text-white text-sm">
                            {alt.profile.designation}
                          </div>
                          <p className="text-[11px] text-[#bec8d2] mt-1 leading-snug">
                            {alt.description}
                          </p>
                          <div className="mt-2 pt-2 border-t border-[#3e4850]/40 flex justify-between items-center text-[10px] font-mono text-[#bec8d2]">
                            <span>Peso: {alt.profile.massLinear} kg/m</span>
                            <span className={isSelected ? 'text-purple-300 font-bold' : 'text-[#89ceff]'}>
                              {isSelected ? '✓ Selecionado' : 'Clique para ver'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="py-12 text-center text-[#bec8d2]">
              <p>Nenhuma recomendação disponível no momento.</p>
              <button
                type="button"
                onClick={onRefreshAi}
                className="mt-3 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded font-mono text-xs font-bold"
              >
                Tentar Novamente
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer / Action Deck */}
        <div className="px-5 py-3.5 bg-[#0e121a] border-t border-[#3e4850] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs font-mono text-[#bec8d2] w-full sm:w-auto">
            <span className="material-symbols-outlined text-green-400 text-base">check_circle</span>
            <span>A aplicação recalculará automaticamente todos os diagramas e memória de cálculo.</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded bg-[#262a33] hover:bg-[#31353e] text-[#dfe2ee] font-mono text-xs border border-[#3e4850] transition-colors"
            >
              Cancelar
            </button>

            {activeProfile && (
              <button
                type="button"
                onClick={() => {
                  onApplyProfile(activeProfile);
                  onClose();
                }}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 via-indigo-600 to-sky-600 hover:from-purple-500 hover:to-sky-500 text-white font-mono text-xs font-bold shadow-lg shadow-purple-950/50 transition-all active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-base">check</span>
                <span>Aplicar Perfil Sugerido ({activeProfile.designation})</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
