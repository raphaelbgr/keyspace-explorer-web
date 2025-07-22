// Multi-Currency Support Types
export type CryptoCurrency = 'BTC' | 'BCH' | 'DASH' | 'DOGE' | 'ETH' | 'LTC' | 'XRP' | 'ZEC';

export type BalanceSource = 'local' | 'external' | 'blockstream';

export interface CurrencyConfig {
  symbol: CryptoCurrency;
  name: string;
  icon: string;
  batchSize: number;
  cacheTTL: number; // milliseconds
  addressFormats: AddressFormat[];
}

export interface AddressFormat {
  type: string;
  label: string;
  supportsCompressed: boolean;
  supportsUncompressed: boolean;
}

// Address Types by Currency
export interface BitcoinAddresses {
  p2pkh_compressed: string;
  p2pkh_uncompressed: string;
  p2wpkh: string;
  p2sh_p2wpkh: string;
  p2tr: string;
}

export interface BitcoinCashAddresses {
  p2pkh_compressed: string;
  p2pkh_uncompressed: string;
  cashaddr_compressed: string;
  cashaddr_uncompressed: string;
}

export interface DashAddresses {
  p2pkh_compressed: string;
  p2pkh_uncompressed: string;
}

export interface DogecoinAddresses {
  p2pkh_compressed: string;
  p2pkh_uncompressed: string;
}

export interface EthereumAddresses {
  standard: string; // No compressed variant for Ethereum
}

export interface LitecoinAddresses {
  p2pkh_compressed: string;
  p2pkh_uncompressed: string;
  p2wpkh: string;
  p2sh_p2wpkh: string;
}

export interface RippleAddresses {
  standard: string; // XRP ledger address
}

export interface ZcashAddresses {
  p2pkh_compressed: string;
  p2pkh_uncompressed: string;
}

// Combined Multi-Currency Address Map
export interface CurrencyAddressMap {
  BTC: BitcoinAddresses;
  BCH: BitcoinCashAddresses;
  DASH: DashAddresses;
  DOGE: DogecoinAddresses;
  ETH: EthereumAddresses;
  LTC: LitecoinAddresses;
  XRP: RippleAddresses;
  ZEC: ZcashAddresses;
}

// Balance and Caching Types
export interface CachedBalance {
  address: string;
  currency: CryptoCurrency;
  balance: string;
  source: BalanceSource;
  cached_at: Date;
  expires_at: Date;
}

export interface BalanceResult {
  address: string;
  currency: CryptoCurrency;
  balance: string;
  source: BalanceSource;
  error?: string;
}

export interface BatchBalanceRequest {
  currency: CryptoCurrency;
  addresses: string[];
  forceRefresh?: boolean;
  forceLocal?: boolean;
}

export interface BatchBalanceResponse {
  currency: CryptoCurrency;
  results: BalanceResult[];
  cacheHits: number;
  cacheMisses: number;
  externalAPICalls: number;
}

// External API Provider Types
export interface APIProvider {
  name: string;
  baseURL: string;
  batchEndpoint?: string;
  maxBatchSize: number;
  rateLimit: {
    requestsPerSecond: number;
    requestsPerDay?: number;
  };
  apiKey?: string;
  headers?: Record<string, string>;
}

export interface ExternalAPIConfig {
  providers: Record<CryptoCurrency, APIProvider>;
  fallbackProviders?: Record<CryptoCurrency, APIProvider[]>;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
}

// Enhanced GeneratedKey type with multi-currency support
export interface MultiCurrencyGeneratedKey {
  index: number;
  privateKey: string;
  addresses: CurrencyAddressMap;
  balances?: Partial<Record<CryptoCurrency, string>>;
  hasAnyFunds: boolean;
  fundedCurrencies: CryptoCurrency[];
}

// Cache Management Types
export interface CacheMetrics {
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  externalAPICalls: number;
  cacheHitRate: number;
  apiCallReduction: number;
  averageResponseTime: number;
}

export interface CacheConfig {
  ttl: Record<CryptoCurrency, number>;
  maxEntries: number;
  cleanupInterval: number;
  batchSizes: Record<CryptoCurrency, number>;
}

// Address Normalization Types
export interface AddressNormalizer {
  currency: CryptoCurrency;
  normalize: (address: string) => string;
  validate: (address: string) => boolean;
}

// Blockchain Explorer Integration
export interface BlockchainExplorer {
  currency: CryptoCurrency;
  name: string;
  addressURL: (address: string) => string;
  transactionURL: (txHash: string) => string;
}

