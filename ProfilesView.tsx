import React, { useState, useEffect, useMemo } from 'react';
import { STEEL_GRADES, STEEL_PROFILES } from '../data/profiles';
import { ProfileFamily, SteelGrade, SteelProfile } from '../types';
import { ProfileCrossSectionSvg } from './ProfileCrossSectionSvg';
import { computeSectionProperties, MainProfileType, SectionDimensions } from '../utils/sectionCalculator';

interface ProfilesViewProps {
  selectedProfile: SteelProfile;
  selectedSteelGrade: SteelGrade;
  onSelectProfile: (profile: SteelProfile) => void;
  onSelectSteelGrade: (grade: SteelGrade) => void;
  onConfirmCalculate: () => void;
}

function getProfileTypeKey(family: ProfileFamily): MainProfileType {
  if (family === 'U') return 'U';
  if (family === 'HSS' || family === 'TUB_RET' || family === 'TUB_QUAD') return 'TUB_RET';
  if (family === 'L') return 'L';
  if (family === 'TUB_CIRC') return 'TUB_CIRC';
  return 'I';
}

export const ProfilesView: React.FC<ProfilesViewProps> = ({
  selectedProfile,
  selectedSteelGrade,
  onSelectProfile,
  onSelectSteelGrade,
  onConfirmCalculate,
}) => {
  const [selectedFamily, setSelectedFamily] = useState<ProfileFamily>(selectedProfile.family || 'W');

  // Dimensions state for real-time section customization
  const [dims, setDims] = useState<SectionDimensions>({
    d: selectedProfile.depth_d,
    bf: selectedProfile.flangeWidth_bf,
    tw: selectedProfile.webThickness_tw,
    tf: selectedProfile.flangeThickness_tf,
  });

  const [inputD, setInputD] = useState<string>(String(selectedProfile.depth_d));
  const [inputBf, setInputBf] = useState<string>(String(selectedProfile.flangeWidth_bf));
  const [inputTw, setInputTw] = useState<string>(String(selectedProfile.webThickness_tw));
  const [inputTf, setInputTf] = useState<string>(String(selectedProfile.flangeThickness_tf));

  // Base profile from official catalog
  const catalogBaseProfile = useMemo(() => {
    return (
      STEEL_PROFILES.find((p) => p.id === selectedProfile.id) ||
      STEEL_PROFILES.find((p) => selectedProfile.id.startsWith(`custom-${p.id}`)) ||
      STEEL_PROFILES.find((p) => p.family === selectedProfile.family) ||
      STEEL_PROFILES[0]
    );
  }, [selectedProfile.id, selectedProfile.family]);

  // Synchronize when selectedProfile changes externally (e.g. clicking catalog button or search)
  useEffect(() => {
    setDims({
      d: selectedProfile.depth_d,
      bf: selectedProfile.flangeWidth_bf,
      tw: selectedProfile.webThickness_tw,
      tf: selectedProfile.flangeThickness_tf,
    });
    setInputD(String(selectedProfile.depth_d));
    setInputBf(String(selectedProfile.flangeWidth_bf));
    setInputTw(String(selectedProfile.webThickness_tw));
    setInputTf(String(selectedProfile.flangeThickness_tf));
    if (selectedProfile.family) {
      setSelectedFamily(selectedProfile.family);
    }
  }, [selectedProfile.id]);

  const isModified = useMemo(() => {
    if (!catalogBaseProfile) return false;
    return (
      Math.abs(dims.d - catalogBaseProfile.depth_d) > 0.05 ||
      Math.abs(dims.bf - catalogBaseProfile.flangeWidth_bf) > 0.05 ||
      Math.abs(dims.tw - catalogBaseProfile.webThickness_tw) > 0.05 ||
      Math.abs(dims.tf - catalogBaseProfile.flangeThickness_tf) > 0.05
    );
  }, [dims, catalogBaseProfile]);

  const typeKey = useMemo(() => getProfileTypeKey(selectedProfile.family), [selectedProfile.family]);

  const dimLabels = useMemo(() => {
    const fam = selectedProfile.family;
    if (fam === 'HSS' || fam === 'TUB_RET' || fam === 'TUB_QUAD') {
      return {
        d: { title: 'Altura Externa (h)', symbol: 'h', desc: 'Dimensão vertical externa', step: 5 },
        bf: { title: 'Largura Externa (b)', symbol: 'b', desc: 'Dimensão horizontal externa', step: 5 },
        tw: { title: 'Espessura Alma/Parede (tw)', symbol: 'tw', desc: 'Espessura chapa vertical', step: 0.5 },
        tf: { title: 'Espessura Mesa/Parede (tf)', symbol: 'tf', desc: 'Espessura chapa horizontal', step: 0.5 },
      };
    }
    if (fam === 'U') {
      return {
        d: { title: 'Altura do Canal (d)', symbol: 'd', desc: 'Altura externa da alma', step: 5 },
        bf: { title: 'Largura da Aba (bf)', symbol: 'bf', desc: 'Largura das mesas', step: 5 },
        tw: { title: 'Espessura da Alma (tw)', symbol: 'tw', desc: 'Espessura chapa alma', step: 0.5 },
        tf: { title: 'Espessura da Mesa (tf)', symbol: 'tf', desc: 'Espessura chapa abas', step: 0.5 },
      };
    }
    if (fam === 'L') {
      return {
        d: { title: 'Aba Vertical (a)', symbol: 'a', desc: 'Comprimento da aba a', step: 5 },
        bf: { title: 'Aba Horizontal (b)', symbol: 'b', desc: 'Comprimento da aba b', step: 5 },
        tw: { title: 'Espessura da Aba (t)', symbol: 't', desc: 'Espessura da chapa', step: 0.5 },
        tf: { title: 'Espessura da Aba (t)', symbol: 't', desc: 'Espessura da chapa', step: 0.5 },
      };
    }
    if (fam === 'TUB_CIRC') {
      return {
        d: { title: 'Diâmetro Externo (Ø)', symbol: 'Ø', desc: 'Diâmetro externo total', step: 5 },
        bf: { title: 'Diâmetro Externo (Ø)', symbol: 'Ø', desc: 'Diâmetro externo total', step: 5 },
        tw: { title: 'Espessura Parede (t)', symbol: 't', desc: 'Espessura da parede do tubo', step: 0.5 },
        tf: { title: 'Espessura Parede (t)', symbol: 't', desc: 'Espessura da parede do tubo', step: 0.5 },
      };
    }
    return {
      d: { title: 'Altura Total (d)', symbol: 'd', desc: 'Altura total da viga', step: 5 },
      bf: { title: 'Largura da Mesa (bf)', symbol: 'bf', desc: 'Largura flanges sup./inf.', step: 5 },
      tw: { title: 'Espessura da Alma (tw)', symbol: 'tw', desc: 'Espessura chapa vertical', step: 0.5 },
      tf: { title: 'Espessura da Mesa (tf)', symbol: 'tf', desc: 'Espessura flanges horizontais', step: 0.5 },
    };
  }, [selectedProfile.family]);

  const applyDimensions = (newDims: SectionDimensions) => {
    const cleanDims = { ...newDims };
    if (selectedProfile.family === 'TUB_CIRC') {
      cleanDims.bf = cleanDims.d;
      cleanDims.tf = cleanDims.tw;
    }

    setDims(cleanDims);
    setInputD(String(cleanDims.d));
    setInputBf(String(cleanDims.bf));
    setInputTw(String(cleanDims.tw));
    setInputTf(String(cleanDims.tf));

    const matchesCatalog =
      catalogBaseProfile &&
      Math.abs(cleanDims.d - catalogBaseProfile.depth_d) < 0.01 &&
      Math.abs(cleanDims.bf - catalogBaseProfile.flangeWidth_bf) < 0.01 &&
      Math.abs(cleanDims.tw - catalogBaseProfile.webThickness_tw) < 0.01 &&
      Math.abs(cleanDims.tf - catalogBaseProfile.flangeThickness_tf) < 0.01;

    if (matchesCatalog) {
      onSelectProfile(catalogBaseProfile);
    } else {
      const baseName = (catalogBaseProfile?.designation || selectedProfile.designation).split(' (')[0];
      const customProfile = computeSectionProperties(
        typeKey,
        cleanDims,
        selectedProfile.family === 'TUB_CIRC'
          ? `${baseName} (Editado Ø${cleanDims.d}x${cleanDims.tw})`
          : `${baseName} (Editado ${cleanDims.d}x${cleanDims.bf})`
      );
      onSelectProfile({
        ...customProfile,
        id: `custom-${catalogBaseProfile?.id || 'prof'}-${cleanDims.d}-${cleanDims.bf}-${cleanDims.tw}-${cleanDims.tf}`,
        family: selectedProfile.family,
        tag: 'EDITADO',
      });
    }
  };

  const handleInputChange = (field: keyof SectionDimensions, strVal: string) => {
    if (field === 'd') {
      setInputD(strVal);
      if (selectedProfile.family === 'TUB_CIRC') setInputBf(strVal);
    }
    if (field === 'bf') {
      setInputBf(strVal);
      if (selectedProfile.family === 'TUB_CIRC') setInputD(strVal);
    }
    if (field === 'tw') {
      setInputTw(strVal);
      if (selectedProfile.family === 'TUB_CIRC') setInputTf(strVal);
    }
    if (field === 'tf') {
      setInputTf(strVal);
      if (selectedProfile.family === 'TUB_CIRC') setInputTw(strVal);
    }

    const val = parseFloat(strVal);
    if (!isNaN(val) && val > 0) {
      const newDims: SectionDimensions = {
        ...dims,
        [field]: val,
      };
      if (selectedProfile.family === 'TUB_CIRC') {
        if (field === 'd' || field === 'bf') {
          newDims.d = val;
          newDims.bf = val;
        }
        if (field === 'tw' || field === 'tf') {
          newDims.tw = val;
          newDims.tf = val;
        }
      }
      applyDimensions(newDims);
    }
  };

  const stepDimension = (field: keyof SectionDimensions, delta: number) => {
    const current = dims[field];
    const isThickness = field === 'tw' || field === 'tf';
    const minVal = isThickness ? 0.5 : 10;
    const nextVal = Math.max(minVal, Number((current + delta).toFixed(isThickness ? 2 : 1)));
    const newDims: SectionDimensions = {
      ...dims,
      [field]: nextVal,
    };
    if (selectedProfile.family === 'TUB_CIRC') {
      if (field === 'd' || field === 'bf') {
        newDims.d = nextVal;
        newDims.bf = nextVal;
      }
      if (field === 'tw' || field === 'tf') {
        newDims.tw = nextVal;
        newDims.tf = nextVal;
      }
    }
    applyDimensions(newDims);
  };

  const handleResetDimensions = () => {
    if (catalogBaseProfile) {
      const resetDims: SectionDimensions = {
        d: catalogBaseProfile.depth_d,
        bf: catalogBaseProfile.flangeWidth_bf,
        tw: catalogBaseProfile.webThickness_tw,
        tf: catalogBaseProfile.flangeThickness_tf,
      };
      applyDimensions(resetDims);
      onSelectProfile(catalogBaseProfile);
    }
  };

  const families: { key: ProfileFamily; label: string; sub: string; symbol: string }[] = [
    { key: 'W', label: 'Perfis W', sub: 'Laminados I/H', symbol: 'W' },
    { key: 'I', label: 'Perfis I', sub: 'Padrão Americano', symbol: 'I' },
    { key: 'U', label: 'Perfis U', sub: 'Canais Dobrados/Lam', symbol: '[' },
    { key: 'HSS', label: 'Tubulares Ret.', sub: 'HSS Retangulares', symbol: '□' },
    { key: 'TUB_CIRC', label: 'Circulares', sub: 'Tubos Redondos / CHS', symbol: '○' },
  ];

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-3 sm:px-4 py-2 pb-24 space-y-4">
      {/* Section Type Selector Tabs */}
      <section className="mt-1">
        <div className="flex items-center justify-between mb-1.5 font-mono text-[10px]">
          <span className="uppercase tracking-wider text-[#bec8d2] flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-[#89ceff]">view_column</span>
            Tipologia da Seção Transversal
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
          {families.map((fam) => {
            const isActive = selectedFamily === fam.key;
            return (
              <button
                key={fam.key}
                type="button"
                onClick={() => {
                  setSelectedFamily(fam.key);
                  const firstOfFam = STEEL_PROFILES.find((p) => p.family === fam.key);
                  if (firstOfFam) onSelectProfile(firstOfFam);
                }}
                className={`flex items-center gap-2.5 p-2.5 rounded transition-all duration-150 relative text-left ${
                  isActive
                    ? 'bg-[#262a33] border border-[#89ceff] text-[#89ceff]'
                    : 'bg-[#181c24] border border-[#3e4850] hover:border-[#88929b] text-[#bec8d2] hover:text-[#dfe2ee]'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded bg-[#0a0e16] flex items-center justify-center border ${
                    isActive ? 'border-[#89ceff]/40 text-[#89ceff]' : 'border-[#3e4850] text-[#bec8d2]'
                  }`}
                >
                  <span className="font-mono text-xs font-bold">{fam.symbol}</span>
                </div>
                <div>
                  <span className="block font-mono text-xs font-bold">{fam.label}</span>
                  <span className="block text-[10px] text-[#88929b]">{fam.sub}</span>
                </div>
                {isActive && <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#ffb95f]"></span>}
              </button>
            );
          })}
        </div>
      </section>

      {/* Steel Material Filter */}
      <section className="bg-[#181c24] border border-[#3e4850] rounded-lg p-3">
        <div className="flex items-center justify-between mb-2 font-mono text-[10px]">
          <span className="uppercase tracking-wider text-[#bec8d2] flex items-center gap-1.5 font-bold">
            <span className="material-symbols-outlined text-sm text-[#ffb95f]">science</span>
            Especificação do Aço Estrutural
          </span>
          <span className="text-[#88929b]">TENSÃO DE ESCOAMENTO FY</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-[#0a0e16] p-1.5 rounded border border-[#3e4850]">
          {STEEL_GRADES.map((grade) => {
            const isSelected = selectedSteelGrade.name === grade.name;
            return (
              <button
                key={grade.name}
                type="button"
                onClick={() => onSelectSteelGrade(grade)}
                className={`px-3 py-2 rounded text-left transition-all relative ${
                  isSelected
                    ? 'bg-[#262a33] border border-[#89ceff] text-[#89ceff]'
                    : 'bg-[#181c24] border border-[#3e4850] text-[#bec8d2] hover:text-[#dfe2ee]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="block text-[9px] font-mono text-[#88929b]">{grade.category}</span>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#89ceff]"></span>}
                </div>
                <span className="block font-mono text-xs font-bold truncate">{grade.name}</span>
                <span className={`block text-[10px] font-mono ${isSelected ? 'text-[#4edea3]' : 'text-[#ffb95f]'}`}>
                  fy = {grade.fy} MPa • E = {grade.E} GPa
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Selected Profile Card (Hero Bento Layout) */}
      <section className="bg-[#181c24] border border-[#3e4850] rounded-lg p-3 sm:p-4 relative overflow-hidden space-y-4">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#3e4850]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-[#0ea5e9]/10 border border-[#0ea5e9]/40 text-[#89ceff]">
              <span className="material-symbols-outlined text-lg">square_foot</span>
            </div>
            <div>
              <h2 className="font-headline text-lg font-bold text-[#dfe2ee]">
                {selectedProfile.designation}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3 font-mono">
            {isModified && (
              <button
                type="button"
                onClick={handleResetDimensions}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#262a33] hover:bg-[#31353e] border border-[#3e4850] hover:border-[#89ceff] text-xs font-mono text-[#89ceff] transition-colors"
                title="Restaurar dimensões nominais da tabela original"
              >
                <span className="material-symbols-outlined text-sm">restart_alt</span>
                <span>Restaurar Catálogo</span>
              </button>
            )}
            <div className="text-right">
              <span className="block text-[10px] text-[#88929b]">MASSA LINEAR</span>
              <span className="text-sm font-bold text-[#ffb95f]">
                {selectedProfile.massLinear} <span className="text-[10px] text-[#88929b]">kg/m</span>
              </span>
            </div>
            <div className="h-6 w-[1px] bg-[#3e4850]"></div>
            <div className="text-right">
              <span className="block text-[10px] text-[#88929b]">ALTURA (d)</span>
              <span className="text-sm font-bold text-[#89ceff]">
                {selectedProfile.depth_d} <span className="text-[10px] text-[#88929b]">mm</span>
              </span>
            </div>
          </div>
        </div>

        {/* Painel Interativo: Edição das Dimensões dos Perfis */}
        <div className="bg-[#12161f] border border-[#3e4850] rounded-lg p-3 sm:p-3.5 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-1.5 border-b border-[#3e4850]/50 font-mono text-xs">
            <span className="text-[#89ceff] font-bold flex items-center gap-1.5 uppercase tracking-wide">
              <span className="material-symbols-outlined text-[16px] text-[#89ceff]">edit</span>
              Edição das Dimensões do Perfil
            </span>
            <span className="text-[10px] text-[#88929b]">
              Ajuste as cotas nominais para cálculo em tempo real
            </span>
          </div>

          {selectedProfile.family === 'TUB_CIRC' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Campo Diâmetro Externo Ø */}
              <div className="bg-[#181c24] border border-[#3e4850] rounded p-2.5 flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#89ceff] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-[#89ceff]">radio_button_unchecked</span>
                    Diâmetro Externo (Ø)
                  </span>
                  <span className="font-mono text-[10px] text-[#88929b] font-semibold">Ø</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => stepDimension('d', -5)}
                    className="w-7 h-7 bg-[#262a33] hover:bg-[#31353e] text-[#dfe2ee] rounded flex items-center justify-center font-bold border border-[#3e4850] transition-colors shrink-0 select-none active:scale-95"
                    title="Diminuir 5 mm"
                  >
                    -
                  </button>
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step={5}
                      min={10}
                      value={inputD}
                      onChange={(e) => handleInputChange('d', e.target.value)}
                      className="w-full bg-[#0a0e16] border border-[#3e4850] rounded px-2 py-1 text-center font-mono text-xs text-[#89ceff] font-bold focus:border-[#89ceff] focus:outline-none"
                    />
                  </div>
                  <span className="font-mono text-xs text-[#88929b] shrink-0">mm</span>
                  <button
                    type="button"
                    onClick={() => stepDimension('d', 5)}
                    className="w-7 h-7 bg-[#262a33] hover:bg-[#31353e] text-[#dfe2ee] rounded flex items-center justify-center font-bold border border-[#3e4850] transition-colors shrink-0 select-none active:scale-95"
                    title="Aumentar 5 mm"
                  >
                    +
                  </button>
                </div>
                <div className="flex items-center justify-between font-mono text-[10px] text-[#88929b]">
                  <span>Diâmetro externo total da seção circular</span>
                  {catalogBaseProfile && (
                    <span className="text-[#bec8d2]">Catálogo: {catalogBaseProfile.depth_d}mm</span>
                  )}
                </div>
              </div>

              {/* Campo Espessura da Parede t */}
              <div className="bg-[#181c24] border border-[#3e4850] rounded p-2.5 flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#89ceff] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-[#89ceff]">line_weight</span>
                    Espessura da Parede (t)
                  </span>
                  <span className="font-mono text-[10px] text-[#88929b] font-semibold">t</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => stepDimension('tw', -0.5)}
                    className="w-7 h-7 bg-[#262a33] hover:bg-[#31353e] text-[#dfe2ee] rounded flex items-center justify-center font-bold border border-[#3e4850] transition-colors shrink-0 select-none active:scale-95"
                    title="Diminuir 0.5 mm"
                  >
                    -
                  </button>
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step={0.5}
                      min={0.5}
                      value={inputTw}
                      onChange={(e) => handleInputChange('tw', e.target.value)}
                      className="w-full bg-[#0a0e16] border border-[#3e4850] rounded px-2 py-1 text-center font-mono text-xs text-[#89ceff] font-bold focus:border-[#89ceff] focus:outline-none"
                    />
                  </div>
                  <span className="font-mono text-xs text-[#88929b] shrink-0">mm</span>
                  <button
                    type="button"
                    onClick={() => stepDimension('tw', 0.5)}
                    className="w-7 h-7 bg-[#262a33] hover:bg-[#31353e] text-[#dfe2ee] rounded flex items-center justify-center font-bold border border-[#3e4850] transition-colors shrink-0 select-none active:scale-95"
                    title="Aumentar 0.5 mm"
                  >
                    +
                  </button>
                </div>
                <div className="flex items-center justify-between font-mono text-[10px] text-[#88929b]">
                  <span>Espessura da chapa de aço da parede</span>
                  {catalogBaseProfile && (
                    <span className="text-[#bec8d2]">Catálogo: {catalogBaseProfile.webThickness_tw}mm</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Campo Altura d */}
              <div className="bg-[#181c24] border border-[#3e4850] rounded p-2.5 flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#89ceff] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-[#89ceff]">height</span>
                    {dimLabels.d.title}
                  </span>
                  <span className="font-mono text-[10px] text-[#88929b] font-semibold">{dimLabels.d.symbol}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => stepDimension('d', -dimLabels.d.step)}
                    className="w-7 h-7 bg-[#262a33] hover:bg-[#31353e] text-[#dfe2ee] rounded flex items-center justify-center font-bold border border-[#3e4850] transition-colors shrink-0 select-none active:scale-95"
                    title={`Diminuir ${dimLabels.d.step} mm`}
                  >
                    -
                  </button>
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step={dimLabels.d.step}
                      min={10}
                      value={inputD}
                      onChange={(e) => handleInputChange('d', e.target.value)}
                      className="w-full bg-[#0a0e16] border border-[#3e4850] rounded px-2 py-1 text-center font-mono text-xs text-[#89ceff] font-bold focus:border-[#89ceff] focus:outline-none"
                    />
                  </div>
                  <span className="font-mono text-xs text-[#88929b] shrink-0">mm</span>
                  <button
                    type="button"
                    onClick={() => stepDimension('d', dimLabels.d.step)}
                    className="w-7 h-7 bg-[#262a33] hover:bg-[#31353e] text-[#dfe2ee] rounded flex items-center justify-center font-bold border border-[#3e4850] transition-colors shrink-0 select-none active:scale-95"
                    title={`Aumentar ${dimLabels.d.step} mm`}
                  >
                    +
                  </button>
                </div>
                <div className="flex items-center justify-between font-mono text-[10px] text-[#88929b]">
                  <span>{dimLabels.d.desc}</span>
                  {catalogBaseProfile && (
                    <span className="text-[#bec8d2]">Catálogo: {catalogBaseProfile.depth_d}mm</span>
                  )}
                </div>
              </div>

              {/* Campo Largura bf */}
              <div className="bg-[#181c24] border border-[#3e4850] rounded p-2.5 flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#89ceff] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-[#89ceff]">straighten</span>
                    {dimLabels.bf.title}
                  </span>
                  <span className="font-mono text-[10px] text-[#88929b] font-semibold">{dimLabels.bf.symbol}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => stepDimension('bf', -dimLabels.bf.step)}
                    className="w-7 h-7 bg-[#262a33] hover:bg-[#31353e] text-[#dfe2ee] rounded flex items-center justify-center font-bold border border-[#3e4850] transition-colors shrink-0 select-none active:scale-95"
                    title={`Diminuir ${dimLabels.bf.step} mm`}
                  >
                    -
                  </button>
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step={dimLabels.bf.step}
                      min={10}
                      value={inputBf}
                      onChange={(e) => handleInputChange('bf', e.target.value)}
                      className="w-full bg-[#0a0e16] border border-[#3e4850] rounded px-2 py-1 text-center font-mono text-xs text-[#89ceff] font-bold focus:border-[#89ceff] focus:outline-none"
                    />
                  </div>
                  <span className="font-mono text-xs text-[#88929b] shrink-0">mm</span>
                  <button
                    type="button"
                    onClick={() => stepDimension('bf', dimLabels.bf.step)}
                    className="w-7 h-7 bg-[#262a33] hover:bg-[#31353e] text-[#dfe2ee] rounded flex items-center justify-center font-bold border border-[#3e4850] transition-colors shrink-0 select-none active:scale-95"
                    title={`Aumentar ${dimLabels.bf.step} mm`}
                  >
                    +
                  </button>
                </div>
                <div className="flex items-center justify-between font-mono text-[10px] text-[#88929b]">
                  <span>{dimLabels.bf.desc}</span>
                  {catalogBaseProfile && (
                    <span className="text-[#bec8d2]">Catálogo: {catalogBaseProfile.flangeWidth_bf}mm</span>
                  )}
                </div>
              </div>

              {/* Campo Espessura Alma tw */}
              <div className="bg-[#181c24] border border-[#3e4850] rounded p-2.5 flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#89ceff] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-[#89ceff]">line_weight</span>
                    {dimLabels.tw.title}
                  </span>
                  <span className="font-mono text-[10px] text-[#88929b] font-semibold">{dimLabels.tw.symbol}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => stepDimension('tw', -dimLabels.tw.step)}
                    className="w-7 h-7 bg-[#262a33] hover:bg-[#31353e] text-[#dfe2ee] rounded flex items-center justify-center font-bold border border-[#3e4850] transition-colors shrink-0 select-none active:scale-95"
                    title={`Diminuir ${dimLabels.tw.step} mm`}
                  >
                    -
                  </button>
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step={dimLabels.tw.step}
                      min={0.5}
                      value={inputTw}
                      onChange={(e) => handleInputChange('tw', e.target.value)}
                      className="w-full bg-[#0a0e16] border border-[#3e4850] rounded px-2 py-1 text-center font-mono text-xs text-[#89ceff] font-bold focus:border-[#89ceff] focus:outline-none"
                    />
                  </div>
                  <span className="font-mono text-xs text-[#88929b] shrink-0">mm</span>
                  <button
                    type="button"
                    onClick={() => stepDimension('tw', dimLabels.tw.step)}
                    className="w-7 h-7 bg-[#262a33] hover:bg-[#31353e] text-[#dfe2ee] rounded flex items-center justify-center font-bold border border-[#3e4850] transition-colors shrink-0 select-none active:scale-95"
                    title={`Aumentar ${dimLabels.tw.step} mm`}
                  >
                    +
                  </button>
                </div>
                <div className="flex items-center justify-between font-mono text-[10px] text-[#88929b]">
                  <span>{dimLabels.tw.desc}</span>
                  {catalogBaseProfile && (
                    <span className="text-[#bec8d2]">Catálogo: {catalogBaseProfile.webThickness_tw}mm</span>
                  )}
                </div>
              </div>

              {/* Campo Espessura Mesa tf */}
              <div className="bg-[#181c24] border border-[#3e4850] rounded p-2.5 flex flex-col justify-between space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#89ceff] flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm text-[#89ceff]">border_all</span>
                    {dimLabels.tf.title}
                  </span>
                  <span className="font-mono text-[10px] text-[#88929b] font-semibold">{dimLabels.tf.symbol}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => stepDimension('tf', -dimLabels.tf.step)}
                    className="w-7 h-7 bg-[#262a33] hover:bg-[#31353e] text-[#dfe2ee] rounded flex items-center justify-center font-bold border border-[#3e4850] transition-colors shrink-0 select-none active:scale-95"
                    title={`Diminuir ${dimLabels.tf.step} mm`}
                  >
                    -
                  </button>
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step={dimLabels.tf.step}
                      min={0.5}
                      value={inputTf}
                      onChange={(e) => handleInputChange('tf', e.target.value)}
                      className="w-full bg-[#0a0e16] border border-[#3e4850] rounded px-2 py-1 text-center font-mono text-xs text-[#89ceff] font-bold focus:border-[#89ceff] focus:outline-none"
                    />
                  </div>
                  <span className="font-mono text-xs text-[#88929b] shrink-0">mm</span>
                  <button
                    type="button"
                    onClick={() => stepDimension('tf', dimLabels.tf.step)}
                    className="w-7 h-7 bg-[#262a33] hover:bg-[#31353e] text-[#dfe2ee] rounded flex items-center justify-center font-bold border border-[#3e4850] transition-colors shrink-0 select-none active:scale-95"
                    title={`Aumentar ${dimLabels.tf.step} mm`}
                  >
                    +
                  </button>
                </div>
                <div className="flex items-center justify-between font-mono text-[10px] text-[#88929b]">
                  <span>{dimLabels.tf.desc}</span>
                  {catalogBaseProfile && (
                    <span className="text-[#bec8d2]">Catálogo: {catalogBaseProfile.flangeThickness_tf}mm</span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bento Grid: CAD Blueprint & Properties */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-3">
          {/* CAD Cross-Section Technical Blueprint Viewport */}
          <div className="lg:col-span-5 bg-[#0a0e16] border border-[#3e4850] rounded p-3 relative flex flex-col items-center justify-between blueprint-grid min-h-[300px]">
            <div className="w-full flex items-center justify-between font-mono text-[10px] text-[#88929b]">
              <span className="flex items-center gap-1 text-[#89ceff]">
                <span className="material-symbols-outlined text-xs">tune</span>
                SEÇÃO {selectedProfile.family} (COTAS EM TEMPO REAL)
              </span>
              <span className="text-[#89ceff]">EIXOS X-X / Y-Y</span>
            </div>

            {/* SVG Precision Blueprint */}
            <div className="w-full py-1 flex items-center justify-center">
              <ProfileCrossSectionSvg type={typeKey} dims={dims} />
            </div>

            <div className="w-full flex items-center justify-around pt-2 border-t border-[#3e4850]/60 font-mono text-[10px]">
              {selectedProfile.family === 'TUB_CIRC' ? (
                <>
                  <span className="text-[#88929b]">
                    Ø (Diâmetro): <strong className="text-[#89ceff]">{dims.d} mm</strong>
                  </span>
                  <span className="text-[#88929b]">
                    t (Parede): <strong className="text-[#dfe2ee]">{dims.tw} mm</strong>
                  </span>
                  <span className="text-[#88929b]">
                    di (Interno): <strong className="text-[#dfe2ee]">{(dims.d - 2 * dims.tw).toFixed(1)} mm</strong>
                  </span>
                </>
              ) : (
                <>
                  <span className="text-[#88929b]">
                    {dimLabels.tw.symbol}: <strong className="text-[#dfe2ee]">{dims.tw} mm</strong>
                  </span>
                  <span className="text-[#88929b]">
                    {dimLabels.tf.symbol}: <strong className="text-[#dfe2ee]">{dims.tf} mm</strong>
                  </span>
                  <span className="text-[#88929b]">
                    {dimLabels.bf.symbol}: <strong className="text-[#dfe2ee]">{dims.bf} mm</strong>
                  </span>
                  <span className="text-[#88929b]">
                    {dimLabels.d.symbol}: <strong className="text-[#89ceff]">{dims.d} mm</strong>
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Geometric Properties Grid */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-2.5">
            <div className="flex items-center justify-between pb-1">
              <span className="font-mono text-[10px] text-[#88929b] uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-[#ffb95f]">analytics</span>
                Propriedades Geométricas da Seção
              </span>
              <span className="font-mono text-[10px] text-[#89ceff]">Unidades: cm, cm³, cm⁴</span>
            </div>

            {/* Matrix cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 flex-1">
              {/* Area A */}
              <div className="bg-[#1c2028] p-2.5 rounded border border-[#3e4850] flex flex-col justify-between">
                <span className="font-mono text-[10px] text-[#88929b]">Área da Seção (A)</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className="font-mono text-lg font-bold text-[#dfe2ee]">{selectedProfile.area_A}</span>
                  <span className="font-mono text-[10px] text-[#ffb95f]">cm²</span>
                </div>
                <div className="w-full bg-[#262a33] h-1 rounded mt-1.5 overflow-hidden">
                  <div className="bg-[#ffb95f] h-full" style={{ width: `${Math.min(selectedProfile.area_A * 1.5, 100)}%` }}></div>
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
                  Ix / Iy = {(selectedProfile.inertia_Ix / selectedProfile.inertia_Iy).toFixed(2)}
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
                  Fator forma: {(selectedProfile.plasticModulus_Zx / selectedProfile.elasticModulus_Wx).toFixed(2)}
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
                  Classe da Seção: <strong className="text-[#4edea3] font-mono">Compacta (Mesa e Alma)</strong>
                </span>
              </div>
              <span className="font-mono text-[10px] text-[#88929b]">λ &lt; λp (Seção Compacta)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Action Trigger */}
      <div className="pt-2">
        <button
          type="button"
          onClick={onConfirmCalculate}
          className="w-full h-12 bg-[#89ceff] text-[#00344d] font-headline font-bold text-sm rounded flex items-center justify-center gap-2 shadow-lg hover:brightness-110 active:scale-[0.99] transition-all duration-150"
        >
          <span className="material-symbols-outlined text-xl">calculate</span>
          <span>Confirmar e Calcular Diagramas</span>
        </button>
      </div>
    </div>
  );
};
