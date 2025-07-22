# Multi-Currency Address Generation API Documentation

## Overview

The Multi-Currency Address Generation API extends the Bitcoin Keyspace Explorer to support **8 cryptocurrencies**: BTC, BCH, DASH, DOGE, ETH, LTC, XRP, and ZEC. The API provides parallel address generation, intelligent error handling, timeout management, and graceful degradation capabilities.

## Supported Cryptocurrencies

| Currency | Symbol | Name | Address Types | Icon |
|----------|--------|------|---------------|------|
| BTC | Bitcoin | Bitcoin | P2PKH, P2WPKH, P2SH-P2WPKH, P2TR | 🟠 |
| BCH | Bitcoin Cash | Bitcoin Cash | P2PKH, CashAddr | 🍊 |
| DASH | Dash | Dash | P2PKH (Compressed/Uncompressed) | 🔵 |
| DOGE | Dogecoin | Dogecoin | P2PKH (Compressed/Uncompressed) | 🐕 |
| ETH | Ethereum | Ethereum | Standard (0x prefix) | 💎 |
| LTC | Litecoin | Litecoin | P2PKH, P2WPKH, P2SH-P2WPKH | ⚪ |
| XRP | Ripple | Ripple | Standard (r prefix) | 💰 |
| ZEC | Zcash | Zcash | Transparent P2PKH (Local DB only) | 🛡️ |

## Address Normalization

The API automatically handles address prefix normalization:

- **ETH**: Removes/adds `0x` prefix for database storage/display
- **BCH**: Removes/adds `bitcoincash:` prefix for CashAddr format
- **Others**: No normalization required

## Endpoints

### 1. Generate Page with Multi-Currency Support

**Endpoint:** `POST /api/generate-page`

Generate a page of sequential private keys with addresses for selected cryptocurrencies.

#### Request Body

```json
{
  "pageNumber": "1",
  "keysPerPage": 45,
  "currencies": ["BTC", "ETH", "BCH"],
  "multiCurrency": false
}
```

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `pageNumber` | string | Yes | - | Page number (supports BigInt as string) |
| `keysPerPage` | number | No | 45 | Number of keys to generate (1-10000) |
| `currencies` | array | No | ["BTC"] | Array of currency symbols to generate |
| `multiCurrency` | boolean | No | false | Legacy flag - generates all currencies if true |

#### Response

```json
{
  "success": true,
  "pageNumber": "1",
  "keys": [
    {
      "privateKey": "0000000000000000000000000000000000000000000000000000000000000001",
      "pageNumber": "1",
      "index": 0,
      "addresses": {
        "BTC": {
          "p2pkh_compressed": "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2",
          "p2pkh_uncompressed": "1EHNa6Q4Jz2uvNExL497mE43ikXhwF6kZm",
          "p2wpkh": "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
          "p2sh_p2wpkh": "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy",
          "p2tr": "bc1p0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9hcz7vqzk5jj0"
        },
        "ETH": {
          "standard": "0x7e5f4552091a69125d5dfcb7b8c2659029395bdf"
        }
      },
      "balances": {},
      "totalBalance": 0
    }
  ],
  "totalPageBalance": 0,
  "generatedAt": "2025-01-22T10:30:00.000Z",
  "balancesFetched": false,
  "multiCurrency": true,
  "currencies": ["BTC", "ETH"],
  "metadata": {
    "supportedCurrencies": ["BTC", "ETH"],
    "totalAddressCount": 6,
    "generationTime": 150.5,
    "currencyResults": [
      {
        "currency": "BTC",
        "addressCount": 5,
        "generationTime": 75.2
      },
      {
        "currency": "ETH", 
        "addressCount": 1,
        "generationTime": 45.3
      }
    ],
    "compressionUsed": true,
    "responseSize": 2048
  },
  "warnings": []
}
```

#### Error Response

