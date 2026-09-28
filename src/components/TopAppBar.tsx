import React from 'react';

interface TopAppBarProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  title = 'Beam Engineering',
  subtitle,
  showBack = false,
  onBack,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#181c24] border-b border-[#3e4850] flex justify-between items-center w-full px-4 h-14 transition-colors">
      <div className="flex items-center space-x-2.5">
        {showBack ? (
          <button
            onClick={onBack}
            aria-label="Voltar"
            className="flex items-center justify-center w-9 h-9 rounded text-[#bec8d2] hover:bg-[#262a33] hover:text-[#89ceff] active:opacity-80 transition-colors"
            type="button"
          >
            <span className="material-symbols-outlined text-xl">arrow_back</span>
          </button>
        ) : (
          <button
            aria-label="Perfil Viga I"
            className="flex items-center justify-center p-1.5 rounded text-[#89ceff] hover:bg-[#262a33] active:opacity-80 transition-colors"
            type="button"
            title="Perfil de Viga I"
          >
            <span className="flex items-center justify-center w-6 h-6 text-[#89ceff]">
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Perfil de Viga I Estrutural com concordâncias nas mesas e alma */}
                <path
                  d="M4 3.5C4 3.22 4.22 3 4.5 3H19.5C19.78 3 20 3.22 20 3.5V6C20 6.28 19.78 6.5 19.5 6.5H13.8C13.25 6.5 12.8 6.95 12.8 7.5V16.5C12.8 17.05 13.25 17.5 13.8 17.5H19.5C19.78 17.5 20 17.72 20 18V20.5C20 20.78 19.78 21 19.5 21H4.5C4.22 21 4 20.78 4 20.5V18C4 17.72 4.22 17.5 4.5 17.5H10.2C10.75 17.5 11.2 17.05 11.2 16.5V7.5C11.2 6.95 10.75 6.5 10.2 6.5H4.5C4.22 6.5 4 6.28 4 6V3.5Z"
                  fill="currentColor"
                />
                {/* Eixos baricêntricos de simetria X-X e Y-Y */}
                <line
                  x1="12"
                  y1="4.5"
                  x2="12"
                  y2="19.5"
                  stroke="#0f131c"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeDasharray="1.5 1.5"
                />
                <line
                  x1="5.5"
                  y1="12"
                  x2="18.5"
                  y2="12"
                  stroke="#0f131c"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeDasharray="1.5 1.5"
                />
              </svg>
            </span>
          </button>
        )}

        <div className="flex flex-col">
          <div className="flex items-center space-x-1.5">
            <span className="font-headline font-bold text-lg text-[#89ceff] tracking-tight">
              {title}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-1 sm:space-x-2" />
    </header>
  );
};
