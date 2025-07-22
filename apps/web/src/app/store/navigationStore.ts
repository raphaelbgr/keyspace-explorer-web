import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { secureRandomBigInt, generateUniformRandomInRange } from '../utils/secureRandom';

interface NavigationState {
  // Current navigation state
  currentPage: number;
  totalPages: string; // Changed to string to handle serialization
  keysPerPage: number;
  
  // Dynamic calculation settings
  estimatedTotalKeys: string; // Changed to string to handle serialization
  keysPerPageOptions: number[];
  
  // Actions
  setCurrentPage: (page: number) => void;
  setTotalPages: (pages: bigint) => void;
  setKeysPerPage: (keysPerPage: number) => void;
  calculateTotalPages: (estimatedKeys: bigint) => void;
  generateRandomPage: () => number | string;
  
  // Navigation helpers
  canNavigateForward: () => boolean;
  canNavigateBackward: () => boolean;
  getPageRange: (aroundPage: number, range: number) => number[];
  getLastPageNumber: () => string; // New method to get last page as string
  
  // Utility methods to convert to BigInt when needed
  getTotalPagesBigInt: () => bigint;
  getEstimatedTotalKeysBigInt: () => bigint;
}

export const useNavigationStore = create<NavigationState>()(
  persist(
    (set, get) => ({
      currentPage: 1,
      totalPages: (BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364140") / BigInt(45)).toString(), // Store as string
      keysPerPage: 45,
      estimatedTotalKeys: BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364140").toString(), // Store as string
      keysPerPageOptions: [10, 25, 45, 50, 100, 250, 500, 1000, 10000],
      
      setCurrentPage: (page: number) => {
        set({ currentPage: Math.max(1, page) });
      },
      
      setTotalPages: (pages: bigint) => {
        set({ totalPages: (pages > BigInt(0) ? pages : BigInt(1)).toString() });
      },
      
      setKeysPerPage: (keysPerPage: number) => {
        const state = get();
        // Use BigInt arithmetic to avoid Number conversion issues
        const estimatedKeysBigInt = BigInt(state.estimatedTotalKeys);
        const totalPagesBigInt = estimatedKeysBigInt / BigInt(keysPerPage);
        const remainder = estimatedKeysBigInt % BigInt(keysPerPage);
        const newTotalPages = remainder > BigInt(0) ? totalPagesBigInt + BigInt(1) : totalPagesBigInt;
        
        set({ 
          keysPerPage, 
          totalPages: newTotalPages.toString(),
          currentPage: Math.min(state.currentPage, Number(newTotalPages))
        });
      },
      
      calculateTotalPages: (estimatedKeys: bigint) => {
        const state = get();
        // Use BigInt division to avoid Number conversion issues
        // Calculate total pages using BigInt arithmetic
        const estimatedKeysBigInt = BigInt(state.estimatedTotalKeys);
        const totalPagesBigInt = estimatedKeysBigInt / BigInt(state.keysPerPage);
        const remainder = estimatedKeysBigInt % BigInt(state.keysPerPage);
        const totalPages = remainder > BigInt(0) ? totalPagesBigInt + BigInt(1) : totalPagesBigInt;
        
        set({ 
          estimatedTotalKeys: estimatedKeys.toString(),
          totalPages: totalPages.toString() // Convert to string
        });
      },
      
      generateRandomPage: () => {
        const state = get();
        
        try {
          // Use the secure crypto-based random generation for enhanced randomness
          // Convert totalPages string to BigInt for calculation
          const actualMaxPages = BigInt(state.totalPages);
          
          console.log(`Generating random page in range 1 to ${actualMaxPages.toString()}`);
          
          try {
            // Use generateUniformRandomInRange with max value
            const randomBigInt = generateUniformRandomInRange(actualMaxPages);
            console.log(`Generated random page: ${randomBigInt.toString()}`);
            return randomBigInt.toString();
          } catch (error) {
            console.warn('generateUniformRandomInRange failed, using fallback:', error);
          }
        } catch (error) {
          console.warn('Secure random generation failed, using Math.random fallback:', error);
        }
        
        // Final fallback: use the actual totalPages but with standard crypto random
        const currentState = get();
        const maxPages = BigInt(currentState.totalPages);
          
          // For very large numbers, use modulo approach with the real range
        const randomBytes = new Uint32Array(2);
          crypto.getRandomValues(randomBytes);
        const randomValue = (BigInt(randomBytes[0]) << BigInt(32)) | BigInt(randomBytes[1]);
        const randomPage = (randomValue % maxPages) + BigInt(1);
        
          return randomPage.toString();
      },
      
      canNavigateForward: () => {
        const state = get();
        return BigInt(state.currentPage) < BigInt(state.totalPages);
      },
      
      canNavigateBackward: () => {
        const state = get();
        return BigInt(state.currentPage) > BigInt(1);
      },
      
      getPageRange: (aroundPage: number, range: number) => {
        const state = get();
        const totalPagesNum = BigInt(state.totalPages);
        const start = Math.max(1, aroundPage - range);
        const end = Math.min(Number(totalPagesNum), aroundPage + range);
        const pages: number[] = [];
        
        for (let i = start; i <= end; i++) {
          pages.push(i);
        }
        
        return pages;
      },

      getLastPageNumber: () => {
        const state = get();
        return state.totalPages;
      },
      
      // Utility methods to convert to BigInt when needed
      getTotalPagesBigInt: () => {
        const state = get();
        return BigInt(state.totalPages);
      },
      
      getEstimatedTotalKeysBigInt: () => {
        const state = get();
        return BigInt(state.estimatedTotalKeys);
      },
    }),
    {
      name: 'bitcoin-explorer-navigation',
      partialize: (state) => ({ 
        currentPage: state.currentPage,
        keysPerPage: state.keysPerPage,
        estimatedTotalKeys: state.estimatedTotalKeys,
        totalPages: state.totalPages,
      } as Record<string, unknown>),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Ensure values are strings (they should already be strings from storage)
          state.estimatedTotalKeys = String(state.estimatedTotalKeys);
          state.totalPages = String(state.totalPages);
        }
      },
    }
  )
); 