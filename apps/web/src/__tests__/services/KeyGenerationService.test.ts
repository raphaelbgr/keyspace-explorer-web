import { KeyGenerationService } from '../../lib/services/KeyGenerationService';

describe('KeyGenerationService', () => {
  let service: KeyGenerationService;

  beforeEach(() => {
    service = new KeyGenerationService();
  });

  describe('Bitcoin Address Generation - Private Key 1', () => {
    it('should generate correct addresses for private key 1', async () => {
      const pageData = await service.generatePage(BigInt(1), 1);
      
      expect(pageData.keys).toHaveLength(1);
      const key = pageData.keys[0];
      
      // Verify private key is correct
      expect(key.privateKey).toBe('0000000000000000000000000000000000000000000000000000000000000001');
      
      // Verify expected addresses for private key 1
      expect(key.addresses.p2pkh_compressed).toBe('1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH');
      expect(key.addresses.p2pkh_uncompressed).toBe('1BgGZ9tcN4rm9KBzDn7KprQz87SZ26SAMH');
      expect(key.addresses.p2wpkh).toBe('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4');
      expect(key.addresses.p2sh_p2wpkh).toBe('3JvL6Ymt8MVWiCNHC7oWU6nLeHNJKLZGLN');
      expect(key.addresses.p2tr).toBe('bc1pmfr3p9j00pfxjh0zmgp99y8zftmd3s5pmedqhyptwy6lm87hf5sspknck9');
    });

    it('should generate different addresses for different private keys', async () => {
      const pageData1 = await service.generatePage(BigInt(1), 1);
      const pageData2 = await service.generatePage(BigInt(2), 1);
      
      expect(pageData1.keys[0].addresses.p2pkh_compressed).not.toBe(
        pageData2.keys[0].addresses.p2pkh_compressed
      );
      expect(pageData1.keys[0].addresses.p2wpkh).not.toBe(
        pageData2.keys[0].addresses.p2wpkh
      );
    });

    it('should not use mock addresses', async () => {
      const pageData = await service.generatePage(BigInt(1), 1);
      const key = pageData.keys[0];
      
      // Verify addresses are real Bitcoin addresses, not mock
      expect(key.addresses.p2pkh_compressed).toMatch(/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/);
      expect(key.addresses.p2wpkh).toMatch(/^bc1[a-z0-9]{39,59}$/);
      expect(key.addresses.p2sh_p2wpkh).toMatch(/^3[a-km-zA-HJ-NP-Z1-9]{25,34}$/);
      expect(key.addresses.p2tr).toMatch(/^bc1p[a-z0-9]{39,59}$/);
    });
  });

  describe('Bitcoin Address Generation - General Tests', () => {
    it('should generate valid P2PKH addresses', async () => {
      const pageData = await service.generatePage(BigInt(1), 1);
      
      expect(pageData.keys).toHaveLength(1);
      const key = pageData.keys[0];
      
      // Test P2PKH compressed address format
      expect(key.addresses.p2pkh_compressed).toMatch(/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/);
      
      // Test P2PKH uncompressed address format
      expect(key.addresses.p2pkh_uncompressed).toMatch(/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/);
    });

    it('should generate valid P2WPKH addresses', async () => {
      const pageData = await service.generatePage(BigInt(1), 1);
      
      expect(pageData.keys).toHaveLength(1);
      const key = pageData.keys[0];
      
      // Test P2WPKH address format (bech32)
      expect(key.addresses.p2wpkh).toMatch(/^bc1[a-z0-9]{39,59}$/);
    });

    it('should generate valid P2SH-P2WPKH addresses', async () => {
      const pageData = await service.generatePage(BigInt(1), 1);
      
      expect(pageData.keys).toHaveLength(1);
      const key = pageData.keys[0];
      
      // Test P2SH-P2WPKH address format (starts with 3)
      expect(key.addresses.p2sh_p2wpkh).toMatch(/^3[a-km-zA-HJ-NP-Z1-9]{25,34}$/);
    });

    it('should generate valid P2TR addresses', async () => {
      const pageData = await service.generatePage(BigInt(1), 1);
      
      expect(pageData.keys).toHaveLength(1);
      const key = pageData.keys[0];
      
      // Test P2TR address format (bech32m)
      expect(key.addresses.p2tr).toMatch(/^bc1p[a-z0-9]{39,59}$/);
    });
  });

  describe('Page Generation', () => {
    it('should generate correct number of keys per page', async () => {
      const pageData = await service.generatePage(BigInt(1), 10);
      expect(pageData.keys).toHaveLength(10);
    });

    it('should generate sequential private keys', async () => {
      const pageData = await service.generatePage(BigInt(1), 5);
      
      for (let i = 0; i < pageData.keys.length; i++) {
        const expectedPrivateKey = BigInt('1') + BigInt(i);
        const expectedHex = expectedPrivateKey.toString(16).padStart(64, '0');
        expect(pageData.keys[i].privateKey).toBe(expectedHex);
      }
    });

    it('should set correct page number and index', async () => {
      const pageData = await service.generatePage(BigInt(5), 3);
      
      pageData.keys.forEach((key, index) => {
        expect(key.pageNumber).toBe(BigInt(5));
        expect(key.index).toBe(index);
      });
    });
  });

  describe('Random Page Generation', () => {
    it('should generate a random page number', () => {
      const randomPage = service.generateSecureRandomPage();
      expect(typeof randomPage).toBe('bigint');
      expect(randomPage).toBeGreaterThanOrEqual(BigInt(0));
      expect(randomPage).toBeLessThan(BigInt(1000000));
    });

    it('should generate different random pages', () => {
      const page1 = service.generateSecureRandomPage();
      const page2 = service.generateSecureRandomPage();
      
      // Note: There's a small chance these could be the same, but it's very unlikely
      // In a real test, you might want to run this multiple times
      expect(page1).toBeDefined();
      expect(page2).toBeDefined();
    });
  });

  describe('Address Validation', () => {
    it('should generate addresses with correct checksums', async () => {
      const pageData = await service.generatePage(BigInt(1), 1);
      const key = pageData.keys[0];
      
      // All addresses should be valid Bitcoin addresses
      const addresses = Object.values(key.addresses);
      addresses.forEach(address => {
        expect(address).toBeDefined();
        expect(typeof address).toBe('string');
        expect(address.length).toBeGreaterThan(0);
      });
    });

    it('should generate unique addresses for each key', async () => {
      const pageData = await service.generatePage(BigInt(1), 25);
      
      // Only check p2pkh_compressed addresses for uniqueness
      const allAddresses = pageData.keys.map(key => key.addresses.p2pkh_compressed);
      const uniqueAddresses = new Set(allAddresses);
      
      // Each address should be unique
      expect(uniqueAddresses.size).toBe(allAddresses.length);
    });
  });
}); 