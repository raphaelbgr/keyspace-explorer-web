import { create } from 'zustand';

interface ThemeState {
  mode: 'light' | 'dark';
  isHydrated: boolean;
  toggle: () => void;
  setMode: (mode: 'light' | 'dark') => void;
  hydrate: () => void;
}

const getInitialMode = (): 'light' | 'dark' => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('theme-mode');
    if (stored === 'light' || stored === 'dark') return stored;
    // Detect system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  }
  return 'light';
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'light', // Default to light, will be updated on hydration
  isHydrated: false,
  toggle: () => {
    const newMode = get().mode === 'light' ? 'dark' : 'light';
    set({ mode: newMode });
    // Apply theme to document immediately
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(newMode);
    }
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme-mode', newMode);
    }
  },
  setMode: (mode) => {
    set({ mode });
    // Apply theme to document immediately
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(mode);
    }
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme-mode', mode);
    }
  },
  hydrate: () => {
    const initialMode = getInitialMode();
    set({ mode: initialMode, isHydrated: true });
    // Apply theme to document immediately
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('light', 'dark');
      document.documentElement.classList.add(initialMode);
    }
  },
})); 