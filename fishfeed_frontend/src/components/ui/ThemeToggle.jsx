import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../../context/ThemeContext';

export function ThemeToggleCompact({ className = '' }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className={`relative w-9 h-9 inline-flex items-center justify-center rounded-lg text-[#5C7384] dark:text-[#93A4AF] hover:bg-[#E6EDF1] dark:hover:bg-white/[0.06] transition-colors ${className}`}
    >
      <motion.div
        key={isDark ? 'moon' : 'sun'}
        initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
        animate={{ opacity: 1, rotate: 0, scale: 1 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      >
        {isDark ? <Moon size={17} strokeWidth={2} /> : <Sun size={17} strokeWidth={2} />}
      </motion.div>
    </button>
  );
}

export function ThemeToggleSwitch({ className = '' }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      aria-label="Toggle theme"
      className={`relative inline-flex items-center w-[52px] h-7 rounded-full px-1 transition-colors duration-200 ${
        isDark ? 'bg-[#2389B5]' : 'bg-[#E6EDF1]'
      } ${className}`}
    >
      <motion.div
        className="w-5 h-5 rounded-full bg-white shadow-sm flex items-center justify-center"
        animate={{ x: isDark ? 24 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
      >
        {isDark
          ? <Moon size={11} className="text-[#0E4561]" strokeWidth={2.5} />
          : <Sun size={11} className="text-[#D89A2A]" strokeWidth={2.5} />}
      </motion.div>
    </button>
  );
}

export function ThemeToggleRow() {
  const { theme } = useTheme();
  return (
    <div className="flex items-center justify-between p-4 rounded-2xl border border-[#E6EDF1] dark:border-[#233340]">
      <div className="flex items-center gap-3">
        <span className="w-9 h-9 rounded-xl bg-[#E3F1F7] dark:bg-[#123347] flex items-center justify-center">
          {theme === 'dark'
            ? <Moon size={16} className="text-[#3FA3CC]" strokeWidth={2} />
            : <Sun size={16} className="text-[#0E4561]" strokeWidth={2} />}
        </span>
        <div>
          <p className="text-[13.5px] font-bold text-[#14202B] dark:text-[#EEF3F6]">Appearance</p>
          <p className="text-xs text-[#5C7384] dark:text-[#93A4AF]">
            {theme === 'dark' ? 'Dark mode' : 'Light mode'}
          </p>
        </div>
      </div>
      <ThemeToggleSwitch />
    </div>
  );
}
