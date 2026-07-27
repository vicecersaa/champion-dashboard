import { Palette, Check, Sun, Moon } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { useTheme } from '../contexts/ThemeContext';

export function SettingsPage() {
 
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Theme */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-1">
          <Palette className="h-5 w-5 text-brand-500" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Tema</h3>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">Pilih mode tampilan dashboard</p>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => theme === 'dark' && toggleTheme()}
            className={`relative rounded-xl border-2 p-5 text-left transition-all ${theme === 'light' ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-900/10' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-500">
                <Sun className="h-5 w-5" />
              </div>
              {theme === 'light' && <Check className="h-5 w-5 text-brand-600" />}
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Mode Terang</p>
            <p className="text-xs text-gray-400 mt-0.5">Tampilan terang dan jernih</p>
          </button>

          <button
            onClick={() => theme === 'light' && toggleTheme()}
            className={`relative rounded-xl border-2 p-5 text-left transition-all ${theme === 'dark' ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-900/10' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                <Moon className="h-5 w-5" />
              </div>
              {theme === 'dark' && <Check className="h-5 w-5 text-brand-600" />}
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Mode Gelap</p>
            <p className="text-xs text-gray-400 mt-0.5">Tampilan gelap dan elegan</p>
          </button>
        </div>
      </Card>

      
      
    </div>
  );
}
