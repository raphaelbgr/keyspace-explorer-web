import * as bitcoin from 'bitcoinjs-lib';
import { PrivateKey, PageData, DerivedAddresses } from '../types/keys';

// Dynamic ECC loading for client-side only
let ECPair: any = null;
let isECCInitialized = false;

export class ClientKeyGenerationService {
  private readonly KEYS_PER_PAGE = 45;
  // Maximum valid Bitcoin private key (order of secp256k1 curve minus 1)
  private readonly MAX_PRIVATE_KEY = BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364140");

  /**
   * Initialize ECC library for client-side use only
   */
  private async initializeECC(): Promise<boolean> {
    if (isECCInitialized && ECPair) {
      console.log('🔄 ECC already initialized, skipping...');
      return true;
    }

    try {
      // Only run in browser environment
      if (typeof window === 'undefined') {
        console.warn('ECC initialization skipped - not in browser environment');
        return false;
      }

      console.log('🔧 Initializing ECC library for client-side generation...');

      // Dynamic import of crypto libraries
      const [{ ECPairFactory }, tinysecp256k1] = await Promise.all([
        import('ecpair'),
        import('tiny-secp256k1')
      ]);

      // Initialize ECPair with the imported library
      ECPair = ECPairFactory(tinysecp256k1);

      // CRITICAL: Initialize bitcoinjs-lib with the ECC library for P2TR support
      bitcoin.initEccLib(tinysecp256k1);
      console.log('🔐 Bitcoin library initialized with ECC support');

      // Test ECC functionality
      const testPrivateKey = Buffer.from('0000000000000000000000000000000000000000000000000000000000000001', 'hex');
      const testKeyPair = ECPair.fromPrivateKey(testPrivateKey);
      
      if (!testKeyPair || !testKeyPair.publicKey) {
        throw new Error('ECC test failed - invalid key pair generated');
      }

      // Test P2TR generation to ensure everything works
      const testPublicKey = Buffer.from(testKeyPair.publicKey);
      const testP2tr = bitcoin.payments.p2tr({
        internalPubkey: testPublicKey.slice(1, 33)
      });
      
      if (!testP2tr.address) {
        throw new Error('P2TR test failed - could not generate Taproot address');
      }

      isECCInitialized = true;
      console.log('✅ ECC library initialized successfully with P2TR support');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize ECC library:', error);
      isECCInitialized = false;
      ECPair = null;
      return false;
    }
  }

  /**
   * Generate a page of keys client-side
   * This runs in the browser using the same logic as the server
   */
  async generatePage(pageNumber: bigint, keysPerPage: number = this.KEYS_PER_PAGE): Promise<PageData> {
    console.log(`🚀 Client-side generation: Page ${pageNumber}, ${keysPerPage} keys`);
    
    // Initialize ECC if not already done
    const eccReady = await this.initializeECC();
    if (!eccReady) {
      throw new Error('ECC library failed to initialize - client-side generation not available');
    }
    
    const keys: PrivateKey[] = [];
    
    // Calculate the starting key number for this page
    const startKeyNumber = (pageNumber - BigInt(1)) * BigInt(keysPerPage) + BigInt(1);
    
    // Performance tracking
    const startTime = performance.now();
    
    for (let i = 0; i < keysPerPage; i++) {
      const keyNumber = startKeyNumber + BigInt(i);
      
      // Ensure we don't exceed the maximum valid private key
      if (keyNumber > this.MAX_PRIVATE_KEY) {
        console.warn(`Key number ${keyNumber} exceeds maximum valid private key`);
        break;
      }
      
      const privateKey = this.generatePrivateKey(keyNumber);
      const addresses = await this.deriveAddresses(privateKey);
      
      keys.push({
        privateKey,
        pageNumber,
        index: i,
        addresses,
        balances: {
          p2pkh_compressed: 0,
          p2pkh_uncompressed: 0,
          p2wpkh: 0,
          p2sh_p2wpkh: 0,
          p2tr: 0,
        },
        totalBalance: 0,
      });
    }

    const endTime = performance.now();
    const generationTime = endTime - startTime;
    
    console.log(`⚡ Client-side generation completed in ${generationTime.toFixed(2)}ms`);
    console.log(`📊 Performance: ${(keysPerPage / (generationTime / 1000)).toFixed(0)} keys/second`);

    return {
      pageNumber,
      keys,
      totalPageBalance: 0,
      generatedAt: new Date(),
      balancesFetched: false,
    };
  }

  /**
   * Generate a private key from a key number
   * Same logic as server-side but optimized for browser
   */
  private generatePrivateKey(keyNumber: bigint): string {
    // Ensure the key number doesn't exceed the maximum valid private key
    if (keyNumber > this.MAX_PRIVATE_KEY) {
      throw new Error(`Key number ${keyNumber} exceeds maximum valid Bitcoin private key`);
    }
    
    // Convert to hex string and pad to 64 characters (256 bits)
    const hexString = keyNumber.toString(16).padStart(64, '0');
    
    return hexString;
  }

