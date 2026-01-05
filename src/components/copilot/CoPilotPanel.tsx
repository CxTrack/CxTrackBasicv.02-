import React, { useState, useRef, useEffect } from 'react';
import { useCoPilot } from '@/contexts/CoPilotContext';
import { useThemeStore } from '@/stores/themeStore';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Send,
  Settings,
  Trash2,
  MessageSquare,
  Database,
  Zap,
  Info,
  Paperclip,
} from 'lucide-react';
import toast from 'react-hot-toast';

const CoPilotPanel: React.FC = () => {
  const {
    isOpen,
    panelSide,
    messages,
    isLoading,
    currentContext,
    closePanel,
    setPanelSide,
    sendMessage,
    clearMessages,
  } = useCoPilot();

  const { theme } = useThemeStore();
  const [input, setInput] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    await sendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const switchSide = () => {
    setPanelSide(panelSide === 'left' ? 'right' : 'left');
  };

  if (!isOpen) return null;

  const isDark = theme === 'dark';
  const isSoftModern = theme === 'soft-modern';

  return (
    <div
      className={`
        fixed top-0 ${panelSide === 'left' ? 'left-0' : 'right-0'} h-full z-50
        ${isSoftModern ? 'bg-[#F8F6F2]' : isDark ? 'bg-gray-800' : 'bg-white'}
        border-2 ${panelSide === 'left' ? 'border-r' : 'border-l'}
        ${isDark ? 'border-gray-700' : 'border-gray-200'}
        flex flex-col
        transition-all duration-300
      `}
      style={{
        width: '400px',
        boxShadow: panelSide === 'left'
          ? '4px 0 24px rgba(0, 0, 0, 0.15)'
          : '-4px 0 24px rgba(0, 0, 0, 0.15)'
      }}
    >
      {/* Header */}
      <div className={`flex items-center justify-between p-4 border-b-2 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-md">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              CxTrack CoPilot
            </h2>
            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              AI-powered assistant
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={switchSide}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            title="Switch side"
          >
            {panelSide === 'left' ? (
              <ChevronRight className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
            ) : (
              <ChevronLeft className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
            )}
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            title="Settings"
          >
            <Settings className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
          </button>

          <button
            onClick={closePanel}
            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            title="Close"
          >
            <X className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
          </button>
        </div>
      </div>

      {showSettings && <CoPilotSettings onClose={() => setShowSettings(false)} />}

      {currentContext && (
        <div className={`px-4 py-3 border-b-2 ${isDark
          ? 'bg-blue-900/30 border-blue-800'
          : 'bg-blue-50 border-blue-100'
          } flex items-center gap-2`}>
          <Database className={`w-4 h-4 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
          <span className={`text-xs font-medium ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
            Context: {currentContext.page || 'Dashboard'}
          </span>
        </div>
      )}

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <EmptyState />
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}

        {isLoading && (
          <div className={`flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" />
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
            <span className="text-sm ml-2">CoPilot is thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className={`px-4 py-2 border-t-2 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <QuickActionChip
            icon={<MessageSquare className="w-3.5 h-3.5" />}
            label="Analyze data"
            onClick={() => setInput('Analyze my customer data and give me insights')}
          />
          <QuickActionChip
            icon={<Zap className="w-3.5 h-3.5" />}
            label="Generate report"
            onClick={() => setInput('Generate a summary report of this page')}
          />
          <QuickActionChip
            icon={<Info className="w-3.5 h-3.5" />}
            label="Help"
            onClick={() => setInput('What can you help me with?')}
          />
        </div>
      </div>

      {/* Input area */}
      <div className={`p-4 border-t-2 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask CoPilot anything..."
                className={`
                  w-full px-4 py-3 pr-10
                  rounded-xl
                  border-2
                  ${isDark
                    ? 'bg-gray-700 border-gray-600 text-white placeholder:text-gray-500'
                    : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400'
                  }
                  focus:border-purple-500 focus:outline-none
                  resize-none
                  transition-colors
                  max-h-32
                `}
                rows={1}
                style={{ minHeight: '48px' }}
              />

              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={clearMessages}
                  className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-100'}`}
                  title="Clear conversation"
                >
                  <Trash2 className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 self-end pb-0.5">
              <input
                type="file"
                id="copilot-file-upload"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    toast.success(`File "${file.name}" selected for upload`);
                  }
                }}
              />
              <label
                htmlFor="copilot-file-upload"
                className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${isDark
                  ? 'bg-gray-700 border-gray-600 text-gray-400 hover:text-white hover:border-gray-500'
                  : 'bg-white border-gray-200 text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                title="Upload file"
              >
                <Paperclip className="w-5 h-5" />
              </label>

              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className={`
                  p-3 rounded-xl
                  bg-gradient-to-br from-purple-500 to-purple-600
                  text-white
                  shadow-md
                  hover:from-purple-600 hover:to-purple-700
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all
                `}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </form>

        <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'} mt-3 text-center`}>
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};

const EmptyState: React.FC = () => {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <div className="text-center py-12">
      <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${isDark
        ? 'bg-purple-900/30'
        : 'bg-gradient-to-br from-purple-100 to-purple-200'
        }`}>
        <Sparkles className={`w-8 h-8 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
      </div>
      <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'} mb-2`}>
        Hi! I'm your CoPilot
      </h3>
      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-4 max-w-xs mx-auto`}>
        I can help you analyze data, generate reports, find customers, and more.
      </p>

      <div className="space-y-2">
        <p className={`text-xs font-semibold ${isDark ? 'text-gray-500' : 'text-gray-500'} uppercase tracking-wide`}>
          Try asking:
        </p>
        <div className="space-y-2">
          <SuggestedPrompt text="Show me my top customers this month" />
          <SuggestedPrompt text="What's my revenue trend?" />
          <SuggestedPrompt text="Find overdue tasks" />
        </div>
      </div>
    </div>
  );
};

const SuggestedPrompt: React.FC<{ text: string }> = ({ text }) => {
  const { sendMessage } = useCoPilot();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={() => sendMessage(text)}
      className={`block w-full text-left px-4 py-2 rounded-lg text-sm transition-colors ${isDark
        ? 'bg-purple-900/30 hover:bg-purple-900/50 text-purple-300'
        : 'bg-purple-50 hover:bg-purple-100 text-purple-700'
        }`}
    >
      "{text}"
    </button>
  );
};

const MessageBubble: React.FC<{ message: any }> = ({ message }) => {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`
          max-w-[85%] px-4 py-3 rounded-2xl
          ${isUser
            ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white'
            : isDark
              ? 'bg-gray-700 text-white'
              : 'bg-gray-100 text-gray-900'
          }
        `}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <p
          className={`text-xs mt-1 ${isUser
            ? 'text-purple-100'
            : isDark
              ? 'text-gray-400'
              : 'text-gray-500'
            }`}
        >
          {new Date(message.timestamp).toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};

const QuickActionChip: React.FC<{
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}> = ({ icon, label, onClick }) => {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${isDark
        ? 'bg-purple-900/30 hover:bg-purple-900/50 text-purple-300'
        : 'bg-purple-50 hover:bg-purple-100 text-purple-700'
        }`}
    >
      {icon}
      {label}
    </button>
  );
};