```json
{
  "success": false,
  "error": "Multi-currency generation failed",
  "errors": [
    {
      "currency": "ETH",
      "error": "Generation timeout exceeded",
      "code": "CURRENCY_TIMEOUT",
      "details": "ETH generation exceeded 5000ms timeout"
    }
  ],
  "metadata": {
    "supportedCurrencies": ["BTC"],
    "totalAddressCount": 5,
    "generationTime": 5000,
    "currencyErrors": [
      {
        "currency": "ETH",
        "error": "Generation timeout exceeded", 
        "code": "CURRENCY_TIMEOUT"
      }
    ]
  }
}
```

### 2. Generate Random Page with Multi-Currency Support

**Endpoint:** `POST /api/generate-random-page`

Generate a random page number and optionally full page data with multi-currency addresses.

#### Request Body

```json
{
  "keysPerPage": 45,
  "currencies": ["BTC", "ETH", "LTC"],
  "generateFullPage": true,
  "multiCurrency": false
}
```

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `keysPerPage` | number | No | 45 | Number of keys to generate (1-10000) |
| `currencies` | array | No | ["BTC"] | Array of currency symbols to generate |
| `generateFullPage` | boolean | No | false | Generate full page data vs just page number |
| `multiCurrency` | boolean | No | false | Legacy flag - generates all currencies if true |

#### Response (generateFullPage: false)

```json
{
  "randomPage": "742891"
}
```

#### Response (generateFullPage: true)

```json
{
  "randomPage": "742891",
  "pageData": {
    "pageNumber": "742891",
    "keys": [/* Same structure as generate-page */],
    "totalPageBalance": 0,
    "generatedAt": "2025-01-22T10:30:00.000Z",
    "balancesFetched": false,
    "multiCurrency": true,
    "currencies": ["BTC", "ETH", "LTC"],
    "metadata": {
      "supportedCurrencies": ["BTC", "ETH", "LTC"],
      "totalAddressCount": 10,
      "generationTime": 225.7,
      "isRandomGeneration": true,
      "currencyResults": [/* Currency-specific results */]
    }
  }
}
```

### 3. Multi-Currency Balance Checking

**Endpoint:** `POST /api/balances`

Check balances for addresses across multiple cryptocurrencies.

#### Request Body

```json
{
  "addresses": [
    "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    "0x7e5f4552091a69125d5dfcb7b8c2659029395bdf"
  ],
  "currencies": ["BTC", "ETH"],
  "forceRefresh": false,
  "forceLocal": false
}
```

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `addresses` | array | Yes | - | Array of addresses to check (max 1000) |
| `currencies` | array | No | ["BTC"] | Array of currency symbols to check |
| `forceRefresh` | boolean | No | false | Force refresh from external APIs |
| `forceLocal` | boolean | No | true | Force local database only (default for reliability) |

#### Response

```json
{
  "success": true,
  "balances": {
    "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa": {
      "BTC": {
        "balance": "50.00000000",
        "source": "local"
      }
    },
    "0x7e5f4552091a69125d5dfcb7b8c2659029395bdf": {
      "ETH": {
        "balance": "1.234567890123456789",
        "source": "external"
      }
    }
  },
  "metadata": {
    "totalAddresses": 2,
    "currenciesChecked": ["BTC", "ETH"],
    "cacheHits": 1,
    "cacheMisses": 1,
    "externalAPICalls": 1,
    "cacheHitRate": "50.0%",
    "apiCallReduction": "50.0%",
    "timestamp": "2025-01-22T10:30:00.000Z"
  }
}
```

## Error Codes

| Code | Description | Resolution |
|------|-------------|------------|
| `CURRENCY_GENERATION_FAILED` | Address generation failed for specific currency | Check currency support and try again |
| `CURRENCY_TIMEOUT` | Generation exceeded timeout limit | Reduce currencies or increase timeout |
| `INVALID_CURRENCY` | Unsupported currency requested | Use supported currencies only |
| `PARTIAL_GENERATION_SUCCESS` | Some currencies succeeded, others failed | Check individual currency errors |
| `MEMORY_LIMIT_EXCEEDED` | Memory usage exceeded limits | Reduce keysPerPage or currencies |
| `RATE_LIMIT_EXCEEDED` | API rate limit exceeded | Wait and retry |

