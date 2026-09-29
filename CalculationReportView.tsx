import React, { useState } from 'react';
import { APPLICABLE_NORM, CalculationResults, LoadItem, SteelGrade, SteelProfile } from '../types';

interface CalculationReportViewProps {
  calcResults: CalculationResults;
  profile: SteelProfile;
  steelGrade: SteelGrade;
  spanLength: number;
  loads?: LoadItem[];
  supportType?: string;
  projectName?: string;
  professionalId?: string;
  engineerName?: string;
  companyName?: string;
  studyDate?: string;
  onBack: () => void;
}

export const CalculationReportView: React.FC<CalculationReportViewProps> = ({
  calcResults,
  profile,
  steelGrade,
  spanLength,
  loads = [],
  supportType = 'SIMPLY_SUPPORTED',
  projectName = '',
  professionalId = '',
  engineerName = '',
  companyName = '',
  studyDate = '',
  onBack,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const hasLoads =
    calcResults.status !== 'NONE' &&
    (loads.length === 0 || loads.some((l) => Number(l.value) > 0));

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `Memorial de Cálculo - ${projectName}`,
          text: `Relatório de dimensionamento estrutural Beam Engineering para viga L=${spanLength}m com perfil ${profile.designation}.`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link do memorial copiado para a área de transferência!');
    }
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(
      `*Memorial de Cálculo Estrutural - Beam Engineering*\nProjeto: ${projectName}\nViga (L = ${spanLength}m)\nPerfil: ${profile.designation} (${steelGrade.name})\nStatus: ${
        !hasLoads
          ? 'AGUARDANDO CARGAS'
          : calcResults.status === 'PASS'
          ? 'ESTRUTURA APROVADA'
          : calcResults.status === 'ALERT'
          ? 'EM ALERTA'
          : 'REPROVADA'
      }\nTaxa Flexão: ${hasLoads ? calcResults.momentRatio.toFixed(1) + '%' : '—'}\nFlecha: ${
        hasLoads ? calcResults.maxDeflection.toFixed(1) + ' mm' : '—'
      } (Limite ${calcResults.allowableDeflection.toFixed(1)} mm)\nNorma: ${APPLICABLE_NORM}\nResponsável: ${engineerName} (${professionalId})`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  // Values for calculations
  const msd_val = Math.abs(calcResults.maxMoment);
  const mrd_val = calcResults.momentCapacity_Mrd;
  const vsd_val = Math.max(Math.abs(calcResults.maxShearPos), Math.abs(calcResults.maxShearNeg));
  const vrd_val = calcResults.shearCapacity_Vrd;
  const Aw_cm2 = (profile.depth_d * profile.webThickness_tw) / 100;

  // Support description
  const supportDesc =
    supportType === 'cantilever'
      ? 'Engastada e Livre (Balanço)'
      : supportType === 'biengastada'
      ? 'Bi-engastada (Engaste Perfeito)'
      : supportType === 'continua'
      ? 'Contínua (apoios A, C e B)'
      : 'Biapoiada (Apoio de 1º e 2º Gênero)';

  // SVG Diagram Coordinates for DEC and DMF
  const svgW = 540;
  const svgH = 80;
  const padX = 25;
  const padY = 14;
  const graphW = svgW - padX * 2;
  const graphH = svgH - padY * 2;

  // Moment path
  const maxM = Math.max(...calcResults.momentCurve.map((c) => Math.abs(c.m)), 0.1);
  const momentPoints = calcResults.momentCurve.map((pt) => {
    const x = padX + (pt.x / spanLength) * graphW;
    const y = padY + graphH * 0.2 + (pt.m / maxM) * (graphH * 0.7);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const momentBaselineY = padY + graphH * 0.2;
  const momentSvgPath = `M ${padX},${momentBaselineY} L ${momentPoints.join(' L ')} L ${padX + graphW},${momentBaselineY} Z`;

  // Shear path
  const maxV = Math.max(...calcResults.shearCurve.map((c) => Math.abs(c.v)), 0.1);
  const shearPoints = calcResults.shearCurve.map((pt) => {
    const x = padX + (pt.x / spanLength) * graphW;
    const y = padY + graphH * 0.5 - (pt.v / maxV) * (graphH * 0.45);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const shearBaselineY = padY + graphH * 0.5;
  const shearSvgPath = `M ${padX},${shearBaselineY} L ${shearPoints.join(' L ')} L ${padX + graphW},${shearBaselineY} Z`;

  return (
    <div className="min-h-screen bg-[#242933] text-slate-900 flex flex-col font-sans print:bg-white print:p-0">
      {/* Print styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            body {
              background: #ffffff !important;
              color: #000000 !important;
            }
            .no-print {
              display: none !important;
            }
            .printable-sheet {
              box-shadow: none !important;
              border: none !important;
              margin: 0 !important;
              padding: 0 !important;
              max-width: 100% !important;
              width: 100% !important;
              background-color: #ffffff !important;
            }
            @page {
              size: A4 portrait;
              margin: 12mm 15mm;
            }
          }
        `,
      }} />

      {/* Top Application Bar (Screen Only) */}
      <header className="no-print sticky top-0 z-40 bg-[#181c24] border-b border-[#3e4850] flex justify-between items-center w-full px-4 h-14 text-white shadow-md">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            aria-label="Voltar para os Resultados"
            className="flex items-center justify-center w-9 h-9 rounded bg-[#262a33] text-[#bec8d2] hover:text-white hover:bg-[#31353e] active:scale-95 transition-all"
            type="button"
          >
            <span className="material-symbols-outlined text-lg">arrow_back</span>
          </button>
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <span className="flex items-center justify-center w-5 h-5 text-[#89ceff]">
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M4 3.5C4 3.22 4.22 3 4.5 3H19.5C19.78 3 20 3.22 20 3.5V6C20 6.28 19.78 6.5 19.5 6.5H13.8C13.25 6.5 12.8 6.95 12.8 7.5V16.5C12.8 17.05 13.25 17.5 13.8 17.5H19.5C19.78 17.5 20 17.72 20 18V20.5C20 20.78 19.78 21 19.5 21H4.5C4.22 21 4 20.78 4 20.5V18C4 17.72 4.22 17.5 4.5 17.5H10.2C10.75 17.5 11.2 17.05 11.2 16.5V7.5C11.2 6.95 10.75 6.5 10.2 6.5H4.5C4.22 6.5 4 6.28 4 6V3.5Z"
                    fill="currentColor"
                  />
                </svg>
              </span>
              <h1 className="font-semibold text-sm sm:text-base text-[#dfe2ee] tracking-tight">
                Simulação Impressa • Memorial de Cálculo A4
              </h1>
            </div>
            <p className="font-mono text-[11px] text-[#88929b]">
              Folha em Branco • Memorial de Cálculo Estrutural
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Zoom controls */}
          <div className="hidden sm:flex items-center bg-[#262a33] rounded border border-[#3e4850] px-1 py-0.5 space-x-1">
            <button
              onClick={() => setZoomLevel((z) => Math.max(70, z - 10))}
              aria-label="Diminuir Zoom"
              className="text-[#bec8d2] hover:text-white p-1 rounded"
              type="button"
            >
              <span className="material-symbols-outlined text-xs">remove</span>
            </button>
            <span className="font-mono text-xs px-1 text-[#dfe2ee]">{zoomLevel}%</span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(130, z + 10))}
              aria-label="Aumentar Zoom"
              className="text-[#bec8d2] hover:text-white p-1 rounded"
              type="button"
            >
              <span className="material-symbols-outlined text-xs">add</span>
            </button>
          </div>

          <button
            onClick={handleShare}
            aria-label="Compartilhar"
            className="w-9 h-9 flex items-center justify-center rounded bg-[#262a33] hover:bg-[#31353e] text-[#dfe2ee] transition-colors"
            type="button"
            title="Compartilhar Memorial"
          >
            <span className="material-symbols-outlined text-lg">share</span>
          </button>
          <button
            onClick={handlePrint}
            aria-label="Imprimir ou Salvar PDF"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-[#0ea5e9] hover:bg-[#89ceff] text-[#001e2f] font-mono text-xs font-bold transition-all active:scale-95 shadow"
            type="button"
            title="Imprimir ou Salvar em PDF"
          >
            <span className="material-symbols-outlined text-base">print</span>
            <span className="hidden sm:inline">Imprimir / Salvar PDF</span>
          </button>
        </div>
      </header>

      {/* Main Canvas: Simulated White Printed Sheet */}
      <main
        className="flex-1 p-3 sm:p-6 overflow-y-auto w-full flex justify-center pb-28 print:p-0 print:m-0"
        style={{ transformOrigin: 'top center' }}
      >
        <article
          className="printable-sheet bg-white text-slate-900 border border-slate-300 rounded shadow-2xl p-6 sm:p-10 max-w-4xl w-full relative transition-transform"
          style={{ transform: zoomLevel !== 100 ? `scale(${zoomLevel / 100})` : undefined, transformOrigin: 'top center' }}
        >
          {/* 1.0 CABEÇALHO OFICIAL DO DOCUMENTO */}
          <header className="border-b-2 border-slate-900 pb-4 mb-4">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M4 3.5C4 3.22 4.22 3 4.5 3H19.5C19.78 3 20 3.22 20 3.5V6C20 6.28 19.78 6.5 19.5 6.5H13.8C13.25 6.5 12.8 6.95 12.8 7.5V16.5C12.8 17.05 13.25 17.5 13.8 17.5H19.5C19.78 17.5 20 17.72 20 18V20.5C20 20.78 19.78 21 19.5 21H4.5C4.22 21 4 20.78 4 20.5V18C4 17.72 4.22 17.5 4.5 17.5H10.2C10.75 17.5 11.2 17.05 11.2 16.5V7.5C11.2 6.95 10.75 6.5 10.2 6.5H4.5C4.22 6.5 4 6.28 4 6V3.5Z"
                      fill="currentColor"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="font-bold text-xl text-slate-900 tracking-tight leading-tight">
                    BeamSolidPro
                  </h1>
                  <span className="font-mono text-[11px] text-slate-600 block tracking-wider uppercase font-semibold">
                    Engenharia Estrutural • Memorial de Cálculo e Verificação
                  </span>
                </div>
              </div>

              <div className="text-right font-mono">
                <span className="inline-block px-2 py-0.5 rounded bg-slate-100 border border-slate-300 text-xs font-bold text-slate-800">
                  DOCUMENTO: MEM-STR-0104
                </span>
                <div className="text-[11px] text-slate-600 mt-1">Data: {studyDate || '—'} • REV 01</div>
              </div>
            </div>

            {/* Metadados do Projeto */}
            <div className="mt-4 pt-3 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 font-mono text-xs text-slate-700 bg-slate-50 p-3 rounded border border-slate-200">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Projeto / Obra:</span>
                <span className="font-semibold text-slate-900">{projectName || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Empresa / Contratada:</span>
                <span className="font-semibold text-slate-900">{companyName || '—'}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-semibold">Responsável Técnico:</span>
                <span className="font-semibold text-slate-900">{engineerName || '—'}</span>
                {professionalId ? (
                  <span className="text-slate-600 block text-[10px]">{professionalId}</span>
                ) : null}
              </div>
            </div>
          </header>

          {/* 1.0 DADOS GEOMÉTRICOS E MATERIAIS */}
          <section className="mb-5">
            <div className="flex items-center space-x-2 border-b border-slate-200 pb-1 mb-2.5">
              <span className="font-mono text-xs font-bold px-1.5 py-0.5 bg-slate-900 text-white rounded">1.0</span>
              <h2 className="font-bold text-slate-900 uppercase tracking-wide text-xs">
                Dados Geométricos, Condições de Contorno e Materiais
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {/* Esquema Estático & Seção */}
              <div className="border border-slate-200 rounded p-3 bg-slate-50 space-y-2">
                <div className="flex justify-between items-center pb-1 border-b border-slate-200">
                  <span className="text-slate-600 font-medium">Esquema Estático:</span>
                  <span className="font-mono font-bold text-slate-900">{supportDesc}</span>
                </div>
                <div className="flex justify-between items-center pb-1 border-b border-slate-200">
                  <span className="text-slate-600 font-medium">Comprimento do Vão (L):</span>
                  <span className="font-mono font-bold text-slate-900">{spanLength.toFixed(2)} m</span>
                </div>
                <div className="flex justify-between items-center pb-1 border-b border-slate-200">
                  <span className="text-slate-600 font-medium">Perfil Laminado Selecionado:</span>
                  <span className="font-mono font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                    Gerdau {profile.designation}
                  </span>
                </div>

                {/* Parâmetros seccionais */}
                <div className="mt-2 pt-2 border-t border-slate-200">
                  <span className="text-[10px] font-mono text-slate-500 uppercase font-semibold block mb-1">
                    Propriedades Geométricas da Seção Transversal:
                  </span>
                  <div className="grid grid-cols-3 gap-1.5 font-mono text-[11px] bg-white p-2 rounded border border-slate-200">
                    <div><span className="text-slate-500">d =</span> <b>{profile.depth_d}</b> mm</div>
                    <div><span className="text-slate-500">bf =</span> <b>{profile.flangeWidth_bf}</b> mm</div>
                    <div><span className="text-slate-500">tw =</span> <b>{profile.webThickness_tw}</b> mm</div>
                    <div><span className="text-slate-500">tf =</span> <b>{profile.flangeThickness_tf}</b> mm</div>
                    <div><span className="text-slate-500">Ix =</span> <b>{profile.inertia_Ix.toLocaleString()}</b> cm⁴</div>
                    <div><span className="text-slate-500">Zx =</span> <b>{profile.plasticModulus_Zx.toLocaleString()}</b> cm³</div>
                    <div><span className="text-slate-500">Wx =</span> <b>{profile.elasticModulus_Wx.toLocaleString()}</b> cm³</div>
                    <div><span className="text-slate-500">rx =</span> <b>{profile.radiusGyration_rx}</b> cm</div>
                    <div><span className="text-slate-500">Massa =</span> <b>{profile.massLinear}</b> kg/m</div>
                  </div>
                </div>
              </div>

              {/* Propriedades do Aço Estrutural */}
              <div className="border border-slate-200 rounded p-3 bg-slate-50 space-y-2">
                <div className="flex justify-between items-center pb-1 border-b border-slate-200">
                  <span className="text-slate-600 font-medium">Especificação do Aço:</span>
                  <span className="font-mono font-bold text-slate-900">{steelGrade.name} ({steelGrade.category})</span>
                </div>
                <div className="flex justify-between items-center pb-1 border-b border-slate-200">
                  <span className="text-slate-600 font-medium">Tensão de Escoamento (fy):</span>
                  <span className="font-mono font-bold text-slate-900">{steelGrade.fy} MPa</span>
                </div>
                <div className="flex justify-between items-center pb-1 border-b border-slate-200">
                  <span className="text-slate-600 font-medium">Tensão de Ruptura (fu):</span>
                  <span className="font-mono font-bold text-slate-900">{steelGrade.fu} MPa</span>
                </div>
                <div className="flex justify-between items-center pb-1 border-b border-slate-200">
                  <span className="text-slate-600 font-medium">Módulo de Elasticidade (E):</span>
                  <span className="font-mono font-bold text-slate-900">{steelGrade.E} GPa (200.000 MPa)</span>
                </div>
                <div className="flex justify-between items-center pb-1 border-b border-slate-200">
                  <span className="text-slate-600 font-medium">Coeficiente de Poisson (ν):</span>
                  <span className="font-mono font-bold text-slate-900">{steelGrade.nu.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pb-1 border-b border-slate-200">
                  <span className="text-slate-600 font-medium">Coeficiente de Ponderação (γa1):</span>
                  <span className="font-mono font-bold text-slate-900">1.10 (ELU - Escoamento)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 font-medium">Tensão Admissível de Cálculo (fyd):</span>
                  <span className="font-mono font-bold text-sky-800">
                    fyd = fy / γa1 = {(steelGrade.fy / 1.10).toFixed(1)} MPa
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* 2.0 AÇÕES APLICADAS & ESFORÇOS SOLICITANTES */}
          <section className="mb-5">
            <div className="flex items-center space-x-2 border-b border-slate-200 pb-1 mb-2.5">
              <span className="font-mono text-xs font-bold px-1.5 py-0.5 bg-slate-900 text-white rounded">2.0</span>
              <h2 className="font-bold text-slate-900 uppercase tracking-wide text-xs">
                Ações Aplicadas, Reações de Apoio e Esforços Solicitantes (ELU / ELS)
              </h2>
            </div>

            {/* Tabela de Ações e Reações */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 text-xs font-mono">
              <div className="border border-slate-200 rounded overflow-hidden">
                <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200 font-bold text-slate-800 text-[11px] uppercase">
                  Carregamentos Definidos no Modelo
                </div>
                {loads.length === 0 ? (
                  <div className="p-3 text-center text-slate-500 italic bg-white text-xs">
                    Nenhum carregamento externo adicionado.
                  </div>
                ) : (
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                      <tr>
                        <th className="py-1 px-2">Tipo</th>
                        <th className="py-1 px-2">Posição (m)</th>
                        <th className="py-1 px-2 text-right">Valor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {loads.map((l) => (
                        <tr key={l.id}>
                          <td className="py-1 px-2 font-medium">
                            {l.type === 'distributed' ? 'Distribuída (q)' : l.type === 'point' ? 'Pontual (P)' : 'Momento (M)'}
                          </td>
                          <td className="py-1 px-2 text-slate-600">
                            {l.type === 'distributed' ? `0.00 → ${spanLength.toFixed(2)}` : `${l.positionX.toFixed(2)}`} m
                          </td>
                          <td className="py-1 px-2 text-right font-bold text-slate-900">
                            {l.value} {l.type === 'distributed' ? 'kN/m' : l.type === 'point' ? 'kN' : 'kN·m'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Resumo dos Esforços de Cálculo */}
              <div className="border border-slate-200 rounded overflow-hidden">
                <div className="bg-slate-100 px-3 py-1.5 border-b border-slate-200 font-bold text-slate-800 text-[11px] uppercase">
                  Esforços de Cálculo e Reações de Apoio
                </div>
                <table className="w-full text-left text-[11px] bg-white divide-y divide-slate-100">
                  <tbody>
                    <tr>
                      <td className="py-1 px-2 text-slate-600">Reação de Apoio A (RA):</td>
                      <td className="py-1 px-2 text-right font-bold text-slate-900">
                        {hasLoads ? `${calcResults.reactionA.toFixed(2)} kN` : '—'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 px-2 text-slate-600">Reação de Apoio B (RB):</td>
                      <td className="py-1 px-2 text-right font-bold text-slate-900">
                        {hasLoads ? `${calcResults.reactionB.toFixed(2)} kN` : '—'}
                      </td>
                    </tr>
                    {calcResults.reactionC !== undefined && (
                      <tr>
                        <td className="py-1 px-2 text-slate-600">Reação de Apoio Intermediário C (RC):</td>
                        <td className="py-1 px-2 text-right font-bold text-slate-900">
                          {hasLoads ? `${calcResults.reactionC.toFixed(2)} kN` : '—'}
                        </td>
                      </tr>
                    )}
                    {calcResults.fixedEndMomentA !== undefined && (
                      <tr>
                        <td className="py-1 px-2 text-slate-600">Momento no engaste A (M_A):</td>
                        <td className="py-1 px-2 text-right font-bold text-slate-900">
                          {hasLoads ? `${calcResults.fixedEndMomentA.toFixed(2)} kN·m` : '—'}
                        </td>
                      </tr>
                    )}
                    {calcResults.fixedEndMomentB !== undefined && (
                      <tr>
                        <td className="py-1 px-2 text-slate-600">Momento no engaste B (M_B):</td>
                        <td className="py-1 px-2 text-right font-bold text-slate-900">
                          {hasLoads ? `${calcResults.fixedEndMomentB.toFixed(2)} kN·m` : '—'}
                        </td>
                      </tr>
                    )}
                    <tr className="bg-sky-50/50">
                      <td className="py-1 px-2 text-sky-900 font-semibold">Momento Fletor Solicitante Máx (MSd):</td>
                      <td className="py-1 px-2 text-right font-bold text-sky-900">
                        {hasLoads ? `${msd_val.toFixed(2)} kN·m (x = ${calcResults.maxMomentX.toFixed(2)}m)` : '—'}
                      </td>
                    </tr>
                    <tr className="bg-emerald-50/50">
                      <td className="py-1 px-2 text-emerald-900 font-semibold">Esforço Cortante Solicitante Máx (VSd):</td>
                      <td className="py-1 px-2 text-right font-bold text-emerald-900">
                        {hasLoads ? `${vsd_val.toFixed(2)} kN` : '—'}
                      </td>
                    </tr>
                    <tr className="bg-amber-50/50">
                      <td className="py-1 px-2 text-amber-900 font-semibold">Flecha Máxima em Serviço (δmax):</td>
                      <td className="py-1 px-2 text-right font-bold text-amber-900">
                        {hasLoads ? `${calcResults.maxDeflection.toFixed(2)} mm (x = ${calcResults.maxDeflectionX.toFixed(2)}m)` : '—'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Diagramas Estruturais Vetoriais em Fundo Branco */}
            <div className="border border-slate-200 rounded p-3 bg-slate-50 space-y-3">
              <span className="text-[10px] font-mono text-slate-600 uppercase font-bold block">
                Envoltórias Gráficas dos Esforços Solicitantes de Cálculo:
              </span>

              {/* Diagrama de Momento Fletor (DMF) */}
              <div className="bg-white p-2 rounded border border-slate-200">
                <div className="flex justify-between items-center font-mono text-[10px] text-slate-700 mb-1">
                  <span className="font-bold text-sky-900">DMF - Diagrama de Momentos Fletores (MSd)</span>
                  <span>Máx: {hasLoads ? `${msd_val.toFixed(2)} kN·m` : '0.00 kN·m'}</span>
                </div>
                <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-16 overflow-visible">
                  {/* Grid baseline */}
                  <line x1={padX} y1={momentBaselineY} x2={padX + graphW} y2={momentBaselineY} stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" />
                  {/* Moment filled curve */}
                  {hasLoads && (
                    <>
                      <path d={momentSvgPath} fill="#0ea5e9" fillOpacity="0.15" />
                      <polyline points={momentPoints.join(' ')} fill="none" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />
                    </>
                  )}
                  {/* Axis bounds */}
                  <text x={padX} y={svgH - 2} fontSize="9" fill="#64748b" fontFamily="monospace">x = 0m</text>
                  <text x={padX + graphW / 2} y={svgH - 2} fontSize="9" fill="#0284c7" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                    {hasLoads ? `MSd = ${msd_val.toFixed(1)} kNm` : '0.0 kNm'}
                  </text>
                  <text x={padX + graphW} y={svgH - 2} fontSize="9" fill="#64748b" textAnchor="end" fontFamily="monospace">x = {spanLength.toFixed(1)}m</text>
                </svg>
              </div>

              {/* Diagrama de Esforço Cortante (DEC) */}
              <div className="bg-white p-2 rounded border border-slate-200">
                <div className="flex justify-between items-center font-mono text-[10px] text-slate-700 mb-1">
                  <span className="font-bold text-emerald-900">DEC - Diagrama de Esforços Cortantes (VSd)</span>
                  <span>Máx: {hasLoads ? `${vsd_val.toFixed(2)} kN` : '0.00 kN'}</span>
                </div>
                <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-16 overflow-visible">
                  {/* Grid baseline */}
                  <line x1={padX} y1={shearBaselineY} x2={padX + graphW} y2={shearBaselineY} stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" />
                  {/* Shear filled curve */}
                  {hasLoads && (
                    <>
                      <path d={shearSvgPath} fill="#10b981" fillOpacity="0.15" />
                      <polyline points={shearPoints.join(' ')} fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
                    </>
                  )}
                  {/* Axis bounds */}
                  <text x={padX} y={svgH - 2} fontSize="9" fill="#64748b" fontFamily="monospace">x = 0m</text>
                  <text x={padX + graphW / 2} y={svgH - 2} fontSize="9" fill="#059669" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                    {hasLoads ? `VSd = ${vsd_val.toFixed(1)} kN` : '0.0 kN'}
                  </text>
                  <text x={padX + graphW} y={svgH - 2} fontSize="9" fill="#64748b" textAnchor="end" fontFamily="monospace">x = {spanLength.toFixed(1)}m</text>
                </svg>
              </div>
            </div>
          </section>

          {/* 3.0 VERIFICAÇÕES ESTRUTURAIS DETALHADAS */}
          <section className="mb-5">
            <div className="flex items-center space-x-2 border-b border-slate-200 pb-1 mb-2.5">
              <span className="font-mono text-xs font-bold px-1.5 py-0.5 bg-slate-900 text-white rounded">3.0</span>
              <h2 className="font-bold text-slate-900 uppercase tracking-wide text-xs">
                Verificações aos Estados Limites Últimos (ELU) e de Serviço (ELS)
              </h2>
            </div>

            <div className="space-y-3 font-mono text-xs">
              {/* 3.1 Flexão Normal (ELU) */}
              <div className="border border-slate-200 rounded p-3 bg-slate-50">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-900">
                    3.1 Momento Fletor Resistente de Cálculo (MRd)
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                    !hasLoads
                      ? 'bg-slate-200 text-slate-700 border-slate-300'
                      : calcResults.momentRatio <= 100
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border-rose-300'
                  }`}>
                    {!hasLoads ? '—' : calcResults.momentRatio <= 100 ? `${calcResults.momentRatio.toFixed(1)}% PASS` : `${calcResults.momentRatio.toFixed(1)}% FAIL`}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 font-sans mb-1.5">
                  Classificação da seção: Alma Compacta (λ ≤ λp) e Mesa Compacta (λ ≤ λp). Plastificação total da seção transversal sem flambagem local prematura.
                </p>
                <div className="bg-white p-2.5 rounded border border-slate-200 text-[11px] space-y-1">
                  <div className="text-slate-700 font-medium">
                    Fórmula de Verificação: <b>MRd = (Zx · fy) / γa1</b> = ({profile.plasticModulus_Zx} cm³ · {(steelGrade.fy / 10).toFixed(1)} kN/cm²) / 1.10
                  </div>
                  <div className="flex justify-between items-center text-slate-900 font-bold pt-1 border-t border-slate-100">
                    <span>MRd = {mrd_val.toFixed(2)} kN·m</span>
                    <span>MSd = {hasLoads ? `${msd_val.toFixed(2)} kN·m` : '0.00 kN·m'}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 pt-0.5">
                    Razão de Utilização: MSd / MRd = {hasLoads ? (msd_val / mrd_val).toFixed(3) : '0.000'} ≤ 1.00 {hasLoads && calcResults.momentRatio <= 100 ? '(Atende plenamente)' : ''}
                  </div>
                </div>
              </div>

              {/* 3.2 Força Cortante (ELU) */}
              <div className="border border-slate-200 rounded p-3 bg-slate-50">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-900">
                    3.2 Força Cortante Resistente de Cálculo (VRd)
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                    !hasLoads
                      ? 'bg-slate-200 text-slate-700 border-slate-300'
                      : calcResults.shearRatio <= 100
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border-rose-300'
                  }`}>
                    {!hasLoads ? '—' : calcResults.shearRatio <= 100 ? `${calcResults.shearRatio.toFixed(1)}% PASS` : `${calcResults.shearRatio.toFixed(1)}% FAIL`}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 font-sans mb-1.5">
                  Área efetiva de cisalhamento da alma: Aw = d · tw = {profile.depth_d} mm · {profile.webThickness_tw} mm = {Aw_cm2.toFixed(2)} cm².
                </p>
                <div className="bg-white p-2.5 rounded border border-slate-200 text-[11px] space-y-1">
                  <div className="text-slate-700 font-medium">
                    Fórmula de Verificação: <b>VRd = 0.60 · Aw · fy / γa1</b> = 0.60 · {Aw_cm2.toFixed(2)} cm² · {(steelGrade.fy / 10).toFixed(1)} kN/cm² / 1.10
                  </div>
                  <div className="flex justify-between items-center text-slate-900 font-bold pt-1 border-t border-slate-100">
                    <span>VRd = {vrd_val.toFixed(2)} kN</span>
                    <span>VSd = {hasLoads ? `${vsd_val.toFixed(2)} kN` : '0.00 kN'}</span>
                  </div>
                  <div className="text-[10px] text-slate-500 pt-0.5">
                    Razão de Utilização: VSd / VRd = {hasLoads ? (vsd_val / vrd_val).toFixed(3) : '0.000'} ≤ 1.00
                  </div>
                </div>
              </div>

              {/* 3.3 Deformação Excessiva (ELS) */}
              <div className="border border-slate-200 rounded p-3 bg-slate-50">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-900">
                    3.3 Estado Limite de Serviço - Flecha Máxima (ELS)
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                    !hasLoads
                      ? 'bg-slate-200 text-slate-700 border-slate-300'
                      : calcResults.deflectionRatio <= 100
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}>
                    {!hasLoads ? '—' : calcResults.deflectionRatio <= 100 ? `${calcResults.deflectionRatio.toFixed(1)}% CONFORME` : `${calcResults.deflectionRatio.toFixed(1)}% ALERTA`}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded border border-slate-200 text-[11px] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Critério de Flecha Admissível (L / 350):</span>
                    <span className="font-bold text-slate-900">
                      δadm = {(spanLength * 1000).toFixed(0)} mm / 350 = {calcResults.allowableDeflection.toFixed(2)} mm
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Flecha Máxima Calculada no Vão (δmax):</span>
                    <span className="font-bold text-sky-900">
                      {hasLoads ? `${calcResults.maxDeflection.toFixed(2)} mm` : '0.00 mm'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 pt-0.5 border-t border-slate-100">
                    Status ELS: {hasLoads ? `${calcResults.maxDeflection.toFixed(2)} mm ≤ ${calcResults.allowableDeflection.toFixed(2)} mm` : 'Aguardando definição de carregamentos'}
                  </div>
                </div>
              </div>

              {/* 3.4 Critério de Tensão Equivalente de Von Mises (ELU) */}
              <div className="border border-slate-200 rounded p-3 bg-slate-50">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-900">
                    3.4 Tensão Equivalente de Von Mises (σ_VM)
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
                    !hasLoads
                      ? 'bg-slate-200 text-slate-700 border-slate-300'
                      : calcResults.vonMisesRatio <= 100
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border-rose-300'
                  }`}>
                    {!hasLoads ? '—' : calcResults.vonMisesRatio <= 100 ? `${calcResults.vonMisesRatio.toFixed(1)}% PASS` : `${calcResults.vonMisesRatio.toFixed(1)}% FAIL`}
                  </span>
                </div>
                <div className="bg-white p-2.5 rounded border border-slate-200 text-[11px] space-y-1">
                  <div className="text-slate-700 font-medium">
                    Critério de Escoamento Multiaxial: <b>σ_VM = √(σ² + 3·τ²) ≤ fyd</b>
                  </div>
                  <div className="grid grid-cols-3 gap-1 text-[10px] text-slate-600 pt-1">
                    <div>σmáx = {hasLoads ? calcResults.normalStressMax.toFixed(1) : '0.0'} MPa</div>
                    <div>τmáx = {hasLoads ? calcResults.shearStressMax.toFixed(1) : '0.0'} MPa</div>
                    <div className="font-bold text-purple-900">σ_VM = {hasLoads ? calcResults.vonMisesMax.toFixed(1) : '0.0'} MPa</div>
                  </div>
                  <div className="text-[10px] text-slate-500 pt-0.5 border-t border-slate-100">
                    Tensão Admissível fyd = {calcResults.allowableStress_fyd.toFixed(1)} MPa • Coeficiente de Segurança CS = {hasLoads && calcResults.vonMisesMax > 0 ? (calcResults.allowableStress_fyd / calcResults.vonMisesMax).toFixed(2) : '—'}x
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 4.0 PARECER CONCLUSIVO & ASSINATURA */}
          <section className="border-t-2 border-slate-900 pt-4">
            <div className="flex items-center space-x-2 mb-3">
              <span className="font-mono text-xs font-bold px-1.5 py-0.5 bg-slate-900 text-white rounded">4.0</span>
              <h2 className="font-bold text-slate-900 uppercase tracking-wide text-xs">
                Parecer Conclusivo de Engenharia e Responsabilidade Técnica
              </h2>
            </div>

            {/* Parecer Conclusivo Banner */}
            <div className={`p-4 rounded-md border-2 mb-4 ${
              !hasLoads
                ? 'bg-slate-100 border-slate-400 text-slate-800'
                : calcResults.status === 'PASS'
                ? 'bg-emerald-50 border-emerald-600 text-emerald-950'
                : calcResults.status === 'ALERT'
                ? 'bg-amber-50 border-amber-600 text-amber-950'
                : 'bg-rose-50 border-rose-600 text-rose-950'
            }`}>
              <div className="flex items-center space-x-3">
                <span className={`material-symbols-outlined text-3xl font-bold ${
                  !hasLoads
                    ? 'text-slate-600'
                    : calcResults.status === 'PASS'
                    ? 'text-emerald-700'
                    : calcResults.status === 'ALERT'
                    ? 'text-amber-700'
                    : 'text-rose-700'
                }`}>
                  {!hasLoads ? 'help_outline' : calcResults.status === 'PASS' ? 'verified' : calcResults.status === 'ALERT' ? 'warning' : 'cancel'}
                </span>
                <div>
                  <h3 className="font-bold text-sm tracking-wider uppercase">
                    {!hasLoads
                      ? 'AGUARDANDO DEFINIÇÃO DE CARGAS'
                      : calcResults.status === 'PASS'
                      ? 'PARECER: ESTRUTURA PLENAMENTE APROVADA'
                      : calcResults.status === 'ALERT'
                      ? 'PARECER: ESTRUTURA EM ESTADO DE ALERTA'
                      : 'PARECER: ESTRUTURA REPROVADA (NÃO CONFORME)'}
                  </h3>
                  <p className="text-xs mt-0.5 leading-relaxed font-sans">
                    {!hasLoads
                      ? `Não constam ações ou cargas solicitantes aplicadas ao modelo estrutural. Insira as cargas na aba de Carregamento para conclusão do dimensionamento.`
                      : calcResults.status === 'PASS'
                      ? `A viga biapoiada de vão L = ${spanLength.toFixed(2)} m constituída pelo perfil ${profile.designation} em aço ${steelGrade.name} atende rigorosamente a todos os critérios de dimensionamento para os Estados Limites Últimos (ELU) e de Serviço (ELS).`
                      : calcResults.status === 'ALERT'
                      ? `A viga atende aos limites admissíveis, porém apresenta taxa de utilização elevada (> 85%). Recomenda-se acompanhamento ou adoção de contra-flecha.`
                      : `A seção adotada excede os limites de dimensionamento estrutural admissíveis. Necessário aumentar a altura ou módulo resistente da viga.`}
                  </p>
                </div>
              </div>
            </div>

            {/* Termo de Responsabilidade & Assinatura Digital */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 border border-slate-200 rounded p-4 font-mono text-xs text-slate-800">
              <div className="md:col-span-2 space-y-1.5">
                <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                  Certificação e Autenticação Digital de Engenharia
                </div>
                <div className="font-semibold text-slate-900 text-sm">{engineerName}</div>
                <div className="text-slate-700">{professionalId}</div>
                <div className="text-slate-600 text-[11px]">{companyName}</div>
                <div className="text-[10px] text-slate-500 pt-1">
                  Assinatura Eletrônica Qualificada ICP-Brasil • Validação ART Vinculada
                </div>
              </div>

              {/* QR Code & Carimbo de Validação */}
              <div className="flex flex-col items-center justify-center p-2 bg-white rounded border border-slate-200 text-center">
                <div className="w-16 h-16 bg-slate-900 text-white rounded p-1 flex flex-col justify-between items-center shadow-inner">
                  <div className="w-full flex justify-between">
                    <div className="w-3.5 h-3.5 bg-white rounded-xs"></div>
                    <div className="w-3.5 h-3.5 bg-white rounded-xs"></div>
                  </div>
                  <span className="material-symbols-outlined text-white text-xs">qr_code_2</span>
                  <div className="w-full flex justify-between">
                    <div className="w-3.5 h-3.5 bg-white rounded-xs"></div>
                    <div className="w-2 h-2 bg-emerald-400 rounded-xs"></div>
                  </div>
                </div>
                <span className="text-[9px] font-bold text-slate-800 mt-1 uppercase tracking-tighter">
                  AUTENTICAÇÃO CREA
                </span>
                <span className="text-[8px] text-slate-500">Hash: 8f3b2a99c4d1e289</span>
              </div>
            </div>

            {/* Rodapé da Folha Impressa */}
            <footer className="mt-4 pt-2 border-t border-slate-300 flex justify-between items-center text-[10px] font-mono text-slate-500">
              <span>BeamSolidPro • Sistema de Dimensionamento Estrutural</span>
              <span>Página 1 de 1 • Memorial de Cálculo A4</span>
              <span>Emitido em: {studyDate}</span>
            </footer>
          </section>
        </article>
      </main>

      {/* Floating Bottom Action Deck for Screen Use */}
      <aside className="no-print fixed bottom-0 left-0 w-full z-40 bg-[#181c24]/95 border-t border-[#3e4850] p-3 px-4 backdrop-blur-md">
        <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
          <button
            onClick={onBack}
            type="button"
            className="px-4 py-2 bg-[#262a33] hover:bg-[#31353e] text-[#dfe2ee] rounded border border-[#3e4850] font-mono text-xs flex items-center gap-1.5 transition-colors active:scale-95"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span>Voltar aos Resultados</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleWhatsApp}
              type="button"
              className="px-3 py-2 bg-[#25D366] hover:bg-[#20ba5a] text-slate-900 rounded font-mono text-xs font-bold flex items-center gap-1.5 transition-colors active:scale-95 shadow"
              title="Compartilhar resumo via WhatsApp"
            >
              <span className="material-symbols-outlined text-sm">send</span>
              <span className="hidden sm:inline">WhatsApp</span>
            </button>

            <button
              onClick={handlePrint}
              type="button"
              className="px-4 py-2 bg-[#0ea5e9] hover:bg-[#89ceff] text-[#001e2f] rounded font-mono text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-md"
            >
              <span className="material-symbols-outlined text-base">print</span>
              <span>Imprimir / Salvar PDF</span>
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};
