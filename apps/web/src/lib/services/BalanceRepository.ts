import { Pool } from 'pg';
import { BalanceCache } from '../types/keys';

export class BalanceRepository {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: '192.168.7.101',
      user: 'postgres',
      password: 'tjq5uxt3',
      database: 'cryptodb',
      port: 5432,
      max: 20,
      idleTimeoutMillis: 30000,
    });
  }

  async getCachedBalance(address: string): Promise<BalanceCache | null> {
    const query = `
      SELECT address, balance, cached_at, source 
      FROM balance_cache 
      WHERE address = $1 AND cached_at > NOW() - INTERVAL '1 hour'
    `;
    
    try {
      const result = await this.pool.query(query, [address]);
      if (result.rows.length > 0) {
        const row = result.rows[0];
        return {
          address: row.address,
          balance: parseFloat(row.balance),
          cachedAt: new Date(row.cached_at),
          source: row.source,
        };
      }
      return null;
    } catch (error) {
      console.error('Database error getting cached balance:', error);
      return null;
    }
  }

  async setCachedBalance(
    address: string, 
    balance: number, 
    source: 'blockstream' | 'local'
  ): Promise<void> {
    const query = `
      INSERT INTO balance_cache (address, balance, source)
      VALUES ($1, $2, $3)
      ON CONFLICT (address) 
      DO UPDATE SET 
        balance = EXCLUDED.balance,
        cached_at = NOW(),
        source = EXCLUDED.source
    `;
    
    try {
      await this.pool.query(query, [address, balance, source]);
    } catch (error) {
      console.error('Database error setting cached balance:', error);
      throw error;
    }
  }

  async getLocalBalance(address: string): Promise<number> {
    const query = `
      SELECT balance FROM wallets_btc WHERE address = $1
    `;
    
    try {
      const result = await this.pool.query(query, [address]);
      if (result.rows.length > 0) {
        const satoshis = result.rows[0].balance || 0;
        return satoshis / 100_000_000; // Convert to BTC
      }
      return 0;
    } catch (error) {
      console.error('Database error getting local balance:', error);
      return 0;
    }
  }

  async cleanup(): Promise<void> {
    await this.pool.end();
  }
} 