import { v4 as uuidv4 } from 'uuid';
import { KeyGenerationService } from './KeyGenerationService';
import { BalanceService } from './BalanceService';
import { TelegramService } from './TelegramService';
import { ScanSession, ScanMode, PageData, PrivateKey } from '../types/keys';

export class ScanningEngine {
  private static instance: ScanningEngine;
  private keyService: KeyGenerationService;
  private balanceService: BalanceService;
  private telegramService: TelegramService;
  private activeSessions: Map<string, ScanSession> = new Map();

  private constructor() {
    this.keyService = new KeyGenerationService();
    this.balanceService = new BalanceService();
    this.telegramService = new TelegramService();
  }

  public static getInstance(): ScanningEngine {
    if (!ScanningEngine.instance) {
      ScanningEngine.instance = new ScanningEngine();
    }
    return ScanningEngine.instance;
  }

  async startScan(mode: ScanMode, startPage?: bigint): Promise<ScanSession> {
    const sessionId = uuidv4();
    const currentPage = startPage || this.keyService.generateSecureRandomPage();

    const session: ScanSession = {
      sessionId,
      mode,
      startPage: currentPage,
      currentPage,
      pagesScanned: 0,
      isActive: true,
      foundFunds: false,
      startedAt: new Date(),
    };

    this.activeSessions.set(sessionId, session);

    // Start the scanning process in background
    this.processScanSession(sessionId);

    return session;
  }

  async stopScan(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.isActive = false;
      session.endedAt = new Date();
      this.activeSessions.delete(sessionId);
    }
  }

  getSession(sessionId: string): ScanSession | null {
    return this.activeSessions.get(sessionId) || null;
  }

  getAllSessions(): ScanSession[] {
    return Array.from(this.activeSessions.values());
  }

  private async processScanSession(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    try {
      while (session.isActive) {
        // Generate page data
        const pageData = await this.keyService.generatePage(session.currentPage);
        
        // Extract all addresses from the page
        const allAddresses: string[] = [];
        pageData.keys.forEach(key => {
          Object.values(key.addresses).forEach(address => {
            if (address) allAddresses.push(address);
          });
        });

        // Fetch balances for all addresses using local database
        const balances = await this.balanceService.fetchBalances(allAddresses, 'local');
        
        // Update keys with balances
        const updatedKeys = pageData.keys.map(key => {
          const keyBalances = {
            p2pkh_compressed: balances[key.addresses.p2pkh_compressed] || 0,
            p2pkh_uncompressed: balances[key.addresses.p2pkh_uncompressed] || 0,
            p2wpkh: balances[key.addresses.p2wpkh] || 0,
            p2sh_p2wpkh: balances[key.addresses.p2sh_p2wpkh] || 0,
            p2tr: balances[key.addresses.p2tr] || 0,
          };

          const totalBalance = Object.values(keyBalances).reduce((sum, balance) => sum + balance, 0);

          return {
            ...key,
            balances: keyBalances,
            totalBalance,
          };
        });

        // Calculate total page balance
        const totalPageBalance = updatedKeys.reduce((sum, key) => sum + key.totalBalance, 0);
        
        // Check if funds were found
        if (totalPageBalance > 0) {
          session.foundFunds = true;
          
          // Send Telegram notification
          const foundKeys = updatedKeys.filter(key => key.totalBalance > 0);
          await this.telegramService.sendFundDiscoveryNotification(
            { ...pageData, keys: updatedKeys, totalPageBalance },
            foundKeys
          );
          
          // Stop scanning when funds are found
          await this.stopScan(sessionId);
          break;
        }

        // Update session progress
        session.pagesScanned++;
        session.currentPage = this.getNextPage(session.currentPage, session.mode);

        // Rate limiting: wait between pages
        await this.delay(2000); // 2 seconds between pages
      }
    } catch (error) {
      console.error(`Error in scan session ${sessionId}:`, error);
      session.isActive = false;
      session.endedAt = new Date();
    }
  }

  private getNextPage(currentPage: bigint, mode: ScanMode): bigint {
    switch (mode) {
      case 'random':
        return this.keyService.generateSecureRandomPage();
      case 'next':
        return currentPage + BigInt(1);
      case 'previous':
        return currentPage - BigInt(1);
      default:
        return currentPage + BigInt(1);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
} 