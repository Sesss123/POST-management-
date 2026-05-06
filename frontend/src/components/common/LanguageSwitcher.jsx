import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

const LanguageSwitcher = ({ className, showLabel = true }) => {
  const { i18n, t } = useTranslation();

  const languages = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'si', label: 'සිංහල', flag: '🇱🇰' }
  ];

  const currentLang = languages.find(l => l.code === (i18n.language?.split('-')[0] || 'en')) || languages[0];

  const toggleLanguage = (code) => {
    i18n.changeLanguage(code);
    localStorage.setItem('i18nextLng', code);
  };

  return (
    <div className={cn("relative group", className)}>
      <button className="flex items-center gap-2 px-3 py-2 bg-slate-50 hover:bg-white rounded-xl border border-slate-100 transition-all shadow-sm group">
        <div className="w-6 h-6 flex items-center justify-center bg-white rounded-lg text-xs shadow-sm">
          <Globe size={14} className="text-indigo-600" />
        </div>
        {showLabel && (
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">
            {currentLang.label}
          </span>
        )}
        <ChevronDown size={14} className="text-slate-400 group-hover:rotate-180 transition-transform duration-300" />
      </button>

      {/* Dropdown */}
      <div className="absolute right-0 top-full mt-2 w-40 bg-white rounded-2xl shadow-2xl border border-slate-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-[100] overflow-hidden">
        <div className="p-2 space-y-1">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => toggleLanguage(lang.code)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-tight transition-all",
                i18n.language?.startsWith(lang.code)
                  ? "bg-indigo-600 text-white"
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <span>{lang.label}</span>
              <span className="text-sm">{lang.flag}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LanguageSwitcher;
