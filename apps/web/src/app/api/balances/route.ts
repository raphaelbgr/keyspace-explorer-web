import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withRateLimit } from '@/lib/middleware/rateLimit';
import { handleApiError } from '@/lib/middleware/errorHandler';
import { databaseService } from '@/lib/services/DatabaseService';

const balancesSchema = z.object({
  addresses: z.array(z.string()).min(1, 'At least one address is required'),
  source: z.enum(['local', 'blockstream', 'blockcypher', 'mempool']).default('local'),
});

interface BalanceResult {
  address: string;
  balance: number;
  txCount: number;
  lastUpdated: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { addresses, source } = balancesSchema.parse(body);

    let balances: BalanceResult[] = [];

    switch (source) {
      case 'local':
        // Simulate local balance checking (for demo purposes)
        balances = await simulateLocalBalances(addresses);
        break;
      
      case 'blockstream':
        balances = await fetchBlockstreamBalances(addresses);
        break;
      
      case 'blockcypher':
        balances = await fetchBlockcypherBalances(addresses);
        break;
      
      case 'mempool':
        balances = await fetchMempoolBalances(addresses);
        break;
      
      default:
        balances = await simulateLocalBalances(addresses);
    }

    return NextResponse.json({
      balances,
      source,
      totalAddresses: addresses.length,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

async function simulateLocalBalances(addresses: string[]): Promise<BalanceResult[]> {
  // Query local PostgreSQL database for real balance data
  console.log(`Querying local database for ${addresses.length} addresses...`);
  
  try {
    const balanceData = await databaseService.getBalances(addresses);
    
    return addresses.map((address) => {
      const data = balanceData[address] || { balance: 0, lastUpdated: new Date().toISOString() };
      return {
        address,
        balance: data.balance,
        txCount: 0, // Database doesn't store tx count, so we use 0
        lastUpdated: data.lastUpdated,
      };
    });
  } catch (error) {
    console.error('Database query error:', error);
    // Fallback to zero balances if database query fails
    return addresses.map((address) => ({
      address,
      balance: 0,
      txCount: 0,
      lastUpdated: new Date().toISOString(),
    }));
  }
}

async function fetchBlockstreamBalances(addresses: string[]): Promise<BalanceResult[]> {
  const balances: BalanceResult[] = [];
  
  for (const address of addresses) {
    try {
      // Add delay to respect rate limits (Blockstream allows 1 request per second)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = await fetch(`https://blockstream.info/api/address/${address}`, {
        headers: { 'User-Agent': 'Bitcoin-Keyspace-Explorer/1.0' },
      });
      
      if (response.ok) {
        const data = await response.json();
        balances.push({
          address,
          balance: (data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum) / 100000000, // Convert satoshis to BTC
          txCount: data.chain_stats.tx_count,
          lastUpdated: new Date().toISOString(),
        });
      } else {
        console.warn(`Blockstream API error for ${address}: ${response.status} ${response.statusText}`);
        // Return zero balance instead of fake data
        balances.push({
          address,
          balance: 0,
          txCount: 0,
          lastUpdated: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error(`Error fetching balance for ${address}:`, error);
      // Return zero balance instead of fake data
      balances.push({
        address,
        balance: 0,
        txCount: 0,
        lastUpdated: new Date().toISOString(),
      });
    }
  }
  
  return balances;
}

async function fetchBlockcypherBalances(addresses: string[]): Promise<BalanceResult[]> {
  const balances: BalanceResult[] = [];
  
  for (const address of addresses) {
    try {
      // Add delay to respect rate limits (BlockCypher allows 3 requests per second)
      await new Promise(resolve => setTimeout(resolve, 350));
      
      const response = await fetch(`https://api.blockcypher.com/v1/btc/main/addrs/${address}/balance`, {
        headers: { 'User-Agent': 'Bitcoin-Keyspace-Explorer/1.0' },
      });
      
      if (response.ok) {
        const data = await response.json();
        balances.push({
          address,
          balance: data.balance / 100000000, // Convert satoshis to BTC
          txCount: data.n_tx,
          lastUpdated: new Date().toISOString(),
        });
      } else {
        console.warn(`BlockCypher API error for ${address}: ${response.status} ${response.statusText}`);
        // Return zero balance instead of fake data
        balances.push({
          address,
          balance: 0,
          txCount: 0,
          lastUpdated: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error(`Error fetching balance for ${address}:`, error);
      // Return zero balance instead of fake data
      balances.push({
        address,
        balance: 0,
        txCount: 0,
        lastUpdated: new Date().toISOString(),
      });
    }
  }
  
  return balances;
}

async function fetchMempoolBalances(addresses: string[]): Promise<BalanceResult[]> {
  const balances: BalanceResult[] = [];
  
  for (const address of addresses) {
    try {
      // Add delay to respect rate limits (Mempool.space allows ~1 request per second)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const response = await fetch(`https://mempool.space/api/address/${address}`, {
        headers: { 'User-Agent': 'Bitcoin-Keyspace-Explorer/1.0' },
      });
      
      if (response.ok) {
        const data = await response.json();
        balances.push({
          address,
          balance: (data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum) / 100000000, // Convert satoshis to BTC
          txCount: data.chain_stats.tx_count,
          lastUpdated: new Date().toISOString(),
        });
      } else {
        console.warn(`Mempool API error for ${address}: ${response.status} ${response.statusText}`);
        // Return zero balance instead of fake data
        balances.push({
          address,
          balance: 0,
          txCount: 0,
          lastUpdated: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error(`Error fetching balance for ${address}:`, error);
      // Return zero balance instead of fake data
      balances.push({
        address,
        balance: 0,
        txCount: 0,
        lastUpdated: new Date().toISOString(),
      });
    }
  }
  
  return balances;
}

// Apply rate limiting
export const GET = withRateLimit(POST); 