import React from 'react';
import { Sparkles } from 'lucide-react';
import { useCoPilot } from '@/contexts/CoPilotContext';
import { useThemeStore } from '@/stores/themeStore';

const CoPilotButton: React.FC = () => {
  const { openPanel } = useCoPilot();
  const { theme } = useThemeStore();

  return (
    <button
      onClick={openPanel}
      className="fixed bottom-6 right-6 z-30 p-4 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition-all duration-300 group"
      title="Open CoPilot"
    >
      <Sparkles className="w-6 h-6" />
      <span className="absolute -top-2 -right-2 w-3 h-3 bg-green-500 rounded-full animate-pulse" />

      <div className={`absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-2 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${
        theme === 'dark'
          ? 'bg-gray-800 text-white'
          : 'bg-white text-gray-900'
      } shadow-lg`}>
        <span className="text-sm font-medium">Ask CoPilot</span>
      </div>
    </button>
  );
};

export default CoPilotButton;
