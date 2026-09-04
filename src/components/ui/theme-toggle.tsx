'use client';

import React, { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/providers/theme-provider';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className = '', showLabel = false }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={`w-9 h-9 rounded-xl border border-border/80 bg-surface/80 flex items-center justify-center opacity-50 ${className}`}
        aria-hidden="true"
      >
        <span className="w-4 h-4" />
      </div>
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`inline-flex items-center justify-center gap-2 px-2.5 h-9 border border-border/80 bg-surface/80 backdrop-blur-md text-foreground hover:bg-surface-hover transition-all rounded-xl font-mono text-[11px] uppercase tracking-widest active:scale-[0.95] shadow-sm ${className}`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-accent transition-transform duration-200 rotate-0" />
      ) : (
        <Moon className="w-4 h-4 text-foreground-muted transition-transform duration-200 rotate-0" />
      )}
      {showLabel && (
        <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
      )}
    </button>
  );
}
