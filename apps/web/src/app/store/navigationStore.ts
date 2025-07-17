import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface NavigationState {
  // Current navigation state
  currentPage: number;
  totalPages: bigint; // Changed to BigInt to handle large numbers
  keysPerPage: number;
  
  // Dynamic calculation settings
  estimatedTotalKeys: bigint;
  keysPerPageOptions: number[];
  
  // Actions
  setCurrentPage: (page: number) => void;
  setTotalPages: (pages: bigint) => void;
  setKeysPerPage: (keysPerPage: number) => void;
  calculateTotalPages: (estimatedKeys: bigint) => void;
  generateRandomPage: () => number;
  
  // Navigation helpers
  canNavigateForward: () => boolean;
  canNavigateBackward: () => boolean;
  getPageRange: (aroundPage: number, range: number) => number[];
  getLastPageNumber: () => string; // New method to get last page as string
}

export const useNavigationStore = create<NavigationState>()(
  persist(
    (set, get) => ({
      currentPage: 1,
      totalPages: BigInt(1),
      keysPerPage: 45,
      estimatedTotalKeys: BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364140"), // Maximum Bitcoin private key
      keysPerPageOptions: [10, 25, 45, 50, 100, 250, 500],
      
      setCurrentPage: (page: number) => {
        set({ currentPage: Math.max(1, page) });
      },
      
      setTotalPages: (pages: bigint) => {
        set({ totalPages: pages > BigInt(0) ? pages : BigInt(1) });
      },
      
      setKeysPerPage: (keysPerPage: number) => {
        const state = get();
        // Use BigInt arithmetic to avoid Number conversion issues
        const totalPagesBigInt = state.estimatedTotalKeys / BigInt(keysPerPage);
        const remainder = state.estimatedTotalKeys % BigInt(keysPerPage);
        const newTotalPages = remainder > BigInt(0) ? totalPagesBigInt + BigInt(1) : totalPagesBigInt;
        
        set({ 
          keysPerPage, 
          totalPages: newTotalPages,
          currentPage: Math.min(state.currentPage, Number(newTotalPages))
        });
      },
      
      calculateTotalPages: (estimatedKeys: bigint) => {
        const state = get();
        // Use BigInt division to avoid Number conversion issues
        // Calculate total pages using BigInt arithmetic
        const totalPagesBigInt = estimatedKeys / BigInt(state.keysPerPage);
        const remainder = estimatedKeys % BigInt(state.keysPerPage);
        const totalPages = remainder > BigInt(0) ? totalPagesBigInt + BigInt(1) : totalPagesBigInt;
        
        set({ 
          estimatedTotalKeys: estimatedKeys,
          totalPages: totalPages > BigInt(0) ? totalPages : BigInt(1)
        });
      },
      
      generateRandomPage: () => {
        const state = get();
        const maxPage = Math.min(Number(state.totalPages), 1000000); // Limit to reasonable range
        return Math.floor(Math.random() * maxPage) + 1;
      },
      
      canNavigateForward: () => {
        const state = get();
        return state.currentPage < Number(state.totalPages);
      },
      
      canNavigateBackward: () => {
        const state = get();
        return state.currentPage > 1;
      },
      
      getPageRange: (aroundPage: number, range: number) => {
        const state = get();
        const totalPagesNum = Number(state.totalPages);
        const start = Math.max(1, aroundPage - range);
        const end = Math.min(totalPagesNum, aroundPage + range);
        const pages: number[] = [];
        
        for (let i = start; i <= end; i++) {
          pages.push(i);
        }
        
        return pages;
      },

      getLastPageNumber: () => {
        const state = get();
        return state.totalPages.toString();
      },
    }),
    {
      name: 'bitcoin-explorer-navigation',
      partialize: (state) => ({ 
        currentPage: state.currentPage,
        keysPerPage: state.keysPerPage,
        estimatedTotalKeys: String(state.estimatedTotalKeys),
        totalPages: String(state.totalPages),
      } as Record<string, unknown>),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Convert strings back to BigInt
          state.estimatedTotalKeys = BigInt(state.estimatedTotalKeys as string);
          state.totalPages = BigInt(state.totalPages as string);
        }
      },
    }
  )
); 