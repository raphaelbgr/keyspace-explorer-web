import { create } from 'zustand';

export interface ScanConfig {
  mode: 'random' | 'sequential' | 'targeted';
  targetPage?: number;
  maxPages?: number;
  delay: number;
  apiSource: string;
}

export interface ScannerState {
  isScanning: boolean;
  currentPage: number;
  scanConfig: ScanConfig;
  totalBalance: number;
  pagesScanned: number;
  lastScannedPage: number;
  scanStartTime: Date | null;
  isAutoContinuing: boolean;
  
  // Actions
  startScan: (config: ScanConfig) => void;
  stopScan: () => void;
  updateBalance: (balance: number) => void;
  setCurrentPage: (page: number) => void;
  incrementPagesScanned: () => void;
  setAutoContinuing: (continuing: boolean) => void;
  resetScanner: () => void;
}

export const useScannerStore = create<ScannerState>((set, get) => ({
  isScanning: false,
  currentPage: 1,
  scanConfig: {
    mode: 'sequential',
    maxPages: 100,
    delay: 1000,
    apiSource: 'local',
  },
  totalBalance: 0,
  pagesScanned: 0,
  lastScannedPage: 0,
  scanStartTime: null,
  isAutoContinuing: false,

  startScan: (config: ScanConfig) => set({
    isScanning: true,
    scanConfig: config,
    scanStartTime: new Date(),
    pagesScanned: 0,
    totalBalance: 0,
    isAutoContinuing: false,
  }),

  stopScan: () => set({
    isScanning: false,
    isAutoContinuing: false,
  }),

  updateBalance: (balance: number) => {
    const state = get();
    set({
      totalBalance: balance,
      lastScannedPage: state.currentPage,
    });
  },

  setCurrentPage: (page: number) => set({
    currentPage: page,
  }),

  incrementPagesScanned: () => set((state) => ({
    pagesScanned: state.pagesScanned + 1,
  })),

  setAutoContinuing: (continuing: boolean) => set({
    isAutoContinuing: continuing,
  }),

  resetScanner: () => set({
    isScanning: false,
    currentPage: 1,
    totalBalance: 0,
    pagesScanned: 0,
    lastScannedPage: 0,
    scanStartTime: null,
    isAutoContinuing: false,
  }),
})); 