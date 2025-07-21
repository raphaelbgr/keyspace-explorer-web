import axios from 'axios';
import { BalanceRepository } from './BalanceRepository';
import { BalanceCache } from '../types/keys';
import { BitcoinAddressValidator } from '../utils/addressValidation';
import { databaseService } from './DatabaseService';

export class BalanceService {
  private balanceRepository: BalanceRepository;
  private readonly BLOCKSTREAM_API_BASE = 'https://blockstream.info/api';
  private readonly LOCAL_API_BASE = 'http://192.168.7.101:5432';

  constructor() {
    this.balanceRepository = new BalanceRepository();
  }

  async fetchBalances(
    addresses: string[], 
    source: 'local' | 'blockstream' = 'local'
  ): Promise<Record<string, number>> {
    const balances: Record<string, number> = {};
    
    // Filter out invalid addresses before processing
    const validAddresses = BitcoinAddressValidator.filterValidAddresses(addresses);
    const invalidAddresses = addresses.filter(addr => !validAddresses.includes(addr));
    
    if (invalidAddresses.length > 0) {
      console.warn(`Filtered out ${invalidAddresses.length} invalid addresses:`, invalidAddresses);
    }
    
    // Process valid addresses in batches to avoid overwhelming APIs
    const batchSize = 10;
    for (let i = 0; i < validAddresses.length; i += batchSize) {
      const batch = validAddresses.slice(i, i + batchSize);
      const batchBalances = await this.fetchBatchBalances(batch, source);
      Object.assign(balances, batchBalances);
      
      // Rate limiting: wait between batches
      if (i + batchSize < validAddresses.length) {
        await this.delay(1000); // 1 second delay
      }
    }
    
    return balances;
  }

  private async fetchBatchBalances(
    addresses: string[], 
    source: 'local' | 'blockstream'
  ): Promise<Record<string, number>> {
    const balances: Record<string, number> = {};
    
    if (source === 'local') {
      // For local database, use batch processing for much better performance
      try {
        const balanceData = await databaseService.getBalances(addresses);
        
        // Convert to the expected format
        for (const address of addresses) {
          const data = balanceData[address];
          balances[address] = data ? data.balance : 0;
        }
        
        return balances;
      } catch (error) {
        console.error('Database batch query error:', error);
        // Fallback to zero balances
        addresses.forEach(address => {
          balances[address] = 0;
        });
        return balances;
      }
    }
    
    // For external APIs, process individually with caching
    for (const address of addresses) {
      try {
        // Check cache first (only if database is available)
        try {
          const cached = await this.balanceRepository.getCachedBalance(address);
          if (cached && !this.isCacheStale(cached.cachedAt)) {
            balances[address] = cached.balance;
            continue;
          }
        } catch (dbError) {
          console.warn('Database cache unavailable, proceeding with external API:', dbError);
        }
        
        // Fetch from external source
        let balance = 0;
        if (source === 'blockstream') {
          balance = await this.fetchFromBlockstream(address);
        }
        
        // Cache the result (only if database is available)
        try {
          await this.balanceRepository.setCachedBalance(address, balance, source);
        } catch (dbError) {
          console.warn('Failed to cache balance, continuing without cache:', dbError);
        }
        
        balances[address] = balance;
        
      } catch (error) {
        console.warn(`Error fetching balance for ${address}:`, error);
        balances[address] = 0; // Default to 0 on error
      }
    }
    
    return balances;
  }

  private async fetchFromBlockstream(address: string): Promise<number> {
    try {
      // Double-check validation before making API call
      if (!BitcoinAddressValidator.isValidAddress(address)) {
        console.warn(`Skipping invalid address: ${address}`);
        return 0;
      }

      const response = await axios.get(`${this.BLOCKSTREAM_API_BASE}/address/${address}`, {
        timeout: 10000,
      });
      
      // Blockstream returns balance in satoshis, convert to BTC
      const satoshis = response.data.chain_stats.funded_txo_sum - response.data.chain_stats.spent_txo_sum;
      return satoshis / 100_000_000;
    } catch (error: any) {
      // Handle specific error cases
      if (error.response?.status === 400) {
        console.warn(`Invalid address format: ${address}`);
        return 0;
      }
      if (error.response?.status === 404) {
        console.warn(`Address not found: ${address}`);
        return 0;
      }
      
      console.error(`Blockstream API error for ${address}:`, error.message);
      return 0; // Return 0 instead of throwing
    }
  }

  private async fetchFromLocal(address: string): Promise<number> {
    try {
      return await this.balanceRepository.getLocalBalance(address);
    } catch (error) {
      console.error(`Local API error for ${address}:`, error);
      return 0; // Return 0 instead of throwing
    }
  }

  private isCacheStale(cachedAt: Date): boolean {
    const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
    return Date.now() - cachedAt.getTime() > oneHour;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getCachedBalance(address: string): Promise<BalanceCache | null> {
    try {
      return await this.balanceRepository.getCachedBalance(address);
    } catch (error) {
      console.warn('Failed to get cached balance:', error);
      return null;
    }
  }

  async invalidateCache(maxAge: number = 3600000): Promise<void> {
    // This would be implemented in the repository
    console.log('Cache invalidation requested');
  }
} 