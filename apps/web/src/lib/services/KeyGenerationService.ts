import { PrivateKey, PageData, DerivedAddresses } from '../types/keys';
import * as crypto from 'crypto';
import * as bitcoin from 'bitcoinjs-lib';
import { ECPairFactory } from 'ecpair';
import '../ecc-init'; // Import ECC initialization

const ECPair = ECPairFactory(require('tiny-secp256k1'));

export class KeyGenerationService {
  private readonly KEYS_PER_PAGE = 45;
  // Maximum valid Bitcoin private key (order of secp256k1 curve minus 1)
  private readonly MAX_PRIVATE_KEY = BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364140");

  async generatePage(pageNumber: bigint, keysPerPage: number = this.KEYS_PER_PAGE): Promise<PageData> {
    const keys: PrivateKey[] = [];
    
    // Calculate the starting key number for this page
    // Each page contains keysPerPage sequential private keys starting from 1
    const startKeyNumber = (pageNumber - BigInt(1)) * BigInt(keysPerPage) + BigInt(1);
    
    for (let i = 0; i < keysPerPage; i++) {
      const keyNumber = startKeyNumber + BigInt(i);
      
      // Ensure we don't exceed the maximum valid private key
      if (keyNumber > this.MAX_PRIVATE_KEY) {
        break; // Stop generating keys if we exceed the maximum
      }
      
      const privateKey = this.generatePrivateKey(keyNumber);
      const addresses = this.deriveAddresses(privateKey);
      
      keys.push({
        privateKey,
        pageNumber,
        index: i, // 0-based index on the page
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

  private generatePrivateKey(keyNumber: bigint): string {
    // Generate a valid Bitcoin private key
    // The key should be a 256-bit number representing the actual key number
    // For key #1: 0000000000000000000000000000000000000000000000000000000000000001
    // For key #2: 0000000000000000000000000000000000000000000000000000000000000002
    
    // Ensure the key number doesn't exceed the maximum valid private key
    if (keyNumber > this.MAX_PRIVATE_KEY) {
      throw new Error(`Key number ${keyNumber} exceeds maximum valid Bitcoin private key`);
    }
    
    // Convert to hex string and pad to 64 characters (256 bits)
    const hexString = keyNumber.toString(16).padStart(64, '0');
    
    return hexString;
  }

  private deriveAddresses(privateKey: string): DerivedAddresses {
    // Convert hex private key to Buffer
    const privateKeyBuffer = Buffer.from(privateKey, 'hex');
    
    // Generate key pair
    const keyPair = ECPair.fromPrivateKey(privateKeyBuffer);
    
    // Convert public key to Buffer for bitcoinjs-lib compatibility
    const publicKeyBuffer = Buffer.from(keyPair.publicKey);
    
    // Generate P2PKH addresses (compressed and uncompressed)
    const p2pkh_compressed = bitcoin.payments.p2pkh({ 
      pubkey: publicKeyBuffer 
    }).address!;
    
    const p2pkh_uncompressed = bitcoin.payments.p2pkh({ 
      pubkey: publicKeyBuffer
    }).address!;
    
    // Generate P2WPKH address
    const p2wpkh = bitcoin.payments.p2wpkh({ 
      pubkey: publicKeyBuffer 
    }).address!;
    
    // Generate P2SH-P2WPKH address
    const p2sh_p2wpkh = bitcoin.payments.p2sh({
      redeem: bitcoin.payments.p2wpkh({ pubkey: publicKeyBuffer })
    }).address!;
    
    // Generate P2TR address (Taproot)
    const p2tr = bitcoin.payments.p2tr({
      internalPubkey: publicKeyBuffer.slice(1, 33)
    }).address!;
    
    return {
      p2pkh_compressed,
      p2pkh_uncompressed,
      p2wpkh,
      p2sh_p2wpkh,
      p2tr,
    };
  }

  generateSecureRandomPage(): bigint {
    // Generate a random page number for educational scanning
    const randomBytes = crypto.randomBytes(4); // Use 4 bytes instead of 8
    const randomNumber = BigInt(`0x${randomBytes.toString('hex')}`);
    return randomNumber % BigInt(1000000); // Limit to 1 million pages
  }
} 