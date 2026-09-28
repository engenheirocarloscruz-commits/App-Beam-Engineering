import React, { useState, useEffect } from 'react';
import { STEEL_GRADES, STEEL_PROFILES } from '../data/profiles';
import { SteelGrade, SteelProfile } from '../types';
import {
  DEFAULT_MANUAL_DIMENSIONS,
  MainProfileType,
  PROFILE_TYPE_DEFINITIONS,
  SectionDimensions,
  computeSectionProperties,
} from '../utils/sectionCalculator';

interface ProfilesViewProps {
  selectedProfile: SteelProfile;
  selectedSteelGrade: SteelGrade;
  onSelectProfile: (profile: SteelProfile) => void;
  onSelectSteelGrade: (grade: SteelGrade) => void;
  onConfirmCalculate: () => void;
}

function mapProfileToMainType(profile: SteelProfile): MainProfileType {
  if (profile.family === 'U') return 'U';
  if (profile.family === 'L') return 'L';
  if (profile.family === 'TUB_CIRC') return 'TUB_CIRC';
  if (profile.family === 'TUB_RET' || profile.family === 'TUB_QUAD' || profile.family === 'HSS')
    return 'TUB_RET';
  return 'I';
}

export const ProfilesView: React.FC<ProfilesViewProps> = ({
  selectedProfile,
  selectedSteelGrade,
  onSelectProfile,
  onSelectSteelGrade,
  onConfirmCalculate,
}) => {
  const [selectedType, setSelectedType] = useState<MainProfileType>(
    mapProfileToMainType(selectedProfile)
  );

  // Manual dimensions state in mm
  const [dims, setDims] = useState<SectionDimensions>({
    d: selectedProfile.depth_d,
    bf: selectedProfile.flangeWidth_bf,
    tw: selectedProfile.webThickness_tw,
    tf: selectedProfile.flangeThickness_tf,
  });

  // Keep manual dimensions in sync if user selects another profile from catalog or outside
  useEffect(() => {
    const mainType = mapProfileToMainType(selectedProfile);
    setSelectedType(mainType);
    setDims({
      d: selectedProfile.depth_d,
      bf: selectedProfile.flangeWidth_bf,
      tw: selectedProfile.webThickness_tw,
      tf: selectedProfile.flangeThickness_tf,
    });
  }, [selectedProfile.id]);

  // Robust unified handler for manual dimension input changes
  const handleDimensionChange = (key: keyof SectionDimensions, val: number) => {
    const num = isNaN(val) ? 0.1 : Math.max(val, 0.1);
    let updatedDims: SectionDimensions;

    if (selectedType === 'TUB_CIRC') {
      if (key === 'd' || key === 'bf') {
        updatedDims = { ...dims, d: num, bf: num };
      } else {
        updatedDims = { ...dims, tw: num, tf: num };
      }
    } else if (selectedType === 'L') {
      if (key === 'tf' || key === 'tw') {
        updatedDims = { ...dims, tf: num, tw: num };
      } else {
        updatedDims = { ...dims, [key]: num };
      }
    } else if (selectedType === 'TUB_RET') {
      if (key === 'tf' || key === 'tw') {
        updatedDims = { ...dims, tf: num, tw: num };
      } else {
        updatedDims = { ...dims, [key]: num };
      }
    } else {
      updatedDims = { ...dims, [key]: num };
    }

    setDims(updatedDims);
    const updatedProfile = computeSectionProperties(selectedType, updatedDims);
    onSelectProfile(updatedProfile);
  };

  // Switch type handler
  const handleSelectType = (newType: MainProfileType) => {
    setSelectedType(newType);
    // Find standard profile of this type to prefill convenient default dimensions
    const preset =
      STEEL_PROFILES.find((p) => {
        if (newType === 'I') return p.family === 'I';
        if (newType === 'U') return p.family === 'U';
        if (newType === 'L') return p.family === 'L';
        if (newType === 'TUB_CIRC') return p.family === 'TUB_CIRC';
        return p.family === 'TUB_RET' || p.family === 'TUB_QUAD';
      }) ||
      STEEL_PROFILES.find((p) => {
        if (newType === 'I') return p.family === 'W';
        return false;
      });

    const fallback = DEFAULT_MANUAL_DIMENSIONS[newType];
    const initialDims = preset
      ? {
          d: preset.depth_d,
          bf: preset.flangeWidth_bf,
          tw: preset.webThickness_tw,
          tf: preset.flangeThickness_tf,
        }
      : fallback;

    setDims(initialDims);
    if (preset) {
      onSelectProfile(preset);
    } else {
      const computed = computeSectionProperties(newType, initialDims);
      onSelectProfile(computed);
    }
  };

  // Catalog presets relevant for the currently selected type
  const availablePresets = STEEL_PROFILES.filter((p) => {
    if (selectedType === 'I') return p.family === 'I' || p.family === 'W';
    if (selectedType === 'U') return p.family === 'U';
    if (selectedType === 'L') return p.family === 'L';
    if (selectedType === 'TUB_CIRC') return p.family === 'TUB_CIRC';
    return p.family === 'TUB_RET' || p.family === 'TUB_QUAD' || p.family === 'HSS';
  });

  // Alternatives recommended for optimization
  const alt1 = availablePresets.find((p) => p.massLinear < selectedProfile.massLinear);
  const alt2 = availablePresets.find((p) => p.inertia_Ix > selectedProfile.inertia_Ix);

  const getSectionTitle = () => {
    switch (selectedType) {
      case 'TUB_RET':
        return Math.abs(dims.d - dims.bf) < 0.5
          ? 'TUBO QUADRADO (SHS)'
          : 'TUBO RETANGULAR (RHS)';
      case 'TUB_CIRC':
        return 'TUBO CIRCULAR (CHS)';
      case 'L':
        return dims.d === dims.bf
          ? 'CANTONEIRA L (ABAS IGUAIS)'
          : 'CANTONEIRA L (ABAS DESIGUAIS)';
      case 'U':
        return 'PERFIL U (CANAL ESTRUTURAL)';
      default:
        return 'PERFIL I ESTRUTURAL';
    }
  };

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-3 sm:px-4 py-2 pb-24 space-y-4">
      {/* 1. Profile Type Selector */}
      <section className="mt-1">
        <div className="flex items-center justify-between mb-1.5 font-mono text-[10px]">
          <span className="uppercase tracking-wider text-[#bec8d2] flex items-center gap-1.5 font-semibold">
            <span className="material-symbols-outlined text-sm text-[#89ceff]">view_column</span>
            Tipologia da Seção Transversal
          </span>
          <span className="text-[#ffb95f]">5 TIPOS ESTRUTURAIS • ENTRADA MANUAL</span>
        </div>

        {/* 5 Distinct Profile Types Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {PROFILE_TYPE_DEFINITIONS.map((item) => {
            const isActive = selectedType === item.key;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleSelectType(item.key)}
                className={`flex items-center gap-2.5 p-2.5 rounded transition-all duration-150 relative text-left ${
                  isActive
                    ? 'bg-[#262a33] border-2 border-[#89ceff] text-[#89ceff] shadow-md shadow-[#89ceff]/10'
                    : 'bg-[#181c24] border border-[#3e4850] hover:border-[#88929b] text-[#bec8d2] hover:text-[#dfe2ee]'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded bg-[#0a0e16] flex items-center justify-center border shrink-0 text-sm font-bold ${
                    isActive ? 'border-[#89ceff] text-[#89ceff]' : 'border-[#3e4850] text-[#bec8d2]'
                  }`}
                >
                  <span className="font-mono">{item.symbol}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block font-mono text-xs font-bold truncate leading-tight">
                    {item.label}
                  </span>
                  <span className="block text-[10px] text-[#88929b] truncate">{item.sub}</span>
                </div>
                {isActive && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#ffb95f]"></span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Manual Dimensions Input Panel */}
      <section className="bg-[#181c24] border border-[#3e4850] rounded-lg p-3 sm:p-4 space-y-3 relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#3e4850] pb-2.5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#89ceff] text-lg">edit_note</span>
            <div>
              <h3 className="font-mono text-xs sm:text-sm font-bold text-[#dfe2ee]">
                Inserção Manual das Dimensões da Seção Transversal
              </h3>
              <p className="text-[11px] text-[#88929b]">
                Altere livremente as medidas em milímetros (mm). Propriedades geométricas recalculadas em tempo real.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#89ceff]/10 border border-[#89ceff]/30 text-[#89ceff] font-bold">
              {selectedProfile.tag || 'DIMENSÕES ATIVAS'}
            </span>
            <span className="font-mono text-xs text-[#ffb95f] font-bold">
              {selectedProfile.massLinear} kg/m
            </span>
          </div>
        </div>

        {/* Input Fields specific to each Profile Type */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          {selectedType === 'I' && (
            <>
              {/* d */}
              <div className="bg-[#0a0e16] p-2.5 rounded border border-[#3e4850] space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-[11px] text-[#89ceff] font-bold">Altura Total (d)</label>
                  <span className="font-mono text-[10px] text-[#88929b]">mm</span>
                </div>
                <input
                  type="number"
                  step="1"
                  min="20"
                  max="1500"
                  value={dims.d}
                  onChange={(e) => handleDimensionChange('d', parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#181c24] border border-[#3e4850] focus:border-[#89ceff] rounded px-2.5 py-1.5 font-mono text-sm text-[#dfe2ee] font-bold focus:outline-none"
                />
                <span className="block text-[9px] text-[#88929b]">Viga d: {dims.d} mm</span>
              </div>

              {/* bf */}
              <div className="bg-[#0a0e16] p-2.5 rounded border border-[#3e4850] space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-[11px] text-[#89ceff] font-bold">Largura Mesa (bf)</label>
                  <span className="font-mono text-[10px] text-[#88929b]">mm</span>
                </div>
                <input
                  type="number"
                  step="1"
                  min="10"
                  max="800"
                  value={dims.bf}
                  onChange={(e) => handleDimensionChange('bf', parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#181c24] border border-[#3e4850] focus:border-[#89ceff] rounded px-2.5 py-1.5 font-mono text-sm text-[#dfe2ee] font-bold focus:outline-none"
                />
                <span className="block text-[9px] text-[#88929b]">Flange bf: {dims.bf} mm</span>
              </div>

              {/* tw */}
              <div className="bg-[#0a0e16] p-2.5 rounded border border-[#3e4850] space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-[11px] text-[#ffb95f] font-bold">Espessura Alma (tw)</label>
                  <span className="font-mono text-[10px] text-[#88929b]">mm</span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="60"
                  value={dims.tw}
                  onChange={(e) => handleDimensionChange('tw', parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#181c24] border border-[#3e4850] focus:border-[#ffb95f] rounded px-2.5 py-1.5 font-mono text-sm text-[#dfe2ee] font-bold focus:outline-none"
                />
                <span className="block text-[9px] text-[#88929b]">hw = {(dims.d - 2 * dims.tf).toFixed(1)} mm</span>
              </div>

              {/* tf */}
              <div className="bg-[#0a0e16] p-2.5 rounded border border-[#3e4850] space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-[11px] text-[#ffb95f] font-bold">Espessura Mesa (tf)</label>
                  <span className="font-mono text-[10px] text-[#88929b]">mm</span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="100"
                  value={dims.tf}
                  onChange={(e) => handleDimensionChange('tf', parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#181c24] border border-[#3e4850] focus:border-[#ffb95f] rounded px-2.5 py-1.5 font-mono text-sm text-[#dfe2ee] font-bold focus:outline-none"
                />
                <span className="block text-[9px] text-[#88929b]">Mesa tf: {dims.tf} mm</span>
              </div>
            </>
          )}

          {selectedType === 'U' && (
            <>
              {/* d */}
              <div className="bg-[#0a0e16] p-2.5 rounded border border-[#3e4850] space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-[11px] text-[#89ceff] font-bold">Altura Total (d)</label>
                  <span className="font-mono text-[10px] text-[#88929b]">mm</span>
                </div>
                <input
                  type="number"
                  step="1"
                  min="20"
                  max="1000"
                  value={dims.d}
                  onChange={(e) => handleDimensionChange('d', parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#181c24] border border-[#3e4850] focus:border-[#89ceff] rounded px-2.5 py-1.5 font-mono text-sm text-[#dfe2ee] font-bold focus:outline-none"
                />
                <span className="block text-[9px] text-[#88929b]">Canal d: {dims.d} mm</span>
              </div>

              {/* bf */}
              <div className="bg-[#0a0e16] p-2.5 rounded border border-[#3e4850] space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-[11px] text-[#89ceff] font-bold">Largura Aba (bf)</label>
                  <span className="font-mono text-[10px] text-[#88929b]">mm</span>
                </div>
                <input
                  type="number"
                  step="1"
                  min="10"
                  max="400"
                  value={dims.bf}
                  onChange={(e) => handleDimensionChange('bf', parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#181c24] border border-[#3e4850] focus:border-[#89ceff] rounded px-2.5 py-1.5 font-mono text-sm text-[#dfe2ee] font-bold focus:outline-none"
                />
                <span className="block text-[9px] text-[#88929b]">Aba bf: {dims.bf} mm</span>
              </div>

              {/* tw */}
              <div className="bg-[#0a0e16] p-2.5 rounded border border-[#3e4850] space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-[11px] text-[#ffb95f] font-bold">Espessura Alma (tw)</label>
                  <span className="font-mono text-[10px] text-[#88929b]">mm</span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="40"
                  value={dims.tw}
                  onChange={(e) => handleDimensionChange('tw', parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#181c24] border border-[#3e4850] focus:border-[#ffb95f] rounded px-2.5 py-1.5 font-mono text-sm text-[#dfe2ee] font-bold focus:outline-none"
                />
                <span className="block text-[9px] text-[#88929b]">Alma tw: {dims.tw} mm</span>
              </div>

              {/* tf */}
              <div className="bg-[#0a0e16] p-2.5 rounded border border-[#3e4850] space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-[11px] text-[#ffb95f] font-bold">Espessura Aba (tf)</label>
                  <span className="font-mono text-[10px] text-[#88929b]">mm</span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="50"
                  value={dims.tf}
                  onChange={(e) => handleDimensionChange('tf', parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#181c24] border border-[#3e4850] focus:border-[#ffb95f] rounded px-2.5 py-1.5 font-mono text-sm text-[#dfe2ee] font-bold focus:outline-none"
                />
                <span className="block text-[9px] text-[#88929b]">Aba tf: {dims.tf} mm</span>
              </div>
            </>
          )}

          {selectedType === 'L' && (
            <>
              {/* a */}
              <div className="bg-[#0a0e16] p-2.5 rounded border border-[#3e4850] space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-[11px] text-[#89ceff] font-bold">Aba Vertical (a)</label>
                  <span className="font-mono text-[10px] text-[#88929b]">mm</span>
                </div>
                <input
                  type="number"
                  step="0.5"
                  min="15"
                  max="400"
                  value={dims.d}
                  onChange={(e) => handleDimensionChange('d', parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#181c24] border border-[#3e4850] focus:border-[#89ceff] rounded px-2.5 py-1.5 font-mono text-sm text-[#dfe2ee] font-bold focus:outline-none"
                />
                <span className="block text-[9px] text-[#88929b]">Aba a: {dims.d} mm</span>
              </div>

              {/* b */}
              <div className="bg-[#0a0e16] p-2.5 rounded border border-[#3e4850] space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-[11px] text-[#89ceff] font-bold">Aba Horizontal (b)</label>
                  <span className="font-mono text-[10px] text-[#88929b]">mm</span>
                </div>
                <input
                  type="number"
                  step="0.5"
                  min="15"
                  max="400"
                  value={dims.bf}
                  onChange={(e) => handleDimensionChange('bf', parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#181c24] border border-[#3e4850] focus:border-[#89ceff] rounded px-2.5 py-1.5 font-mono text-sm text-[#dfe2ee] font-bold focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleDimensionChange('bf', dims.d)}
                  className="text-[9px] text-[#89ceff] hover:underline block font-mono"
                >
                  = Tornar igual a {dims.d} mm
                </button>
              </div>

              {/* t */}
              <div className="bg-[#0a0e16] p-2.5 rounded border border-[#3e4850] space-y-1 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-[11px] text-[#ffb95f] font-bold">Espessura da Cantoneira (t)</label>
                  <span className="font-mono text-[10px] text-[#88929b]">mm</span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="50"
                  value={dims.tf}
                  onChange={(e) => {
                    const tVal = parseFloat(e.target.value) || 0;
                    const updatedDims = { ...dims, tf: tVal, tw: tVal };
                    setDims(updatedDims);
                    onSelectProfile(computeSectionProperties(selectedType, updatedDims));
                  }}
                  className="w-full bg-[#181c24] border border-[#3e4850] focus:border-[#ffb95f] rounded px-2.5 py-1.5 font-mono text-sm text-[#dfe2ee] font-bold focus:outline-none"
                />
                <span className="block text-[9px] text-[#88929b]">
                  Espessura nominal t: {dims.tf} mm
                </span>
              </div>
            </>
          )}

          {selectedType === 'TUB_CIRC' && (
            <>
              {/* D */}
              <div className="bg-[#0a0e16] p-2.5 rounded border border-[#3e4850] space-y-1 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-[11px] text-[#89ceff] font-bold">Diâmetro Externo (Ø / D)</label>
                  <span className="font-mono text-[10px] text-[#88929b]">mm</span>
                </div>
                <input
                  type="number"
                  step="0.5"
                  min="15"
                  max="1000"
                  value={dims.d}
                  onChange={(e) => {
                    const dVal = parseFloat(e.target.value) || 0;
                    const updatedDims = { ...dims, d: dVal, bf: dVal };
                    setDims(updatedDims);
                    onSelectProfile(computeSectionProperties(selectedType, updatedDims));
                  }}
                  className="w-full bg-[#181c24] border border-[#3e4850] focus:border-[#89ceff] rounded px-2.5 py-1.5 font-mono text-sm text-[#dfe2ee] font-bold focus:outline-none"
                />
                <span className="block text-[9px] text-[#88929b]">
                  Raio externo R = {(dims.d / 2).toFixed(1)} mm
                </span>
              </div>

              {/* t */}
              <div className="bg-[#0a0e16] p-2.5 rounded border border-[#3e4850] space-y-1 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-[11px] text-[#ffb95f] font-bold">Espessura da Parede (t)</label>
                  <span className="font-mono text-[10px] text-[#88929b]">mm</span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="60"
                  value={dims.tw}
                  onChange={(e) => {
                    const tVal = parseFloat(e.target.value) || 0;
                    const updatedDims = { ...dims, tw: tVal, tf: tVal };
                    setDims(updatedDims);
                    onSelectProfile(computeSectionProperties(selectedType, updatedDims));
                  }}
                  className="w-full bg-[#181c24] border border-[#3e4850] focus:border-[#ffb95f] rounded px-2.5 py-1.5 font-mono text-sm text-[#dfe2ee] font-bold focus:outline-none"
                />
                <span className="block text-[9px] text-[#88929b]">
                  Diâmetro interno di = {(dims.d - 2 * dims.tw).toFixed(1)} mm
                </span>
              </div>
            </>
          )}

          {selectedType === 'TUB_RET' && (
            <>
              {/* h */}
              <div className="bg-[#0a0e16] p-2.5 rounded border border-[#3e4850] space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-[11px] text-[#89ceff] font-bold">Altura Externa (h)</label>
                  <span className="font-mono text-[10px] text-[#88929b]">mm</span>
                </div>
                <input
                  type="number"
                  step="1"
                  min="20"
                  max="800"
                  value={dims.d}
                  onChange={(e) => handleDimensionChange('d', parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#181c24] border border-[#3e4850] focus:border-[#89ceff] rounded px-2.5 py-1.5 font-mono text-sm text-[#dfe2ee] font-bold focus:outline-none"
                />
                <span className="block text-[9px] text-[#88929b]">Altura h: {dims.d} mm</span>
              </div>

              {/* b */}
              <div className="bg-[#0a0e16] p-2.5 rounded border border-[#3e4850] space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-[11px] text-[#89ceff] font-bold">Largura Externa (b)</label>
                  <span className="font-mono text-[10px] text-[#88929b]">mm</span>
                </div>
                <input
                  type="number"
                  step="1"
                  min="20"
                  max="800"
                  value={dims.bf}
                  onChange={(e) => handleDimensionChange('bf', parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#181c24] border border-[#3e4850] focus:border-[#89ceff] rounded px-2.5 py-1.5 font-mono text-sm text-[#dfe2ee] font-bold focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleDimensionChange('bf', dims.d)}
                  className="text-[9px] text-[#89ceff] hover:underline block font-mono"
                >
                  = Ajustar Quadrado ({dims.d} mm)
                </button>
              </div>

              {/* t */}
              <div className="bg-[#0a0e16] p-2.5 rounded border border-[#3e4850] space-y-1 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="font-mono text-[11px] text-[#ffb95f] font-bold">Espessura Parede (t)</label>
                  <span className="font-mono text-[10px] text-[#88929b]">mm</span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="40"
                  value={dims.tw}
                  onChange={(e) => {
                    const tVal = parseFloat(e.target.value) || 0;
                    const updatedDims = { ...dims, tw: tVal, tf: tVal };
                    setDims(updatedDims);
                    onSelectProfile(computeSectionProperties(selectedType, updatedDims));
                  }}
                  className="w-full bg-[#181c24] border border-[#3e4850] focus:border-[#ffb95f] rounded px-2.5 py-1.5 font-mono text-sm text-[#dfe2ee] font-bold focus:outline-none"
                />
                <span className="block text-[9px] text-[#88929b]">
                  Espessura uniforme t: {dims.tw} mm
                </span>
              </div>
            </>
          )}
        </div>
      </section>

      {/* CAD Cross-Section Technical Blueprint Viewport (Posicionada abaixo da seção de inserção manual) */}
      <div className="bg-[#0a0e16] border border-[#3e4850] rounded-lg p-3 sm:p-4 relative flex flex-col items-center justify-between blueprint-grid min-h-[300px]">
        <div className="w-full flex items-center justify-between font-mono text-[10px] text-[#88929b] pb-2 border-b border-[#3e4850]/60">
          <span className="flex items-center gap-1.5 text-[#89ceff] font-bold">
            <span className="material-symbols-outlined text-sm">tune</span>
            Desenho Técnico CAD da Seção Transversal • {getSectionTitle()}
          </span>
          <span className="text-[#89ceff]">EIXOS PRINCIPAIS X-X / Y-Y</span>
        </div>

        {/* SVG Precision Blueprint reflecting manual dimensions */}
        <div className="w-full py-2 flex items-center justify-center">
          {selectedType === 'TUB_RET' && Math.abs(dims.d - dims.bf) < 0.5 ? (
            <svg className="w-64 h-52 drop-shadow-sm select-none" viewBox="0 0 260 210">
              <defs>
                <marker id="cad-arrow" markerHeight="4" markerWidth="4" orient="auto-start-reverse" refX="5" refY="5" viewBox="0 0 10 10">
                  <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#88929b" />
                </marker>
                <marker id="cad-arrow-cyan" markerHeight="4" markerWidth="4" orient="auto-start-reverse" refX="5" refY="5" viewBox="0 0 10 10">
                  <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#0ea5e9" />
                </marker>
              </defs>
              <line x1="20" x2="220" y1="105" y2="105" stroke="#3e4850" strokeWidth="0.8" strokeDasharray="4 2" />
              <line x1="120" x2="120" y1="15" y2="195" stroke="#3e4850" strokeWidth="0.8" strokeDasharray="4 2" />
              <text x="212" y="101" fill="#88929b" fontFamily="JetBrains Mono" fontSize="8">X</text>
              <text x="123" y="24" fill="#88929b" fontFamily="JetBrains Mono" fontSize="8">Y</text>

              <rect x="65" y="50" width="110" height="110" rx="4" fill="#181c24" stroke="#0ea5e9" strokeWidth="2" />
              <rect x="79" y="64" width="82" height="82" rx="3" fill="#0a0e16" stroke="#0ea5e9" strokeWidth="1.5" />

              <line x1="65" x2="175" y1="36" y2="36" stroke="#88929b" strokeWidth="0.8" markerStart="url(#cad-arrow)" markerEnd="url(#cad-arrow)" />
              <line x1="65" x2="65" y1="32" y2="48" stroke="#3e4850" strokeWidth="0.7" />
              <line x1="175" x2="175" y1="32" y2="48" stroke="#3e4850" strokeWidth="0.7" />
              <text x="120" y="32" fill="#89ceff" fontFamily="JetBrains Mono" fontSize="9" fontWeight="600" textAnchor="middle">
                b = {dims.bf} mm
              </text>

              <line x1="48" x2="48" y1="50" y2="160" stroke="#88929b" strokeWidth="0.8" markerStart="url(#cad-arrow)" markerEnd="url(#cad-arrow)" />
              <line x1="44" x2="63" y1="50" y2="50" stroke="#3e4850" strokeWidth="0.7" />
              <line x1="44" x2="63" y1="160" y2="160" stroke="#3e4850" strokeWidth="0.7" />
              <text x="44" y="108" fill="#89ceff" fontFamily="JetBrains Mono" fontSize="9" fontWeight="600" textAnchor="end">
                h = {dims.d}
              </text>

              <line x1="175" x2="198" y1="105" y2="105" stroke="#0ea5e9" strokeWidth="0.8" markerStart="url(#cad-arrow-cyan)" />
              <text x="202" y="108" fill="#ffb95f" fontFamily="JetBrains Mono" fontSize="8">
                t: {dims.tw}
              </text>
            </svg>
          ) : selectedType === 'TUB_RET' ? (
            <svg className="w-64 h-52 drop-shadow-sm select-none" viewBox="0 0 260 210">
              <defs>
                <marker id="cad-arrow" markerHeight="4" markerWidth="4" orient="auto-start-reverse" refX="5" refY="5" viewBox="0 0 10 10">
                  <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#88929b" />
                </marker>
                <marker id="cad-arrow-cyan" markerHeight="4" markerWidth="4" orient="auto-start-reverse" refX="5" refY="5" viewBox="0 0 10 10">
                  <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#0ea5e9" />
                </marker>
              </defs>
              <line x1="20" x2="220" y1="105" y2="105" stroke="#3e4850" strokeWidth="0.8" strokeDasharray="4 2" />
              <line x1="120" x2="120" y1="15" y2="195" stroke="#3e4850" strokeWidth="0.8" strokeDasharray="4 2" />
              <text x="212" y="101" fill="#88929b" fontFamily="JetBrains Mono" fontSize="8">X</text>
              <text x="123" y="24" fill="#88929b" fontFamily="JetBrains Mono" fontSize="8">Y</text>

              <rect x="75" y="40" width="90" height="130" rx="4" fill="#181c24" stroke="#0ea5e9" strokeWidth="2" />
              <rect x="89" y="54" width="62" height="102" rx="3" fill="#0a0e16" stroke="#0ea5e9" strokeWidth="1.5" />

              <line x1="75" x2="165" y1="26" y2="26" stroke="#88929b" strokeWidth="0.8" markerStart="url(#cad-arrow)" markerEnd="url(#cad-arrow)" />
              <line x1="75" x2="75" y1="22" y2="38" stroke="#3e4850" strokeWidth="0.7" />
              <line x1="165" x2="165" y1="22" y2="38" stroke="#3e4850" strokeWidth="0.7" />
              <text x="120" y="22" fill="#89ceff" fontFamily="JetBrains Mono" fontSize="9" fontWeight="600" textAnchor="middle">
                b = {dims.bf} mm
              </text>

              <line x1="56" x2="56" y1="40" y2="170" stroke="#88929b" strokeWidth="0.8" markerStart="url(#cad-arrow)" markerEnd="url(#cad-arrow)" />
              <line x1="50" x2="73" y1="40" y2="40" stroke="#3e4850" strokeWidth="0.7" />
              <line x1="50" x2="73" y1="170" y2="170" stroke="#3e4850" strokeWidth="0.7" />
              <text x="52" y="108" fill="#89ceff" fontFamily="JetBrains Mono" fontSize="9" fontWeight="600" textAnchor="end">
                h = {dims.d}
              </text>

              <line x1="165" x2="188" y1="105" y2="105" stroke="#0ea5e9" strokeWidth="0.8" markerStart="url(#cad-arrow-cyan)" />
              <text x="192" y="108" fill="#ffb95f" fontFamily="JetBrains Mono" fontSize="8">
                t: {dims.tw}
              </text>
            </svg>
          ) : selectedType === 'TUB_CIRC' ? (
            <svg className="w-64 h-52 drop-shadow-sm select-none" viewBox="0 0 260 210">
              <defs>
                <marker id="cad-arrow" markerHeight="4" markerWidth="4" orient="auto-start-reverse" refX="5" refY="5" viewBox="0 0 10 10">
                  <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#88929b" />
                </marker>
                <marker id="cad-arrow-cyan" markerHeight="4" markerWidth="4" orient="auto-start-reverse" refX="5" refY="5" viewBox="0 0 10 10">
                  <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#0ea5e9" />
                </marker>
              </defs>
              <line x1="20" x2="220" y1="105" y2="105" stroke="#3e4850" strokeWidth="0.8" strokeDasharray="4 2" />
              <line x1="120" x2="120" y1="15" y2="195" stroke="#3e4850" strokeWidth="0.8" strokeDasharray="4 2" />
              <text x="212" y="101" fill="#88929b" fontFamily="JetBrains Mono" fontSize="8">X</text>
              <text x="123" y="24" fill="#88929b" fontFamily="JetBrains Mono" fontSize="8">Y</text>

              <circle cx="120" cy="105" r="58" fill="#181c24" stroke="#0ea5e9" strokeWidth="2" />
              <circle cx="120" cy="105" r="44" fill="#0a0e16" stroke="#0ea5e9" strokeWidth="1.5" />

              <line x1="62" x2="178" y1="32" y2="32" stroke="#88929b" strokeWidth="0.8" markerStart="url(#cad-arrow)" markerEnd="url(#cad-arrow)" />
              <line x1="62" x2="62" y1="28" y2="45" stroke="#3e4850" strokeWidth="0.7" />
              <line x1="178" x2="178" y1="28" y2="45" stroke="#3e4850" strokeWidth="0.7" />
              <text x="120" y="28" fill="#89ceff" fontFamily="JetBrains Mono" fontSize="9" fontWeight="600" textAnchor="middle">
                Ø = {dims.d} mm
              </text>

              <line x1="178" x2="198" y1="105" y2="105" stroke="#0ea5e9" strokeWidth="0.8" markerStart="url(#cad-arrow-cyan)" />
              <text x="202" y="108" fill="#ffb95f" fontFamily="JetBrains Mono" fontSize="8">
                t: {dims.tw}
              </text>
            </svg>
          ) : selectedType === 'L' ? (
            <svg className="w-64 h-52 drop-shadow-sm select-none" viewBox="0 0 260 210">
              <defs>
                <marker id="cad-arrow" markerHeight="4" markerWidth="4" orient="auto-start-reverse" refX="5" refY="5" viewBox="0 0 10 10">
                  <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#88929b" />
                </marker>
                <marker id="cad-arrow-cyan" markerHeight="4" markerWidth="4" orient="auto-start-reverse" refX="5" refY="5" viewBox="0 0 10 10">
                  <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#0ea5e9" />
                </marker>
              </defs>
              <line x1="20" x2="220" y1="110" y2="110" stroke="#3e4850" strokeWidth="0.8" strokeDasharray="4 2" />
              <line x1="115" x2="115" y1="15" y2="195" stroke="#3e4850" strokeWidth="0.8" strokeDasharray="4 2" />
              <text x="212" y="106" fill="#88929b" fontFamily="JetBrains Mono" fontSize="8">X</text>
              <text x="118" y="24" fill="#88929b" fontFamily="JetBrains Mono" fontSize="8">Y</text>

              <path
                d="M 75 40 L 95 40 L 95 140 L 175 140 L 175 160 L 75 160 Z"
                fill="#181c24"
                stroke="#0ea5e9"
                strokeWidth="2"
                strokeLinejoin="round"
              />

              <line x1="75" x2="175" y1="176" y2="176" stroke="#88929b" strokeWidth="0.8" markerStart="url(#cad-arrow)" markerEnd="url(#cad-arrow)" />
              <line x1="75" x2="75" y1="162" y2="180" stroke="#3e4850" strokeWidth="0.7" />
              <line x1="175" x2="175" y1="162" y2="180" stroke="#3e4850" strokeWidth="0.7" />
              <text x="125" y="190" fill="#89ceff" fontFamily="JetBrains Mono" fontSize="9" fontWeight="600" textAnchor="middle">
                b = {dims.bf} mm
              </text>

              <line x1="55" x2="55" y1="40" y2="160" stroke="#88929b" strokeWidth="0.8" markerStart="url(#cad-arrow)" markerEnd="url(#cad-arrow)" />
              <line x1="50" x2="73" y1="40" y2="40" stroke="#3e4850" strokeWidth="0.7" />
              <line x1="50" x2="73" y1="160" y2="160" stroke="#3e4850" strokeWidth="0.7" />
              <text x="50" y="103" fill="#89ceff" fontFamily="JetBrains Mono" fontSize="9" fontWeight="600" textAnchor="end">
                a = {dims.d}
              </text>

              <line x1="95" x2="120" y1="40" y2="40" stroke="#0ea5e9" strokeWidth="0.8" markerStart="url(#cad-arrow-cyan)" />
              <text x="124" y="43" fill="#ffb95f" fontFamily="JetBrains Mono" fontSize="8">
                t: {dims.tf}
              </text>
            </svg>
          ) : selectedType === 'U' ? (
            <svg className="w-64 h-52 drop-shadow-sm select-none" viewBox="0 0 260 210">
              <defs>
                <marker id="cad-arrow" markerHeight="4" markerWidth="4" orient="auto-start-reverse" refX="5" refY="5" viewBox="0 0 10 10">
                  <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#88929b" />
                </marker>
                <marker id="cad-arrow-cyan" markerHeight="4" markerWidth="4" orient="auto-start-reverse" refX="5" refY="5" viewBox="0 0 10 10">
                  <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#0ea5e9" />
                </marker>
              </defs>
              <line x1="20" x2="220" y1="105" y2="105" stroke="#3e4850" strokeWidth="0.8" strokeDasharray="4 2" />
              <line x1="110" x2="110" y1="15" y2="195" stroke="#3e4850" strokeWidth="0.8" strokeDasharray="4 2" />
              <text x="212" y="101" fill="#88929b" fontFamily="JetBrains Mono" fontSize="8">X</text>
              <text x="113" y="24" fill="#88929b" fontFamily="JetBrains Mono" fontSize="8">Y</text>

              <path
                d="M 165 35 L 165 50 L 95 50 L 95 160 L 165 160 L 165 175 L 75 175 L 75 35 Z"
                fill="#181c24"
                stroke="#0ea5e9"
                strokeWidth="2"
                strokeLinejoin="round"
              />

              <line x1="75" x2="165" y1="20" y2="20" stroke="#88929b" strokeWidth="0.8" markerStart="url(#cad-arrow)" markerEnd="url(#cad-arrow)" />
              <line x1="75" x2="75" y1="16" y2="33" stroke="#3e4850" strokeWidth="0.7" />
              <line x1="165" x2="165" y1="16" y2="33" stroke="#3e4850" strokeWidth="0.7" />
              <text x="120" y="16" fill="#89ceff" fontFamily="JetBrains Mono" fontSize="9" fontWeight="600" textAnchor="middle">
                bf = {dims.bf} mm
              </text>

              <line x1="55" x2="55" y1="35" y2="175" stroke="#88929b" strokeWidth="0.8" markerStart="url(#cad-arrow)" markerEnd="url(#cad-arrow)" />
              <line x1="50" x2="73" y1="35" y2="35" stroke="#3e4850" strokeWidth="0.7" />
              <line x1="50" x2="73" y1="175" y2="175" stroke="#3e4850" strokeWidth="0.7" />
              <text x="50" y="108" fill="#89ceff" fontFamily="JetBrains Mono" fontSize="9" fontWeight="600" textAnchor="end">
                d = {dims.d}
              </text>

              <line x1="95" x2="120" y1="105" y2="105" stroke="#0ea5e9" strokeWidth="0.8" markerStart="url(#cad-arrow-cyan)" />
              <text x="124" y="108" fill="#ffb95f" fontFamily="JetBrains Mono" fontSize="8">
                tw: {dims.tw}
              </text>

              {/* Cota tf (Espessura da Aba/Mesa) */}
              <line x1="178" x2="178" y1="35" y2="50" stroke="#88929b" strokeWidth="0.8" markerStart="url(#cad-arrow)" markerEnd="url(#cad-arrow)" />
              <line x1="168" x2="185" y1="35" y2="35" stroke="#3e4850" strokeWidth="0.7" />
              <line x1="168" x2="185" y1="50" y2="50" stroke="#3e4850" strokeWidth="0.7" />
              <text x="190" y="46" fill="#ffb95f" fontFamily="JetBrains Mono" fontSize="8" fontWeight="600">
                tf: {dims.tf}
              </text>
            </svg>
          ) : (
            <svg className="w-64 h-52 drop-shadow-sm select-none" viewBox="0 0 260 210">
              <defs>
                <marker id="cad-arrow" markerHeight="4" markerWidth="4" orient="auto-start-reverse" refX="5" refY="5" viewBox="0 0 10 10">
                  <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#88929b" />
                </marker>
                <marker id="cad-arrow-cyan" markerHeight="4" markerWidth="4" orient="auto-start-reverse" refX="5" refY="5" viewBox="0 0 10 10">
                  <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#0ea5e9" />
                </marker>
              </defs>

              <line x1="20" x2="220" y1="100" y2="100" stroke="#3e4850" strokeWidth="0.8" strokeDasharray="4 2" />
              <line x1="120" x2="120" y1="15" y2="185" stroke="#3e4850" strokeWidth="0.8" strokeDasharray="4 2" />
              <text x="212" y="96" fill="#88929b" fontFamily="JetBrains Mono" fontSize="8">X</text>
              <text x="123" y="24" fill="#88929b" fontFamily="JetBrains Mono" fontSize="8">Y</text>

              <path
                d="M 70 30 
                   L 170 30 
                   L 170 42 
                   L 124 42 
                   L 124 158 
                   L 170 158 
                   L 170 170 
                   L 70 170 
                   L 70 158 
                   L 116 158 
                   L 116 42 
                   L 70 42 Z"
                fill="#181c24"
                stroke="#0ea5e9"
                strokeWidth="1.75"
                strokeLinejoin="round"
              />

              <line x1="70" x2="170" y1="18" y2="18" stroke="#88929b" strokeWidth="0.8" markerStart="url(#cad-arrow)" markerEnd="url(#cad-arrow)" />
              <line x1="70" x2="70" y1="16" y2="28" stroke="#3e4850" strokeWidth="0.7" />
              <line x1="170" x2="170" y1="16" y2="28" stroke="#3e4850" strokeWidth="0.7" />
              <text x="120" y="14" fill="#89ceff" fontFamily="JetBrains Mono" fontSize="9" fontWeight="600" textAnchor="middle">
                bf = {dims.bf} mm
              </text>

              <line x1="180" x2="180" y1="30" y2="42" stroke="#88929b" strokeWidth="0.8" markerStart="url(#cad-arrow)" markerEnd="url(#cad-arrow)" />
              <line x1="172" x2="186" y1="30" y2="30" stroke="#3e4850" strokeWidth="0.7" />
              <line x1="172" x2="186" y1="42" y2="42" stroke="#3e4850" strokeWidth="0.7" />
              <text x="192" y="38" fill="#ffb95f" fontFamily="JetBrains Mono" fontSize="8">
                tf: {dims.tf}
              </text>

              <line x1="50" x2="50" y1="30" y2="170" stroke="#88929b" strokeWidth="0.8" markerStart="url(#cad-arrow)" markerEnd="url(#cad-arrow)" />
              <line x1="44" x2="68" y1="30" y2="30" stroke="#3e4850" strokeWidth="0.7" />
              <line x1="44" x2="68" y1="170" y2="170" stroke="#3e4850" strokeWidth="0.7" />
              <text x="44" y="103" fill="#89ceff" fontFamily="JetBrains Mono" fontSize="9" fontWeight="600" textAnchor="end">
                d = {dims.d}
              </text>

              <line x1="90" x2="114" y1="85" y2="85" stroke="#0ea5e9" strokeWidth="0.8" markerEnd="url(#cad-arrow-cyan)" />
              <text x="86" y="88" fill="#89ceff" fontFamily="JetBrains Mono" fontSize="8" textAnchor="end">
                tw: {dims.tw}
              </text>
            </svg>
          )}
        </div>

        <div className="w-full flex flex-wrap items-center justify-around pt-2.5 border-t border-[#3e4850]/60 font-mono text-[11px] gap-2">
          {selectedType === 'TUB_RET' ? (
            <>
              <span className="text-[#88929b]">
                Altura h: <strong className="text-[#dfe2ee]">{dims.d} mm</strong>
              </span>
              <span className="text-[#88929b]">
                Largura b: <strong className="text-[#dfe2ee]">{dims.bf} mm</strong>
              </span>
              <span className="text-[#88929b]">
                Espessura t: <strong className="text-[#dfe2ee]">{dims.tw} mm</strong>
              </span>
            </>
          ) : selectedType === 'TUB_CIRC' ? (
            <>
              <span className="text-[#88929b]">
                Diâmetro ext. Ø: <strong className="text-[#dfe2ee]">{dims.d} mm</strong>
              </span>
              <span className="text-[#88929b]">
                Espessura t: <strong className="text-[#dfe2ee]">{dims.tw} mm</strong>
              </span>
              <span className="text-[#88929b]">
                Raio R: <strong className="text-[#dfe2ee]">{(dims.d / 2).toFixed(1)} mm</strong>
              </span>
            </>
          ) : selectedType === 'L' ? (
            <>
              <span className="text-[#88929b]">
                Aba a: <strong className="text-[#dfe2ee]">{dims.d} mm</strong>
              </span>
              <span className="text-[#88929b]">
                Aba b: <strong className="text-[#dfe2ee]">{dims.bf} mm</strong>
              </span>
              <span className="text-[#88929b]">
                Espessura t: <strong className="text-[#dfe2ee]">{dims.tf} mm</strong>
              </span>
            </>
          ) : selectedType === 'U' ? (
            <>
              <span className="text-[#88929b]">
                Altura d: <strong className="text-[#dfe2ee]">{dims.d} mm</strong>
              </span>
              <span className="text-[#88929b]">
                Aba bf: <strong className="text-[#dfe2ee]">{dims.bf} mm</strong>
              </span>
              <span className="text-[#88929b]">
                Alma tw: <strong className="text-[#dfe2ee]">{dims.tw} mm</strong>
              </span>
              <span className="text-[#88929b]">
                Mesa tf: <strong className="text-[#dfe2ee]">{dims.tf} mm</strong>
              </span>
            </>
          ) : (
            <>
              <span className="text-[#88929b]">
                Altura d: <strong className="text-[#dfe2ee]">{dims.d} mm</strong>
              </span>
              <span className="text-[#88929b]">
                Largura bf: <strong className="text-[#dfe2ee]">{dims.bf} mm</strong>
              </span>
              <span className="text-[#88929b]">
                Alma tw: <strong className="text-[#dfe2ee]">{dims.tw} mm</strong>
              </span>
              <span className="text-[#88929b]">
                Mesa tf: <strong className="text-[#dfe2ee]">{dims.tf} mm</strong>
              </span>
            </>
          )}
        </div>
      </div>

      {/* 3. Steel Material Selection Card */}
      <section className="bg-[#181c24] border border-[#3e4850] rounded-lg p-2.5 sm:p-3">
        <div className="flex items-center justify-between mb-2 font-mono text-[11px] text-[#bec8d2]">
          <span className="flex items-center gap-1.5 font-bold text-[#dfe2ee]">
            <span className="material-symbols-outlined text-sm text-[#ffb95f]">shield</span>
            Grau do Aço Estrutural (Resistência e Escoamento)
          </span>
          <span className="text-[#88929b]">NBR 8800:2008 / ASTM</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {STEEL_GRADES.map((grade) => {
            const isSelected = selectedSteelGrade.name === grade.name;
            return (
              <button
                key={grade.name}
                type="button"
                onClick={() => onSelectSteelGrade(grade)}
                className={`p-2 rounded text-left transition-all relative border ${
                  isSelected
                    ? 'bg-[#262a33] border-[#89ceff] text-[#89ceff] shadow-sm'
                    : 'bg-[#0a0e16] border-[#3e4850] text-[#bec8d2] hover:text-[#dfe2ee] hover:border-[#88929b]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="block text-[9px] font-mono text-[#88929b]">{grade.category}</span>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#89ceff]"></span>}
                </div>
                <span className="block font-mono text-xs font-bold truncate mt-0.5">{grade.name}</span>
                <span className={`block text-[10px] font-mono ${isSelected ? 'text-[#4edea3]' : 'text-[#ffb95f]'}`}>
                  fy = {grade.fy} MPa
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. Active Profile Technical Overview (CAD Blueprint & Properties) */}
      <section className="bg-[#181c24] border border-[#3e4850] rounded-lg p-3 sm:p-4 relative overflow-hidden">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#3e4850]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-[#0ea5e9]/10 border border-[#0ea5e9]/40 text-[#89ceff]">
              <span className="material-symbols-outlined text-lg">square_foot</span>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <h2 className="font-headline text-lg font-bold text-[#dfe2ee]">
                  {selectedProfile.designation}
                </h2>
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#00b17b]/10 text-[#4edea3] border border-[#00b17b]/30 font-bold">
                  {selectedProfile.tag || 'SEÇÃO ATIVA'}
                </span>
              </div>
              <p className="text-xs text-[#bec8d2]">{selectedProfile.typeDescription}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono">
            <div className="text-right">
              <span className="block text-[10px] text-[#88929b]">MASSA LINEAR</span>
              <span className="text-sm font-bold text-[#ffb95f]">
                {selectedProfile.massLinear} <span className="text-[10px] text-[#88929b]">kg/m</span>
              </span>
            </div>
            <div className="h-6 w-[1px] bg-[#3e4850]"></div>
            <div className="text-right">
              <span className="block text-[10px] text-[#88929b]">ALTURA / DIAM (d)</span>
              <span className="text-sm font-bold text-[#89ceff]">
                {selectedProfile.depth_d} <span className="text-[10px] text-[#88929b]">mm</span>
              </span>
            </div>
          </div>
        </div>

        {/* Geometric Properties Grid */}
        <div className="flex flex-col justify-between space-y-2.5 mt-3">
          <div className="flex items-center justify-between pb-1">
            <span className="font-mono text-[10px] text-[#88929b] uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-[#ffb95f]">analytics</span>
              Propriedades Geométricas Recalculadas
            </span>
            <span className="font-mono text-[10px] text-[#89ceff]">Unidades: cm, cm³, cm⁴</span>
          </div>

          {/* Matrix cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 flex-1">
              {/* Area A */}
              <div className="bg-[#1c2028] p-2.5 rounded border border-[#3e4850] flex flex-col justify-between">
                <span className="font-mono text-[10px] text-[#88929b]">Área da Seção (A)</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="font-mono text-lg font-bold text-[#dfe2ee]">{selectedProfile.area_A}</span>
                  <span className="font-mono text-[10px] text-[#ffb95f]">cm²</span>
                </div>
                <div className="w-full bg-[#262a33] h-1 rounded mt-1.5 overflow-hidden">
                  <div
                    className="bg-[#ffb95f] h-full"
                    style={{ width: `${Math.min(selectedProfile.area_A * 1.5, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Ix */}
              <div className="bg-[#1c2028] p-2.5 rounded border border-[#3e4850] flex flex-col justify-between">
                <span className="font-mono text-[10px] text-[#88929b]">Inércia Eixo Maior (Ix)</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="font-mono text-lg font-bold text-[#89ceff]">
                    {selectedProfile.inertia_Ix.toLocaleString()}
                  </span>
                  <span className="font-mono text-[10px] text-[#89ceff]">cm⁴</span>
                </div>
                <span className="font-mono text-[9px] text-[#88929b]">Rigidez à flexão X</span>
              </div>

              {/* Iy */}
              <div className="bg-[#1c2028] p-2.5 rounded border border-[#3e4850] flex flex-col justify-between">
                <span className="font-mono text-[10px] text-[#88929b]">Inércia Eixo Menor (Iy)</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="font-mono text-lg font-bold text-[#dfe2ee]">{selectedProfile.inertia_Iy}</span>
                  <span className="font-mono text-[10px] text-[#88929b]">cm⁴</span>
                </div>
                <span className="font-mono text-[9px] text-[#88929b]">
                  Ix / Iy = {(selectedProfile.inertia_Ix / (selectedProfile.inertia_Iy || 1)).toFixed(2)}
                </span>
              </div>

              {/* Wx */}
              <div className="bg-[#1c2028] p-2.5 rounded border border-[#3e4850] flex flex-col justify-between">
                <span className="font-mono text-[10px] text-[#88929b]">Mód. Elástico (Wx)</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="font-mono text-lg font-bold text-[#dfe2ee]">{selectedProfile.elasticModulus_Wx}</span>
                  <span className="font-mono text-[10px] text-[#ffb95f]">cm³</span>
                </div>
                <span className="font-mono text-[9px] text-[#4edea3]">Mel = Wx · fy</span>
              </div>

              {/* Zx */}
              <div className="bg-[#1c2028] p-2.5 rounded border border-[#3e4850] flex flex-col justify-between">
                <span className="font-mono text-[10px] text-[#88929b]">Mód. Plástico (Zx)</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="font-mono text-lg font-bold text-[#4edea3]">{selectedProfile.plasticModulus_Zx}</span>
                  <span className="font-mono text-[10px] text-[#4edea3]">cm³</span>
                </div>
                <span className="font-mono text-[9px] text-[#88929b]">
                  Fator forma: {(selectedProfile.plasticModulus_Zx / (selectedProfile.elasticModulus_Wx || 1)).toFixed(2)}
                </span>
              </div>

              {/* Raios rx / ry */}
              <div className="bg-[#1c2028] p-2.5 rounded border border-[#3e4850] flex flex-col justify-between">
                <span className="font-mono text-[10px] text-[#88929b]">Raios de Giração</span>
                <div className="space-y-0.5 mt-1 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-[#88929b]">rx:</span>
                    <span className="text-[#dfe2ee] font-bold">{selectedProfile.radiusGyration_rx} cm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#88929b]">ry:</span>
                    <span className="text-[#dfe2ee] font-bold">{selectedProfile.radiusGyration_ry} cm</span>
                  </div>
                </div>
                <span className="font-mono text-[9px] text-[#88929b]">Esbeltez λ = L / r</span>
              </div>
            </div>

            {/* Section Status Bar */}
            <div className="p-2 rounded bg-[#262a33] border border-[#3e4850] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#4edea3] text-base">check_circle</span>
                <span className="text-xs text-[#dfe2ee]">
                  Classificação da Seção:{' '}
                  <strong className="text-[#4edea3] font-mono">
                    {selectedProfile.webCompact && selectedProfile.flangeCompact
                      ? 'Seção Compacta (NBR 8800)'
                      : 'Seção Não Compacta / Esbelta'}
                  </strong>
                </span>
              </div>
              <span className="font-mono text-[10px] text-[#88929b]">λ &lt; λp (NBR 8800)</span>
            </div>
          </div>
      </section>

      {/* 5. Alternative Recommendations Section */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#ffb95f] text-sm">tune</span>
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#bec8d2] font-bold">
              Alternativas Comerciais Otimizadas (Mesma Tipologia)
            </span>
          </div>
          <span className="font-mono text-[10px] text-[#4edea3] flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">trending_down</span>
            Otimização de Peso e Rigidez
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {alt1 && (
            <div className="bg-[#181c24] border border-[#3e4850] hover:border-[#88929b] rounded p-3 transition-colors flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-[#262a33] border border-[#3e4850] flex flex-col items-center justify-center group-hover:border-[#ffb95f]">
                  <span className="material-symbols-outlined text-[#ffb95f] text-base">height</span>
                  <span className="font-mono text-[8px] text-[#88929b]">{alt1.depth_d}mm</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-mono text-xs font-bold text-[#dfe2ee] group-hover:text-[#89ceff]">
                      {alt1.designation}
                    </h4>
                    <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-[#1c2028] border border-[#3e4850] text-[#bec8d2]">
                      {(alt1.massLinear - selectedProfile.massLinear).toFixed(1)} kg/m
                    </span>
                  </div>
                  <p className="text-xs text-[#88929b]">
                    {alt1.massLinear} kg/m • Opção mais leve no catálogo
                  </p>
                  <div className="flex gap-3 font-mono text-[10px] text-[#bec8d2] mt-1">
                    <span>Wx: {alt1.elasticModulus_Wx} cm³</span>
                    <span>Ix: {alt1.inertia_Ix} cm⁴</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDims({
                    d: alt1.depth_d,
                    bf: alt1.flangeWidth_bf,
                    tw: alt1.webThickness_tw,
                    tf: alt1.flangeThickness_tf,
                  });
                  onSelectProfile(alt1);
                }}
                className="px-2.5 py-1.5 rounded bg-[#262a33] hover:bg-[#31353e] border border-[#3e4850] font-mono text-xs text-[#dfe2ee] group-hover:border-[#89ceff]"
              >
                Carregar Medidas
              </button>
            </div>
          )}

          {alt2 && (
            <div className="bg-[#181c24] border border-[#3e4850] hover:border-[#88929b] rounded p-3 transition-colors flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-[#262a33] border border-[#3e4850] flex flex-col items-center justify-center group-hover:border-[#4edea3]">
                  <span className="material-symbols-outlined text-[#4edea3] text-base">electric_bolt</span>
                  <span className="font-mono text-[8px] text-[#4edea3] font-bold">Rigidez</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-mono text-xs font-bold text-[#dfe2ee] group-hover:text-[#89ceff]">
                      {alt2.designation}
                    </h4>
                    <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-[#00b17b]/10 border border-[#00b17b]/30 text-[#4edea3] font-bold">
                      Maior Inércia
                    </span>
                  </div>
                  <p className="text-xs text-[#88929b]">
                    {alt2.massLinear} kg/m • Maior inércia à flexão (Ix={alt2.inertia_Ix} cm⁴)
                  </p>
                  <div className="flex gap-3 font-mono text-[10px] text-[#bec8d2] mt-1">
                    <span>Wx: {alt2.elasticModulus_Wx} cm³</span>
                    <span className="text-[#4edea3] font-bold">Ix: {alt2.inertia_Ix} cm⁴</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDims({
                    d: alt2.depth_d,
                    bf: alt2.flangeWidth_bf,
                    tw: alt2.webThickness_tw,
                    tf: alt2.flangeThickness_tf,
                  });
                  onSelectProfile(alt2);
                }}
                className="px-2.5 py-1.5 rounded bg-[#262a33] hover:bg-[#31353e] border border-[#3e4850] font-mono text-xs text-[#dfe2ee] group-hover:border-[#4edea3]"
              >
                Carregar Medidas
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 6. Bottom Action Trigger */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onConfirmCalculate}
          className="w-full h-12 bg-[#89ceff] text-[#00344d] font-headline font-bold text-sm rounded flex items-center justify-center gap-2 shadow-lg hover:brightness-110 active:scale-[0.99] transition-all duration-150"
        >
          <span className="material-symbols-outlined text-xl">calculate</span>
          <span>Confirmar e Calcular Diagramas com este Perfil</span>
        </button>
        <p className="text-center font-mono text-[10px] text-[#88929b] mt-1.5">
          Atualiza automaticamente esforços cortantes (SFD), momentos fletores (BMD), tensões combinadas e flecha máxima L/d.
        </p>
      </div>
    </div>
  );
};
