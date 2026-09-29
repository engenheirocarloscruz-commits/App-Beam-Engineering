import React from 'react';
import { NormCode, ProjectData, SteelProfile, SupportType } from '../types';

interface ProjectsViewProps {
  currentSpan?: number;
  currentSupportType: SupportType;
  currentNorm: NormCode;
  selectedProfile?: SteelProfile;
  onSelectSupportType: (type: SupportType) => void;
  onUpdateSpan?: (span: number) => void;
  onSelectNorm: (norm: NormCode) => void;
  onStartCalculation: () => void;
  onOpenProfileCatalog: () => void;
  onSelectProfile?: (profile: SteelProfile) => void;
  onOpenMemorial?: (projectId?: string) => void;
  onLoadProject?: (project: ProjectData) => void;
  projectName?: string;
  professionalId?: string;
  engineerName?: string;
  companyName?: string;
  studyDate?: string;
  onChangeProjectName?: (val: string) => void;
  onChangeProfessionalId?: (val: string) => void;
  onChangeEngineerName?: (val: string) => void;
  onChangeCompanyName?: (val: string) => void;
  onChangeStudyDate?: (val: string) => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  currentSupportType,
  currentNorm,
  selectedProfile,
  onSelectSupportType,
  onSelectNorm,
  onStartCalculation,
  onOpenProfileCatalog,
  onSelectProfile,
  projectName = '',
  professionalId = '',
  engineerName = '',
  companyName = '',
  studyDate = '',
  onChangeProjectName,
  onChangeProfessionalId,
  onChangeEngineerName,
  onChangeCompanyName,
  onChangeStudyDate,
}) => {
  const [localProjectName, setLocalProjectName] = React.useState(projectName);
  const [localProfessionalId, setLocalProfessionalId] = React.useState(professionalId);
  const [localEngineer, setLocalEngineer] = React.useState(engineerName);
  const [localCompany, setLocalCompany] = React.useState(companyName);
  const [localDate, setLocalDate] = React.useState(studyDate);

  React.useEffect(() => {
    if (projectName !== undefined) setLocalProjectName(projectName);
  }, [projectName]);

  React.useEffect(() => {
    if (professionalId !== undefined) setLocalProfessionalId(professionalId);
  }, [professionalId]);

  React.useEffect(() => {
    if (engineerName !== undefined) setLocalEngineer(engineerName);
  }, [engineerName]);

  React.useEffect(() => {
    if (companyName !== undefined) setLocalCompany(companyName);
  }, [companyName]);

  React.useEffect(() => {
    if (studyDate !== undefined) setLocalDate(studyDate);
  }, [studyDate]);

  const handleProjectNameChange = (val: string) => {
    setLocalProjectName(val);
    onChangeProjectName?.(val);
  };

  const handleProfessionalIdChange = (val: string) => {
    setLocalProfessionalId(val);
    onChangeProfessionalId?.(val);
  };

  const handleEngineerChange = (val: string) => {
    setLocalEngineer(val);
    onChangeEngineerName?.(val);
  };

  const handleCompanyChange = (val: string) => {
    setLocalCompany(val);
    onChangeCompanyName?.(val);
  };

  const handleDateChange = (val: string) => {
    setLocalDate(val);
    onChangeStudyDate?.(val);
  };
  return (
    <div className="max-w-7xl mx-auto px-4 py-4 space-y-6">
      {/* Hero / Status Banner & Telemetry Strip */}
      <div className="datum-grid rounded-lg border border-[#3e4850] bg-[#0a0e16] p-4 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-[#0ea5e9]/20 text-[#89ceff] border border-[#0ea5e9]/30 rounded font-mono text-[10px]">
                ENGENHARIA ESTRUTURAL
              </span>
              <span className="font-mono text-[10px] text-[#bec8d2]">
                DIMENSIONAMENTO ESTÁTICO & PERFIS DE AÇO
              </span>
            </div>
            <h1 className="font-headline text-2xl font-semibold text-[#dfe2ee] tracking-tight">
              Painel de Cálculo & Tipologias
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-[#181c24] border border-[#3e4850] px-3 py-1.5 rounded flex items-center gap-3">
              <div>
                <div className="font-mono text-[10px] text-[#88929b]">MOTOR DE CÁLCULO</div>
                <div className="font-mono text-sm text-[#4edea3] font-bold">
                  ESTÁTICO <span className="text-[10px] text-[#4edea3]">ATIVO</span>
                </div>
              </div>
              <div className="h-6 w-[1px] bg-[#3e4850]"></div>
              <div>
                <div className="font-mono text-[10px] text-[#88929b]">NORMAS</div>
                <div className="font-mono text-sm text-[#89ceff] font-bold">NBR / AISC</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section: Novo Cálculo Estrutural */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#89ceff] text-[20px]">
              add_circle
            </span>
            <h2 className="font-headline text-lg font-semibold text-[#dfe2ee]">
              Novo Dimensionamento Estrutural
            </h2>
          </div>
          <span className="font-mono text-[10px] text-[#88929b] hidden sm:inline">
            SELECIONE A TOPOLOGIA DOS APOIOS
          </span>
        </div>

        {/* Bento Grid for Support Schemes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Card 1: Biapoiada */}
          <div
            onClick={() => onSelectSupportType('biapoiada')}
            className={`relative rounded-lg p-3.5 flex flex-col justify-between transition-all cursor-pointer group ${
              currentSupportType === 'biapoiada'
                ? 'bg-[#181c24] border-2 border-[#89ceff] shadow-[0_0_12px_rgba(14,165,233,0.18)]'
                : 'bg-[#181c24] border border-[#3e4850] hover:border-[#89ceff]/50 hover:bg-[#262a33]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-bold flex items-center gap-1.5 ${
                currentSupportType === 'biapoiada' ? 'text-[#89ceff]' : 'text-[#dfe2ee]'
              }`}>
                <span className={`w-2 h-2 rounded-full inline-block ${
                  currentSupportType === 'biapoiada' ? 'bg-[#89ceff]' : 'bg-[#88929b]'
                }`}></span>
                Biapoiada
              </span>
              <span className="px-1.5 py-0.5 rounded bg-[#89ceff]/20 text-[#89ceff] border border-[#89ceff]/40 font-mono text-[10px]">
                PADRÃO
              </span>
            </div>
            <div className="py-3 px-2 my-2 bg-[#0a0e16] rounded border border-[#3e4850]/60 flex items-center justify-center">
              <svg className="w-full h-12 text-[#89ceff]" fill="none" stroke="currentColor" viewBox="0 0 160 48">
                <line strokeLinecap="round" strokeWidth="3" x1="20" x2="140" y1="20" y2="20" />
                <polygon fill="currentColor" fillOpacity="0.2" points="20,20 12,34 28,34" strokeWidth="1.5" />
                <line strokeWidth="1.5" x1="8" x2="32" y1="36" y2="36" />
                <polygon fill="currentColor" fillOpacity="0.2" points="140,20 132,32 148,32" strokeWidth="1.5" />
                <circle cx="136" cy="36" fill="currentColor" r="2" />
                <circle cx="144" cy="36" fill="currentColor" r="2" />
                <line strokeWidth="1.5" x1="128" x2="152" y1="40" y2="40" />
              </svg>
            </div>
            <div className="font-mono text-[10px] text-[#bec8d2] flex justify-between items-center mt-1">
              <span>Isostática</span>
              <span className="text-[#88929b]">Apoio 1º e 2º Gên.</span>
            </div>
          </div>

          {/* Card 2: Engastada e Livre (Balanço) */}
          <div
            onClick={() => onSelectSupportType('cantilever')}
            className={`relative rounded-lg p-3.5 flex flex-col justify-between transition-all cursor-pointer group ${
              currentSupportType === 'cantilever'
                ? 'bg-[#181c24] border-2 border-[#89ceff] shadow-[0_0_12px_rgba(14,165,233,0.18)]'
                : 'bg-[#181c24] border border-[#3e4850] hover:border-[#89ceff]/50 hover:bg-[#262a33]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-bold transition-colors ${
                currentSupportType === 'cantilever' ? 'text-[#89ceff]' : 'text-[#dfe2ee] group-hover:text-[#89ceff]'
              }`}>
                Engastada e Livre
              </span>
              <span className="font-mono text-[10px] text-[#88929b]">Balanço</span>
            </div>
            <div className="py-3 px-2 my-2 bg-[#0a0e16] rounded border border-[#3e4850]/60 flex items-center justify-center">
              <svg className={`w-full h-12 transition-colors ${
                currentSupportType === 'cantilever' ? 'text-[#89ceff]' : 'text-[#88929b] group-hover:text-[#89ceff]'
              }`} fill="none" stroke="currentColor" viewBox="0 0 160 48">
                <line strokeWidth="2.5" x1="24" x2="24" y1="8" y2="36" />
                <line strokeWidth="1" x1="18" x2="24" y1="12" y2="18" />
                <line strokeWidth="1" x1="18" x2="24" y1="18" y2="24" />
                <line strokeWidth="1" x1="18" x2="24" y1="24" y2="30" />
                <line strokeLinecap="round" strokeWidth="3" x1="24" x2="135" y1="20" y2="20" />
                <circle cx="135" cy="20" fill="currentColor" r="2.5" />
              </svg>
            </div>
            <div className="font-mono text-[10px] text-[#bec8d2] flex justify-between items-center mt-1">
              <span>Isostática</span>
              <span className="text-[#88929b]">Momento Máx no Apoio</span>
            </div>
          </div>

          {/* Card 3: Bi-engastada */}
          <div
            onClick={() => onSelectSupportType('biengastada')}
            className={`relative rounded-lg p-3.5 flex flex-col justify-between transition-all cursor-pointer group ${
              currentSupportType === 'biengastada'
                ? 'bg-[#181c24] border-2 border-[#89ceff] shadow-[0_0_12px_rgba(14,165,233,0.18)]'
                : 'bg-[#181c24] border border-[#3e4850] hover:border-[#89ceff]/50 hover:bg-[#262a33]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-bold transition-colors ${
                currentSupportType === 'biengastada' ? 'text-[#89ceff]' : 'text-[#dfe2ee] group-hover:text-[#89ceff]'
              }`}>
                Bi-engastada
              </span>
              <span className="font-mono text-[10px] text-[#ffb95f]">HIPERESTÁTICA</span>
            </div>
            <div className="py-3 px-2 my-2 bg-[#0a0e16] rounded border border-[#3e4850]/60 flex items-center justify-center">
              <svg className={`w-full h-12 transition-colors ${
                currentSupportType === 'biengastada' ? 'text-[#89ceff]' : 'text-[#88929b] group-hover:text-[#89ceff]'
              }`} fill="none" stroke="currentColor" viewBox="0 0 160 48">
                <line strokeWidth="2.5" x1="24" x2="24" y1="8" y2="36" />
                <line strokeWidth="1" x1="18" x2="24" y1="14" y2="20" />
                <line strokeWidth="1" x1="18" x2="24" y1="22" y2="28" />
                <line strokeLinecap="round" strokeWidth="3" x1="24" x2="136" y1="20" y2="20" />
                <line strokeWidth="2.5" x1="136" x2="136" y1="8" y2="36" />
                <line strokeWidth="1" x1="136" x2="142" y1="14" y2="20" />
                <line strokeWidth="1" x1="136" x2="142" y1="22" y2="28" />
              </svg>
            </div>
            <div className="font-mono text-[10px] text-[#bec8d2] flex justify-between items-center mt-1">
              <span>Hiperestática 3º</span>
              <span className="text-[#88929b]">Menor Flecha Central</span>
            </div>
          </div>

          {/* Card 4: Viga Contínua */}
          <div
            onClick={() => onSelectSupportType('continua')}
            className={`relative rounded-lg p-3.5 flex flex-col justify-between transition-all cursor-pointer group ${
              currentSupportType === 'continua'
                ? 'bg-[#181c24] border-2 border-[#89ceff] shadow-[0_0_12px_rgba(14,165,233,0.18)]'
                : 'bg-[#181c24] border border-[#3e4850] hover:border-[#89ceff]/50 hover:bg-[#262a33]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-bold transition-colors ${
                currentSupportType === 'continua' ? 'text-[#89ceff]' : 'text-[#dfe2ee] group-hover:text-[#89ceff]'
              }`}>
                Viga Contínua
              </span>
              <span className="font-mono text-[10px] text-[#88929b]">2 Vãos (L1+L2)</span>
            </div>
            <div className="py-3 px-2 my-2 bg-[#0a0e16] rounded border border-[#3e4850]/60 flex items-center justify-center">
              <svg className={`w-full h-12 transition-colors ${
                currentSupportType === 'continua' ? 'text-[#89ceff]' : 'text-[#88929b] group-hover:text-[#89ceff]'
              }`} fill="none" stroke="currentColor" viewBox="0 0 160 48">
                <line strokeLinecap="round" strokeWidth="3" x1="18" x2="142" y1="20" y2="20" />
                <polygon fill="currentColor" fillOpacity="0.2" points="20,20 14,32 26,32" strokeWidth="1.2" />
                <line strokeWidth="1.2" x1="12" x2="28" y1="34" y2="34" />
                <polygon fill="currentColor" fillOpacity="0.3" points="80,20 74,32 86,32" strokeWidth="1.2" />
                <line strokeWidth="1.2" x1="72" x2="88" y1="34" y2="34" />
                <polygon fill="currentColor" fillOpacity="0.2" points="140,20 134,32 146,32" strokeWidth="1.2" />
                <circle cx="140" cy="35" fill="currentColor" r="2" />
              </svg>
            </div>
            <div className="font-mono text-[10px] text-[#bec8d2] flex justify-between items-center mt-1">
              <span>Hiperestática 1º</span>
              <span className="text-[#88929b]">Momento Fletor Negativo</span>
            </div>
          </div>
        </div>

        {/* Formulation & Parameters Bar */}
        <div className="bg-[#181c24] border border-[#3e4850] rounded-lg p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mt-2">
          <div className="flex flex-wrap items-center gap-4">
            {/* Standard Norm Selector */}
            <div className="flex flex-col gap-1">
              <label className="font-mono text-[10px] text-[#88929b]">NORMA REGULAMENTADORA</label>
              <div className="inline-flex p-1 bg-[#0a0e16] rounded border border-[#3e4850]">
                <button
                  type="button"
                  onClick={() => onSelectNorm('NBR 8800:2008')}
                  className={`px-3 py-1 rounded font-mono text-xs font-bold transition-colors ${
                    currentNorm === 'NBR 8800:2008'
                      ? 'bg-[#89ceff] text-[#00344d] shadow'
                      : 'text-[#bec8d2] hover:text-[#dfe2ee]'
                  }`}
                >
                  NBR 8800:2008 (BR)
                </button>
                <button
                  type="button"
                  onClick={() => onSelectNorm('AISC 360-16')}
                  className={`px-3 py-1 rounded font-mono text-xs font-bold transition-colors ${
                    currentNorm === 'AISC 360-16'
                      ? 'bg-[#89ceff] text-[#00344d] shadow'
                      : 'text-[#bec8d2] hover:text-[#dfe2ee]'
                  }`}
                >
                  AISC 360-16 (EUA)
                </button>
              </div>
            </div>
          </div>

          {/* Primary Execution Button */}
          <button
            type="button"
            onClick={onStartCalculation}
            className="flex items-center justify-center gap-2 bg-[#0ea5e9] hover:bg-[#89ceff] text-[#001e2f] active:opacity-90 px-6 py-3 rounded-lg font-headline text-sm font-bold transition-all shadow-md"
          >
            <span className="material-symbols-outlined text-[20px]">play_arrow</span>
            <span>Iniciar Dimensionamento</span>
          </button>
        </div>
      </section>

      {/* Caixa Editável: Identificação do Estudo Técnico */}
      <section className="bg-[#181c24] border border-[#3e4850] rounded-lg p-4 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#3e4850]/60">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#89ceff] text-[20px]">
              badge
            </span>
            <h3 className="font-headline text-sm font-semibold text-[#dfe2ee]">
              Identificação do Estudo Técnico
            </h3>
          </div>
          <span className="font-mono text-[10px] text-[#bec8d2]">
            DADOS DO PROJETO, RESPONSÁVEL, EMPRESA E REGISTRO
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {/* Nome do projeto */}
          <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
            <label className="flex items-center gap-1.5 font-mono text-[11px] text-[#bec8d2] font-medium">
              <span className="material-symbols-outlined text-sm text-[#89ceff]">architecture</span>
              Nome do Projeto
            </label>
            <input
              type="text"
              value={localProjectName}
              onChange={(e) => handleProjectNameChange(e.target.value)}
              placeholder="Ex.: Viga Cobertura Galpão B"
              className="w-full bg-[#0a0e16] border border-[#3e4850] rounded px-3 py-2 text-xs font-mono text-[#dfe2ee] placeholder-[#88929b] focus:outline-none focus:border-[#89ceff] focus:ring-1 focus:ring-[#89ceff] transition-colors"
            />
          </div>

          {/* Nome da empresa */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 font-mono text-[11px] text-[#bec8d2] font-medium">
              <span className="material-symbols-outlined text-sm text-[#89ceff]">business</span>
              Nome da Empresa
            </label>
            <input
              type="text"
              value={localCompany}
              onChange={(e) => handleCompanyChange(e.target.value)}
              placeholder="Ex.: Cruz Engenharia Estrutural"
              className="w-full bg-[#0a0e16] border border-[#3e4850] rounded px-3 py-2 text-xs font-mono text-[#dfe2ee] placeholder-[#88929b] focus:outline-none focus:border-[#89ceff] focus:ring-1 focus:ring-[#89ceff] transition-colors"
            />
          </div>

          {/* Nome do responsável pelo estudo */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 font-mono text-[11px] text-[#bec8d2] font-medium">
              <span className="material-symbols-outlined text-sm text-[#89ceff]">person</span>
              Nome do Responsável pelo Estudo
            </label>
            <input
              type="text"
              value={localEngineer}
              onChange={(e) => handleEngineerChange(e.target.value)}
              placeholder="Ex.: Eng. Carlos Cruz"
              className="w-full bg-[#0a0e16] border border-[#3e4850] rounded px-3 py-2 text-xs font-mono text-[#dfe2ee] placeholder-[#88929b] focus:outline-none focus:border-[#89ceff] focus:ring-1 focus:ring-[#89ceff] transition-colors"
            />
          </div>

          {/* Registro Profissional */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 font-mono text-[11px] text-[#bec8d2] font-medium">
              <span className="material-symbols-outlined text-sm text-[#89ceff]">assignment_ind</span>
              Registro Profissional (CREA / CAU)
            </label>
            <input
              type="text"
              value={localProfessionalId}
              onChange={(e) => handleProfessionalIdChange(e.target.value)}
              placeholder="Ex.: CREA/SP: 5069812-4 / D"
              className="w-full bg-[#0a0e16] border border-[#3e4850] rounded px-3 py-2 text-xs font-mono text-[#dfe2ee] placeholder-[#88929b] focus:outline-none focus:border-[#89ceff] focus:ring-1 focus:ring-[#89ceff] transition-colors"
            />
          </div>

          {/* Data do estudo */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 font-mono text-[11px] text-[#bec8d2] font-medium">
              <span className="material-symbols-outlined text-sm text-[#89ceff]">calendar_today</span>
              Data do Estudo
            </label>
            <input
              type="date"
              value={localDate}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-full bg-[#0a0e16] border border-[#3e4850] rounded px-3 py-2 text-xs font-mono text-[#dfe2ee] placeholder-[#88929b] focus:outline-none focus:border-[#89ceff] focus:ring-1 focus:ring-[#89ceff] transition-colors"
            />
          </div>
        </div>
      </section>
    </div>
  );
};
