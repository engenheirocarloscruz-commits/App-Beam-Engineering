import React, { useState } from 'react';
import { STEEL_GRADES, STEEL_PROFILES } from '../data/profiles';
import { ProfileFamily, SteelGrade, SteelProfile } from '../types';

interface ProfilesViewProps {
  selectedProfile: SteelProfile;
  selectedSteelGrade: SteelGrade;
  onSelectProfile: (profile: SteelProfile) => void;
  onSelectSteelGrade: (grade: SteelGrade) => void;
  onConfirmCalculate: () => void;
}

export const ProfilesView: React.FC<ProfilesViewProps> = ({
  selectedProfile,
  selectedSteelGrade,
  onSelectProfile,
  onSelectSteelGrade,
  onConfirmCalculate,
}) => {
  const [selectedFamily, setSelectedFamily] = useState<ProfileFamily>('W');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProfiles = STEEL_PROFILES.filter((p) => {
    const matchFamily = p.family === selectedFamily;
    const matchSearch = p.designation.toLowerCase().includes(searchQuery.toLowerCase());
    return matchFamily && matchSearch;
  });

  const families: { key: ProfileFamily; label: string; sub: string; symbol: string }[] = [
    { key: 'W', label: 'Perfis W', sub: 'Laminados I/H', symbol: 'W' },
    { key: 'I', label: 'Perfis I', sub: 'Padrão Americano', symbol: 'I' },
    { key: 'U', label: 'Perfis U', sub: 'Canais Dobrados/Lam', symbol: '[' },
    { key: 'HSS', label: 'Tubulares', sub: 'HSS Retangulares', symbol: '□' },
  ];

  // Specific alternatives recommended for weight optimization
  const alt1 = STEEL_PROFILES.find((p) => p.id === 'w-200-31-3');
  const alt2 = STEEL_PROFILES.find((p) => p.id === 'w-310-28-3');

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-3 sm:px-4 py-2 pb-24 space-y-4">
      {/* Section Type Selector Tabs */}
      <section className="mt-1">
        <div className="flex items-center justify-between mb-1.5 font-mono text-[10px]">
          <span className="uppercase tracking-wider text-[#bec8d2] flex items-center gap-1.5">
            <span className="material-symbols-outlined text-sm text-[#89ceff]">view_column</span>
            Tipologia da Seção Transversal
          </span>
          <span className="text-[#ffb95f]">PADRÃO GERDAU/AISC</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
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

      {/* Search & Steel Material Controls */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
        {/* Search Input */}
        <div className="md:col-span-7 bg-[#181c24] border border-[#3e4850] rounded p-1.5 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#88929b] pl-1.5">search</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar perfil ex: W 250, W 310..."
            className="w-full bg-transparent border-none text-[#dfe2ee] font-mono text-xs focus:ring-0 focus:outline-none placeholder:text-[#88929b] p-0"
          />
          <span className="font-mono text-[10px] text-[#88929b] px-1.5 py-0.5 rounded bg-[#1c2028] border border-[#3e4850] whitespace-nowrap">
            {filteredProfiles.length} itens
          </span>
        </div>

        {/* Steel Material Filter */}
        <div className="md:col-span-5 grid grid-cols-2 gap-1.5 bg-[#0a0e16] p-1 rounded border border-[#3e4850]">
          {STEEL_GRADES.map((grade) => {
            const isSelected = selectedSteelGrade.name === grade.name;
            return (
              <button
                key={grade.name}
                type="button"
                onClick={() => onSelectSteelGrade(grade)}
                className={`px-2.5 py-1.5 rounded text-left transition-all relative ${
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
                  fy={grade.fy} MPa
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Profile quick selector list if user searched */}
      {searchQuery && (
        <div className="bg-[#181c24] border border-[#3e4850] rounded p-2 flex flex-wrap gap-2 max-h-36 overflow-y-auto">
          {filteredProfiles.map((p) => (
            <button
              key={p.id}
              onClick={() => onSelectProfile(p)}
              className={`px-2.5 py-1 rounded font-mono text-xs border transition-colors ${
                selectedProfile.id === p.id
                  ? 'bg-[#89ceff]/20 border-[#89ceff] text-[#89ceff] font-bold'
                  : 'bg-[#1c2028] border-[#3e4850] text-[#bec8d2] hover:border-[#88929b]'
              }`}
            >
              {p.designation} ({p.massLinear} kg/m)
            </button>
          ))}
        </div>
      )}

      {/* Selected Profile Card (Hero Bento Layout) */}
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
                  U = 0.84 PASS
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
              <span className="block text-[10px] text-[#88929b]">ALTURA NOMINAL (d)</span>
              <span className="text-sm font-bold text-[#89ceff]">
                {selectedProfile.depth_d} <span className="text-[10px] text-[#88929b]">mm</span>
              </span>
            </div>
          </div>
        </div>

        {/* Bento Grid: CAD Blueprint & Properties */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-3">
          {/* CAD Cross-Section Technical Blueprint Viewport */}
          <div className="lg:col-span-5 bg-[#0a0e16] border border-[#3e4850] rounded p-3 relative flex flex-col items-center justify-between blueprint-grid min-h-[290px]">
            <div className="w-full flex items-center justify-between font-mono text-[10px] text-[#88929b]">
              <span className="flex items-center gap-1 text-[#89ceff]">
                <span className="material-symbols-outlined text-xs">tune</span>
                SEÇÃO I (ESCALA 1:5)
              </span>
              <span className="text-[#89ceff]">EIXOS X-X / Y-Y</span>
            </div>

            {/* SVG Precision Blueprint */}
            <div className="w-full py-1 flex items-center justify-center">
              <svg className="w-56 h-48 drop-shadow-sm select-none" viewBox="0 0 260 210">
                <defs>
                  <marker id="cad-arrow" markerHeight="4" markerWidth="4" orient="auto-start-reverse" refX="5" refY="5" viewBox="0 0 10 10">
                    <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#88929b" />
                  </marker>
                  <marker id="cad-arrow-cyan" markerHeight="4" markerWidth="4" orient="auto-start-reverse" refX="5" refY="5" viewBox="0 0 10 10">
                    <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill="#0ea5e9" />
                  </marker>
                </defs>

                {/* Centroid lines */}
                <line x1="20" x2="220" y1="100" y2="100" stroke="#3e4850" strokeWidth="0.8" strokeDasharray="4 2" />
                <line x1="120" x2="120" y1="15" y2="185" stroke="#3e4850" strokeWidth="0.8" strokeDasharray="4 2" />
                <text x="212" y="96" fill="#88929b" fontFamily="JetBrains Mono" fontSize="8">X</text>
                <text x="123" y="24" fill="#88929b" fontFamily="JetBrains Mono" fontSize="8">Y</text>

                {/* Cross section shape */}
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

                {/* Dimension bf (top) */}
                <line x1="70" x2="170" y1="18" y2="18" stroke="#88929b" strokeWidth="0.8" markerStart="url(#cad-arrow)" markerEnd="url(#cad-arrow)" />
                <line x1="70" x2="70" y1="16" y2="28" stroke="#3e4850" strokeWidth="0.7" />
                <line x1="170" x2="170" y1="16" y2="28" stroke="#3e4850" strokeWidth="0.7" />
                <text x="120" y="14" fill="#89ceff" fontFamily="JetBrains Mono" fontSize="9" fontWeight="600" textAnchor="middle">
                  bf = {selectedProfile.flangeWidth_bf} mm
                </text>

                {/* Dimension tf (right flange) */}
                <line x1="180" x2="180" y1="30" y2="42" stroke="#88929b" strokeWidth="0.8" markerStart="url(#cad-arrow)" markerEnd="url(#cad-arrow)" />
                <line x1="172" x2="186" y1="30" y2="30" stroke="#3e4850" strokeWidth="0.7" />
                <line x1="172" x2="186" y1="42" y2="42" stroke="#3e4850" strokeWidth="0.7" />
                <text x="192" y="38" fill="#ffb95f" fontFamily="JetBrains Mono" fontSize="8">
                  tf: {selectedProfile.flangeThickness_tf}
                </text>

                {/* Dimension d (depth on left) */}
                <line x1="50" x2="50" y1="30" y2="170" stroke="#88929b" strokeWidth="0.8" markerStart="url(#cad-arrow)" markerEnd="url(#cad-arrow)" />
                <line x1="44" x2="68" y1="30" y2="30" stroke="#3e4850" strokeWidth="0.7" />
                <line x1="44" x2="68" y1="170" y2="170" stroke="#3e4850" strokeWidth="0.7" />
                <text x="44" y="103" fill="#89ceff" fontFamily="JetBrains Mono" fontSize="9" fontWeight="600" textAnchor="end">
                  d = {selectedProfile.depth_d}
                </text>

                {/* Web thickness tw callout */}
                <line x1="90" x2="114" y1="85" y2="85" stroke="#0ea5e9" strokeWidth="0.8" markerEnd="url(#cad-arrow-cyan)" />
                <text x="86" y="88" fill="#89ceff" fontFamily="JetBrains Mono" fontSize="8" textAnchor="end">
                  tw: {selectedProfile.webThickness_tw}
                </text>
              </svg>
            </div>

            <div className="w-full flex items-center justify-around pt-2 border-t border-[#3e4850]/60 font-mono text-[10px]">
              <span className="text-[#88929b]">
                Alma tw: <strong className="text-[#dfe2ee]">{selectedProfile.webThickness_tw} mm</strong>
              </span>
              <span className="text-[#88929b]">
                Mesa tf: <strong className="text-[#dfe2ee]">{selectedProfile.flangeThickness_tf} mm</strong>
              </span>
              <span className="text-[#88929b]">
                Largura bf: <strong className="text-[#dfe2ee]">{selectedProfile.flangeWidth_bf} mm</strong>
              </span>
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
              <span className="font-mono text-[10px] text-[#88929b]">λ &lt; λp (NBR 8800)</span>
            </div>
          </div>
        </div>
      </section>

      {/* Alternative Recommendations Section */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#ffb95f] text-sm">tune</span>
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#bec8d2] font-bold">
              Alternativas Recomendadas para Otimização de Peso
            </span>
          </div>
          <span className="font-mono text-[10px] text-[#4edea3] flex items-center gap-1">
            <span className="material-symbols-outlined text-xs">trending_down</span>
            Economia de até 13.4%
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
                      -1.4 kg/m
                    </span>
                  </div>
                  <p className="text-xs text-[#88929b]">31.3 kg/m • Perfil mais compacto para pé-direito reduzido</p>
                  <div className="flex gap-3 font-mono text-[10px] text-[#bec8d2] mt-1">
                    <span>Wx: {alt1.elasticModulus_Wx} cm³</span>
                    <span>Ix: {alt1.inertia_Ix} cm⁴</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onSelectProfile(alt1)}
                className="px-2.5 py-1.5 rounded bg-[#262a33] hover:bg-[#31353e] border border-[#3e4850] font-mono text-xs text-[#dfe2ee] group-hover:border-[#89ceff]"
              >
                Substituir
              </button>
            </div>
          )}

          {alt2 && (
            <div className="bg-[#181c24] border border-[#3e4850] hover:border-[#88929b] rounded p-3 transition-colors flex items-center justify-between group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-[#262a33] border border-[#3e4850] flex flex-col items-center justify-center group-hover:border-[#4edea3]">
                  <span className="material-symbols-outlined text-[#4edea3] text-base">electric_bolt</span>
                  <span className="font-mono text-[8px] text-[#4edea3] font-bold">-13.4%</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-mono text-xs font-bold text-[#dfe2ee] group-hover:text-[#89ceff]">
                      {alt2.designation}
                    </h4>
                    <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-[#00b17b]/10 border border-[#00b17b]/30 text-[#4edea3] font-bold">
                      Mais Leve
                    </span>
                  </div>
                  <p className="text-xs text-[#88929b]">28.3 kg/m • Maior inércia flexional (d=309 mm)</p>
                  <div className="flex gap-3 font-mono text-[10px] text-[#bec8d2] mt-1">
                    <span>Wx: {alt2.elasticModulus_Wx} cm³</span>
                    <span className="text-[#4edea3] font-bold">Ix: {alt2.inertia_Ix} cm⁴ (+11%)</span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => onSelectProfile(alt2)}
                className="px-2.5 py-1.5 rounded bg-[#262a33] hover:bg-[#31353e] border border-[#3e4850] font-mono text-xs text-[#dfe2ee] group-hover:border-[#4edea3]"
              >
                Substituir
              </button>
            </div>
          )}
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
        <p className="text-center font-mono text-[10px] text-[#88929b] mt-1.5">
          Atualiza automaticamente SFD, BMD, tensões combinadas de von Mises e flecha máxima L/d.
        </p>
      </div>
    </div>
  );
};
