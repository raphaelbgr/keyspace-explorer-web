import { Pool, PoolClient } from 'pg';

interface DatabaseBalance {
  address: string;
  balance: string; // Balance in satoshi as string
  updated_at: Date;
}

export class DatabaseService {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      user: 'postgres',
      password: 'tjq5uxt3',
      host: '192.168.7.101',
      database: 'cryptodb',
      port: 5432,
      // Connection pool settings
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // How long a client is allowed to remain idle
      connectionTimeoutMillis: 2000, // How long to wait when connecting a client
    });
  }

  /**
   * Get balances for multiple Bitcoin addresses from the local database
   */
  async getBalances(addresses: string[]): Promise<Record<string, { balance: number; lastUpdated: string }>> {
    if (addresses.length === 0) {
      return {};
    }

    const client: PoolClient = await this.pool.connect();
    
    try {
      // Create placeholders for parameterized query
      const placeholders = addresses.map((_, index) => `$${index + 1}`).join(', ');
      
      const query = `
        SELECT address, balance, updated_at 
        FROM wallets_btc 
        WHERE address IN (${placeholders})
      `;
      
      console.log(`Querying database for ${addresses.length} addresses...`);
      
      const result = await client.query(query, addresses);
      const balances: Record<string, { balance: number; lastUpdated: string }> = {};
      
      // Process found addresses
      result.rows.forEach((row: DatabaseBalance) => {
        const balanceInSatoshi = parseInt(row.balance, 10);
        const balanceInBTC = balanceInSatoshi / 100000000; // Convert satoshi to BTC
        
        balances[row.address] = {
          balance: balanceInBTC,
          lastUpdated: row.updated_at.toISOString()
        };
      });
      
      // Add zero balances for addresses not found in database
      const foundAddresses = new Set(result.rows.map((row: DatabaseBalance) => row.address));
      addresses.forEach(address => {
        if (!foundAddresses.has(address)) {
          balances[address] = {
            balance: 0,
            lastUpdated: new Date().toISOString()
          };
        }
      });
      
      console.log(`Database query completed: ${result.rows.length} addresses found with balances, ${addresses.length - result.rows.length} addresses have zero balance`);
      
      return balances;
      
    } catch (error) {
      console.error('Database query error:', error);
      throw new Error(`Database query failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      client.release();
    }
  }

  /**
   * Get balance for a single Bitcoin address
   */
  async getBalance(address: string): Promise<{ balance: number; lastUpdated: string }> {
    const balances = await this.getBalances([address]);
    return balances[address] || { balance: 0, lastUpdated: new Date().toISOString() };
  }

  /**
   * Check if an address exists in the database (has any record)
   */
  async addressExists(address: string): Promise<boolean> {
    const client: PoolClient = await this.pool.connect();
    
    try {
      const query = 'SELECT 1 FROM wallets_btc WHERE address = $1 LIMIT 1';
      const result = await client.query(query, [address]);
      return result.rows.length > 0;
    } catch (error) {
      console.error('Database exists check error:', error);
      return false;
    } finally {
      client.release();
    }
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<{ totalAddresses: number; addressesWithBalance: number }> {
    const client: PoolClient = await this.pool.connect();
    
    try {
      const totalQuery = 'SELECT COUNT(*) as total FROM wallets_btc';
      const balanceQuery = 'SELECT COUNT(*) as with_balance FROM wallets_btc WHERE balance != \'0\'';
      
      const [totalResult, balanceResult] = await Promise.all([
        client.query(totalQuery),
        client.query(balanceQuery)
      ]);
      
      return {
        totalAddresses: parseInt(totalResult.rows[0].total, 10),
        addressesWithBalance: parseInt(balanceResult.rows[0].with_balance, 10)
      };
    } catch (error) {
      console.error('Database stats error:', error);
      return { totalAddresses: 0, addressesWithBalance: 0 };
    } finally {
      client.release();
    }
  }

  /**
   * Close the database connection pool
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}

// Singleton instance
export const databaseService = new DatabaseService(); 