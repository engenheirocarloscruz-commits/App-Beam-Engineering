import React from 'react';
import { CalculationResults, LoadItem, SteelGrade, SteelProfile } from '../types';

interface ResultsViewProps {
  calcResults: CalculationResults;
  profile: SteelProfile;
  steelGrade: SteelGrade;
  spanLength: number;
  norm: string;
  loads?: LoadItem[];
  onOpenMemorial: () => void;
  onOptimizeProfile: () => void;
  onGoToLoads?: () => void;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  calcResults,
  profile,
  steelGrade,
  spanLength,
  norm,
  loads,
  onOpenMemorial,
  onOptimizeProfile,
  onGoToLoads,
}) => {
  const hasLoads =
    calcResults.status !== 'NONE' &&
    (loads === undefined || (loads.length > 0 && loads.some((l) => Number(l.value) > 0)));
  // Generate SVG diagram coordinates
  const svgW = 800;
  const svgH = 160;
  const marginX = 40;
  const graphW = svgW - 2 * marginX; // 720
  const baselineY = 80;

  const maxV = Math.max(Math.abs(calcResults.maxShearPos), Math.abs(calcResults.maxShearNeg), 1);
  const maxM = Math.max(Math.abs(calcResults.maxMoment), 1);
  const maxD = Math.max(calcResults.maxDeflection, calcResults.allowableDeflection, 1);
  const maxVM = Math.max(calcResults.vonMisesMax, calcResults.allowableStress_fyd, 1);

  // DEC (Shear) SVG Path
  const shearPointsStr = calcResults.shearCurve
    .map((pt) => {
      const x_svg = marginX + (pt.x / spanLength) * graphW;
      // positive shear is upwards (lower Y)
      const y_svg = baselineY - (pt.v / maxV) * 55;
      return `${x_svg.toFixed(1)},${y_svg.toFixed(1)}`;
    })
    .join(' ');

  // DMF (Moment) SVG Path
  const momentBaselineY = 30;
  const momentPointsStr = calcResults.momentCurve
    .map((pt) => {
      const x_svg = marginX + (pt.x / spanLength) * graphW;
      // positive bending moment drawn downwards for bottom fiber tension
      const y_svg = momentBaselineY + (Math.abs(pt.m) / maxM) * 105;
      return `${x_svg.toFixed(1)},${y_svg.toFixed(1)}`;
    })
    .join(' ');

  // Deflection SVG Path
  const deflBaselineY = 25;
  const deflPointsStr = calcResults.deflectionCurve
    .map((pt) => {
      const x_svg = marginX + (pt.x / spanLength) * graphW;
      const y_svg = deflBaselineY + (pt.d / maxD) * 72;
      return `${x_svg.toFixed(1)},${y_svg.toFixed(1)}`;
    })
    .join(' ');

  // Von Mises Stress SVG Path
  const vmBaselineY = 125;
  const vmChartH = 90;
  const vmPointsStr = calcResults.vonMisesCurve
    .map((pt) => {
      const x_svg = marginX + (pt.x / spanLength) * graphW;
      const y_svg = vmBaselineY - (pt.vm / maxVM) * vmChartH;
      return `${x_svg.toFixed(1)},${y_svg.toFixed(1)}`;
    })
    .join(' ');

  const peakMomentSvgX = marginX + (calcResults.maxMomentX / spanLength) * graphW;
  const peakDeflSvgX = marginX + (calcResults.maxDeflectionX / spanLength) * graphW;
  const peakVMSvgX = marginX + (calcResults.vonMisesMaxX / spanLength) * graphW;
  const peakVMSvgY = vmBaselineY - (calcResults.vonMisesMax / maxVM) * vmChartH;
  const fydSvgY = vmBaselineY - (calcResults.allowableStress_fyd / maxVM) * vmChartH;

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-4 py-3 pb-24 space-y-4">
      {/* Screen Title & System Status Banner */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0a0e16] border border-[#3e4850] rounded p-3.5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-headline font-semibold text-xl text-[#dfe2ee]">
              Resultados & Verificação
            </h1>
            <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-[#00b17b]/15 text-[#4edea3] border border-[#00b17b]/30">
              {norm}
            </span>
          </div>
          <p className="text-xs text-[#bec8d2] mt-0.5">
            Análise elastoplástica de 1ª ordem com combinações ELU e ELS calculadas.
          </p>
        </div>

        {/* Global Compliance Pill */}
        <div className={`flex items-center gap-3 bg-[#181c24] px-3 py-2 rounded border transition-colors ${
          !hasLoads
            ? 'border-[#3e4850] bg-[#181c24]'
            : calcResults.status === 'PASS'
            ? 'border-[#00b17b]/40 bg-[#00b17b]/5'
            : calcResults.status === 'ALERT'
            ? 'border-[#ee9800]/50 bg-[#ee9800]/5'
            : 'border-[#ba1a1a]/50 bg-[#ba1a1a]/10'
        }`}>
          <div className="flex flex-col text-right">
            <span className="font-mono text-[10px] text-[#bec8d2]">Status Global</span>
            <span className={`font-mono text-xs font-bold min-h-[16px] ${
              !hasLoads
                ? 'text-[#88929b]'
                : calcResults.status === 'PASS'
                ? 'text-[#4edea3]'
                : calcResults.status === 'ALERT'
                ? 'text-[#ffb95f]'
                : 'text-[#ffb4ab]'
            }`}>
              {!hasLoads
                ? ''
                : calcResults.status === 'PASS'
                ? 'ESTRUTURA APROVADA'
                : calcResults.status === 'ALERT'
                ? 'VERIFICAÇÃO EM ALERTA'
                : 'ESTRUTURA REPROVADA'}
            </span>
          </div>
          <div className={`w-8 h-8 rounded flex items-center justify-center border transition-colors ${
            !hasLoads
              ? 'bg-[#262a33]/50 border-[#3e4850]'
              : calcResults.status === 'PASS'
              ? 'bg-[#00b17b]/20 border-[#00b17b]'
              : calcResults.status === 'ALERT'
              ? 'bg-[#ee9800]/20 border-[#ee9800]'
              : 'bg-[#ba1a1a]/20 border-[#ba1a1a]'
          }`}>
            <span className={`material-symbols-outlined text-lg font-bold ${
              !hasLoads
                ? 'text-[#88929b]'
                : calcResults.status === 'PASS'
                ? 'text-[#4edea3] fill-1'
                : calcResults.status === 'ALERT'
                ? 'text-[#ffb95f] fill-1'
                : 'text-[#ffb4ab] fill-1'
            }`}>
              {!hasLoads ? 'horizontal_rule' : calcResults.status === 'PASS' ? 'verified' : calcResults.status === 'ALERT' ? 'warning' : 'cancel'}
            </span>
          </div>
        </div>
      </section>

      {/* Informative banner when loads are not defined */}
      {!hasLoads && (
        <div className="bg-[#181c24] border border-[#3e4850] rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#89ceff] text-xl">info</span>
            <div>
              <p className="font-mono text-xs text-[#dfe2ee] font-semibold">
                Nenhuma carga foi definida para a viga
              </p>
              <p className="font-mono text-[11px] text-[#bec8d2]">
                O status global permanece em branco até a inserção dos carregamentos na aba de Carregamento.
              </p>
            </div>
          </div>
          {onGoToLoads && (
            <button
              type="button"
              onClick={onGoToLoads}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0ea5e9] hover:bg-[#89ceff] text-[#001e2f] rounded font-mono text-xs font-bold transition-colors shrink-0"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Definir Cargas
            </button>
          )}
        </div>
      )}

      {/* Bento Grid 1: Verification KPI Cards & Reaction Values */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Card 1: Flexion Capacity */}
        <div className="bg-[#181c24] border border-[#3e4850] rounded p-3.5 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#0ea5e9]/5 rounded-full blur-2xl pointer-events-none"></div>
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="font-mono text-xs text-[#bec8d2] font-medium">Flexão Normal (ELU)</span>
              <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold border ${
                !hasLoads
                  ? 'bg-[#262a33] text-[#88929b] border-[#3e4850]'
                  : calcResults.momentRatio <= 100
                  ? 'bg-[#00b17b]/15 text-[#4edea3] border-[#00b17b]/30'
                  : 'bg-[#93000a]/20 text-[#ffb4ab] border-[#93000a]'
              }`}>
                {!hasLoads ? '—' : calcResults.momentRatio <= 100 ? 'PASS' : 'FAIL'}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-2xl font-bold text-[#dfe2ee]">
                {calcResults.momentRatio.toFixed(1)}%
              </span>
              <span className="font-mono text-[10px] text-[#bec8d2]">MSd / MRd</span>
            </div>
            <div className="w-full bg-[#31353e] h-1.5 rounded mt-2.5 overflow-hidden">
              <div
                className={`h-full rounded ${calcResults.momentRatio <= 100 ? 'bg-[#89ceff]' : 'bg-[#ffb4ab]'}`}
                style={{ width: `${Math.min(calcResults.momentRatio, 100)}%` }}
              ></div>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-[#3e4850]/60 flex justify-between font-mono text-[10px] text-[#bec8d2]">
            <span>MSd = {Math.abs(calcResults.maxMoment).toFixed(1)} kNm</span>
            <span>MRd = {calcResults.momentCapacity_Mrd.toFixed(1)} kNm</span>
          </div>
        </div>

        {/* Card 2: Shear Capacity */}
        <div className="bg-[#181c24] border border-[#3e4850] rounded p-3.5 flex flex-col justify-between relative overflow-hidden">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="font-mono text-xs text-[#bec8d2] font-medium">Cisalhamento (ELU)</span>
              <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold border ${
                !hasLoads
                  ? 'bg-[#262a33] text-[#88929b] border-[#3e4850]'
                  : 'bg-[#00b17b]/15 text-[#4edea3] border-[#00b17b]/30'
              }`}>
                {!hasLoads ? '—' : 'PASS'}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-2xl font-bold text-[#dfe2ee]">
                {calcResults.shearRatio.toFixed(1)}%
              </span>
              <span className="font-mono text-[10px] text-[#bec8d2]">VSd / VRd</span>
            </div>
            <div className="w-full bg-[#31353e] h-1.5 rounded mt-2.5 overflow-hidden">
              <div
                className="bg-[#4edea3] h-full rounded"
                style={{ width: `${Math.min(calcResults.shearRatio, 100)}%` }}
              ></div>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-[#3e4850]/60 flex justify-between font-mono text-[10px] text-[#bec8d2]">
            <span>VSd = {Math.max(Math.abs(calcResults.maxShearPos), Math.abs(calcResults.maxShearNeg)).toFixed(1)} kN</span>
            <span>VRd = {calcResults.shearCapacity_Vrd.toFixed(1)} kN</span>
          </div>
        </div>

        {/* Card 3: Von Mises Equivalent Stress */}
        <div className="bg-[#181c24] border border-[#3e4850] rounded p-3.5 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#c084fc]/10 rounded-full blur-2xl pointer-events-none"></div>
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="font-mono text-xs text-[#c084fc] font-semibold flex items-center gap-1">
                <span className="material-symbols-outlined text-sm text-[#c084fc]">speed</span>
                Von Mises (σ_VM)
              </span>
              <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold border ${
                !hasLoads
                  ? 'bg-[#262a33] text-[#88929b] border-[#3e4850]'
                  : calcResults.vonMisesRatio <= 100
                  ? 'bg-[#00b17b]/15 text-[#4edea3] border-[#00b17b]/30'
                  : 'bg-[#93000a]/20 text-[#ffb4ab] border-[#93000a]'
              }`}>
                {!hasLoads ? '—' : calcResults.vonMisesRatio <= 100 ? 'PASS' : 'FAIL'}
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-2xl font-bold text-[#dfe2ee]">
                {calcResults.vonMisesMax.toFixed(1)}
              </span>
              <span className="font-mono text-xs text-[#c084fc] font-semibold">MPa</span>
              <span className="font-mono text-[10px] text-[#bec8d2] ml-auto">
                {calcResults.vonMisesRatio}% de fyd
              </span>
            </div>
            <div className="w-full bg-[#31353e] h-1.5 rounded mt-2.5 overflow-hidden">
              <div
                className={`h-full rounded transition-all ${
                  calcResults.vonMisesRatio <= 85
                    ? 'bg-[#c084fc]'
                    : calcResults.vonMisesRatio <= 100
                    ? 'bg-[#ffb95f]'
                    : 'bg-[#ffb4ab]'
                }`}
                style={{ width: `${Math.min(calcResults.vonMisesRatio, 100)}%` }}
              ></div>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-[#3e4850]/60 flex justify-between font-mono text-[10px] text-[#bec8d2]">
            <span>fyd = {calcResults.allowableStress_fyd.toFixed(1)} MPa</span>
            <span>x = {calcResults.vonMisesMaxX.toFixed(2)}m</span>
          </div>
        </div>

        {/* Card 4: Deflection ELS */}
        <div className="bg-[#181c24] border border-[#3e4850] rounded p-3.5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="font-mono text-xs text-[#bec8d2] font-medium">Flecha Máxima (ELS)</span>
              <span className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold border ${
                !hasLoads
                  ? 'bg-[#262a33] text-[#88929b] border-[#3e4850]'
                  : calcResults.deflectionRatio <= 100
                  ? 'bg-[#00b17b]/15 text-[#4edea3] border-[#00b17b]/30'
                  : 'bg-[#ee9800]/20 text-[#ffb4ab] border-[#ee9800]/40'
              }`}>
                {!hasLoads ? '—' : `${calcResults.deflectionRatio.toFixed(1)}%`}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-2xl font-bold text-[#ffb95f]">
                {calcResults.maxDeflection.toFixed(1)} <span className="text-xs font-normal">mm</span>
              </span>
              <span className="font-mono text-[10px] text-[#bec8d2]">
                δmax em x = {calcResults.maxDeflectionX.toFixed(2)}m
              </span>
            </div>
            <div className="w-full bg-[#31353e] h-1.5 rounded mt-2.5 overflow-hidden">
              <div
                className="bg-[#ffb95f] h-full rounded"
                style={{ width: `${Math.min(calcResults.deflectionRatio, 100)}%` }}
              ></div>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-[#3e4850]/60 flex justify-between font-mono text-[10px] text-[#bec8d2]">
            <span>Limite L/350 = {calcResults.allowableDeflection.toFixed(1)} mm</span>
            <span className={calcResults.deflectionRatio <= 100 ? 'text-[#4edea3]' : 'text-[#ffb95f]'}>
              {calcResults.deflectionRatio <= 100 ? 'Conforme' : 'Atenção'}
            </span>
          </div>
        </div>

        {/* Card 5: Support Reactions */}
        <div className="bg-[#181c24] border border-[#3e4850] rounded p-3.5 flex flex-col justify-between">
          <div className="flex justify-between items-center mb-1">
            <span className="font-mono text-xs text-[#bec8d2] font-medium">Reações nos Apoios</span>
            <span className="material-symbols-outlined text-[#88929b] text-base">balance</span>
          </div>
          <div className="grid grid-cols-2 gap-2 my-1">
            <div className="bg-[#1c2028] p-2 rounded border border-[#3e4850]/50">
              <span className="font-mono text-[10px] text-[#bec8d2] block">Apoio A (Esq)</span>
              <div className="font-mono text-base font-bold text-[#89ceff]">
                {calcResults.reactionA.toFixed(1)} <span className="text-[10px] font-normal text-[#bec8d2]">kN</span>
              </div>
              <span className="font-mono text-[9px] text-[#4edea3]">↑ Vertical</span>
            </div>
            <div className="bg-[#1c2028] p-2 rounded border border-[#3e4850]/50">
              <span className="font-mono text-[10px] text-[#bec8d2] block">Apoio B (Dir)</span>
              <div className="font-mono text-base font-bold text-[#89ceff]">
                {calcResults.reactionB.toFixed(1)} <span className="text-[10px] font-normal text-[#bec8d2]">kN</span>
              </div>
              <span className="font-mono text-[9px] text-[#4edea3]">↑ Vertical</span>
            </div>
          </div>
          <div className="pt-1.5 border-t border-[#3e4850]/60 flex justify-between font-mono text-[10px] text-[#bec8d2]">
            <span>ΣFy = {calcResults.totalVerticalLoad.toFixed(1)} kN</span>
            <span>Equilíbrio: 0.0 kN</span>
          </div>
        </div>
      </section>

      {/* Structural Diagrams Viewport Stack */}
      <section className="space-y-3">
        {/* Diagram 1: DEC (Shear) */}
        <div className="bg-[#181c24] border border-[#3e4850] rounded overflow-hidden">
          <div className="px-4 py-2 bg-[#0a0e16] border-b border-[#3e4850] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded bg-[#89ceff]"></span>
              <span className="font-mono text-xs text-[#dfe2ee] font-semibold">
                Diagrama de Esforço Cortante (DEC • V)
              </span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[10px]">
              <span className="text-[#bec8d2]">
                Vmáx(+) = <span className="text-[#89ceff] font-semibold">+{calcResults.maxShearPos.toFixed(1)} kN</span>
              </span>
              <span className="text-[#bec8d2]">
                Vmáx(-) = <span className="text-[#ffb95f] font-semibold">{calcResults.maxShearNeg.toFixed(1)} kN</span>
              </span>
              <span className="bg-[#1c2028] px-2 py-0.5 rounded text-[#88929b] border border-[#3e4850]">
                V = 0 em x = {calcResults.shearZeroX.toFixed(2)}m
              </span>
            </div>
          </div>

          <div className="p-3 cad-grid-pattern relative overflow-x-auto bg-[#0f131c]">
            <svg className="w-full h-36 min-w-[500px] select-none overflow-visible" viewBox={`0 0 ${svgW} ${svgH}`}>
              <defs>
                <linearGradient id="shearPosGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.02" />
                </linearGradient>
                <linearGradient id="shearNegGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#ee9800" stopOpacity="0.05" />
                  <stop offset="100%" stopColor="#ee9800" stopOpacity="0.35" />
                </linearGradient>
              </defs>

              {/* Baseline */}
              <line x1={marginX} x2={svgW - marginX} y1={baselineY} y2={baselineY} stroke="#3e4850" strokeWidth="1.5" strokeDasharray="3 3" />
              <text x={marginX - 8} y={baselineY + 4} fill="#88929b" fontFamily="JetBrains Mono" fontSize="10" textAnchor="end">0.0</text>
              <text x={svgW - marginX + 8} y={baselineY + 4} fill="#88929b" fontFamily="JetBrains Mono" fontSize="10" textAnchor="start">x (m)</text>

              {/* Shaded Area of shear curve */}
              <path
                d={`M ${marginX},${baselineY} L ${shearPointsStr} L ${svgW - marginX},${baselineY} Z`}
                fill="url(#shearPosGrad)"
                stroke="#0ea5e9"
                strokeWidth="2"
              />

              {/* Key points markers */}
              <circle cx={marginX} cy={baselineY - (calcResults.reactionA / maxV) * 55} r={3.5} fill="#89ceff" />
              <circle cx={svgW - marginX} cy={baselineY - (calcResults.maxShearNeg / maxV) * 55} r={3.5} fill="#ffb95f" />

              <text x={marginX + 10} y={baselineY - (calcResults.reactionA / maxV) * 55 - 6} fill="#89ceff" fontFamily="JetBrains Mono" fontSize="10" fontWeight="600">
                +{calcResults.reactionA.toFixed(1)} kN
              </text>
              <text x={svgW - marginX - 10} y={baselineY - (calcResults.maxShearNeg / maxV) * 55 + 14} fill="#ffb95f" fontFamily="JetBrains Mono" fontSize="10" fontWeight="600" textAnchor="end">
                {calcResults.maxShearNeg.toFixed(1)} kN
              </text>
            </svg>
          </div>
        </div>

        {/* Diagram 2: DMF (Moment) */}
        <div className="bg-[#181c24] border border-[#3e4850] rounded overflow-hidden">
          <div className="px-4 py-2 bg-[#0a0e16] border-b border-[#3e4850] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded bg-[#0ea5e9]"></span>
              <span className="font-mono text-xs text-[#dfe2ee] font-semibold">
                Diagrama de Momento Fletor (DMF • M)
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono text-[10px]">
              <span className="text-[#bec8d2]">Tração nas Fibras Inferiores (↓)</span>
              <span className="bg-[#0ea5e9]/10 text-[#89ceff] px-2 py-0.5 rounded border border-[#0ea5e9]/20 font-semibold">
                Mmáx = {Math.abs(calcResults.maxMoment).toFixed(1)} kNm
              </span>
            </div>
          </div>

          <div className="p-3 cad-grid-pattern relative overflow-x-auto bg-[#0f131c]">
            <svg className="w-full h-36 min-w-[500px] select-none overflow-visible" viewBox={`0 0 ${svgW} ${svgH}`}>
              <defs>
                <linearGradient id="momentGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.05" />
                  <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.4" />
                </linearGradient>
              </defs>

              {/* Baseline */}
              <line x1={marginX} x2={svgW - marginX} y1={momentBaselineY} y2={momentBaselineY} stroke="#3e4850" strokeWidth="1.5" />
              <text x={marginX - 8} y={momentBaselineY + 4} fill="#88929b" fontFamily="JetBrains Mono" fontSize="10" textAnchor="end">0.0</text>
              <text x={svgW - marginX + 8} y={momentBaselineY + 4} fill="#88929b" fontFamily="JetBrains Mono" fontSize="10" textAnchor="start">x (m)</text>

              {/* Parabola path */}
              <path
                d={`M ${marginX},${momentBaselineY} L ${momentPointsStr} L ${svgW - marginX},${momentBaselineY} Z`}
                fill="url(#momentGrad)"
                stroke="#0ea5e9"
                strokeWidth="2.5"
              />

              {/* Peak indicator */}
              <line x1={peakMomentSvgX} x2={peakMomentSvgX} y1={momentBaselineY} y2={momentBaselineY + 105} stroke="#89ceff" strokeWidth="1" strokeDasharray="3 2" />
              <circle cx={peakMomentSvgX} cy={momentBaselineY + 105} r={4} fill="#0ea5e9" stroke="#ffffff" strokeWidth="1.5" />

              <g transform={`translate(${Math.min(peakMomentSvgX + 8, svgW - 170)}, ${momentBaselineY + 90})`}>
                <rect x={0} y={0} width={150} height={24} rx={2} fill="#0b0f17" fillOpacity="0.9" stroke="#0ea5e9" strokeWidth="1" />
                <text x={8} y={16} fill="#89ceff" fontFamily="JetBrains Mono" fontSize="10" fontWeight="700">
                  M_máx = +{Math.abs(calcResults.maxMoment).toFixed(1)} kNm
                </text>
              </g>
              <text x={peakMomentSvgX} y={momentBaselineY - 6} fill="#88929b" fontFamily="JetBrains Mono" fontSize="9" textAnchor="middle">
                x = {calcResults.maxMomentX.toFixed(2)}m
              </text>
            </svg>
          </div>
        </div>

        {/* Diagram 3: Linha Elástica */}
        <div className="bg-[#181c24] border border-[#3e4850] rounded overflow-hidden">
          <div className="px-4 py-2 bg-[#0a0e16] border-b border-[#3e4850] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded bg-[#4edea3]"></span>
              <span className="font-mono text-xs text-[#dfe2ee] font-semibold">
                Linha Elástica / Deformação Real (δ)
              </span>
            </div>
            <div className="flex items-center gap-3 font-mono text-[10px]">
              <span className="text-[#bec8d2]">δadm = {calcResults.allowableDeflection.toFixed(1)} mm (L/350)</span>
              <span className="text-[#4edea3] font-semibold">
                δmáx = {calcResults.maxDeflection.toFixed(1)} mm @ x={calcResults.maxDeflectionX.toFixed(2)}m
              </span>
            </div>
          </div>

          <div className="p-3 cad-grid-pattern relative overflow-x-auto bg-[#0f131c]">
            <svg className="w-full h-28 min-w-[500px] select-none overflow-visible" viewBox={`0 0 ${svgW} 130`}>
              <line x1={marginX} x2={svgW - marginX} y1={deflBaselineY} y2={deflBaselineY} stroke="#3e4850" strokeWidth="1.5" />
              <text x={marginX - 8} y={deflBaselineY + 4} fill="#88929b" fontFamily="JetBrains Mono" fontSize="10" textAnchor="end">0.0</text>

              {/* Allowable limit line */}
              <line
                x1={marginX}
                x2={svgW - marginX}
                y1={deflBaselineY + (calcResults.allowableDeflection / maxD) * 72}
                y2={deflBaselineY + (calcResults.allowableDeflection / maxD) * 72}
                stroke="#ee9800"
                strokeWidth="1"
                strokeDasharray="4 4"
                strokeOpacity="0.7"
              />
              <text x={svgW - marginX + 6} y={deflBaselineY + (calcResults.allowableDeflection / maxD) * 72 + 3} fill="#ee9800" fontFamily="JetBrains Mono" fontSize="9">
                δ_lim = {calcResults.allowableDeflection.toFixed(1)}mm
              </text>

              {/* Deflection path */}
              <path
                d={`M ${marginX},${deflBaselineY} L ${deflPointsStr} L ${svgW - marginX},${deflBaselineY}`}
                fill="none"
                stroke="#4edea3"
                strokeWidth="2.5"
              />

              {/* Peak Deflection Point */}
              <circle
                cx={peakDeflSvgX}
                cy={deflBaselineY + (calcResults.maxDeflection / maxD) * 72}
                r={3.5}
                fill="#4edea3"
              />

              <g transform={`translate(${Math.min(peakDeflSvgX + 8, svgW - 160)}, ${deflBaselineY + (calcResults.maxDeflection / maxD) * 72 - 12})`}>
                <rect x={0} y={0} width={146} height={22} rx={2} fill="#0b0f17" fillOpacity="0.9" stroke="#4edea3" strokeWidth="1" />
                <text x={6} y={15} fill="#4edea3" fontFamily="JetBrains Mono" fontSize="10" fontWeight="600">
                  δ = {calcResults.maxDeflection.toFixed(1)} mm (x={calcResults.maxDeflectionX.toFixed(2)}m)
                </text>
              </g>
            </svg>
          </div>
        </div>

        {/* Diagram 4: Tensão Equivalente de Von Mises (σ_VM) */}
        <div className="bg-[#181c24] border border-[#3e4850] rounded overflow-hidden">
          <div className="px-4 py-2 bg-[#0a0e16] border-b border-[#3e4850] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded bg-[#c084fc]"></span>
              <span className="font-mono text-xs text-[#dfe2ee] font-semibold">
                Diagrama de Tensão Equivalente de Von Mises (σ_VM = √(σ² + 3τ²))
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3 font-mono text-[10px]">
              <span className="text-[#bec8d2]">
                σ_máx = <span className="text-[#89ceff] font-semibold">{calcResults.normalStressMax.toFixed(1)} MPa</span>
              </span>
              <span className="text-[#bec8d2]">
                τ_máx = <span className="text-[#4edea3] font-semibold">{calcResults.shearStressMax.toFixed(1)} MPa</span>
              </span>
              <span className="text-[#bec8d2]">
                fyd = <span className="text-[#ffb95f] font-semibold">{calcResults.allowableStress_fyd.toFixed(1)} MPa</span>
              </span>
              <span className="bg-[#c084fc]/15 text-[#c084fc] px-2 py-0.5 rounded border border-[#c084fc]/30 font-semibold">
                σ_VM,máx = {calcResults.vonMisesMax.toFixed(1)} MPa @ x={calcResults.vonMisesMaxX.toFixed(2)}m
              </span>
            </div>
          </div>

          <div className="p-3 cad-grid-pattern relative overflow-x-auto bg-[#0f131c]">
            <svg className="w-full h-36 min-w-[500px] select-none overflow-visible" viewBox={`0 0 ${svgW} ${svgH}`}>
              <defs>
                <linearGradient id="vmGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#c084fc" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#c084fc" stopOpacity="0.03" />
                </linearGradient>
              </defs>

              {/* Baseline */}
              <line x1={marginX} x2={svgW - marginX} y1={vmBaselineY} y2={vmBaselineY} stroke="#3e4850" strokeWidth="1.5" />
              <text x={marginX - 8} y={vmBaselineY + 4} fill="#88929b" fontFamily="JetBrains Mono" fontSize="10" textAnchor="end">0.0</text>
              <text x={svgW - marginX + 8} y={vmBaselineY + 4} fill="#88929b" fontFamily="JetBrains Mono" fontSize="10" textAnchor="start">x (m)</text>

              {/* Allowable stress limit line fyd */}
              {fydSvgY >= 10 && fydSvgY <= vmBaselineY && (
                <>
                  <line
                    x1={marginX}
                    x2={svgW - marginX}
                    y1={fydSvgY}
                    y2={fydSvgY}
                    stroke="#ffb95f"
                    strokeWidth="1.2"
                    strokeDasharray="4 3"
                    strokeOpacity="0.85"
                  />
                  <text x={svgW - marginX + 6} y={fydSvgY + 3} fill="#ffb95f" fontFamily="JetBrains Mono" fontSize="9">
                    fyd = {calcResults.allowableStress_fyd.toFixed(1)} MPa
                  </text>
                </>
              )}

              {/* Shaded Area of Von Mises curve */}
              <path
                d={`M ${marginX},${vmBaselineY} L ${vmPointsStr} L ${svgW - marginX},${vmBaselineY} Z`}
                fill="url(#vmGrad)"
                stroke="#c084fc"
                strokeWidth="2.2"
              />

              {/* Peak indicator */}
              <line x1={peakVMSvgX} x2={peakVMSvgX} y1={vmBaselineY} y2={peakVMSvgY} stroke="#c084fc" strokeWidth="1" strokeDasharray="3 2" />
              <circle cx={peakVMSvgX} cy={peakVMSvgY} r={4} fill="#c084fc" stroke="#ffffff" strokeWidth="1.5" />

              <g transform={`translate(${Math.min(peakVMSvgX + 8, svgW - 190)}, ${Math.max(peakVMSvgY - 14, 18)})`}>
                <rect x={0} y={0} width={180} height={24} rx={3} fill="#0b0f17" fillOpacity="0.95" stroke="#c084fc" strokeWidth="1" />
                <text x={8} y={16} fill="#c084fc" fontFamily="JetBrains Mono" fontSize="10" fontWeight="700">
                  σ_VM = {calcResults.vonMisesMax.toFixed(1)} MPa ({calcResults.vonMisesRatio}%)
                </text>
              </g>
              <text x={peakVMSvgX} y={vmBaselineY + 14} fill="#88929b" fontFamily="JetBrains Mono" fontSize="9" textAnchor="middle">
                x = {calcResults.vonMisesMaxX.toFixed(2)}m
              </text>
            </svg>
          </div>
        </div>
      </section>

      {/* Detailed Section Specs & Von Mises Technical Breakdown & Engineering Action Controls */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Profile Geometric Properties Card */}
        <div className="bg-[#181c24] border border-[#3e4850] rounded p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-[#3e4850]/60 mb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#89ceff] text-xl">view_column</span>
              <span className="font-headline font-semibold text-[#dfe2ee]">
                Propriedades ({profile.designation})
              </span>
            </div>
            <span className="font-mono text-[10px] text-[#bec8d2]">
              fy = {steelGrade.fy} MPa
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 font-mono text-xs">
            <div className="bg-[#1c2028] p-2 rounded border border-[#3e4850]/40">
              <span className="text-[#88929b] block text-[10px]">Altura (d)</span>
              <span className="text-[#dfe2ee] font-semibold">{profile.depth_d} mm</span>
            </div>
            <div className="bg-[#1c2028] p-2 rounded border border-[#3e4850]/40">
              <span className="text-[#88929b] block text-[10px]">Largura Mesa (bf)</span>
              <span className="text-[#dfe2ee] font-semibold">{profile.flangeWidth_bf} mm</span>
            </div>
            <div className="bg-[#1c2028] p-2 rounded border border-[#3e4850]/40">
              <span className="text-[#88929b] block text-[10px]">Inércia X (Ix)</span>
              <span className="text-[#dfe2ee] font-semibold">{profile.inertia_Ix.toLocaleString()} cm⁴</span>
            </div>
            <div className="bg-[#1c2028] p-2 rounded border border-[#3e4850]/40">
              <span className="text-[#88929b] block text-[10px]">Mód. Elástico (Wx)</span>
              <span className="text-[#dfe2ee] font-semibold">{profile.elasticModulus_Wx} cm³</span>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 font-mono text-[10px] text-[#bec8d2]">
            <span className="flex items-center gap-1 text-[#4edea3]">
              <span className="material-symbols-outlined text-sm">check_circle</span> Mesa Compacta
            </span>
            <span className="text-[#88929b]">•</span>
            <span className="flex items-center gap-1 text-[#4edea3]">
              <span className="material-symbols-outlined text-sm">check_circle</span> Alma Compacta
            </span>
          </div>
        </div>

        {/* Card: Detalhamento de Tensões e Von Mises */}
        <div className="bg-[#181c24] border border-[#3e4850] rounded p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-[#3e4850]/60 mb-3">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#c084fc] text-xl">speed</span>
              <span className="font-headline font-semibold text-[#dfe2ee]">
                Critério de Von Mises
              </span>
            </div>
            <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold border ${
              !hasLoads
                ? 'bg-[#262a33] text-[#88929b] border-[#3e4850]'
                : calcResults.vonMisesRatio <= 100
                ? 'bg-[#00b17b]/15 text-[#4edea3] border-[#00b17b]/30'
                : 'bg-[#93000a]/20 text-[#ffb4ab] border-[#93000a]'
            }`}>
              {!hasLoads ? '—' : calcResults.vonMisesRatio <= 100 ? 'CONFORME' : 'NÃO CONFORME'}
            </span>
          </div>

          <div className="space-y-2 font-mono text-xs">
            <div className="bg-[#1c2028] p-2 rounded border border-[#3e4850]/40 flex justify-between items-center">
              <span className="text-[#bec8d2] text-[11px]">Tensão Normal Máx (σ):</span>
              <span className="text-[#89ceff] font-bold">{calcResults.normalStressMax.toFixed(1)} MPa</span>
            </div>
            <div className="bg-[#1c2028] p-2 rounded border border-[#3e4850]/40 flex justify-between items-center">
              <span className="text-[#bec8d2] text-[11px]">Tensão Cisalhante Máx (τ):</span>
              <span className="text-[#4edea3] font-bold">{calcResults.shearStressMax.toFixed(1)} MPa</span>
            </div>
            <div className="bg-[#1c2028] p-2 rounded border border-[#3e4850]/40 flex justify-between items-center">
              <span className="text-[#bec8d2] text-[11px]">Tensão Equiv. Von Mises (σ_VM):</span>
              <span className="text-[#c084fc] font-bold text-sm">{calcResults.vonMisesMax.toFixed(1)} MPa</span>
            </div>
            <div className="bg-[#1c2028] p-2 rounded border border-[#3e4850]/40 flex justify-between items-center">
              <span className="text-[#bec8d2] text-[11px]">Tensão Admissível (fyd):</span>
              <span className="text-[#ffb95f] font-bold">{calcResults.allowableStress_fyd.toFixed(1)} MPa</span>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-[#3e4850]/60 flex items-center justify-between font-mono text-[10px]">
            <span className="text-[#88929b]">Fórmula: σ_VM = √(σ² + 3τ²)</span>
            <span className="text-[#c084fc] font-semibold">
              CS = {calcResults.vonMisesMax > 0 ? (calcResults.allowableStress_fyd / calcResults.vonMisesMax).toFixed(2) : '∞'}x
            </span>
          </div>
        </div>

        {/* Action Deck */}
        <div className="bg-[#181c24] border border-[#3e4850] rounded p-4 flex flex-col justify-between space-y-3">
          <div>
            <span className="font-mono text-xs text-[#bec8d2] font-semibold uppercase tracking-wider block mb-1">
              Ações de Engenharia
            </span>
            <p className="text-xs text-[#88929b]">Gere o documento final auditável ou otimize o consumo de aço.</p>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={onOpenMemorial}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded bg-[#0ea5e9] hover:bg-[#89ceff] text-[#001e2f] font-mono text-xs font-bold transition-all active:scale-[0.98] shadow"
            >
              <span className="material-symbols-outlined text-xl">picture_as_pdf</span>
              <span>Exportar Memorial de Cálculo PDF</span>
            </button>
            <button
              type="button"
              onClick={onOptimizeProfile}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded bg-[#262a33] hover:bg-[#31353e] text-[#dfe2ee] border border-[#3e4850] font-mono text-xs transition-colors active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[#89ceff] text-lg">auto_fix_high</span>
              <span>Otimizar Perfil (Economia de Aço)</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
