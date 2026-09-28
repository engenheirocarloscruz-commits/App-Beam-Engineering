import React, { useState, useEffect } from 'react';

export type TabKey = 'projetos' | 'carregamento' | 'perfis' | 'resultados';

export const TAB_ORDER: TabKey[] = ['projetos', 'carregamento', 'perfis', 'resultados'];

interface BottomNavBarProps {
  activeTab: TabKey;
  resultsReady: boolean;
  onTabChange: (tab: TabKey) => void;
}

interface BlockedNoticeInfo {
  type: 'advance' | 'return';
  buttonLabel: string;
  buttonId: string;
  targetTabName: string;
}

const TAB_ACTION_BUTTONS: Record<TabKey, { label: string; elementId: string }> = {
  projetos: {
    label: 'Iniciar Dimensionamento',
    elementId: 'btn-iniciar-dimensionamento',
  },
  carregamento: {
    label: 'Avançar para seleção de Perfis',
    elementId: 'btn-avancar-perfis',
  },
  perfis: {
    label: 'Confirmar e calcular Diagramas com este perfil',
    elementId: 'btn-confirmar-calcular',
  },
  resultados: {
    label: '',
    elementId: '',
  },
};

export const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeTab, resultsReady, onTabChange }) => {
  const [blockedNotice, setBlockedNotice] = useState<BlockedNoticeInfo | null>(null);

  // Auto-dismiss the blocked notice after 4.5 seconds
  useEffect(() => {
    if (!blockedNotice) return;
    const timer = setTimeout(() => {
      setBlockedNotice(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [blockedNotice]);

  const tabs = [
    {
      key: 'projetos' as TabKey,
      label: 'Projetos',
      icon: 'folder_open',
    },
    {
      key: 'carregamento' as TabKey,
      label: 'Carregamento',
      icon: 'tune',
    },
    {
      key: 'perfis' as TabKey,
      label: 'Perfis',
      icon: 'view_column',
    },
    {
      key: 'resultados' as TabKey,
      label: 'Resultados',
      icon: 'analytics',
    },
  ];

  const activeIndex = TAB_ORDER.indexOf(activeTab);

  const highlightButton = (elementId: string) => {
    if (!elementId) return;
    const targetBtn = document.getElementById(elementId);
    if (targetBtn) {
      targetBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
      targetBtn.classList.add('ring-4', 'ring-[#89ceff]', 'ring-offset-2', 'ring-offset-[#0f131c]');
      setTimeout(() => {
        targetBtn.classList.remove('ring-4', 'ring-[#89ceff]', 'ring-offset-2', 'ring-offset-[#0f131c]');
      }, 2000);
    }
  };

  const handleTabClick = (tabKey: TabKey, tabLabel: string) => {
    const targetIndex = TAB_ORDER.indexOf(tabKey);

    // If already on the clicked tab, do nothing
    if (targetIndex === activeIndex) return;

    // Se o cálculo já foi finalizado, permitir navegação livre para as outras abas sem bloqueio!
    if (resultsReady) {
      setBlockedNotice(null);
      onTabChange(tabKey);
      return;
    }

    // Se o cálculo ainda NÃO foi finalizado:
    // 1. Bloqueia avanço (permitido apenas via botões designados)
    if (targetIndex > activeIndex) {
      const currentRequirement = TAB_ACTION_BUTTONS[activeTab];
      setBlockedNotice({
        type: 'advance',
        buttonLabel: currentRequirement.label,
        buttonId: currentRequirement.elementId,
        targetTabName: tabLabel,
      });
      highlightButton(currentRequirement.elementId);
      return;
    }

    // 2. Bloqueia retorno (permitido apenas após o cálculo estar pronto)
    if (targetIndex < activeIndex) {
      const currentRequirement = TAB_ACTION_BUTTONS[activeTab];
      setBlockedNotice({
        type: 'return',
        buttonLabel: currentRequirement.label,
        buttonId: currentRequirement.elementId,
        targetTabName: tabLabel,
      });
      highlightButton(currentRequirement.elementId);
      return;
    }
  };

  return (
    <>
      {/* Toast Notification when user attempts an unauthorized navigation */}
      {blockedNotice && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-lg bg-[#181c24] border-2 border-[#ffb95f] rounded-xl px-4 py-3 shadow-2xl flex items-center justify-between gap-3 text-xs font-mono text-[#dfe2ee] ring-4 ring-[#ffb95f]/20 transition-all duration-200">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#ffb95f]/20 border border-[#ffb95f] flex items-center justify-center shrink-0 text-[#ffb95f]">
              <span className="material-symbols-outlined text-lg">lock</span>
            </div>
            <div className="min-w-0">
              <p className="font-bold text-[#ffb95f] text-[11px] uppercase tracking-wide flex items-center gap-1.5">
                <span>
                  {blockedNotice.type === 'return' ? 'Retorno de Aba Bloqueado' : 'Avanço de Aba Bloqueado'}
                </span>
                <span className="text-[10px] text-[#88929b] font-normal">• {blockedNotice.targetTabName}</span>
              </p>
              <p className="text-[#dfe2ee] text-xs leading-snug mt-0.5 truncate sm:text-clip">
                {blockedNotice.type === 'return' ? (
                  <>
                    Retorno permitido apenas após os resultados estarem prontos. Avance pelo botão:{' '}
                    <span className="text-[#89ceff] font-bold underline decoration-[#89ceff]/50">
                      "{blockedNotice.buttonLabel}"
                    </span>
                  </>
                ) : (
                  <>
                    Avanço permitido apenas pelo botão:{' '}
                    <span className="text-[#89ceff] font-bold underline decoration-[#89ceff]/50">
                      "{blockedNotice.buttonLabel}"
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {blockedNotice.buttonId && (
              <button
                type="button"
                onClick={() => {
                  highlightButton(blockedNotice.buttonId);
                  const targetBtn = document.getElementById(blockedNotice.buttonId);
                  if (targetBtn) {
                    targetBtn.focus();
                  }
                  setBlockedNotice(null);
                }}
                className="px-2.5 py-1.5 bg-[#89ceff] text-[#00344d] rounded font-mono text-[11px] font-bold hover:brightness-110 transition-all shadow-sm"
              >
                Localizar Botão
              </button>
            )}
            <button
              type="button"
              onClick={() => setBlockedNotice(null)}
              className="p-1 text-[#88929b] hover:text-white rounded hover:bg-[#262a33] transition-colors"
              aria-label="Fechar aviso"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Persistent Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 w-full z-40 flex justify-around items-center h-16 px-2 bg-[#0a0e16] border-t border-[#3e4850] shadow-2xl">
        {tabs.map((tab) => {
          const tabIndex = TAB_ORDER.indexOf(tab.key);
          const isActive = activeTab === tab.key;
          const isForward = tabIndex > activeIndex;
          const isPast = tabIndex < activeIndex;

          // Se o cálculo já foi finalizado (resultsReady), nenhuma aba fica bloqueada!
          const isBlocked = !resultsReady && (isForward || isPast);
          const isReturnBlocked = !resultsReady && isPast;

          let tooltip = tab.label;
          if (isBlocked) {
            if (isReturnBlocked) {
              tooltip = `Retorno bloqueado: O retorno a "${tab.label}" só é permitido após os resultados estarem prontos.`;
            } else {
              tooltip = `Avanço bloqueado: Utilize o botão "${TAB_ACTION_BUTTONS[activeTab].label}"`;
            }
          } else if (isActive) {
            tooltip = tab.label;
          } else if (isPast) {
            tooltip = `Retornar para ${tab.label}`;
          } else {
            tooltip = `Ir para ${tab.label}`;
          }

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabClick(tab.key, tab.label)}
              title={tooltip}
              className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${
                isBlocked
                  ? 'opacity-40 hover:opacity-60 cursor-not-allowed'
                  : isActive
                  ? 'text-[#89ceff] font-bold cursor-default'
                  : 'text-[#bec8d2] hover:text-[#dfe2ee] cursor-pointer active:scale-95'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <span
                  className={`material-symbols-outlined text-[22px] mb-0.5 ${
                    isActive ? 'fill-1' : ''
                  }`}
                >
                  {tab.icon}
                </span>

                {/* Lock badge indicating forward step or unready return is locked */}
                {isBlocked && (
                  <span
                    className="absolute -top-1 -right-2.5 flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[#181c24] border border-[#ffb95f]/70 text-[#ffb95f]"
                    title={isReturnBlocked ? 'Retorno bloqueado até os resultados ficarem prontos' : 'Avanço bloqueado'}
                  >
                    <span className="material-symbols-outlined text-[9px]">lock</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-0.5">
                <span className="font-mono text-[11px] leading-tight">{tab.label}</span>
              </div>

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
