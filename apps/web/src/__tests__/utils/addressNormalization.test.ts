/**
 * Address Normalization Tests
 * Comprehensive tests for address prefix normalization functionality
 */

import { AddressNormalizer, ETH_NORMALIZER, BCH_NORMALIZER, getNormalizer } from '../../lib/utils/addressNormalization';
import { CryptoCurrency } from '../../lib/types/multi-currency';

describe('AddressNormalizer', () => {
  
  describe('ETH Address Normalization', () => {
    const ethAddress = '1a1zp1ep5qgefi2dmpttl5slmv7divfna'; // 40 char hex
    const ethAddressWithPrefix = `0x${ethAddress}`;

    test('should remove 0x prefix from ETH addresses', () => {
      expect(AddressNormalizer.normalize(ethAddressWithPrefix, 'ETH')).toBe(ethAddress);
    });

    test('should leave ETH addresses without prefix unchanged', () => {
      expect(AddressNormalizer.normalize(ethAddress, 'ETH')).toBe(ethAddress);
    });

    test('should add 0x prefix to ETH addresses for display', () => {
      expect(AddressNormalizer.denormalize(ethAddress, 'ETH')).toBe(ethAddressWithPrefix);
    });

    test('should not double-add 0x prefix to ETH addresses', () => {
      expect(AddressNormalizer.denormalize(ethAddressWithPrefix, 'ETH')).toBe(ethAddressWithPrefix);
    });

    test('should validate ETH address format correctly', () => {
      expect(AddressNormalizer.validateFormat(ethAddressWithPrefix, 'ETH')).toEqual({ isValid: true });
      expect(AddressNormalizer.validateFormat(ethAddress, 'ETH')).toEqual({ isValid: true });
      expect(AddressNormalizer.validateFormat('invalid', 'ETH')).toEqual({ 
        isValid: false, 
        error: 'Ethereum address must be 40 hexadecimal characters' 
      });
    });
  });

  describe('BCH Address Normalization', () => {
    const bchLegacyAddress = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';
    const bchCashAddr = 'qhkfq3xqj0k4fj6q4j6q4j6q4j6q4j6q4j';
    const bchCashAddrWithPrefix = `bitcoincash:${bchCashAddr}`;

    test('should remove bitcoincash: prefix from BCH addresses', () => {
      expect(AddressNormalizer.normalize(bchCashAddrWithPrefix, 'BCH')).toBe(bchCashAddr);
    });

    test('should leave BCH addresses without prefix unchanged', () => {
      expect(AddressNormalizer.normalize(bchLegacyAddress, 'BCH')).toBe(bchLegacyAddress);
      expect(AddressNormalizer.normalize(bchCashAddr, 'BCH')).toBe(bchCashAddr);
    });

    test('should add bitcoincash: prefix to CashAddr format addresses', () => {
      expect(AddressNormalizer.denormalize(bchCashAddr, 'BCH')).toBe(bchCashAddrWithPrefix);
    });

    test('should not add prefix to legacy BCH addresses', () => {
      expect(AddressNormalizer.denormalize(bchLegacyAddress, 'BCH')).toBe(bchLegacyAddress);
    });

    test('should validate BCH address format correctly', () => {
      expect(AddressNormalizer.validateFormat(bchLegacyAddress, 'BCH')).toEqual({ isValid: true });
      expect(AddressNormalizer.validateFormat(bchCashAddrWithPrefix, 'BCH')).toEqual({ isValid: true });
      expect(AddressNormalizer.validateFormat('short', 'BCH')).toEqual({ 
        isValid: false, 
        error: 'Bitcoin Cash address length is invalid' 
      });
    });
  });

  describe('Other Currency Normalization', () => {
    const btcAddress = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';
    const xrpAddress = 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH';

    test('should not modify BTC addresses', () => {
      expect(AddressNormalizer.normalize(btcAddress, 'BTC')).toBe(btcAddress);
      expect(AddressNormalizer.denormalize(btcAddress, 'BTC')).toBe(btcAddress);
    });

    test('should not modify XRP addresses', () => {
      expect(AddressNormalizer.normalize(xrpAddress, 'XRP')).toBe(xrpAddress);
      expect(AddressNormalizer.denormalize(xrpAddress, 'XRP')).toBe(xrpAddress);
    });

    test('should validate BTC address format', () => {
      expect(AddressNormalizer.validateFormat(btcAddress, 'BTC')).toEqual({ isValid: true });
      expect(AddressNormalizer.validateFormat('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4', 'BTC')).toEqual({ isValid: true });
      expect(AddressNormalizer.validateFormat('invalid', 'BTC')).toEqual({ 
        isValid: false, 
        error: 'Bitcoin address must start with 1, 3, or bc1' 
      });
    });

    test('should validate XRP address format', () => {
      expect(AddressNormalizer.validateFormat(xrpAddress, 'XRP')).toEqual({ isValid: true });
      expect(AddressNormalizer.validateFormat('invalid', 'XRP')).toEqual({ 
        isValid: false, 
        error: 'XRP address must start with "r" and be 25-34 characters' 
      });
    });
  });

  describe('Batch Operations', () => {
    const ethAddresses = [
      '0x1a1zp1ep5qgefi2dmpttl5slmv7divfna11111111',
      '2a1zp1ep5qgefi2dmpttl5slmv7divfna22222222',
      '0x3a1zp1ep5qgefi2dmpttl5slmv7divfna33333333'
    ];

    test('should normalize batch of ETH addresses', () => {
      const normalized = AddressNormalizer.normalizeBatch(ethAddresses, 'ETH');
      expect(normalized).toEqual([
        '1a1zp1ep5qgefi2dmpttl5slmv7divfna11111111',
        '2a1zp1ep5qgefi2dmpttl5slmv7divfna22222222',
        '3a1zp1ep5qgefi2dmpttl5slmv7divfna33333333'
      ]);
    });

    test('should denormalize batch of ETH addresses', () => {
      const normalized = [
        '1a1zp1ep5qgefi2dmpttl5slmv7divfna11111111',
        '2a1zp1ep5qgefi2dmpttl5slmv7divfna22222222',
        '3a1zp1ep5qgefi2dmpttl5slmv7divfna33333333'
      ];
      const denormalized = AddressNormalizer.denormalizeBatch(normalized, 'ETH');
      expect(denormalized).toEqual([
        '0x1a1zp1ep5qgefi2dmpttl5slmv7divfna11111111',
        '0x2a1zp1ep5qgefi2dmpttl5slmv7divfna22222222',
        '0x3a1zp1ep5qgefi2dmpttl5slmv7divfna33333333'
      ]);
    });
  });

  describe('Address Analysis', () => {
    test('should analyze ETH address with prefix', () => {
      const analysis = AddressNormalizer.analyzeAddress('0x1a1zp1ep5qgefi2dmpttl5slmv7divfna11111111', 'ETH');
      expect(analysis).toEqual({
        normalized: '1a1zp1ep5qgefi2dmpttl5slmv7divfna11111111',
        original: '0x1a1zp1ep5qgefi2dmpttl5slmv7divfna11111111',
        currency: 'ETH',
        hasPrefix: true,
        prefix: '0x'
      });
    });

    test('should analyze BCH address with prefix', () => {
      const analysis = AddressNormalizer.analyzeAddress('bitcoincash:qhkfq3xqj0k4fj6q4j6q4j6q4j6q4j6q4j', 'BCH');
      expect(analysis).toEqual({
        normalized: 'qhkfq3xqj0k4fj6q4j6q4j6q4j6q4j6q4j',
        original: 'bitcoincash:qhkfq3xqj0k4fj6q4j6q4j6q4j6q4j6q4j',
        currency: 'BCH',
        hasPrefix: true,
        prefix: 'bitcoincash:'
      });
    });

    test('should analyze address without prefix', () => {
      const analysis = AddressNormalizer.analyzeAddress('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 'BTC');
      expect(analysis).toEqual({
        normalized: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        original: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        currency: 'BTC',
        hasPrefix: false,
        prefix: undefined
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle null/undefined addresses', () => {
      expect(AddressNormalizer.normalize('', 'ETH')).toBe('');
      expect(AddressNormalizer.normalize(null as any, 'ETH')).toBe(null);
      expect(AddressNormalizer.normalize(undefined as any, 'ETH')).toBe(undefined);
    });

    test('should handle whitespace in addresses', () => {
      expect(AddressNormalizer.normalize('  0x1234567890123456789012345678901234567890  ', 'ETH'))
        .toBe('1234567890123456789012345678901234567890');
    });

    test('should validate empty/invalid addresses', () => {
      expect(AddressNormalizer.validateFormat('', 'ETH')).toEqual({ 
        isValid: false, 
        error: 'Address is required and must be a string' 
      });
      expect(AddressNormalizer.validateFormat(null as any, 'ETH')).toEqual({ 
        isValid: false, 
        error: 'Address is required and must be a string' 
      });
    });
  });
});

describe('Currency-specific normalizers', () => {
  test('ETH_NORMALIZER should work correctly', () => {
    expect(ETH_NORMALIZER.normalize('0x1234567890123456789012345678901234567890')).toBe('1234567890123456789012345678901234567890');
    expect(ETH_NORMALIZER.denormalize('1234567890123456789012345678901234567890')).toBe('0x1234567890123456789012345678901234567890');
    expect(ETH_NORMALIZER.validate('0x1234567890123456789012345678901234567890')).toEqual({ isValid: true });
  });

  test('BCH_NORMALIZER should work correctly', () => {
    expect(BCH_NORMALIZER.normalize('bitcoincash:qhkfq3xqj0k4fj6q4j6q4j6q4j6q4j6q4j')).toBe('qhkfq3xqj0k4fj6q4j6q4j6q4j6q4j6q4j');
    expect(BCH_NORMALIZER.denormalize('qhkfq3xqj0k4fj6q4j6q4j6q4j6q4j6q4j')).toBe('bitcoincash:qhkfq3xqj0k4fj6q4j6q4j6q4j6q4j6q4j');
  });

  test('getNormalizer should return appropriate normalizer', () => {
    const ethNormalizer = getNormalizer('ETH');
    expect(ethNormalizer.normalize('0x1234567890123456789012345678901234567890')).toBe('1234567890123456789012345678901234567890');

    const btcNormalizer = getNormalizer('BTC');
    expect(btcNormalizer.normalize('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')).toBe('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa');
  });
});

describe('Middleware functionality', () => {
  test('createNormalizationMiddleware should process request body', () => {
    const middleware = AddressNormalizer.createNormalizationMiddleware();
    
    const req = {
      body: {
        addresses: ['0x1234567890123456789012345678901234567890', '0x9876543210987654321098765432109876543210'],
        currency: 'ETH'
      }
    };
    
    const res = {};
    const next = jest.fn();
    
    middleware(req, res, next);
    
    expect(req.body.addresses).toEqual([
      '1234567890123456789012345678901234567890',
      '9876543210987654321098765432109876543210'
    ]);
    expect(next).toHaveBeenCalled();
  });

  test('middleware should handle errors gracefully', () => {
    const middleware = AddressNormalizer.createNormalizationMiddleware();
    
    const req = {
      body: null // This will cause an error
    };
    
    const res = {};
    const next = jest.fn();
    
    middleware(req, res, next);
    
    expect(next).toHaveBeenCalled(); // Should continue even on error
  });
}); 