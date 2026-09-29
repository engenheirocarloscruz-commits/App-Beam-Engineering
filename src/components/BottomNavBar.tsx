import React, { useState, useEffect } from 'react';

export type TabKey = 'projetos' | 'carregamento' | 'perfis' | 'resultados';

export const TAB_UNLOCK_BUTTONS: Record<TabKey, string> = {
  projetos: '',
  carregamento: 'Iniciar Dimensionamento',
  perfis: 'Avançar para Seleção de Perfis',
  resultados: 'Confirmar e Calcular Diagramas',
};

interface BottomNavBarProps {
  activeTab: TabKey;
  unlockedTabs: TabKey[];
  onTabChange: (tab: TabKey) => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  unlockedTabs,
  onTabChange,
}) => {
  const [blockedToast, setBlockedToast] = useState<string | null>(null);

  useEffect(() => {
    if (blockedToast) {
      const timer = setTimeout(() => setBlockedToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [blockedToast]);

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    {
      key: 'projetos',
      label: 'Projetos',
      icon: 'folder_open',
    },
    {
      key: 'carregamento',
      label: 'Carregamento',
      icon: 'tune',
    },
    {
      key: 'perfis',
      label: 'Perfis',
      icon: 'view_column',
    },
    {
      key: 'resultados',
      label: 'Resultados',
      icon: 'analytics',
    },
  ];

  const handleTabClick = (tabKey: TabKey) => {
    if (unlockedTabs.includes(tabKey)) {
      onTabChange(tabKey);
    } else {
      const requiredBtn = TAB_UNLOCK_BUTTONS[tabKey];
      setBlockedToast(`Aba bloqueada: pressione "${requiredBtn}" para avançar.`);
    }
  };

  return (
    <>
      {blockedToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-[#1e232d] border border-[#ffb95f]/70 text-[#dfe2ee] px-4 py-2.5 rounded-lg shadow-2xl flex items-center gap-2.5 font-mono text-xs max-w-[90vw] text-center">
          <span className="material-symbols-outlined text-[#ffb95f] text-base shrink-0">lock</span>
          <span>{blockedToast}</span>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-16 px-2 bg-[#0a0e16] border-t border-[#3e4850] shadow-2xl">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          const isUnlocked = unlockedTabs.includes(tab.key);

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabClick(tab.key)}
              title={
                isUnlocked
                  ? tab.label
                  : `Aba bloqueada: requer apertar o botão "${TAB_UNLOCK_BUTTONS[tab.key]}"`
              }
              className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${
                !isUnlocked
                  ? 'opacity-40 cursor-not-allowed text-[#88929b]'
                  : isActive
                  ? 'text-[#89ceff] font-bold active:scale-95'
                  : 'text-[#bec8d2] hover:text-[#dfe2ee] active:scale-95'
              }`}
            >
              <div className="relative">
                <span
                  className={`material-symbols-outlined text-[22px] mb-0.5 ${
                    isActive ? 'fill-1' : ''
                  }`}
                >
                  {tab.icon}
                </span>
                {!isUnlocked && (
                  <span className="absolute -top-1 -right-2.5 w-3.5 h-3.5 rounded-full bg-[#1c2028] border border-[#3e4850] flex items-center justify-center text-[10px] text-[#ffb95f]">
                    <span className="material-symbols-outlined text-[10px]">lock</span>
                  </span>
                )}
              </div>
              <span className="font-mono text-[11px] leading-tight flex items-center gap-1">
                {tab.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1 bg-[#89ceff] rounded-full mt-0.5"></span>
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
};
