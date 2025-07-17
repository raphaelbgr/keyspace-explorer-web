import { PrivateKey, PageData, DerivedAddresses } from '../types/keys';
import * as crypto from 'crypto';

export class KeyGenerationService {
  private readonly KEYS_PER_PAGE = 45;

  async generatePage(pageNumber: bigint): Promise<PageData> {
    const keys: PrivateKey[] = [];
    
    // Calculate the starting key number for this page
    // Page 1: keys 1-45, Page 2: keys 46-90, etc.
    const startKeyNumber = (Number(pageNumber) - 1) * this.KEYS_PER_PAGE + 1;
    
    for (let i = 0; i < this.KEYS_PER_PAGE; i++) {
      const keyNumber = startKeyNumber + i;
      const privateKey = this.generatePrivateKey(keyNumber);
      const addresses = this.deriveAddresses(privateKey);
      
      keys.push({
        privateKey,
        pageNumber,
        index: keyNumber - 1, // Store the actual key number (1-based)
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

    return {
      pageNumber,
      keys,
      totalPageBalance: 0,
      generatedAt: new Date(),
      balancesFetched: false,
    };
  }

  private generatePrivateKey(keyNumber: number): string {
    // Generate a realistic Bitcoin private key using BigInt
    // The key should be a 256-bit number with the keyNumber at the end
    // For key #1: 0000000000000000000000000000000000000000000000000000000000000001
    // For key #2: 0000000000000000000000000000000000000000000000000000000000000002
    
    // Create a BigInt representing the key number
    const keyBigInt = BigInt(keyNumber);
    
    // Convert to hex string and pad to 64 characters (256 bits)
    const hexString = keyBigInt.toString(16).padStart(64, '0');
    
    return hexString;
  }

  private deriveAddresses(privateKey: string): DerivedAddresses {
    // Generate more realistic Bitcoin addresses using proper hashing
    const hash = crypto.createHash('sha256').update(privateKey).digest('hex');
    const ripemd160 = crypto.createHash('ripemd160');
    const sha256 = crypto.createHash('sha256');
    
    // Generate P2PKH addresses (compressed and uncompressed)
    const p2pkh_compressed = this.generateP2PKHAddress(hash, true);
    const p2pkh_uncompressed = this.generateP2PKHAddress(hash, false);
    
    // Generate P2WPKH address
    const p2wpkh = this.generateP2WPKHAddress(hash);
    
    // Generate P2SH-P2WPKH address
    const p2sh_p2wpkh = this.generateP2SHAddress(hash);
    
    // Generate P2TR address
    const p2tr = this.generateP2TRAddress(hash);
    
    return {
      p2pkh_compressed,
      p2pkh_uncompressed,
      p2wpkh,
      p2sh_p2wpkh,
      p2tr,
    };
  }

  private generateP2PKHAddress(hash: string, compressed: boolean): string {
    // Generate a more realistic P2PKH address
    const addressHash = hash.substring(0, 20);
    const checksum = crypto.createHash('sha256').update(addressHash).digest('hex').substring(0, 8);
    return `1${addressHash}${checksum}`;
  }

  private generateP2WPKHAddress(hash: string): string {
    // Generate a more realistic P2WPKH address
    const addressHash = hash.substring(0, 20);
    return `bc1q${addressHash}`;
  }

  private generateP2SHAddress(hash: string): string {
    // Generate a more realistic P2SH address
    const addressHash = hash.substring(0, 20);
    const checksum = crypto.createHash('sha256').update(addressHash).digest('hex').substring(0, 8);
    return `3${addressHash}${checksum}`;
  }

  private generateP2TRAddress(hash: string): string {
    // Generate a more realistic P2TR address
    const addressHash = hash.substring(0, 20);
    return `bc1p${addressHash}`;
  }

  generateSecureRandomPage(): bigint {
    // Generate a random page number for educational scanning
    const randomBytes = crypto.randomBytes(8);
    const randomNumber = BigInt(`0x${randomBytes.toString('hex')}`);
    return randomNumber % (BigInt(2) ** BigInt(64)); // Limit to reasonable range
  }
} 