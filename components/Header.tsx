import React from 'react';
import { BrainCircuit, PlusSquare, Search } from 'lucide-react';
import LanguageSelector from './LanguageSelector';

interface HeaderProps {
  onNewChat: () => void;
  currentLanguage: string;
  onLanguageChange: (language: string) => void;
  isSearchEnabled: boolean;
  onToggleSearch: () => void;
}

const Header: React.FC<HeaderProps> = ({ onNewChat, currentLanguage, onLanguageChange, isSearchEnabled, onToggleSearch }) => {
  return (
    <header className="p-4 border-b border-gray-700/50 bg-gray-900/80 backdrop-blur-sm z-10">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BrainCircuit className="h-8 w-8 text-blue-400" />
          <h1 className="text-2xl font-bold text-gray-100 tracking-tight">
            Gemini AI Chat
          </h1>
        </div>
        <div className="flex items-center space-x-2">
            <button
              onClick={onToggleSearch}
              className={`flex items-center space-x-2 px-3 py-2 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                isSearchEnabled
                  ? 'bg-blue-600 border-blue-500 text-white'
                  : 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
              aria-pressed={isSearchEnabled}
              aria-label="Toggle web search"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Search web</span>
            </button>
            <LanguageSelector 
              currentLanguage={currentLanguage}
              onSelectLanguage={onLanguageChange}
            />
            <button
              onClick={onNewChat}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
              aria-label="Start new chat"
            >
              <PlusSquare className="w-4 h-4" />
              <span>New Chat</span>
            </button>
        </div>
      </div>
    </header>
  );
};

export default Header;