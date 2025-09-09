import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check } from 'lucide-react';
import { LANGUAGES } from '../constants/languages';

interface LanguageSelectorProps {
  currentLanguage: string;
  onSelectLanguage: (language: string) => void;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ currentLanguage, onSelectLanguage }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [wrapperRef]);

  const handleSelect = (languageName: string) => {
    onSelectLanguage(languageName);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
        aria-label="Select language"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <Globe className="w-4 h-4" />
        <span className="hidden sm:inline">{currentLanguage}</span>
      </button>
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-20 origin-top-right">
          <ul className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="language-menu-button">
            {LANGUAGES.map((lang) => (
              <li key={lang.code}>
                <button
                  onClick={() => handleSelect(lang.name)}
                  className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 flex items-center justify-between"
                  role="menuitem"
                >
                  <span>{lang.name}</span>
                  {currentLanguage === lang.name && <Check className="w-4 h-4 text-blue-400" />}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
