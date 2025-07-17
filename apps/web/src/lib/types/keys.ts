export interface PrivateKey {
  privateKey: string;
  pageNumber: bigint;
  index: number;
  addresses: DerivedAddresses;
  balances: AddressBalances;
  totalBalance: number;
}

export interface DerivedAddresses {
  p2pkh_compressed: string;
  p2pkh_uncompressed: string;
  p2wpkh: string;
  p2sh_p2wpkh: string;
  p2tr: string;
}

export interface AddressBalances {
  p2pkh_compressed: number;
  p2pkh_uncompressed: number;
  p2wpkh: number;
  p2sh_p2wpkh: number;
  p2tr: number;
}

export interface PageData {
  pageNumber: bigint;
  keys: PrivateKey[];
  totalPageBalance: number;
  generatedAt: Date;
  balancesFetched: boolean;
}

export type ScanMode = 'random' | 'next' | 'previous';

export interface ScanSession {
  sessionId: string;
  mode: ScanMode;
  startPage: bigint;
  currentPage: bigint;
  pagesScanned: number;
  isActive: boolean;
  foundFunds: boolean;
  startedAt: Date;
  endedAt?: Date;
}

export interface BalanceCache {
  address: string;
  balance: number;
  cachedAt: Date;
  source: 'blockstream' | 'local';
} 