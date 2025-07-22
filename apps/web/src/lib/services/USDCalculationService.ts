import { CryptoCurrency } from '../types/multi-currency';

// Currency precision configuration
export const CURRENCY_PRECISION: Record<CryptoCurrency, number> = {
  BTC: 8,
  BCH: 8,
  DASH: 8,
  DOGE: 8,
  ETH: 18,
  LTC: 8,
  XRP: 6,
  ZEC: 8
};

// Atomic unit divisors - balances are stored in smallest units
export const ATOMIC_UNIT_DIVISORS: Record<CryptoCurrency, number> = {
  BTC: 100000000,      // 1 BTC = 100,000,000 satoshis
  BCH: 100000000,      // 1 BCH = 100,000,000 satoshis
  DASH: 100000000,     // 1 DASH = 100,000,000 duffs
  DOGE: 100000000,     // 1 DOGE = 100,000,000 koinus
  ETH: 1000000000000000000, // 1 ETH = 10^18 wei
  LTC: 100000000,      // 1 LTC = 100,000,000 litoshis
  XRP: 1000000,        // 1 XRP = 1,000,000 drops
  ZEC: 100000000       // 1 ZEC = 100,000,000 zatoshi
};

// Mock price data - will be replaced with real API integration
const MOCK_PRICES: Record<CryptoCurrency, number> = {
  BTC: 45000,
  ETH: 2800,
  BCH: 420,
  XRP: 0.65,
  LTC: 85,
  DASH: 45,
  DOGE: 0.08,
  ZEC: 35
};

export interface USDBalanceData {
  cryptoBalance: number;
  usdValue: number;
  currency: CryptoCurrency;
  formattedCrypto: string;
  formattedUSD: string;
}

export class USDCalculationService {
  private static instance: USDCalculationService;
  private priceCache: Map<CryptoCurrency, number> = new Map();
  private lastUpdate: Date | null = null;

  private constructor() {
    // Initialize with mock prices
    Object.entries(MOCK_PRICES).forEach(([currency, price]) => {
      this.priceCache.set(currency as CryptoCurrency, price);
    });
    this.lastUpdate = new Date();
  }

  public static getInstance(): USDCalculationService {
    if (!USDCalculationService.instance) {
      USDCalculationService.instance = new USDCalculationService();
    }
    return USDCalculationService.instance;
  }

  /**
   * Update price for a specific cryptocurrency
   */
  public updatePrice(currency: CryptoCurrency, usdPrice: number): void {
    this.priceCache.set(currency, usdPrice);
    this.lastUpdate = new Date();
  }

  /**
   * Update multiple prices at once
   */
  public updatePrices(prices: Record<CryptoCurrency, number>): void {
    Object.entries(prices).forEach(([currency, price]) => {
      this.priceCache.set(currency as CryptoCurrency, price);
    });
    this.lastUpdate = new Date();
  }

  /**
   * Get current USD price for a cryptocurrency
   */
  public getPrice(currency: CryptoCurrency): number {
    return this.priceCache.get(currency) || 0;
  }

  /**
   * Convert atomic units to display units
   * e.g., 14203245 satoshis -> 0.14203245 BTC
   */
  public convertFromAtomicUnits(atomicBalance: number, currency: CryptoCurrency): number {
    const divisor = ATOMIC_UNIT_DIVISORS[currency];
    return atomicBalance / divisor;
  }

  /**
   * Convert display units to atomic units
   * e.g., 0.14203245 BTC -> 14203245 satoshis
   */
  public convertToAtomicUnits(displayBalance: number, currency: CryptoCurrency): number {
    const divisor = ATOMIC_UNIT_DIVISORS[currency];
    return Math.round(displayBalance * divisor);
  }

  /**
   * Calculate USD value for a crypto balance (in display units)
   */
  public calculateUSDValue(cryptoBalance: number, currency: CryptoCurrency): number {
    const price = this.getPrice(currency);
    return cryptoBalance * price;
  }

