import React from 'react';

export type TabKey = 'projetos' | 'carregamento' | 'perfis' | 'resultados';

interface BottomNavBarProps {
  activeTab: TabKey;
  unlockedTabs?: TabKey[];
  onTabChange: (tab: TabKey) => void;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  activeTab,
  onTabChange,
}) => {
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

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-16 px-2 bg-[#0a0e16] border-t border-[#3e4850] shadow-2xl">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;

        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onTabChange(tab.key)}
            title={tab.label}
            className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${
              isActive
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
  );
};