// Configuration Constants
export const CURRENCY_CONFIGS: Record<CryptoCurrency, CurrencyConfig> = {
  BTC: {
    symbol: 'BTC',
    name: 'Bitcoin',
    icon: '🟠',
    batchSize: 100,
    cacheTTL: 5 * 60 * 1000, // 5 minutes
    addressFormats: [
      { type: 'P2PKH (Compressed)', label: 'Legacy Compressed', supportsCompressed: true, supportsUncompressed: false },
      { type: 'P2PKH (Uncompressed)', label: 'Legacy Uncompressed', supportsCompressed: false, supportsUncompressed: true },
      { type: 'P2WPKH', label: 'Native SegWit', supportsCompressed: true, supportsUncompressed: false },
      { type: 'P2SH-P2WPKH', label: 'SegWit Wrapped', supportsCompressed: true, supportsUncompressed: false },
      { type: 'P2TR', label: 'Taproot', supportsCompressed: true, supportsUncompressed: false }
    ]
  },
  BCH: {
    symbol: 'BCH',
    name: 'Bitcoin Cash',
    icon: '🍊',
    batchSize: 100,
    cacheTTL: 5 * 60 * 1000,
    addressFormats: [
      { type: 'P2PKH (Compressed)', label: 'Legacy Compressed', supportsCompressed: true, supportsUncompressed: false },
      { type: 'P2PKH (Uncompressed)', label: 'Legacy Uncompressed', supportsCompressed: false, supportsUncompressed: true },
      { type: 'CashAddr (Compressed)', label: 'CashAddr Compressed', supportsCompressed: true, supportsUncompressed: false },
      { type: 'CashAddr (Uncompressed)', label: 'CashAddr Uncompressed', supportsCompressed: false, supportsUncompressed: true }
    ]
  },
  DASH: {
    symbol: 'DASH',
    name: 'Dash',
    icon: '🔵',
    batchSize: 50,
    cacheTTL: 3 * 60 * 1000,
    addressFormats: [
      { type: 'P2PKH (Compressed)', label: 'Compressed', supportsCompressed: true, supportsUncompressed: false },
      { type: 'P2PKH (Uncompressed)', label: 'Uncompressed', supportsCompressed: false, supportsUncompressed: true }
    ]
  },
  DOGE: {
    symbol: 'DOGE',
    name: 'Dogecoin',
    icon: '🐕',
    batchSize: 100,
    cacheTTL: 5 * 60 * 1000,
    addressFormats: [
      { type: 'P2PKH (Compressed)', label: 'Compressed', supportsCompressed: true, supportsUncompressed: false },
      { type: 'P2PKH (Uncompressed)', label: 'Uncompressed', supportsCompressed: false, supportsUncompressed: true }
    ]
  },
  ETH: {
    symbol: 'ETH',
    name: 'Ethereum',
    icon: '💎',
    batchSize: 20,
    cacheTTL: 2 * 60 * 1000,
    addressFormats: [
      { type: 'Standard', label: 'Ethereum Address', supportsCompressed: false, supportsUncompressed: true }
    ]
  },
  LTC: {
    symbol: 'LTC',
    name: 'Litecoin',
    icon: '⚪',
    batchSize: 100,
    cacheTTL: 3 * 60 * 1000,
    addressFormats: [
      { type: 'P2PKH (Compressed)', label: 'Legacy Compressed', supportsCompressed: true, supportsUncompressed: false },
      { type: 'P2PKH (Uncompressed)', label: 'Legacy Uncompressed', supportsCompressed: false, supportsUncompressed: true },
      { type: 'P2WPKH', label: 'Native SegWit', supportsCompressed: true, supportsUncompressed: false },
      { type: 'P2SH-P2WPKH', label: 'SegWit Wrapped', supportsCompressed: true, supportsUncompressed: false }
    ]
  },
  XRP: {
    symbol: 'XRP',
    name: 'Ripple',
    icon: '💰',
    batchSize: 100,
    cacheTTL: 1 * 60 * 1000,
    addressFormats: [
      { type: 'Standard', label: 'XRP Ledger Address', supportsCompressed: false, supportsUncompressed: true }
    ]
  },
  ZEC: {
    symbol: 'ZEC',
    name: 'Zcash',
    icon: '🛡️',
    batchSize: 1,
    cacheTTL: 5 * 60 * 1000,
    addressFormats: [
      { type: 'P2PKH (Compressed)', label: 'Transparent Compressed', supportsCompressed: true, supportsUncompressed: false },
      { type: 'P2PKH (Uncompressed)', label: 'Transparent Uncompressed', supportsCompressed: false, supportsUncompressed: true }
    ]
  }
};

export const SUPPORTED_CURRENCIES: CryptoCurrency[] = Object.keys(CURRENCY_CONFIGS) as CryptoCurrency[]; 