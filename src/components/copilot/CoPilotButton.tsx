
import React from 'react';
import { Sparkles } from 'lucide-react';
import { useCoPilot } from '@/contexts/CoPilotContext';
import { useThemeStore } from '@/stores/themeStore';

const CoPilotButton: React.FC = () => {
  const { openPanel, isOpen } = useCoPilot();
  const { theme } = useThemeStore();

  // Don't show button if panel is already open
  if (isOpen) return null;

  return (
    <button
      onClick={openPanel}
      className={`
        fixed top-1/2 right-0 z-40 
        transform -translate-y-1/2 translate-x-1 hover:translate-x-0
        flex items-center gap-2
        py-3 px-2 pl-3
        rounded-l-2xl
        shadow-lg
        transition-all duration-300 ease-out
        border-y border-l border-r-0
        backdrop-blur-md
        group
        ${theme === 'dark'
          ? 'bg-gray-900/80 border-purple-500/30 text-white'
          : 'bg-white/80 border-purple-200 text-gray-900'
        }
      `}
      title="Open CoPilot"
    >
      <div className={`
        relative flex items-center justify-center
        w-8 h-8 rounded-full
        ${theme === 'dark' ? 'bg-purple-500/20' : 'bg-purple-100'}
        group-hover:scale-110 transition-transform duration-300
      `}>
        <Sparkles
          className={`
            w-4 h-4 
            ${theme === 'dark' ? 'text-purple-300' : 'text-purple-600'}
          `}
        />
        {/* Subtle glow effect */}
        <div className={`
          absolute inset-0 rounded-full opacity-0 group-hover:opacity-100
          animate-pulse
          ${theme === 'dark' ? 'bg-purple-400/20' : 'bg-purple-400/20'}
          transition-opacity duration-500
        `} />
      </div>

      <span className={`
        writing-mode-vertical 
        text-xs font-bold tracking-widest uppercase
        overflow-hidden w-0 group-hover:w-auto
        group-hover:opacity-100 opacity-0
        transition-all duration-300
        whitespace-nowrap
        ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}
      `}>
        AI
      </span>
    </button>
  );
};

export default CoPilotButton;