  /**
   * Derive all Bitcoin addresses from a private key
   * Optimized for browser performance
   */
  private async deriveAddresses(privateKey: string): Promise<DerivedAddresses> {
    try {
      if (!ECPair || !isECCInitialized) {
        throw new Error('ECC library not initialized');
      }

      // Convert hex private key to Buffer
      const privateKeyBuffer = Buffer.from(privateKey, 'hex');
      
      // Generate compressed key pair (default)
      const keyPairCompressed = ECPair.fromPrivateKey(privateKeyBuffer, { compressed: true });
      
      // Generate uncompressed key pair
      const keyPairUncompressed = ECPair.fromPrivateKey(privateKeyBuffer, { compressed: false });
      
      // Get compressed and uncompressed public key buffers
      const publicKeyCompressed = Buffer.from(keyPairCompressed.publicKey);
      const publicKeyUncompressed = Buffer.from(keyPairUncompressed.publicKey);
      
      // Generate P2PKH addresses (compressed and uncompressed)
      const p2pkh_compressed = bitcoin.payments.p2pkh({ 
        pubkey: publicKeyCompressed 
      }).address!;
      
      const p2pkh_uncompressed = bitcoin.payments.p2pkh({ 
        pubkey: publicKeyUncompressed
      }).address!;
      
      // Generate P2WPKH address (always uses compressed public key)
      const p2wpkh = bitcoin.payments.p2wpkh({ 
        pubkey: publicKeyCompressed 
      }).address!;
      
      // Generate P2SH-P2WPKH address (always uses compressed public key)
      const p2sh_p2wpkh = bitcoin.payments.p2sh({
        redeem: bitcoin.payments.p2wpkh({ pubkey: publicKeyCompressed })
      }).address!;
      
      // Generate P2TR address (Taproot - always uses compressed, x-only)
      const p2tr = bitcoin.payments.p2tr({
        internalPubkey: publicKeyCompressed.slice(1, 33)
      }).address!;
      
      return {
        p2pkh_compressed,
        p2pkh_uncompressed,
        p2wpkh,
        p2sh_p2wpkh,
        p2tr,
      };
    } catch (error) {
      console.error('Address derivation error:', error);
      throw new Error(`Failed to derive addresses for private key: ${privateKey.substring(0, 16)}...`);
    }
  }

  /**
   * Estimate generation time for a given number of keys
   * Useful for showing progress or warnings
   */
  estimateGenerationTime(keyCount: number): number {
    // Based on typical browser performance: ~1000-2000 keys/second
    const keysPerSecond = 1500;
    return (keyCount / keysPerSecond) * 1000; // Return in milliseconds
  }

  /**
   * Check if client-side generation is supported
   * Verify all required libraries are available
   */
  async isSupported(): Promise<boolean> {
    try {
      // Only check in browser environment
      if (typeof window === 'undefined') {
        return false;
      }

      // Try to initialize ECC
      const eccReady = await this.initializeECC();
      if (!eccReady) {
        return false;
      }

      // Test basic crypto operations
      const testKey = this.generatePrivateKey(BigInt(1));
      const testAddresses = await this.deriveAddresses(testKey);
      
      return !!(testKey && testAddresses.p2pkh_compressed);
    } catch (error) {
      console.error('Client-side generation not supported:', error);
      return false;
    }
  }

  /**
   * Get browser compatibility info
   */
  async getBrowserInfo(): Promise<{
    supported: boolean;
    performance: 'high' | 'medium' | 'low';
    warnings: string[];
  }> {
    const warnings: string[] = [];
    let performance: 'high' | 'medium' | 'low' = 'high';

    // Only check in browser environment
    if (typeof window === 'undefined') {
      return {
        supported: false,
        performance: 'low',
        warnings: ['Not running in browser environment']
      };
    }

    // Check for Web Workers support
    if (typeof Worker === 'undefined') {
      warnings.push('Web Workers not supported - generation may block UI');
      performance = 'low';
    }

    // Check for WebAssembly support
    if (typeof WebAssembly === 'undefined') {
      warnings.push('WebAssembly not supported - slower cryptographic operations');
      performance = performance === 'low' ? 'low' : 'medium';
    }

    // Check memory constraints
    const deviceMemory = (navigator as any).deviceMemory;
    if (deviceMemory && deviceMemory < 2) {
      warnings.push('Low device memory detected - consider smaller page sizes');
      performance = 'low';
    }

    // Test actual support
    const supported = await this.isSupported();

    return {
      supported,
      performance,
      warnings
    };
  }
}

// Export a singleton instance
export const clientKeyGenerationService = new ClientKeyGenerationService(); 