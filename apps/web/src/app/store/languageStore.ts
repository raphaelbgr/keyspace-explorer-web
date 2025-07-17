import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Language = 'en' | 'pt';

interface LanguageState {
  language: Language;
  setLanguage: (language: Language) => void;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set) => ({
      language: 'en',
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'bitcoin-explorer-language',
      partialize: (state) => ({ language: state.language }),
    }
  )
); 