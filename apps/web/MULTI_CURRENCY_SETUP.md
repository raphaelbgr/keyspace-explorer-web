# 🌍 Multi-Currency Setup Guide
**Bitcoin Keyspace Explorer - Enhanced for 8 Cryptocurrencies**

## 🎯 Overview

The Bitcoin Keyspace Explorer has been successfully enhanced to support **8 cryptocurrencies**:
- **Bitcoin (BTC)** - 5 address types
- **Bitcoin Cash (BCH)** - 4 address types  
- **Dash (DASH)** - 2 address types
- **Dogecoin (DOGE)** - 2 address types
- **Ethereum (ETH)** - 1 address type
- **Litecoin (LTC)** - 4 address types
- **Ripple (XRP)** - 1 address type
- **Zcash (ZEC)** - 2 address types

**Total: 21 different cryptocurrency addresses generated from each private key!**

## ✅ Implementation Status

### Completed Features
- [x] **Real Crypto Address Generation** - Using bitcoinjs-lib and proper cryptographic libraries
- [x] **Multi-Currency Balance Service** - Smart caching with external API fallbacks
- [x] **Enhanced UI Components** - Beautiful currency-specific displays with icons
- [x] **Database Schema** - Complete tables for all cryptocurrencies
- [x] **Type System** - Full TypeScript support for all currencies
- [x] **Error Handling** - Robust error handling and graceful fallbacks

### Ready to Use
- [x] Multi-currency address generation API
- [x] Enhanced key card components with currency accordions
- [x] Balance checking for all cryptocurrencies
- [x] Smart caching system with TTL
- [x] Performance optimizations

## 🚀 Quick Setup

### 1. Database Setup
Run the multi-currency database setup:

```bash
# If you have PostgreSQL installed locally
psql -U postgres -d bitcoin_explorer -f database-multi-currency-setup.sql

# Or using Docker
docker exec -i your_postgres_container psql -U postgres -d bitcoin_explorer < database-multi-currency-setup.sql
```

### 2. Test Multi-Currency Generation
Test the API with multi-currency flag:

```bash
# PowerShell (Windows)
$body = @{ pageNumber = "1"; keysPerPage = 1; multiCurrency = $true } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/generate-page" -Method POST -ContentType "application/json" -Body $body

# Bash (Linux/Mac)  
curl -X POST http://localhost:3000/api/generate-page \
  -H "Content-Type: application/json" \
  -d '{"pageNumber":"1","keysPerPage":1,"multiCurrency":true}'
```

### 3. Run the Application
```bash
npm run dev
```

## 🎨 UI Components

### EnhancedKeyCard Component
New component specifically designed for multi-currency display:

- **Currency Icons**: Visual indicators for each cryptocurrency
- **Expandable Accordions**: Organized display of address types
- **Fund Indicators**: Green highlighting for funded addresses
- **Address Count**: Shows total addresses generated (21 per key)
- **Copy & Explorer Links**: Easy access to blockchain explorers

### Integration Options
1. **Full Multi-Currency Mode**: Use `EnhancedKeyCard` with `multiCurrency={true}`
2. **Backward Compatibility**: Existing components still work with Bitcoin-only data
3. **Gradual Migration**: Can enable multi-currency selectively

## 🏗️ Architecture

### Address Generation Flow
```
Private Key → MultiCurrencyKeyGenerationService → {
  BTC: { p2pkh_compressed, p2pkh_uncompressed, p2wpkh, p2sh_p2wpkh, p2tr },
  BCH: { p2pkh_compressed, p2pkh_uncompressed, cashaddr_compressed, cashaddr_uncompressed },
  DASH: { p2pkh_compressed, p2pkh_uncompressed },
  DOGE: { p2pkh_compressed, p2pkh_uncompressed },
  ETH: { standard },
  LTC: { p2pkh_compressed, p2pkh_uncompressed, p2wpkh, p2sh_p2wpkh },
  XRP: { standard },
  ZEC: { p2pkh_compressed, p2pkh_uncompressed }
}
```

### Balance Checking Flow
```
Addresses → MultiCurrencyBalanceService → {
  Local Database Check → External API Fallback → Smart Caching
}
```

### Database Schema
- **7 Wallet Tables**: `wallets_bch`, `wallets_dash`, `wallets_doge`, `wallets_eth`, `wallets_ltc`, `wallets_xrp`, `wallets_zec`
- **Enhanced Cache**: `balance_cache` with multi-currency support
- **Performance Indexes**: Optimized queries for funded addresses

## 🔧 Configuration

### Currency Settings
Each cryptocurrency has configurable settings in `multi-currency.ts`:
- **Batch Sizes**: Different API batch limits per currency
- **Cache TTL**: Custom cache timeouts
- **Icons & Colors**: Visual customization
- **Address Formats**: Supported address types

### API Providers
Configure external APIs for balance checking:
- **Bitcoin**: Blockchair API
- **Ethereum**: Etherscan API  
- **Others**: Various blockchain APIs with fallbacks

## 🧪 Testing

### API Testing
```bash
# Test Bitcoin addresses (legacy)
curl -X POST http://localhost:3000/api/generate-page \
  -H "Content-Type: application/json" \
  -d '{"pageNumber":"1","keysPerPage":1,"multiCurrency":false}'

# Test multi-currency addresses  
curl -X POST http://localhost:3000/api/generate-page \
  -H "Content-Type: application/json" \
  -d '{"pageNumber":"1","keysPerPage":1,"multiCurrency":true}'

# Test balance checking
curl -X POST http://localhost:3000/api/balances \
  -H "Content-Type: application/json" \
  -d '{"addresses":["1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"],"currencies":["BTC"]}'
```

### Component Testing
The `EnhancedKeyCard` component supports both modes:
- **Legacy Mode**: `multiCurrency={false}` - Shows Bitcoin addresses only
- **Multi-Currency Mode**: `multiCurrency={true}` - Shows all 8 cryptocurrencies

## 🚀 Performance Features

### Parallel Generation
All cryptocurrency addresses are generated in parallel for maximum performance.

### Smart Caching
- **Local Database Priority**: Check wallet tables first
- **External API Fallback**: Only query APIs when needed
- **TTL Management**: Automatic cache expiration
- **Batch Processing**: Optimized API calls

### UI Optimizations
- **Lazy Loading**: Addresses load on demand
- **Virtual Scrolling**: Handles large key sets
- **Responsive Design**: Works on all screen sizes

## 🎯 Next Steps

### Ready for Production
The multi-currency implementation is **production-ready** with:
- ✅ Real cryptographic address generation
- ✅ Robust error handling
- ✅ Performance optimizations
- ✅ Complete type safety
- ✅ Database schema
- ✅ UI components

### Optional Enhancements
- **Additional Cryptocurrencies**: Easy to add new currencies
- **Advanced Filtering**: Filter by funded currencies
- **Export Features**: Export multi-currency data
- **Analytics**: Multi-currency balance statistics

## 📞 Support

If you encounter any issues:
1. Check the console for error messages
2. Verify database setup completed successfully
3. Ensure all dependencies are installed
4. Test with simple API calls first

**Enjoy exploring the multi-cryptocurrency keyspace! 🌟** 