## Rate Limiting

All endpoints are rate-limited to prevent abuse:

- **Default Rate Limit:** 100 requests per minute per IP
- **Burst Allowance:** 10 requests
- **Reset Window:** 1 minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642857600
```

## Performance Considerations

### Timeouts

- **Total Request Timeout:** 30 seconds
- **Per-Currency Timeout:** 5 seconds
- **Graceful Degradation:** Enabled by default

### Memory Limits

- **Maximum Memory Usage:** 200MB per request
- **Automatic Monitoring:** Memory usage tracked and reported
- **Graceful Handling:** Partial results if memory limit exceeded

### Optimization Tips

1. **Selective Currency Generation:** Only request needed currencies
2. **Batch Sizes:** Use appropriate keysPerPage (recommended: 45-100)
3. **Local Generation:** Use client-side generation for better performance
4. **Caching:** Balance API uses intelligent caching for better performance
5. **Default Local Mode:** UI now defaults to local-only API source for improved reliability

## Address Format Examples

### Bitcoin (BTC)
```json
{
  "p2pkh_compressed": "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2",
  "p2pkh_uncompressed": "1EHNa6Q4Jz2uvNExL497mE43ikXhwF6kZm", 
  "p2wpkh": "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
  "p2sh_p2wpkh": "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy",
  "p2tr": "bc1p0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9hcz7vqzk5jj0"
}
```

### Ethereum (ETH)
```json
{
  "standard": "0x7e5f4552091a69125d5dfcb7b8c2659029395bdf"
}
```

### Bitcoin Cash (BCH)
```json
{
  "p2pkh_compressed": "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2",
  "p2pkh_uncompressed": "1EHNa6Q4Jz2uvNExL497mE43ikXhwF6kZm",
  "cashaddr_compressed": "bitcoincash:qpm2qsznhks23z7629mms6s4cwef74vcwvy22gdx6a",
  "cashaddr_uncompressed": "bitcoincash:qr95sy3j9xwd2ap32xkykttr4cvcu7as4y0qverfuy"
}
```

## Integration Examples

### JavaScript/TypeScript
```typescript
// Generate multi-currency page
const response = await fetch('/api/generate-page', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    pageNumber: '1',
    keysPerPage: 10,
    currencies: ['BTC', 'ETH', 'LTC']
  })
});

const data = await response.json();
console.log(`Generated ${data.metadata.totalAddressCount} addresses`);
```

### PowerShell
```powershell
# Generate random multi-currency page
$body = @{
  currencies = @("BTC", "ETH") 
  generateFullPage = $true
  keysPerPage = 5
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3002/api/generate-random-page" `
  -Method POST -ContentType "application/json" -Body $body

Write-Host "Random page: $($response.randomPage)"
```

### cURL
```bash
# Check multi-currency balances
curl -X POST http://localhost:3002/api/balances \
  -H "Content-Type: application/json" \
  -d '{
    "addresses": ["1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"],
    "currencies": ["BTC", "BCH", "LTC"]
  }'
```

## Troubleshooting

### Common Issues

1. **Timeout Errors**
   - Reduce the number of currencies requested
   - Decrease keysPerPage value
   - Enable graceful degradation

2. **Memory Limit Exceeded**
   - Reduce keysPerPage (recommended: ≤ 100)
   - Limit currencies to essential ones only
   - Use client-side generation for large requests

3. **Partial Generation Success**
   - Check individual currency errors in response
   - Some currencies may have succeeded - use partial results
   - Retry failed currencies individually

4. **Invalid Currency Errors**
   - Verify currency symbols are supported
   - Use uppercase currency codes (BTC, ETH, etc.)
   - Check the supported currencies list

### API Health Check

Check API status and supported currencies:
```bash
curl http://localhost:3002/api/balances
```

This returns cache metrics and supported currencies without requiring authentication.

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-01-22 | Initial multi-currency API documentation |
| 1.1 | 2025-01-22 | Updated default to local-only mode for improved reliability, disabled failing ZEC external API | 