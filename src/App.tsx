import { useState, useMemo } from 'react';
import { TopAppBar } from './components/TopAppBar';
import { BottomNavBar, TabKey } from './components/BottomNavBar';
import { ProjectsView } from './components/ProjectsView';
import { LoadingView } from './components/LoadingView';
import { ProfilesView } from './components/ProfilesView';
import { ResultsView } from './components/ResultsView';
import { CalculationReportView } from './components/CalculationReportView';
import { DEFAULT_PROFILE, STEEL_GRADES, STEEL_PROFILES } from './data/profiles';
import { LoadItem, NormCode, ProjectData, SteelGrade, SteelProfile, SupportPositions, SupportType } from './types';
import { solveBeam } from './utils/structuralSolver';

export function App() {
  // Navigation & View state
  const [activeTab, setActiveTab] = useState<TabKey>('projetos');
  const [showReportView, setShowReportView] = useState<boolean>(false);

  // Structural parameters
  const [spanLength, setSpanLength] = useState<number>(6.0);
  const [supportType, setSupportType] = useState<SupportType>('biapoiada');
  const [supportPositions, setSupportPositions] = useState<SupportPositions>({
    posA: 0.0,
    posB: 6.0,
  });
  const [norm, setNorm] = useState<NormCode>('NBR 8800:2008');
  const [projectName, setProjectName] = useState<string>('');
  const [professionalId, setProfessionalId] = useState<string>('');
  const [engineerName, setEngineerName] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [studyDate, setStudyDate] = useState<string>('');

  // Materials & Profile
  const [selectedProfile, setSelectedProfile] = useState<SteelProfile>(DEFAULT_PROFILE);
  const [selectedSteelGrade, setSelectedSteelGrade] = useState<SteelGrade>(
    STEEL_GRADES.find((g) => g.name.includes('A572')) || STEEL_GRADES[1]
  );

  // Load items: start empty so no load is displayed until selected/added
  const [loads, setLoads] = useState<LoadItem[]>([]);

  // Real-time Structural Mechanics Engine execution
  const calcResults = useMemo(() => {
    return solveBeam(spanLength, supportType, loads, selectedProfile, selectedSteelGrade, supportPositions);
  }, [spanLength, supportType, loads, selectedProfile, selectedSteelGrade, supportPositions]);

  // Span update handler keeping support B in sync if it was at the beam end
  const handleUpdateSpan = (newSpan: number) => {
    const oldSpan = spanLength;
    setSpanLength(newSpan);
    setSupportPositions((prev) => ({
      posA: Math.min(prev.posA, Math.max(0, newSpan - 0.2)),
      posB: prev.posB === oldSpan ? newSpan : Math.min(prev.posB, newSpan),
    }));
  };

  // Load manipulation handlers
  const handleAddLoad = (newLoad: LoadItem) => {
    setLoads((prev) => [...prev, newLoad]);
  };

  const handleRemoveLoad = (id: string) => {
    setLoads((prev) => prev.filter((l) => l.id !== id));
  };

  const handleUpdateLoad = (updatedLoad: LoadItem) => {
    setLoads((prev) => prev.map((l) => (l.id === updatedLoad.id ? updatedLoad : l)));
  };

  // Load an existing project
  const handleLoadProject = (project: ProjectData) => {
    setProjectName(project.name);
    setSpanLength(project.spanLength);
    setSupportPositions({
      posA: 0,
      posB: project.spanLength,
    });
    setSupportType(project.spanType);
    setNorm(project.norm);
    if (project.loads && project.loads.length > 0) {
      setLoads(project.loads);
    }
    // Attempt profile match
    const matchedProfile = STEEL_PROFILES.find((p) => project.profileDesignation.includes(p.designation));
    if (matchedProfile) {
      setSelectedProfile(matchedProfile);
    }
    setActiveTab('carregamento');
  };

  // Open calculation report with specific project context
  const handleOpenMemorial = (projectId?: string) => {
    if (projectId) {
      // Find and switch context if needed
    }
    setShowReportView(true);
  };

  // Quick title logic
  const getSubTitle = () => {
    if (activeTab === 'projetos') return 'Gestão de Vigas & Tipologias';
    if (activeTab === 'carregamento') return `Vão L = ${spanLength.toFixed(2)}m • ${norm}`;
    if (activeTab === 'perfis') return `${selectedProfile.designation} • ${selectedSteelGrade.name}`;
    if (activeTab === 'resultados') return `Status: ${calcResults.status} • U = ${(calcResults.momentRatio / 100).toFixed(2)}`;
    return undefined;
  };

  return (
    <div className="min-h-screen bg-[#0f131c] text-[#dfe2ee] flex flex-col font-sans selection:bg-[#0ea5e9]/30 selection:text-[#89ceff]">
      {showReportView ? (
        <CalculationReportView
          calcResults={calcResults}
          profile={selectedProfile}
          steelGrade={selectedSteelGrade}
          spanLength={spanLength}
          norm={norm}
          loads={loads}
          supportType={supportType}
          projectName={projectName}
          professionalId={professionalId}
          engineerName={engineerName}
          companyName={companyName}
          studyDate={studyDate}
          onBack={() => setShowReportView(false)}
        />
      ) : (
        <>
          <TopAppBar
            title="Beam Engineering"
            subtitle={getSubTitle()}
          />

          <main className="flex-1 flex flex-col pb-20 overflow-y-auto">
            {activeTab === 'projetos' && (
              <ProjectsView
                currentSpan={spanLength}
                currentSupportType={supportType}
                currentNorm={norm}
                selectedProfile={selectedProfile}
                projectName={projectName}
                professionalId={professionalId}
                engineerName={engineerName}
                companyName={companyName}
                studyDate={studyDate}
                onChangeProjectName={setProjectName}
                onChangeProfessionalId={setProfessionalId}
                onChangeEngineerName={setEngineerName}
                onChangeCompanyName={setCompanyName}
                onChangeStudyDate={setStudyDate}
                onSelectSupportType={(type) => setSupportType(type)}
                onUpdateSpan={(val) => setSpanLength(val)}
                onSelectNorm={(n) => setNorm(n)}
                onSelectProfile={(p) => setSelectedProfile(p)}
                onStartCalculation={() => setActiveTab('carregamento')}
                onOpenProfileCatalog={() => setActiveTab('perfis')}
                onOpenMemorial={(id) => handleOpenMemorial(id)}
                onLoadProject={handleLoadProject}
              />
            )}

            {activeTab === 'carregamento' && (
              <LoadingView
                spanLength={spanLength}
                supportType={supportType}
                supportPositions={supportPositions}
                loads={loads}
                calcResults={calcResults}
                onUpdateSpan={handleUpdateSpan}
                onUpdateSupportType={(type) => setSupportType(type)}
                onUpdateSupportPositions={(pos) => setSupportPositions(pos)}
                onAddLoad={handleAddLoad}
                onRemoveLoad={handleRemoveLoad}
                onUpdateLoad={handleUpdateLoad}
                onAdvanceToProfiles={() => setActiveTab('perfis')}
              />
            )}

            {activeTab === 'perfis' && (
              <ProfilesView
                selectedProfile={selectedProfile}
                selectedSteelGrade={selectedSteelGrade}
                onSelectProfile={(p) => setSelectedProfile(p)}
                onSelectSteelGrade={(g) => setSelectedSteelGrade(g)}
                onConfirmCalculate={() => setActiveTab('resultados')}
              />
            )}

            {activeTab === 'resultados' && (
              <ResultsView
                calcResults={calcResults}
                profile={selectedProfile}
                steelGrade={selectedSteelGrade}
                spanLength={spanLength}
                supportType={supportType}
                supportPositions={supportPositions}
                norm={norm}
                loads={loads}
                onSelectProfile={(p) => setSelectedProfile(p)}
                onOpenMemorial={() => setShowReportView(true)}
                onOptimizeProfile={() => setActiveTab('perfis')}
                onGoToLoads={() => setActiveTab('carregamento')}
              />
            )}
          </main>

          <BottomNavBar
            activeTab={activeTab}
            onTabChange={(tab) => {
              setActiveTab(tab);
            }}
          />
        </>
      )}
    </div>
  );
}

export default App;
