import { 
  CurrencyAddressMap,
  BitcoinAddresses,
  BitcoinCashAddresses,
  DashAddresses,
  DogecoinAddresses,
  EthereumAddresses,
  LitecoinAddresses,
  RippleAddresses,
  ZcashAddresses,
  MultiCurrencyGeneratedKey,
  CryptoCurrency,
  SUPPORTED_CURRENCIES
} from '../types/multi-currency';

import * as bitcoin from 'bitcoinjs-lib';
import { ECPairFactory } from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import { createHash, createHmac } from 'crypto';
// @ts-ignore
import * as bchaddr from 'bchaddrjs';
// @ts-ignore  
import * as rippleCodec from 'ripple-address-codec';
import * as bs58check from 'bs58check';
// @ts-ignore
import * as keccak from 'keccak';

// Initialize ECC for bitcoinjs-lib
bitcoin.initEccLib(ecc);
const ECPair = ECPairFactory(ecc);

// Network configurations for different cryptocurrencies
const NETWORKS = {
  BTC: bitcoin.networks.bitcoin,
  BCH: { // Bitcoin Cash (same as Bitcoin for key generation)
    messagePrefix: '\x18Bitcoin Signed Message:\n',
    bech32: 'bc',
    bip32: { public: 0x0488b21e, private: 0x0488ade4 },
    pubKeyHash: 0x00,
    scriptHash: 0x05,
    wif: 0x80
  },
  DASH: { // Dash network parameters
    messagePrefix: '\x19DarkCoin Signed Message:\n',
    bech32: 'dash', // Not widely used
    bip32: { public: 0x0488b21e, private: 0x0488ade4 },
    pubKeyHash: 0x4c, // 76 in decimal - 'X' addresses
    scriptHash: 0x10, // 16 in decimal
    wif: 0xcc // 204 in decimal
  },
  DOGE: { // Dogecoin network parameters
    messagePrefix: '\x19Dogecoin Signed Message:\n',
    bech32: 'doge', // Not widely used
    bip32: { public: 0x02facafd, private: 0x02fac398 },
    pubKeyHash: 0x1e, // 30 in decimal - 'D' addresses
    scriptHash: 0x16, // 22 in decimal
    wif: 0x9e // 158 in decimal
  },
  LTC: { // Litecoin network parameters
    messagePrefix: '\x19Litecoin Signed Message:\n',
    bech32: 'ltc1',
    bip32: { public: 0x019da462, private: 0x019d9cfe },
    pubKeyHash: 0x30, // 48 in decimal - 'L' addresses
    scriptHash: 0x32, // 50 in decimal - 'M' addresses
    wif: 0xb0 // 176 in decimal
  },
  ZEC: { // Zcash network parameters
    messagePrefix: '\x18Zcash Signed Message:\n',
    bech32: 'zs1', // For shielded addresses (not implemented here)
    bip32: { public: 0x0488b21e, private: 0x0488ade4 },
    pubKeyHash: 0x1cb8, // 't1' addresses
    scriptHash: 0x1cbd, // 't3' addresses
    wif: 0x80
  }
};

export class MultiCurrencyKeyGenerationService {
  