  /**
   * Calculate USD value for atomic units balance
   * e.g., 14203245 satoshis -> converts to BTC first, then to USD
   */
  public calculateUSDValueFromAtomic(atomicBalance: number, currency: CryptoCurrency): number {
    const displayBalance = this.convertFromAtomicUnits(atomicBalance, currency);
    return this.calculateUSDValue(displayBalance, currency);
  }

  /**
   * Format crypto balance with proper decimal places
   */
  public formatCryptoBalance(balance: number, currency: CryptoCurrency): string {
    const precision = CURRENCY_PRECISION[currency];
    
    // For ETH (18 decimals), use smart truncation to show significant digits
    if (currency === 'ETH') {
      if (balance === 0) return '0.000000000000000000';
      if (balance >= 1) return balance.toFixed(6); // Show 6 decimals for values >= 1
      
      // For small values, show up to 18 decimals but remove trailing zeros
      const fullString = balance.toFixed(18);
      return fullString.replace(/\.?0+$/, '') || '0';
    }
    
    // For other currencies, use their standard precision
    return balance.toFixed(precision);
  }

  /**
   * Format USD value with appropriate formatting
   */
  public formatUSDValue(usdValue: number): string {
    if (usdValue === 0) return '$0.00';
    
    if (usdValue >= 1000000) {
      return `$${(usdValue / 1000000).toFixed(2)}M`;
    } else if (usdValue >= 1000) {
      return `$${(usdValue / 1000).toFixed(1)}K`;
    } else if (usdValue >= 1) {
      return `$${usdValue.toFixed(2)}`;
    } else {
      return `$${usdValue.toFixed(4)}`;
    }
  }

  /**
   * Calculate comprehensive USD balance data (from display units)
   */
  public calculateUSDBalanceData(cryptoBalance: number, currency: CryptoCurrency): USDBalanceData {
    const usdValue = this.calculateUSDValue(cryptoBalance, currency);
    
    return {
      cryptoBalance,
      usdValue,
      currency,
      formattedCrypto: this.formatCryptoBalance(cryptoBalance, currency),
      formattedUSD: this.formatUSDValue(usdValue)
    };
  }

  /**
   * Calculate comprehensive USD balance data from atomic units
   * This is the main method for app balances stored in satoshis/wei/etc
   */
  public calculateUSDBalanceDataFromAtomic(atomicBalance: number, currency: CryptoCurrency): USDBalanceData {
    const displayBalance = this.convertFromAtomicUnits(atomicBalance, currency);
    const usdValue = this.calculateUSDValue(displayBalance, currency);
    
    return {
      cryptoBalance: displayBalance,
      usdValue,
      currency,
      formattedCrypto: this.formatCryptoBalance(displayBalance, currency),
      formattedUSD: this.formatUSDValue(usdValue)
    };
  }

  /**
   * Calculate total USD value across multiple currencies
   */
  public calculateTotalUSDValue(balances: Record<CryptoCurrency, number>): number {
    return Object.entries(balances).reduce((total, [currency, balance]) => {
      return total + this.calculateUSDValue(balance, currency as CryptoCurrency);
    }, 0);
  }

  /**
   * Get all current prices
   */
  public getAllPrices(): Record<CryptoCurrency, number> {
    const prices: Partial<Record<CryptoCurrency, number>> = {};
    this.priceCache.forEach((price, currency) => {
      prices[currency] = price;
    });
    return prices as Record<CryptoCurrency, number>;
  }

  /**
   * Get last update timestamp
   */
  public getLastUpdate(): Date | null {
    return this.lastUpdate;
  }

  /**
   * Add thousand separators to numbers
   */
  public formatWithSeparators(value: number): string {
    return new Intl.NumberFormat('en-US').format(value);
  }

  /**
   * Format balance display with currency symbol and USD value
   */
  public formatBalanceWithUSD(cryptoBalance: number, currency: CryptoCurrency): string {
    const data = this.calculateUSDBalanceData(cryptoBalance, currency);
    if (data.usdValue === 0) {
      return `${data.formattedCrypto} ${currency}`;
    }
    return `${data.formattedCrypto} ${currency} (${data.formattedUSD})`;
  }
} 