import React, { useState } from 'react';
import { CalculationResults, LoadItem, SupportPositions, SupportType } from '../types';
import {
  convertDistLoad,
  convertDistance,
  convertMomentLoad,
  convertPointLoad,
  DIST_LOAD_UNITS,
  DISTANCE_UNITS,
  DistanceUnit,
  DistLoadUnit,
  MOMENT_LOAD_UNITS,
  MomentLoadUnit,
  POINT_LOAD_UNITS,
  PointLoadUnit,
} from '../utils/units';

interface LoadingViewProps {
  spanLength: number;
  supportType: SupportType;
  supportPositions: SupportPositions;
  loads: LoadItem[];
  calcResults: CalculationResults;
  onUpdateSpan: (span: number) => void;
  onUpdateSupportType: (type: SupportType) => void;
  onUpdateSupportPositions: (positions: SupportPositions) => void;
  onAddLoad: (load: LoadItem) => void;
  onRemoveLoad: (id: string) => void;
  onUpdateLoad: (load: LoadItem) => void;
  onAdvanceToProfiles: () => void;
}

export const LoadingView: React.FC<LoadingViewProps> = ({
  spanLength,
  supportType,
  supportPositions,
  loads,
  calcResults,
  onUpdateSpan,
  onUpdateSupportType,
  onUpdateSupportPositions,
  onAddLoad,
  onRemoveLoad,
  onUpdateLoad,
  onAdvanceToProfiles,
}) => {
  // Modal & Load Selection State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLoadId, setEditingLoadId] = useState<string | null>(null);
  const [loadTypeToAdd, setLoadTypeToAdd] = useState<'distributed' | 'point' | 'moment'>('point');
  const [loadName, setLoadName] = useState('');
  
  // Value & Unit states for the active modal
  const [inputVal, setInputVal] = useState<number>(20.0);
  const [inputPos, setInputPos] = useState<number>(spanLength / 2);
  const [inputLen, setInputLen] = useState<number>(spanLength);

  // Selected units in the modal
  const [selectedDistUnit, setSelectedDistUnit] = useState<DistanceUnit>('m');
  const [selectedPointUnit, setSelectedPointUnit] = useState<PointLoadUnit>('kN');
  const [selectedDistLoadUnit, setSelectedDistLoadUnit] = useState<DistLoadUnit>('kN/m');
  const [selectedMomentUnit, setSelectedMomentUnit] = useState<MomentLoadUnit>('kN.m');

  // Computed positions
  const posA = Math.max(0, Math.min(supportPositions.posA, spanLength - 0.2));
  const posB = Math.max(posA + 0.2, Math.min(supportPositions.posB, spanLength));

  // Stepper functions for span
  const incrementSpan = () => {
    const next = Math.min(Number((spanLength + 0.25).toFixed(2)), 30.0);
    onUpdateSpan(next);
  };

  const decrementSpan = () => {
    const next = Math.max(Number((spanLength - 0.25).toFixed(2)), 1.0);
    onUpdateSpan(next);
  };

  // Open modal for NEW load
  const handleOpenAddModal = (type: 'distributed' | 'point' | 'moment') => {
    setEditingLoadId(null);
    setLoadTypeToAdd(type);
    setSelectedDistUnit('m');

    if (type === 'distributed') {
      setSelectedDistLoadUnit('kN/m');
      setLoadName('Sobrecarga Distribuída');
      setInputVal(12.5);
      setInputPos(0);
      setInputLen(spanLength);
    } else if (type === 'point') {
      setSelectedPointUnit('kN');
      setLoadName('Carga Concentrada');
      setInputVal(25.0);
      setInputPos(Number(((posA + posB) / 2).toFixed(2)));
    } else {
      setSelectedMomentUnit('kN.m');
      setLoadName('Momento Fletor Local');
      setInputVal(15.0);
      setInputPos(Number(((posA + posB) / 2).toFixed(2)));
    }
    setModalOpen(true);
  };

  // Open modal for EDITING existing load
  const handleOpenEditModal = (load: LoadItem) => {
    setEditingLoadId(load.id);
    setLoadTypeToAdd(load.type);
    setLoadName(load.name);
    setSelectedDistUnit('m');

    if (load.type === 'distributed') {
      setSelectedDistLoadUnit((load.preferredLoadUnit as DistLoadUnit) || 'kN/m');
      const unit = (load.preferredLoadUnit as DistLoadUnit) || 'kN/m';
      const userVal = convertDistLoad(load.value, 'kN/m', unit);
      setInputVal(Number(userVal.toFixed(2)));
      setInputPos(load.positionX);
      setInputLen(load.length ?? spanLength);
    } else if (load.type === 'point') {
      setSelectedPointUnit((load.preferredLoadUnit as PointLoadUnit) || 'kN');
      const unit = (load.preferredLoadUnit as PointLoadUnit) || 'kN';
      const userVal = convertPointLoad(load.value, 'kN', unit);
      setInputVal(Number(userVal.toFixed(2)));
      setInputPos(load.positionX);
    } else {
      setSelectedMomentUnit((load.preferredLoadUnit as MomentLoadUnit) || 'kN.m');
      const unit = (load.preferredLoadUnit as MomentLoadUnit) || 'kN.m';
      const userVal = convertMomentLoad(load.value, 'kN.m', unit);
      setInputVal(Number(userVal.toFixed(2)));
      setInputPos(load.positionX);
    }
    setModalOpen(true);
  };

  // Save (Add or Update)
  const handleSaveLoad = () => {
    // Convert distance from selectedDistUnit back to SI (meters)
    const posInMeters = Math.min(convertDistance(inputPos, selectedDistUnit, 'm'), spanLength);
    const lenInMeters = loadTypeToAdd === 'distributed'
      ? Math.min(convertDistance(inputLen, selectedDistUnit, 'm'), spanLength - posInMeters)
      : undefined;

    // Convert force from selected force unit back to SI (kN or kN/m or kN.m)
    let valInSI = inputVal;
    let prefUnit = 'kN';
    if (loadTypeToAdd === 'distributed') {
      valInSI = convertDistLoad(inputVal, selectedDistLoadUnit, 'kN/m');
      prefUnit = selectedDistLoadUnit;
    } else if (loadTypeToAdd === 'point') {
      valInSI = convertPointLoad(inputVal, selectedPointUnit, 'kN');
      prefUnit = selectedPointUnit;
    } else {
      valInSI = convertMomentLoad(inputVal, selectedMomentUnit, 'kN.m');
      prefUnit = selectedMomentUnit;
    }

    if (editingLoadId) {
      const existing = loads.find((l) => l.id === editingLoadId);
      if (existing) {
        onUpdateLoad({
          ...existing,
          name: loadName || existing.name,
          value: Number(valInSI.toFixed(4)),
          positionX: Number(posInMeters.toFixed(3)),
          length: lenInMeters ? Number(lenInMeters.toFixed(3)) : undefined,
          preferredLoadUnit: prefUnit,
          preferredDistUnit: selectedDistUnit,
        });
      }
    } else {
      const newItem: LoadItem = {
        id: `load-${Date.now()}`,
        type: loadTypeToAdd,
        name: loadName || (loadTypeToAdd === 'distributed' ? 'Carga Distribuída' : 'Carga Pontual'),
        value: Number(valInSI.toFixed(4)),
        positionX: Number(posInMeters.toFixed(3)),
        length: lenInMeters ? Number(lenInMeters.toFixed(3)) : undefined,
        direction: '-Y',
        gammaF: 1.4,
        preferredLoadUnit: prefUnit,
        preferredDistUnit: selectedDistUnit,
      };
      onAddLoad(newItem);
    }

    setModalOpen(false);
  };

  // Support position updates
  const updatePosA = (newA: number) => {
    const clampedA = Math.max(0, Math.min(newA, posB - 0.2));
    onUpdateSupportPositions({
      ...supportPositions,
      posA: Number(clampedA.toFixed(2)),
    });
  };

  const updatePosB = (newB: number) => {
    const clampedB = Math.max(posA + 0.2, Math.min(newB, spanLength));
    onUpdateSupportPositions({
      ...supportPositions,
      posB: Number(clampedB.toFixed(2)),
    });
  };

  // Visual SVG mapping
  const svgLeft = 90;
  const svgRight = 630;
  const svgWidth = svgRight - svgLeft; // 540
  const beamY = 110;

  const getSvgX = (x_m: number) => {
    const ratio = Math.max(0, Math.min(x_m / spanLength, 1));
    return svgLeft + ratio * svgWidth;
  };

  const svgPosA = getSvgX(posA);
  const svgPosB = getSvgX(posB);

  const distLoads = loads.filter((l) => l.type === 'distributed');
  const pointLoads = loads.filter((l) => l.type === 'point');
  const momentLoads = loads.filter((l) => l.type === 'moment');

  const hasLeftCantilever = posA > 0.05;
  const hasRightCantilever = posB < spanLength - 0.05;

  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-4">
      {/* Top Header & Geometry / Support Configuration Panel */}
      <section className="bg-[#181c24] border border-[#3e4850] rounded-lg p-3 sm:p-4 space-y-3 shadow-md">
        {/* Header Bar: Title */}
        <div className="flex items-center space-x-2 border-b border-[#3e4850]/60 pb-2.5">
          <span className="material-symbols-outlined text-[#89ceff] text-lg">straighten</span>
          <h2 className="font-headline text-xs sm:text-sm font-bold text-[#dfe2ee] tracking-wide uppercase">
            Geometria do Vão e Posicionamento dos Apoios
          </h2>
        </div>

        {/* 3 Columns: Caixa Apoio A | Caixa Apoio B | Caixa VÃO TOTAL DA VIGA (L) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Caixa Apoio A */}
          <div className="bg-[#12161f] border border-[#3e4850] rounded-lg p-3 space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[#89ceff] flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#89ceff] inline-block shadow-sm"></span>
                  Apoio A (Esquerdo)
                </span>
                <span className="font-mono text-[10px] text-[#88929b]">RA = {calcResults.reactionA.toFixed(1)} kN</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <label className="font-mono text-[11px] text-[#bec8d2]">x_A =</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max={posB - 0.2}
                  value={posA}
                  onChange={(e) => updatePosA(parseFloat(e.target.value) || 0)}
                  className="w-24 bg-[#0a0e16] border border-[#3e4850] rounded px-2.5 py-1 font-mono text-xs text-[#89ceff] font-bold focus:border-[#89ceff] focus:outline-none"
                />
                <span className="font-mono text-xs text-[#88929b]">m</span>
                {hasLeftCantilever ? (
                  <span className="font-mono text-[10px] text-[#ffb95f] ml-auto">
                    ↳ Balanço: {posA.toFixed(2)}m
                  </span>
                ) : (
                  <span className="font-mono text-[10px] text-[#88929b] ml-auto">
                    Extremidade (0m)
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-1 pt-1 font-mono text-[10px]">
              <button
                type="button"
                onClick={() => updatePosA(0)}
                className={`px-2 py-0.5 rounded border transition-colors ${
                  posA === 0 ? 'bg-[#89ceff]/20 border-[#89ceff] text-[#89ceff] font-bold' : 'bg-[#0a0e16] border-[#3e4850] text-[#88929b] hover:text-[#dfe2ee]'
                }`}
              >
                Extremidade (0m)
              </button>
              <button
                type="button"
                onClick={() => updatePosA(0.5)}
                className="px-2 py-0.5 rounded bg-[#0a0e16] border border-[#3e4850] text-[#88929b] hover:text-[#dfe2ee]"
              >
                +0.50m
              </button>
              <button
                type="button"
                onClick={() => updatePosA(1.0)}
                className="px-2 py-0.5 rounded bg-[#0a0e16] border border-[#3e4850] text-[#88929b] hover:text-[#dfe2ee]"
              >
                +1.00m
              </button>
            </div>
          </div>

          {/* Caixa Apoio B */}
          <div className="bg-[#12161f] border border-[#3e4850] rounded-lg p-3 space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[#89ceff] flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#89ceff] inline-block shadow-sm"></span>
                  Apoio B (Direito)
                </span>
                <span className="font-mono text-[10px] text-[#88929b]">RB = {calcResults.reactionB.toFixed(1)} kN</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <label className="font-mono text-[11px] text-[#bec8d2]">x_B =</label>
                <input
                  type="number"
                  step="0.1"
                  min={posA + 0.2}
                  max={spanLength}
                  value={posB}
                  onChange={(e) => updatePosB(parseFloat(e.target.value) || spanLength)}
                  className="w-24 bg-[#0a0e16] border border-[#3e4850] rounded px-2.5 py-1 font-mono text-xs text-[#89ceff] font-bold focus:border-[#89ceff] focus:outline-none"
                />
                <span className="font-mono text-xs text-[#88929b]">m</span>
                {hasRightCantilever ? (
                  <span className="font-mono text-[10px] text-[#ffb95f] ml-auto">
                    ↳ Balanço: {(spanLength - posB).toFixed(2)}m
                  </span>
                ) : (
                  <span className="font-mono text-[10px] text-[#88929b] ml-auto">
                    Extremidade (L)
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-1 pt-1 font-mono text-[10px]">
              <button
                type="button"
                onClick={() => updatePosB(spanLength)}
                className={`px-2 py-0.5 rounded border transition-colors ${
                  posB === spanLength ? 'bg-[#89ceff]/20 border-[#89ceff] text-[#89ceff] font-bold' : 'bg-[#0a0e16] border-[#3e4850] text-[#88929b] hover:text-[#dfe2ee]'
                }`}
              >
                Extremidade (L)
              </button>
              <button
                type="button"
                onClick={() => updatePosB(spanLength - 0.5)}
                className="px-2 py-0.5 rounded bg-[#0a0e16] border border-[#3e4850] text-[#88929b] hover:text-[#dfe2ee]"
              >
                -0.50m
              </button>
              <button
                type="button"
                onClick={() => updatePosB(spanLength - 1.0)}
                className="px-2 py-0.5 rounded bg-[#0a0e16] border border-[#3e4850] text-[#88929b] hover:text-[#dfe2ee]"
              >
                -1.00m
              </button>
            </div>
          </div>

          {/* Caixa VÃO TOTAL DA VIGA (L) */}
          <div className="bg-[#12161f] border border-[#3e4850] rounded-lg p-3 space-y-2 flex flex-col justify-between justify-self-end sm:col-start-3 sm:ml-auto w-full">
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-[#4edea3] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[15px]">straighten</span>
                  VÃO TOTAL DA VIGA (L)
                </span>
                <span className="font-mono text-[10px] text-[#88929b]">
                  ({(spanLength * 100).toFixed(0)} cm)
                </span>
              </div>
              <div className="flex items-center space-x-1.5 mt-2">
                <button
                  type="button"
                  onClick={decrementSpan}
                  className="w-7 h-7 bg-[#262a33] hover:bg-[#31353e] text-[#dfe2ee] rounded flex items-center justify-center font-bold border border-[#3e4850] transition-colors"
                  title="Diminuir vão em 0.25m"
                >
                  -
                </button>
                <div className="flex items-center bg-[#0a0e16] border border-[#3e4850] px-2.5 py-1 rounded flex-1">
                  <input
                    type="number"
                    step="0.25"
                    min="0.5"
                    max="30"
                    value={spanLength}
                    onChange={(e) => onUpdateSpan(Math.max(0.5, parseFloat(e.target.value) || 6.0))}
                    className="w-16 bg-transparent border-0 p-0 font-mono text-xs font-bold text-[#89ceff] focus:outline-none"
                  />
                  <span className="font-mono text-xs text-[#88929b] ml-1">m</span>
                  <span className="font-mono text-[10px] text-[#4edea3] ml-auto font-medium">
                    L_AB: {(posB - posA).toFixed(2)}m
                  </span>
                </div>
                <button
                  type="button"
                  onClick={incrementSpan}
                  className="w-7 h-7 bg-[#262a33] hover:bg-[#31353e] text-[#dfe2ee] rounded flex items-center justify-center font-bold border border-[#3e4850] transition-colors"
                  title="Aumentar vão em 0.25m"
                >
                  +
                </button>
              </div>
            </div>
            <div className="pt-1.5 border-t border-[#3e4850]/40 flex items-center justify-between font-mono text-[10px]">
              <button
                type="button"
                onClick={() => {
                  updatePosA(0);
                  updatePosB(spanLength);
                }}
                className="text-[#89ceff] hover:underline"
              >
                Resetar apoios nos extremos (0 - L)
              </button>
              <span className="text-[#88929b]">
                {posA === 0 && posB === spanLength ? 'Apoios nos extremos' : `${(((posB - posA) / spanLength) * 100).toFixed(0)}% vão livre`}
              </span>
            </div>
          </div>
        </div>

        {/* Rodapé informativo */}
        <div className="pt-1 border-t border-[#3e4850]/40 flex flex-wrap items-center justify-between font-mono text-[11px] gap-2">
          <div className="flex items-center gap-2 text-[#bec8d2]">
            <span>Vão livre entre eixos dos apoios (L_AB):</span>
            <strong className="text-[#4edea3]">{(posB - posA).toFixed(2)}m</strong>
            <span className="text-[#88929b]">({(((posB - posA) / spanLength) * 100).toFixed(0)}% do vão total)</span>
          </div>
          <button
            type="button"
            onClick={() => {
              updatePosA(0);
              updatePosB(spanLength);
            }}
            className="text-[#89ceff] hover:underline text-[10px]"
          >
            Resetar apoios nos extremos (0m - L)
          </button>
        </div>
      </section>

      {/* Main CAD Viewport Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left / Center CAD Visualizer (8 cols) */}
        <div className="lg:col-span-8 flex flex-col space-y-3">
          <div className="bg-[#14171f] border border-[#3e4850] rounded-lg p-3 sm:p-5 relative overflow-hidden flex flex-col min-h-[380px] justify-between">
            {/* Viewport Meta Overlays */}
            <div className="flex items-center justify-between font-mono text-[10px] text-[#88929b] select-none border-b border-[#3e4850]/50 pb-2">
              <div className="flex items-center space-x-2">
                <span className="material-symbols-outlined text-sm text-[#89ceff]">grid_on</span>
                <span>MODELO ESTRUTURAL DE VIGA METÁLICA</span>
                <span className="text-[#3e4850]">|</span>
                <span>ESCALA 1:50 [m]</span>
              </div>
              <div className="flex items-center space-x-2">
                {loads.length === 0 && (
                  <span className="px-2 py-0.5 rounded bg-[#262a33]/90 text-[#88929b] border border-[#3e4850]">
                    Sem cargas no vão
                  </span>
                )}
                {loads.length > 0 && (
                  <span className="px-2 py-0.5 rounded bg-[#262a33]/90 text-[#4edea3] border border-[#3e4850]">
                    {loads.length} {loads.length === 1 ? 'carga ativa' : 'cargas ativas'}
                  </span>
                )}
              </div>
            </div>

            {/* Interactive SVG CAD Stage */}
            <div className="w-full flex-1 flex items-center justify-center p-2 sm:p-4 mt-6 mb-2">
              <svg className="w-full max-w-3xl h-auto select-none overflow-visible" viewBox="0 0 720 230">
                <defs>
                  <marker id="arrow-dist" markerHeight="6" markerWidth="6" orient="auto" refX="3" refY="5">
                    <path d="M0,0 L3,5 L6,0 Z" fill="#0ea5e9" />
                  </marker>
                  <marker id="arrow-point" markerHeight="8" markerWidth="8" orient="auto" refX="4" refY="7">
                    <path d="M0,0 L4,7 L8,0 Z" fill="#ffb95f" />
                  </marker>
                  <linearGradient id="distLoadGrad" x1="0%" x2="0%" y1="0%" y2="100%">
                    <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.04" />
                  </linearGradient>
                </defs>

                {/* Distributed loads render */}
                {distLoads.map((d) => {
                  const x1 = getSvgX(d.positionX);
                  const len_m = d.length ?? spanLength - d.positionX;
                  const x2 = getSvgX(d.positionX + len_m);
                  const w = Math.max(x2 - x1, 10);
                  const arrowCount = Math.max(Math.floor(w / 45), 3);
                  const arrowStep = w / (arrowCount + 1);

                  return (
                    <g
                      key={d.id}
                      className="cursor-pointer hover:opacity-90"
                      onClick={() => handleOpenEditModal(d)}
                    >
                      <rect
                        x={x1}
                        y={45}
                        width={w}
                        height={65}
                        fill="url(#distLoadGrad)"
                        stroke="#0ea5e9"
                        strokeWidth="1.2"
                        strokeDasharray="3 3"
                      />
                      <line x1={x1} x2={x2} y1={45} y2={45} stroke="#0ea5e9" strokeWidth="1.75" />
                      <g stroke="#0ea5e9" strokeWidth="1.2">
                        {Array.from({ length: arrowCount }).map((_, idx) => (
                          <line
                            key={idx}
                            x1={x1 + (idx + 1) * arrowStep}
                            x2={x1 + (idx + 1) * arrowStep}
                            y1={45}
                            y2={105}
                            markerEnd="url(#arrow-dist)"
                          />
                        ))}
                      </g>
                      {/* Text Badge */}
                      <g transform={`translate(${x1 + w / 2}, 38)`}>
                        <rect x={-58} y={-12} width={116} height={18} rx={2} fill="#181c24" stroke="#0ea5e9" strokeWidth="0.8" />
                        <text x={0} y={1} fill="#89ceff" fontFamily="JetBrains Mono" fontSize="10" fontWeight="600" textAnchor="middle">
                          q = {d.value.toFixed(1)} kN/m
                        </text>
                      </g>
                    </g>
                  );
                })}

                {/* Point loads render */}
                {pointLoads.map((p) => {
                  const px = getSvgX(p.positionX);
                  return (
                    <g
                      key={p.id}
                      className="cursor-pointer hover:opacity-90"
                      onClick={() => handleOpenEditModal(p)}
                    >
                      <line x1={px} x2={px} y1={12} y2={110} stroke="#ffb95f" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
                      <line x1={px} x2={px} y1={18} y2={106} stroke="#ffb95f" strokeWidth="2.75" markerEnd="url(#arrow-point)" />
                      <g transform={`translate(${px}, 10)`}>
                        <rect x={-46} y={-14} width={92} height={20} rx={3} fill="#1e293b" stroke="#ffb95f" strokeWidth="1.2" />
                        <text x={0} y={0} fill="#ffb95f" fontFamily="JetBrains Mono" fontSize="11" fontWeight="700" textAnchor="middle">
                          P = {p.value.toFixed(1)} kN
                        </text>
                      </g>
                      <circle cx={px} cy={110} r={3.5} fill="#ffb95f" />
                    </g>
                  );
                })}

                {/* Moment loads render */}
                {momentLoads.map((m) => {
                  const mx = getSvgX(m.positionX);
                  return (
                    <g
                      key={m.id}
                      className="cursor-pointer hover:opacity-90"
                      onClick={() => handleOpenEditModal(m)}
                    >
                      <circle cx={mx} cy={beamY} r={14} fill="none" stroke="#a78bfa" strokeWidth="2" strokeDasharray="20 4" />
                      <g transform={`translate(${mx}, ${beamY - 24})`}>
                        <rect x={-45} y={-10} width={90} height={18} rx={2} fill="#1e293b" stroke="#a78bfa" strokeWidth="1" />
                        <text x={0} y={3} fill="#c4b5fd" fontFamily="JetBrains Mono" fontSize="10" fontWeight="700" textAnchor="middle">
                          M = {m.value.toFixed(1)} kN.m
                        </text>
                      </g>
                    </g>
                  );
                })}

                {/* Empty loads state indicator in SVG */}
                {loads.length === 0 && (
                  <g transform={`translate(${(svgLeft + svgRight) / 2}, 62)`}>
                    <rect x={-130} y={-14} width={260} height={28} rx={4} fill="#181c24" fillOpacity="0.85" stroke="#3e4850" strokeWidth="1" strokeDasharray="3 3" />
                    <text x={0} y={4} fill="#88929b" fontFamily="JetBrains Mono" fontSize="10" fontWeight="500" textAnchor="middle">
                      Vão livre sem cargas aplicadas
                    </text>
                  </g>
                )}

                {/* VIGA PRINCIPAL (BARRA HORIZONTAL) */}
                <line x1={svgLeft} x2={svgRight} y1={beamY} y2={beamY} stroke="#0a0e16" strokeWidth="12" strokeLinecap="round" />
                <line x1={svgLeft} x2={svgRight} y1={beamY} y2={beamY} stroke="#89ceff" strokeWidth="6" strokeLinecap="square" />
                <line x1={svgLeft - 2} x2={svgRight + 2} y1={beamY} y2={beamY} stroke="#ffffff" strokeWidth="1" strokeDasharray="8 3" opacity="0.8" />

                {/* APOIO A (POSICIONADO EM posA) */}
                {supportType === 'biapoiada' ? (
                  <g transform={`translate(${svgPosA}, ${beamY})`}>
                    <circle cx={0} cy={0} r={4.5} fill="#0f131c" stroke="#89ceff" strokeWidth="2" />
                    <polygon points="0,3 -16,25 16,25" fill="#181c24" stroke="#89ceff" strokeWidth="1.5" />
                    <line x1={-22} x2={22} y1={25} y2={25} stroke="#88929b" strokeWidth="2" />
                    {[-18, -10, -2, 6, 14, 22].map((hx) => (
                      <line key={hx} x1={hx} x2={hx - 5} y1={25} y2={32} stroke="#88929b" strokeWidth="1.2" />
                    ))}
                    <text x={-26} y={16} fill="#89ceff" fontFamily="Space Grotesk" fontSize="12" fontWeight="700">A</text>
                  </g>
                ) : supportType === 'cantilever' ? (
                  <g transform={`translate(${svgPosA}, ${beamY})`}>
                    <line x1={0} x2={0} y1={-25} y2={25} stroke="#88929b" strokeWidth="3" />
                    {[-20, -12, -4, 4, 12, 20].map((hy) => (
                      <line key={hy} x1={0} x2={-8} y1={hy} y2={hy + 6} stroke="#88929b" strokeWidth="1.2" />
                    ))}
                    <text x={-20} y={-8} fill="#89ceff" fontFamily="Space Grotesk" fontSize="12" fontWeight="700">A</text>
                  </g>
                ) : (
                  <g transform={`translate(${svgPosA}, ${beamY})`}>
                    <line x1={0} x2={0} y1={-25} y2={25} stroke="#88929b" strokeWidth="3" />
                    {[-20, -12, -4, 4, 12, 20].map((hy) => (
                      <line key={hy} x1={0} x2={-8} y1={hy} y2={hy + 6} stroke="#88929b" strokeWidth="1.2" />
                    ))}
                    <text x={-20} y={-8} fill="#89ceff" fontFamily="Space Grotesk" fontSize="12" fontWeight="700">A</text>
                  </g>
                )}

                {/* APOIO B (POSICIONADO EM posB) */}
                {supportType === 'biapoiada' ? (
                  <g transform={`translate(${svgPosB}, ${beamY})`}>
                    <circle cx={0} cy={0} r={4.5} fill="#0f131c" stroke="#89ceff" strokeWidth="2" />
                    <polygon points="0,3 -16,21 16,21" fill="#181c24" stroke="#89ceff" strokeWidth="1.5" />
                    <circle cx={-7} cy={25} r={3.5} fill="#1e293b" stroke="#89ceff" strokeWidth="1.2" />
                    <circle cx={7} cy={25} r={3.5} fill="#1e293b" stroke="#89ceff" strokeWidth="1.2" />
                    <line x1={-22} x2={22} y1={30} y2={30} stroke="#88929b" strokeWidth="2" />
                    {[-18, -10, -2, 6, 14, 22].map((hx) => (
                      <line key={hx} x1={hx} x2={hx - 5} y1={30} y2={37} stroke="#88929b" strokeWidth="1.2" />
                    ))}
                    <text x={24} y={16} fill="#89ceff" fontFamily="Space Grotesk" fontSize="12" fontWeight="700">B</text>
                  </g>
                ) : supportType === 'biengastada' ? (
                  <g transform={`translate(${svgPosB}, ${beamY})`}>
                    <line x1={0} x2={0} y1={-25} y2={25} stroke="#88929b" strokeWidth="3" />
                    {[-20, -12, -4, 4, 12, 20].map((hy) => (
                      <line key={hy} x1={0} x2={8} y1={hy} y2={hy + 6} stroke="#88929b" strokeWidth="1.2" />
                    ))}
                    <text x={18} y={-8} fill="#89ceff" fontFamily="Space Grotesk" fontSize="12" fontWeight="700">B</text>
                  </g>
                ) : null}

                {/* COTAS & DIMENSIONAMENTO DINÂMICO */}
                {/* Linha guia dos extremos da viga */}
                <line x1={svgLeft} x2={svgLeft} y1={148} y2={218} stroke="#3e4850" strokeWidth="1" strokeDasharray="2 2" />
                <line x1={svgRight} x2={svgRight} y1={148} y2={218} stroke="#3e4850" strokeWidth="1" strokeDasharray="2 2" />

                {/* Cota do Balanço Esquerdo (se xA > 0) */}
                {hasLeftCantilever && (
                  <g>
                    <line x1={svgPosA} x2={svgPosA} y1={148} y2={180} stroke="#3e4850" strokeWidth="1" strokeDasharray="2 2" />
                    <line x1={svgLeft + 1} x2={svgPosA - 1} y1={165} y2={165} stroke="#ffb95f" strokeWidth="1" />
                    <rect x={(svgLeft + svgPosA) / 2 - 25} y={157} width={50} height={16} fill="#0f131c" />
                    <text x={(svgLeft + svgPosA) / 2} y={169} fill="#ffb95f" fontFamily="JetBrains Mono" fontSize="9" fontWeight="600" textAnchor="middle">
                      {posA.toFixed(2)}m
                    </text>
                  </g>
                )}

                {/* Cota do Vão Central entre Apoios */}
                <g>
                  <line x1={svgPosA + 1} x2={svgPosB - 1} y1={165} y2={165} stroke="#89ceff" strokeWidth="1.2" />
                  <rect x={(svgPosA + svgPosB) / 2 - 35} y={156} width={70} height={18} fill="#0f131c" stroke="#3e4850" strokeWidth="0.8" rx={2} />
                  <text x={(svgPosA + svgPosB) / 2} y={169} fill="#89ceff" fontFamily="JetBrains Mono" fontSize="10" fontWeight="700" textAnchor="middle">
                    L_vão = {(posB - posA).toFixed(2)}m
                  </text>
                </g>

                {/* Cota do Balanço Direito (se xB < L) */}
                {hasRightCantilever && (
                  <g>
                    <line x1={svgPosB} x2={svgPosB} y1={148} y2={180} stroke="#3e4850" strokeWidth="1" strokeDasharray="2 2" />
                    <line x1={svgPosB + 1} x2={svgRight - 1} y1={165} y2={165} stroke="#ffb95f" strokeWidth="1" />
                    <rect x={(svgPosB + svgRight) / 2 - 25} y={157} width={50} height={16} fill="#0f131c" />
                    <text x={(svgPosB + svgRight) / 2} y={169} fill="#ffb95f" fontFamily="JetBrains Mono" fontSize="9" fontWeight="600" textAnchor="middle">
                      {(spanLength - posB).toFixed(2)}m
                    </text>
                  </g>
                )}

                {/* Cota Total L */}
                <line x1={svgLeft} x2={svgRight} y1={198} y2={198} stroke="#88929b" strokeWidth="1" />
                <rect x={(svgLeft + svgRight) / 2 - 30} y={190} width={60} height={16} fill="#0f131c" />
                <text x={(svgLeft + svgRight) / 2} y={202} fill="#dfe2ee" fontFamily="JetBrains Mono" fontSize="10" fontWeight="700" textAnchor="middle">
                  L = {spanLength.toFixed(2)}m
                </text>
              </svg>
            </div>

            {/* Bottom Support Reaction Telemetry Blocks */}
            <div className="pt-2 border-t border-[#3e4850]/60 grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[11px]">
              <div className="bg-[#0a0e16] p-2 rounded border border-[#3e4850]/50">
                <span className="text-[#88929b] block text-[9px]">REAÇÃO NO APOIO A</span>
                <span className="text-[#89ceff] font-bold text-sm">
                  {calcResults.reactionA.toFixed(2)} kN
                </span>
                <span className="text-[10px] text-[#88929b] ml-1">
                  ({(calcResults.reactionA / 9.80665).toFixed(2)} tf)
                </span>
              </div>

              <div className="bg-[#0a0e16] p-2 rounded border border-[#3e4850]/50">
                <span className="text-[#88929b] block text-[9px]">REAÇÃO NO APOIO B</span>
                <span className="text-[#89ceff] font-bold text-sm">
                  {calcResults.reactionB.toFixed(2)} kN
                </span>
                <span className="text-[10px] text-[#88929b] ml-1">
                  ({(calcResults.reactionB / 9.80665).toFixed(2)} tf)
                </span>
              </div>

              <div className="bg-[#0a0e16] p-2 rounded border border-[#3e4850]/50">
                <span className="text-[#88929b] block text-[9px]">MOMENTO MÁXIMO (ELU)</span>
                <span className="text-[#ffb95f] font-bold text-sm">
                  {calcResults.maxMoment.toFixed(2)} kN.m
                </span>
              </div>

              <div className="bg-[#0a0e16] p-2 rounded border border-[#3e4850]/50">
                <span className="text-[#88929b] block text-[9px]">CORTANTE MÁXIMO (ELU)</span>
                <span className="text-[#4edea3] font-bold text-sm">
                  {Math.max(Math.abs(calcResults.maxShearPos), Math.abs(calcResults.maxShearNeg)).toFixed(2)} kN
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Tools & Loads Manager (4 cols) */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          {/* Action Toolbar to Add Loads */}
          <section className="bg-[#181c24] border border-[#3e4850] rounded-lg p-3 space-y-2.5">
            <span className="font-mono text-[10px] text-[#88929b] block font-bold">
              ADICIONAR CARREGAMENTOS NO VÃO
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleOpenAddModal('distributed')}
                className="flex flex-col items-center justify-center p-2 rounded bg-[#0a0e16] border border-[#3e4850] hover:border-[#0ea5e9] hover:bg-[#1c2028] transition-colors group text-center"
              >
                <span className="material-symbols-outlined text-[#89ceff] text-xl mb-1 group-hover:scale-110 transition-transform">
                  align_horizontal_left
                </span>
                <span className="font-mono text-[10px] text-[#dfe2ee] font-bold">+ Distribuída</span>
                <span className="font-mono text-[9px] text-[#88929b]">kN/m, tf/m</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenAddModal('point')}
                className="flex flex-col items-center justify-center p-2 rounded bg-[#0a0e16] border border-[#3e4850] hover:border-[#ffb95f] hover:bg-[#1c2028] transition-colors group text-center"
              >
                <span className="material-symbols-outlined text-[#ffb95f] text-xl mb-1 group-hover:scale-110 transition-transform">
                  arrow_downward
                </span>
                <span className="font-mono text-[10px] text-[#dfe2ee] font-bold">+ Pontual</span>
                <span className="font-mono text-[9px] text-[#88929b]">kN, tf, kgf</span>
              </button>

              <button
                type="button"
                onClick={() => handleOpenAddModal('moment')}
                className="flex flex-col items-center justify-center p-2 rounded bg-[#0a0e16] border border-[#3e4850] hover:border-[#a78bfa] hover:bg-[#1c2028] transition-colors group text-center"
              >
                <span className="material-symbols-outlined text-[#c4b5fd] text-xl mb-1 group-hover:scale-110 transition-transform">
                  rotate_right
                </span>
                <span className="font-mono text-[10px] text-[#dfe2ee] font-bold">+ Momento</span>
                <span className="font-mono text-[9px] text-[#88929b]">kN.m, tf.m</span>
              </button>
            </div>
          </section>

          {/* List of Applied Loads with Interactive Unit Conversions */}
          <section className="bg-[#181c24] border border-[#3e4850] rounded-lg p-3 sm:p-4 space-y-3 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[#3e4850] pb-2 mb-2.5">
                <div className="flex items-center space-x-2">
                  <span className="material-symbols-outlined text-base text-[#89ceff]">ballot</span>
                  <h2 className="font-headline text-xs font-bold text-[#dfe2ee]">
                    Cargas Aplicadas no Vão ({loads.length})
                  </h2>
                </div>
                <span className="font-mono text-[10px] text-[#88929b]">Clique para editar/converter</span>
              </div>

              {loads.length === 0 ? (
                <div className="bg-[#1c2028]/60 border border-dashed border-[#3e4850] rounded-lg p-5 flex flex-col items-center justify-center text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-[#262a33] flex items-center justify-center text-[#88929b] border border-[#3e4850]">
                    <span className="material-symbols-outlined text-lg">tune</span>
                  </div>
                  <div>
                    <h3 className="font-headline text-xs font-bold text-[#dfe2ee]">
                      Nenhuma carga aplicada no momento
                    </h3>
                    <p className="text-[11px] font-mono text-[#88929b] max-w-sm mt-0.5">
                      Utilize as ferramentas acima (+ Distribuída, + Pontual ou + Momento) para lançar carregamentos com opção de unidades.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {loads.map((load) => {
                    const tfVal = (load.value / 9.80665).toFixed(2);
                    const kgfVal = (load.value / 0.00980665).toFixed(0);

                    return (
                      <div
                        key={load.id}
                        onClick={() => handleOpenEditModal(load)}
                        className={`bg-[#1c2028] border rounded p-2.5 cursor-pointer flex flex-col justify-between gap-2 transition-colors ${
                          load.type === 'distributed'
                            ? 'border-[#3e4850] hover:border-[#0ea5e9]'
                            : load.type === 'point'
                            ? 'border-[#3e4850] hover:border-[#ffb95f]'
                            : 'border-[#3e4850] hover:border-[#a78bfa]'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`font-mono text-xs font-bold ${
                                load.type === 'distributed'
                                  ? 'text-[#89ceff]'
                                  : load.type === 'point'
                                  ? 'text-[#ffb95f]'
                                  : 'text-[#c4b5fd]'
                              }`}
                            >
                              {load.type === 'distributed' ? 'q = ' : load.type === 'point' ? 'P = ' : 'M = '}
                              {load.value.toFixed(2)} {load.type === 'distributed' ? 'kN/m' : load.type === 'point' ? 'kN' : 'kN.m'}
                            </span>
                            <span className="font-mono text-[10px] text-[#88929b]">
                              ({tfVal} {load.type === 'distributed' ? 'tf/m' : load.type === 'point' ? 'tf' : 'tf.m'})
                            </span>
                          </div>

                          <div className="flex items-center space-x-1" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(load)}
                              className="p-1 rounded hover:bg-[#262a33] text-[#bec8d2] hover:text-[#89ceff]"
                              title="Editar e converter unidades"
                            >
                              <span className="material-symbols-outlined text-sm">edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onRemoveLoad(load.id)}
                              className="p-1 rounded hover:bg-[#262a33] text-[#bec8d2] hover:text-[#ffb4ab]"
                              title="Excluir carga"
                            >
                              <span className="material-symbols-outlined text-sm">delete</span>
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] font-mono text-[#88929b]">
                          <span>
                            {load.type === 'distributed'
                              ? `Trecho: ${load.positionX.toFixed(2)}m → ${(
                                  load.positionX + (load.length ?? spanLength)
                                ).toFixed(2)}m (${(load.positionX * 100).toFixed(0)}cm)`
                              : `Posição x = ${load.positionX.toFixed(2)}m (${(load.positionX * 100).toFixed(0)}cm)`}
                          </span>
                          <span className="text-[#dfe2ee]">
                            {load.type === 'distributed'
                              ? `Σ = ${(load.value * (load.length ?? spanLength)).toFixed(1)} kN`
                              : `Fator γf = ${load.gammaF.toFixed(2)}`}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Resumo de Carga Total */}
            <div className="bg-[#0a0e16] border border-[#3e4850] rounded p-2.5 flex items-center justify-between font-mono text-xs mt-3">
              <div className="flex items-center space-x-2 text-[#bec8d2]">
                <span className="material-symbols-outlined text-sm text-[#4edea3]">check_circle</span>
                <span>Resultante Vertical Total:</span>
              </div>
              <div className="text-right font-mono">
                <span className="font-bold text-[#89ceff] text-sm block">
                  {calcResults.totalVerticalLoad.toFixed(2)} kN
                </span>
                <span className="text-[10px] text-[#88929b]">
                  ≈ {(calcResults.totalVerticalLoad / 9.80665).toFixed(2)} tf
                </span>
              </div>
            </div>
          </section>

          {/* CTA Avançar */}
          <button
            type="button"
            onClick={onAdvanceToProfiles}
            className="w-full py-3 px-4 bg-[#0ea5e9] hover:bg-[#89ceff] text-[#001e2f] rounded font-headline font-bold flex items-center justify-center space-x-2 shadow-lg transition-all active:scale-[0.99] group text-base"
          >
            <span>Avançar para Seleção de Perfis</span>
            <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">
              arrow_forward
            </span>
          </button>
        </div>
      </div>

      {/* Modal: Adicionar / Editar Carga com Conversão de Unidades e Métrica de Distância */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181c24] border border-[#3e4850] rounded-xl max-w-lg w-full p-4 sm:p-5 space-y-4 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#3e4850]">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#89ceff] text-xl">
                  {loadTypeToAdd === 'distributed' ? 'align_horizontal_left' : loadTypeToAdd === 'point' ? 'arrow_downward' : 'rotate_right'}
                </span>
                <h3 className="font-headline font-bold text-base text-[#dfe2ee]">
                  {editingLoadId ? 'Editar Carregamento & Unidades' : 'Novo Carregamento & Unidades'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-[#bec8d2] hover:text-[#dfe2ee] p-1"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="space-y-4 font-mono text-xs">
              {/* Load Description */}
              <div>
                <label className="text-[#88929b] block mb-1">Descrição / Finalidade</label>
                <input
                  type="text"
                  value={loadName}
                  onChange={(e) => setLoadName(e.target.value)}
                  placeholder="Ex: Carga Permanente de Alvenaria, HVAC, etc."
                  className="w-full bg-[#0a0e16] border border-[#3e4850] rounded px-3 py-1.5 text-[#dfe2ee] focus:border-[#89ceff] focus:outline-none"
                />
              </div>

              {/* Magnitude & Force Unit Selector */}
              <div className="bg-[#12161f] border border-[#3e4850] rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[#dfe2ee] font-bold block">
                    MAGNITUDE DA CARGA
                  </label>
                  <span className="text-[10px] text-[#88929b]">Selecione a unidade de força</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <input
                      type="number"
                      step="0.1"
                      value={inputVal}
                      onChange={(e) => setInputVal(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#0a0e16] border border-[#3e4850] rounded px-3 py-2 text-[#89ceff] font-bold text-base focus:border-[#89ceff] focus:outline-none"
                    />
                  </div>

                  <div>
                    {loadTypeToAdd === 'point' ? (
                      <select
                        value={selectedPointUnit}
                        onChange={(e) => setSelectedPointUnit(e.target.value as PointLoadUnit)}
                        className="w-full bg-[#0a0e16] border border-[#3e4850] rounded px-2.5 py-2 text-[#dfe2ee] focus:border-[#89ceff] focus:outline-none font-bold"
                      >
                        {POINT_LOAD_UNITS.map((u) => (
                          <option key={u.value} value={u.value}>
                            {u.label}
                          </option>
                        ))}
                      </select>
                    ) : loadTypeToAdd === 'distributed' ? (
                      <select
                        value={selectedDistLoadUnit}
                        onChange={(e) => setSelectedDistLoadUnit(e.target.value as DistLoadUnit)}
                        className="w-full bg-[#0a0e16] border border-[#3e4850] rounded px-2.5 py-2 text-[#dfe2ee] focus:border-[#89ceff] focus:outline-none font-bold"
                      >
                        {DIST_LOAD_UNITS.map((u) => (
                          <option key={u.value} value={u.value}>
                            {u.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <select
                        value={selectedMomentUnit}
                        onChange={(e) => setSelectedMomentUnit(e.target.value as MomentLoadUnit)}
                        className="w-full bg-[#0a0e16] border border-[#3e4850] rounded px-2.5 py-2 text-[#dfe2ee] focus:border-[#89ceff] focus:outline-none font-bold"
                      >
                        {MOMENT_LOAD_UNITS.map((u) => (
                          <option key={u.value} value={u.value}>
                            {u.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Real-time SI Equivalent Conversion Preview */}
                <div className="text-[11px] text-[#4edea3] bg-[#0a0e16] px-2.5 py-1.5 rounded border border-[#3e4850]/60 flex items-center justify-between">
                  <span>Equivalente no Motor de Cálculo (SI):</span>
                  <strong>
                    {loadTypeToAdd === 'point'
                      ? `${convertPointLoad(inputVal, selectedPointUnit, 'kN').toFixed(2)} kN (${(
                          convertPointLoad(inputVal, selectedPointUnit, 'kN') / 9.80665
                        ).toFixed(2)} tf)`
                      : loadTypeToAdd === 'distributed'
                      ? `${convertDistLoad(inputVal, selectedDistLoadUnit, 'kN/m').toFixed(2)} kN/m (${(
                          convertDistLoad(inputVal, selectedDistLoadUnit, 'kN/m') / 9.80665
                        ).toFixed(2)} tf/m)`
                      : `${convertMomentLoad(inputVal, selectedMomentUnit, 'kN.m').toFixed(2)} kN.m`}
                  </strong>
                </div>
              </div>

              {/* Distance & Geometry Units (Métrica de Distância) */}
              <div className="bg-[#12161f] border border-[#3e4850] rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[#dfe2ee] font-bold block">
                    POSIÇÃO & GEOMETRIA (MÉTRICA DE DISTÂNCIA)
                  </label>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-[#88929b]">Unidade:</span>
                    <select
                      value={selectedDistUnit}
                      onChange={(e) => setSelectedDistUnit(e.target.value as DistanceUnit)}
                      className="bg-[#0a0e16] border border-[#3e4850] rounded px-2 py-0.5 text-[#89ceff] font-bold text-[11px] focus:outline-none"
                    >
                      {DISTANCE_UNITS.map((u) => (
                        <option key={u.value} value={u.value}>
                          {u.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[#88929b] block mb-1">
                      Posição inicial X [{selectedDistUnit}]
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={inputPos}
                      onChange={(e) => setInputPos(parseFloat(e.target.value) || 0)}
                      className="w-full bg-[#0a0e16] border border-[#3e4850] rounded px-3 py-1.5 text-[#dfe2ee] focus:border-[#89ceff] focus:outline-none"
                    />
                    <span className="text-[10px] text-[#88929b] mt-0.5 block">
                      = {convertDistance(inputPos, selectedDistUnit, 'm').toFixed(2)} m
                    </span>
                  </div>

                  {loadTypeToAdd === 'distributed' && (
                    <div>
                      <label className="text-[#88929b] block mb-1">
                        Comprimento do trecho [{selectedDistUnit}]
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0.1"
                        value={inputLen}
                        onChange={(e) => setInputLen(parseFloat(e.target.value) || 0)}
                        className="w-full bg-[#0a0e16] border border-[#3e4850] rounded px-3 py-1.5 text-[#dfe2ee] focus:border-[#89ceff] focus:outline-none"
                      />
                      <span className="text-[10px] text-[#88929b] mt-0.5 block">
                        = {convertDistance(inputLen, selectedDistUnit, 'm').toFixed(2)} m
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#3e4850]">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-3.5 py-1.5 rounded border border-[#3e4850] text-[#bec8d2] hover:bg-[#262a33]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveLoad}
                className="px-4 py-1.5 rounded bg-[#0ea5e9] text-[#001e2f] font-bold hover:bg-[#89ceff] transition-colors"
              >
                {editingLoadId ? 'Salvar Alterações' : 'Aplicar Carga'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