const CoPilotSettings: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { config, setConfig } = useCoPilot();
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  const [localConfig, setLocalConfig] = useState(config);

  const handleSave = () => {
    setConfig(localConfig);
    onClose();
  };

  return (
    <div className={`px-4 py-3 border-b-2 space-y-3 ${isDark
      ? 'bg-gray-900 border-gray-700'
      : 'bg-gray-50 border-gray-200'
      }`}>
      <div className="flex items-center justify-between">
        <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          CoPilot Settings
        </h3>
        <button
          onClick={onClose}
          className="text-sm text-purple-600 font-medium hover:text-purple-700"
        >
          Done
        </button>
      </div>

      <div>
        <label className={`text-xs font-medium mb-1 block ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Provider
        </label>
        <select
          value={localConfig.provider}
          onChange={(e) =>
            setLocalConfig({ ...localConfig, provider: e.target.value as any })
          }
          className={`w-full px-3 py-2 rounded-lg border-2 text-sm ${isDark
            ? 'bg-gray-700 border-gray-600 text-white'
            : 'bg-white border-gray-200 text-gray-900'
            }`}
        >
          <option value="internal">Internal (Database)</option>
          <option value="openai">OpenAI</option>
          <option value="anthropic">Anthropic (Claude)</option>
          <option value="ollama">Ollama (Local)</option>
          <option value="custom">Custom Endpoint</option>
        </select>
      </div>

      {(localConfig.provider === 'openai' || localConfig.provider === 'anthropic') && (
        <div>
          <label className={`text-xs font-medium mb-1 block ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            API Key
          </label>
          <input
            type="password"
            value={localConfig.apiKey || ''}
            onChange={(e) =>
              setLocalConfig({ ...localConfig, apiKey: e.target.value })
            }
            className={`w-full px-3 py-2 rounded-lg border-2 text-sm ${isDark
              ? 'bg-gray-700 border-gray-600 text-white'
              : 'bg-white border-gray-200 text-gray-900'
              }`}
            placeholder="sk-..."
          />
        </div>
      )}

      <div>
        <label className={`text-xs font-medium mb-1 block ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          Model
        </label>
        <input
          type="text"
          value={localConfig.model || ''}
          onChange={(e) =>
            setLocalConfig({ ...localConfig, model: e.target.value })
          }
          className={`w-full px-3 py-2 rounded-lg border-2 text-sm ${isDark
            ? 'bg-gray-700 border-gray-600 text-white'
            : 'bg-white border-gray-200 text-gray-900'
            }`}
          placeholder="gpt-4, claude-3, llama2..."
        />
      </div>

      <button
        onClick={handleSave}
        className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg font-medium text-sm hover:bg-purple-700 transition-colors shadow-md"
      >
        Save Settings
      </button>
    </div>
  );
};

export default CoPilotPanel;
