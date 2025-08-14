import React, { useEffect, useState } from 'react';
import { Button } from '../ui/Button';
import { ArrowLeft, Settings as SettingsIcon, Moon, Sun } from 'lucide-react';

interface SettingsPageProps {
  onBack?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onBack }) => {
  // Dark mode toggle (moved here from Profile)
  const [dark, setDark] = useState(false);

  // Helper to determine current theme reliably
  const getIsDark = () => {
    try {
      const classDark = document.documentElement.classList.contains('dark');
      if (classDark) return true;
      const saved = localStorage.getItem('theme');
      if (saved === 'dark') return true;
      if (saved === 'light') return false;
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      return !!prefersDark;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    setDark(getIsDark());

    // Listen for external changes and keep in sync
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'theme') setDark(getIsDark());
    };
    window.addEventListener('storage', handleStorage);

    let mql: MediaQueryList | null = null;
    const handleMedia = () => setDark(getIsDark());
    try {
      mql = window.matchMedia('(prefers-color-scheme: dark)');
      if (mql.addEventListener) mql.addEventListener('change', handleMedia);
      else if ((mql as any).addListener) (mql as any).addListener(handleMedia);
    } catch {}

    // Observe DOM class changes in case theme toggled elsewhere
    const observer = new MutationObserver(() => setDark(getIsDark()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => {
      window.removeEventListener('storage', handleStorage);
      try {
        if (mql) {
          if (mql.removeEventListener) mql.removeEventListener('change', handleMedia);
          else if ((mql as any).removeListener) (mql as any).removeListener(handleMedia);
        }
      } catch {}
      observer.disconnect();
    };
  }, []);
  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    try {
      if (next) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
    } catch {}
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 dark:text-gray-100 pb-20">
      <div className="px-4 pt-4 pb-6 max-w-md mx-auto space-y-6">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="secondary" size="sm" onClick={onBack} className="!px-2 !py-1">
              <ArrowLeft size={16} />
            </Button>
          )}
          <div className="flex items-center gap-2">
            <SettingsIcon className="text-gray-500 dark:text-gray-300" size={18} />
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Settings</h1>
          </div>
        </div>

        <div className="bg-transparent rounded-none shadow-none border-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {dark ? (
                <Moon size={18} className="text-gray-500 dark:text-gray-300" />
              ) : (
                <Sun size={18} className="text-gray-500 dark:text-gray-300" />
              )}
              <span className="text-sm text-gray-700 dark:text-gray-300">Dark Mode</span>
            </div>
            <button
              onClick={toggleDark}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${dark ? 'bg-blue-700' : 'bg-gray-300 dark:bg-gray-600'}`}
              aria-label="Toggle dark mode"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white dark:bg-gray-200 shadow ring-1 ring-black/5 dark:ring-white/10 transition-transform ${dark ? 'translate-x-4' : 'translate-x-1'}`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