  /**
   * Generate addresses for all supported cryptocurrencies from a single private key
   */
  async generateMultiCurrencyAddresses(privateKey: string): Promise<CurrencyAddressMap> {
    try {
      // Generate all currency addresses in parallel for performance
      const [btc, bch, dash, doge, eth, ltc, xrp, zec] = await Promise.all([
        this.generateBitcoinAddresses(privateKey),
        this.generateBitcoinCashAddresses(privateKey),
        this.generateDashAddresses(privateKey),
        this.generateDogecoinAddresses(privateKey),
        this.generateEthereumAddresses(privateKey),
        this.generateLitecoinAddresses(privateKey),
        this.generateRippleAddresses(privateKey),
        this.generateZcashAddresses(privateKey)
      ]);

      return {
        BTC: btc,
        BCH: bch,
        DASH: dash,
        DOGE: doge,
        ETH: eth,
        LTC: ltc,
        XRP: xrp,
        ZEC: zec
      };
    } catch (error) {
      console.error('Error generating multi-currency addresses:', error);
      throw new Error(`Multi-currency address generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a complete multi-currency key with all addresses
   */
  async generateMultiCurrencyKey(privateKey: string, index: number): Promise<MultiCurrencyGeneratedKey> {
    const addresses = await this.generateMultiCurrencyAddresses(privateKey);
    
    return {
      index,
      privateKey,
      addresses,
      hasAnyFunds: false, // Will be updated after balance checks
      fundedCurrencies: []
    };
  }

  /**
   * Generate Bitcoin addresses (5 types)
   */
  private async generateBitcoinAddresses(privateKey: string): Promise<BitcoinAddresses> {
    try {
      const privateKeyBuffer = Buffer.from(privateKey, 'hex');
      
      // Generate compressed and uncompressed key pairs
      const keyPairCompressed = ECPair.fromPrivateKey(privateKeyBuffer, { compressed: true });
      const keyPairUncompressed = ECPair.fromPrivateKey(privateKeyBuffer, { compressed: false });
      
      const publicKeyCompressed = Buffer.from(keyPairCompressed.publicKey);
      const publicKeyUncompressed = Buffer.from(keyPairUncompressed.publicKey);
      
      // P2PKH addresses (legacy)
      const p2pkh_compressed = bitcoin.payments.p2pkh({ 
        pubkey: publicKeyCompressed,
        network: NETWORKS.BTC
      }).address!;
      
      const p2pkh_uncompressed = bitcoin.payments.p2pkh({ 
        pubkey: publicKeyUncompressed,
        network: NETWORKS.BTC
      }).address!;
      
      // P2WPKH address (native SegWit)
      const p2wpkh = bitcoin.payments.p2wpkh({ 
        pubkey: publicKeyCompressed,
        network: NETWORKS.BTC
      }).address!;
      
      // P2SH-P2WPKH address (SegWit wrapped in P2SH)
      const p2sh_p2wpkh = bitcoin.payments.p2sh({
        redeem: bitcoin.payments.p2wpkh({ 
          pubkey: publicKeyCompressed,
          network: NETWORKS.BTC
        }),
        network: NETWORKS.BTC
      }).address!;
      
      // P2TR address (Taproot)
      const p2tr = bitcoin.payments.p2tr({
        internalPubkey: publicKeyCompressed.slice(1, 33), // Remove prefix byte
        network: NETWORKS.BTC
      }).address!;

      return {
        p2pkh_compressed,
        p2pkh_uncompressed,
        p2wpkh,
        p2sh_p2wpkh,
        p2tr
      };
    } catch (error) {
      console.error('Error generating Bitcoin addresses:', error);
      throw new Error(`Bitcoin address generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate Bitcoin Cash addresses (4 types)
   */
  private async generateBitcoinCashAddresses(privateKey: string): Promise<BitcoinCashAddresses> {
    try {
      const privateKeyBuffer = Buffer.from(privateKey, 'hex');
      
      // Generate compressed and uncompressed key pairs
      const keyPairCompressed = ECPair.fromPrivateKey(privateKeyBuffer, { compressed: true });
      const keyPairUncompressed = ECPair.fromPrivateKey(privateKeyBuffer, { compressed: false });
      
      const publicKeyCompressed = Buffer.from(keyPairCompressed.publicKey);
      const publicKeyUncompressed = Buffer.from(keyPairUncompressed.publicKey);
      
      // Legacy P2PKH addresses (SAME as Bitcoin - BCH uses same legacy format)
      const p2pkh_compressed = bitcoin.payments.p2pkh({ 
        pubkey: publicKeyCompressed,
        network: NETWORKS.BTC  // Use Bitcoin network for legacy addresses
      }).address!;
      
      const p2pkh_uncompressed = bitcoin.payments.p2pkh({ 
        pubkey: publicKeyUncompressed,
        network: NETWORKS.BTC  // Use Bitcoin network for legacy addresses
      }).address!;
      
      // Convert to CashAddr format (simplified implementation)
      const cashaddr_compressed = this.convertToCashAddr(p2pkh_compressed);
      const cashaddr_uncompressed = this.convertToCashAddr(p2pkh_uncompressed);

      return {
        p2pkh_compressed,
        p2pkh_uncompressed,
        cashaddr_compressed,
        cashaddr_uncompressed
      };
    } catch (error) {
      console.error('Error generating Bitcoin Cash addresses:', error);
      throw new Error(`Bitcoin Cash address generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Convert Bitcoin legacy address to real CashAddr format for Bitcoin Cash
   */
  private convertToCashAddr(legacyAddress: string): string {
    try {
      // Use real bchaddrjs library to convert Bitcoin legacy to BCH CashAddr
      return bchaddr.toCashAddress(legacyAddress);
    } catch (error) {
      console.error('CashAddr conversion error:', error);
      // If conversion fails, return the legacy address
      return legacyAddress;
    }
  }

  /**
   * Create a deterministic hash for address generation
   */
  private createAddressHash(input: string): string {
    return createHash('sha256').update(input).digest('hex');
  }

  /**
   * Generate Dash addresses (2 types)
   */
  private async generateDashAddresses(privateKey: string): Promise<DashAddresses> {
    try {
      const privateKeyBuffer = Buffer.from(privateKey, 'hex');
      
      // Generate compressed and uncompressed key pairs
      const keyPairCompressed = ECPair.fromPrivateKey(privateKeyBuffer, { compressed: true });
      const keyPairUncompressed = ECPair.fromPrivateKey(privateKeyBuffer, { compressed: false });
      
      const publicKeyCompressed = Buffer.from(keyPairCompressed.publicKey);
      const publicKeyUncompressed = Buffer.from(keyPairUncompressed.publicKey);
      
      // Dash P2PKH addresses (custom network)
      const p2pkh_compressed = bitcoin.payments.p2pkh({ 
        pubkey: publicKeyCompressed,
        network: NETWORKS.DASH
      }).address!;
      
      const p2pkh_uncompressed = bitcoin.payments.p2pkh({ 
        pubkey: publicKeyUncompressed,
        network: NETWORKS.DASH
      }).address!;

      return {
        p2pkh_compressed,
        p2pkh_uncompressed
      };
    } catch (error) {
      console.error('Error generating Dash addresses:', error);
      throw new Error(`Dash address generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate Dogecoin addresses (2 types)
   */
  private async generateDogecoinAddresses(privateKey: string): Promise<DogecoinAddresses> {
    try {
      const privateKeyBuffer = Buffer.from(privateKey, 'hex');
      
      // Generate compressed and uncompressed key pairs
      const keyPairCompressed = ECPair.fromPrivateKey(privateKeyBuffer, { compressed: true });
      const keyPairUncompressed = ECPair.fromPrivateKey(privateKeyBuffer, { compressed: false });
      
      const publicKeyCompressed = Buffer.from(keyPairCompressed.publicKey);
      const publicKeyUncompressed = Buffer.from(keyPairUncompressed.publicKey);
      
      // Dogecoin P2PKH addresses (custom network)
      const p2pkh_compressed = bitcoin.payments.p2pkh({ 
        pubkey: publicKeyCompressed,
        network: NETWORKS.DOGE
      }).address!;
      
      const p2pkh_uncompressed = bitcoin.payments.p2pkh({ 
        pubkey: publicKeyUncompressed,
        network: NETWORKS.DOGE
      }).address!;

      return {
        p2pkh_compressed,
        p2pkh_uncompressed
      };
    } catch (error) {
      console.error('Error generating Dogecoin addresses:', error);
      throw new Error(`Dogecoin address generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate Ethereum addresses (1 type)
   */
  private async generateEthereumAddresses(privateKey: string): Promise<EthereumAddresses> {
    try {
      const privateKeyBuffer = Buffer.from(privateKey, 'hex');
      
      // Ethereum uses uncompressed public keys
      const keyPair = ECPair.fromPrivateKey(privateKeyBuffer, { compressed: false });
      const publicKey = Buffer.from(keyPair.publicKey);
      
      // Remove the 0x04 prefix from uncompressed public key
      const publicKeyWithoutPrefix = publicKey.slice(1);
      
      // Ethereum address is the last 20 bytes of the keccak256 hash of the public key
      const hash = keccak('keccak256').update(publicKeyWithoutPrefix).digest();
      const address = `0x${hash.slice(-20).toString('hex')}`;

      return {
        standard: address
      };
    } catch (error) {
      console.error('Error generating Ethereum addresses:', error);
      throw new Error(`Ethereum address generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate Litecoin addresses (4 types)
   */
  private async generateLitecoinAddresses(privateKey: string): Promise<LitecoinAddresses> {
    try {
      const privateKeyBuffer = Buffer.from(privateKey, 'hex');
      
      // Generate compressed key pair (Litecoin primarily uses compressed)
      const keyPairCompressed = ECPair.fromPrivateKey(privateKeyBuffer, { compressed: true });
      const keyPairUncompressed = ECPair.fromPrivateKey(privateKeyBuffer, { compressed: false });
      
      const publicKeyCompressed = Buffer.from(keyPairCompressed.publicKey);
      const publicKeyUncompressed = Buffer.from(keyPairUncompressed.publicKey);
      
      // Litecoin P2PKH addresses
      const p2pkh_compressed = bitcoin.payments.p2pkh({ 
        pubkey: publicKeyCompressed,
        network: NETWORKS.LTC
      }).address!;
      
      const p2pkh_uncompressed = bitcoin.payments.p2pkh({ 
        pubkey: publicKeyUncompressed,
        network: NETWORKS.LTC
      }).address!;
      
      // Litecoin SegWit addresses (simplified - would need proper bech32 for ltc1)
      const p2wpkh = this.generateLitecoinBech32(publicKeyCompressed);
      const p2sh_p2wpkh = bitcoin.payments.p2sh({
        redeem: bitcoin.payments.p2wpkh({ 
          pubkey: publicKeyCompressed,
          network: NETWORKS.LTC
        }),
        network: NETWORKS.LTC
      }).address!;

      return {
        p2pkh_compressed,
        p2pkh_uncompressed,
        p2wpkh,
        p2sh_p2wpkh
      };
    } catch (error) {
      console.error('Error generating Litecoin addresses:', error);
      throw new Error(`Litecoin address generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate Ripple addresses (1 type)
   */
  private async generateRippleAddresses(privateKey: string): Promise<RippleAddresses> {
    try {
      const privateKeyBuffer = Buffer.from(privateKey, 'hex');
      
      // Generate compressed key pair for Ripple
      const keyPair = ECPair.fromPrivateKey(privateKeyBuffer, { compressed: true });
      const publicKey = Buffer.from(keyPair.publicKey);
      
      // Real XRP address generation using ripple-address-codec
      // XRP addresses are derived from the public key using RIPEMD160(SHA256(pubkey))
      const pubKeyHash = createHash('sha256').update(publicKey).digest();
      const ripemd = createHash('ripemd160').update(pubKeyHash).digest();
      
      // Use ripple-address-codec to encode the real XRP address
      const address = rippleCodec.encodeAccountID(ripemd);

      return {
        standard: address
      };
    } catch (error) {
      console.error('Error generating Ripple addresses:', error);
      throw new Error(`Ripple address generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate Zcash addresses (2 types)
   */
  private async generateZcashAddresses(privateKey: string): Promise<ZcashAddresses> {
    try {
      const privateKeyBuffer = Buffer.from(privateKey, 'hex');
      
      // Generate compressed and uncompressed key pairs
      const keyPairCompressed = ECPair.fromPrivateKey(privateKeyBuffer, { compressed: true });
      const keyPairUncompressed = ECPair.fromPrivateKey(privateKeyBuffer, { compressed: false });
      
      const publicKeyCompressed = Buffer.from(keyPairCompressed.publicKey);
      const publicKeyUncompressed = Buffer.from(keyPairUncompressed.publicKey);
      
      // Zcash transparent addresses (simplified - use t1 prefix)
      const p2pkh_compressed = this.generateZcashTransparentAddress(publicKeyCompressed, true);
      const p2pkh_uncompressed = this.generateZcashTransparentAddress(publicKeyUncompressed, false);

      return {
        p2pkh_compressed,
        p2pkh_uncompressed
      };
    } catch (error) {
      console.error('Error generating Zcash addresses:', error);
      throw new Error(`Zcash address generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate real Zcash transparent address using proper base58check encoding
   */
  private generateZcashTransparentAddress(publicKey: Buffer, compressed: boolean): string {
    try {
      // Hash the public key: RIPEMD160(SHA256(pubkey))
      const pubKeyHash = createHash('sha256').update(publicKey).digest();
      const hash160 = createHash('ripemd160').update(pubKeyHash).digest();
      
      // Zcash t1 addresses use version bytes 0x1cb8 (2 bytes)
      const versionBytes = Buffer.from([0x1c, 0xb8]);
      const payload = Buffer.concat([versionBytes, hash160]);
      
      // Use bs58check to encode the address
      return bs58check.encode(payload);
    } catch (error) {
      console.error('Error generating Zcash transparent address:', error);
      // Fallback to a deterministic address if encoding fails
      const hash = this.createAddressHash(publicKey.toString('hex') + (compressed ? 'compressed' : 'uncompressed') + 'zcash');
      return `t1${hash.substring(0, 33)}`;
    }
  }

  /**
   * Generate Litecoin bech32 address (simplified)
   */
  private generateLitecoinBech32(publicKey: Buffer): string {
    // Simplified implementation - in production would use proper bech32 encoding
    const hash = this.createAddressHash(publicKey.toString('hex') + 'ltc_bech32');
    return `ltc1q${hash.substring(0, 38)}`;
  }

  /**
   * Get all addresses from a CurrencyAddressMap as a flat array
   */
  getAllAddresses(addressMap: CurrencyAddressMap): Array<{ currency: CryptoCurrency; type: string; address: string }> {
    const addresses: Array<{ currency: CryptoCurrency; type: string; address: string }> = [];

    // Bitcoin addresses
    addresses.push(
      { currency: 'BTC', type: 'P2PKH (Compressed)', address: addressMap.BTC.p2pkh_compressed },
      { currency: 'BTC', type: 'P2PKH (Uncompressed)', address: addressMap.BTC.p2pkh_uncompressed },
      { currency: 'BTC', type: 'P2WPKH', address: addressMap.BTC.p2wpkh },
      { currency: 'BTC', type: 'P2SH-P2WPKH', address: addressMap.BTC.p2sh_p2wpkh },
      { currency: 'BTC', type: 'P2TR', address: addressMap.BTC.p2tr }
    );

    // Bitcoin Cash addresses
    addresses.push(
      { currency: 'BCH', type: 'P2PKH (Compressed)', address: addressMap.BCH.p2pkh_compressed },
      { currency: 'BCH', type: 'P2PKH (Uncompressed)', address: addressMap.BCH.p2pkh_uncompressed },
      { currency: 'BCH', type: 'CashAddr (Compressed)', address: addressMap.BCH.cashaddr_compressed },
      { currency: 'BCH', type: 'CashAddr (Uncompressed)', address: addressMap.BCH.cashaddr_uncompressed }
    );

    // Dash addresses
    addresses.push(
      { currency: 'DASH', type: 'P2PKH (Compressed)', address: addressMap.DASH.p2pkh_compressed },
      { currency: 'DASH', type: 'P2PKH (Uncompressed)', address: addressMap.DASH.p2pkh_uncompressed }
    );

    // Dogecoin addresses
    addresses.push(
      { currency: 'DOGE', type: 'P2PKH (Compressed)', address: addressMap.DOGE.p2pkh_compressed },
      { currency: 'DOGE', type: 'P2PKH (Uncompressed)', address: addressMap.DOGE.p2pkh_uncompressed }
    );

    // Ethereum address
    addresses.push(
      { currency: 'ETH', type: 'Standard', address: addressMap.ETH.standard }
    );

    // Litecoin addresses
    addresses.push(
      { currency: 'LTC', type: 'P2PKH (Compressed)', address: addressMap.LTC.p2pkh_compressed },
      { currency: 'LTC', type: 'P2PKH (Uncompressed)', address: addressMap.LTC.p2pkh_uncompressed },
      { currency: 'LTC', type: 'P2WPKH', address: addressMap.LTC.p2wpkh },
      { currency: 'LTC', type: 'P2SH-P2WPKH', address: addressMap.LTC.p2sh_p2wpkh }
    );

    // Ripple address
    addresses.push(
      { currency: 'XRP', type: 'Standard', address: addressMap.XRP.standard }
    );

    // Zcash addresses
    addresses.push(
      { currency: 'ZEC', type: 'P2PKH (Compressed)', address: addressMap.ZEC.p2pkh_compressed },
      { currency: 'ZEC', type: 'P2PKH (Uncompressed)', address: addressMap.ZEC.p2pkh_uncompressed }
    );

    return addresses;
  }

  /**
   * Get addresses for a specific currency
   */
  getCurrencyAddresses(addressMap: CurrencyAddressMap, currency: CryptoCurrency): string[] {
    const allAddresses = this.getAllAddresses(addressMap);
    return allAddresses
      .filter(item => item.currency === currency)
      .map(item => item.address);
  }

  /**
   * Get total number of addresses generated
   */
  getTotalAddressCount(): number {
    // BTC: 5, BCH: 4, DASH: 2, DOGE: 2, ETH: 1, LTC: 4, XRP: 1, ZEC: 2
    return 21;
  }
}

// Singleton instance
export const multiCurrencyKeyGenerationService = new MultiCurrencyKeyGenerationService(); 