# 🔑 Bitcoin Keyspace Explorer

A sophisticated web application for exploring the Bitcoin private key space with advanced navigation, balance checking, and real-time scanning capabilities.

![Bitcoin Keyspace Explorer](https://img.shields.io/badge/Bitcoin-Keyspace%20Explorer-orange?style=for-the-badge&logo=bitcoin)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?style=for-the-badge&logo=postgresql)

## ⚠️ Important Disclaimer

**This tool is for educational and research purposes only.** 

- The Bitcoin private key space is astronomically large (2^256 possible keys)
- The probability of finding a key with funds is essentially zero
- This project demonstrates cryptographic concepts and blockchain technology
- **Never use generated private keys for actual Bitcoin storage**
- **Always generate production keys using secure, proven methods**

## 🌟 Features

### 🧭 Advanced Navigation
- **Keyspace Slider**: Visual navigation through the massive Bitcoin keyspace
- **Page Navigation**: Jump to specific pages with BigInt precision
- **Quick Jumps**: Predefined shortcuts (5, 10K, 1M, 10M pages)
- **Random Page Generator**: Cryptographically secure random page selection
- **Random Key Selector**: Pick random keys within current page

### 🔍 Key Generation & Display
- **Dual Mode Generation**: 
  - 🖥️ **Client-side**: Fast local generation using browser crypto
  - 🌐 **Server-side**: API-based generation with load balancing
- **Multiple View Modes**:
  - 📋 **Table View**: Compact, sortable key listing
  - 🎯 **Grid View**: Rich card-based display with detailed information
- **Address Format Support**:
  - P2PKH (Compressed & Uncompressed)
  - P2WPKH (SegWit v0)
  - P2SH-P2WPKH (SegWit wrapped)
  - P2TR (Taproot)

### 💰 Balance Checking
- **Real-time Balance Queries**: Check address balances via local database
- **Visual Fund Indicators**: 
  - 💰 Green highlighting for funded addresses
  - Success chips and color-coded rows
  - Balance breakdown per address type
- **Bulk Balance Processing**: Efficient batch queries (500+ addresses)

### 🔄 Real-time Scanning
- **Continuous Scanning**: Background balance monitoring
- **Session Management**: Start/stop/status tracking
- **Progress Indicators**: Real-time scan statistics
- **Notification System**: Telegram integration for fund discoveries

### 🎨 User Experience
- **Dark/Light Themes**: Automatic theme switching
- **Responsive Design**: Mobile-first approach
- **Multi-language Support**: Internationalization ready
- **Performance Optimized**: Virtualized lists for large datasets
- **Accessibility**: WCAG compliant interface

## 📱 Application Preview
<img width="512" height="4000" alt="image" src="https://github.com/user-attachments/assets/00cbaa9e-41ab-4b07-acc0-1ed3a6947b4e" />


### 🎯 Grid View - Rich Card Display
![Grid View](<img width="1280" height="1160" alt="image" src="https://github.com/user-attachments/assets/00c40cb2-405b-4732-884c-8bb259371acf" />
)

The **Grid View** provides a comprehensive card-based interface featuring:
- **Balance Overview**: Total page balance prominently displayed (2.50000000 BTC shown)
- **Individual Key Cards**: Each card shows complete information for a private key
- **Fund Indicators**: 💰 "FUNDS!" badges and green highlighting for funded addresses
- **Balance Breakdown**: Detailed breakdown by address type (P2PKH, P2WPKH, P2SH, P2TR)
- **Expandable Details**: "View Addresses" button for detailed address information
- **Visual Hierarchy**: Clean, modern card design with clear data organization

### 🔍 Address Details Modal
!(<img width="1280" height="976" alt="image" src="https://github.com/user-attachments/assets/a899def7-f476-4e43-841a-4e7652d3a653" />)

The **Address Details Modal** provides in-depth information:
- **Private Key Display**: Full 64-character hexadecimal private key with copy functionality
- **Address Table**: Comprehensive table showing all Bitcoin address formats
- **Balance Information**: Individual balance for each address type
- **Funded Address Highlighting**: Green background for addresses with funds (P2WPKH: 2.50000000 BTC)
- **Action Buttons**: Copy and external link buttons for each address
- **Clean Interface**: Professional table layout with clear typography

### 📊 Table View - Compact Data Display
![Table View](<img width="1280" height="1160" alt="image" src="https://github.com/user-attachments/assets/6ae67a8f-e37e-4719-ba88-31c7799e19f4" />)

The **Table View** offers efficient data browsing:
- **Expandable Rows**: Click to expand any key for detailed information
- **Balance Summary**: Quick balance overview in the rightmost column
- **Fund Indicators**: "FUNDS" badges for keys with positive balances
- **Detailed Breakdown**: Expanded rows show complete address and balance information
- **Green Highlighting**: Funded addresses prominently displayed with success colors
- **Compact Design**: Maximum information density for power users

### ✨ Key Features Demonstrated

#### 💰 **Balance Detection System**
- **Real-time Checking**: All generated addresses automatically checked for balances
- **Visual Indicators**: Multiple visual cues for funded addresses:
  - 🟢 Green highlighting on funded rows/cards
  - 💰 "FUNDS!" badges and chips
  - 📊 Balance amounts prominently displayed

#### 🔢 **Multiple Address Formats**
- **P2PKH (Compressed)**: Traditional Bitcoin addresses starting with '1'
- **P2PKH (Uncompressed)**: Legacy uncompressed public key addresses
- **P2WPKH**: Native SegWit addresses starting with 'bc1q'
- **P2SH-P2WPKH**: SegWit wrapped in P2SH starting with '3'
- **P2TR**: Taproot addresses starting with 'bc1p'

#### 🎨 **Professional UI/UX**
- **Dark Theme**: Modern dark interface reducing eye strain
- **Responsive Design**: Works seamlessly across different screen sizes
- **Intuitive Navigation**: Clear visual hierarchy and user-friendly controls
- **Performance Optimized**: Smooth interactions even with large datasets

## 🚀 Quick Start

### Prerequisites

Ensure you have the following installed:
- **Node.js** 18+ ([Download](https://nodejs.org/))
- **PostgreSQL** 14+ ([Download](https://postgresql.org/download/))
- **Git** ([Download](https://git-scm.com/))

### 1. Clone Repository

```bash
git clone https://github.com/raphaelbgr/keyspace-explorer-web.git
cd keyspace-explorer-web
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Install web app dependencies
cd apps/web
npm install
```

### 3. Database Setup

#### Create PostgreSQL Database

```bash
# Connect to PostgreSQL as superuser
psql -U postgres

# Create database and user
CREATE DATABASE bitcoin_keyspace;
CREATE USER keyspace_user WITH PASSWORD 'choose_your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE bitcoin_keyspace TO keyspace_user;
\q
```

#### Initialize Database Schema

```bash
# Run database setup script
psql -U keyspace_user -d bitcoin_keyspace -f apps/web/database-setup.sql
```

### 4. Environment Configuration

Create environment file:

```bash
cd apps/web
cp .env.example .env.local
```

Configure your `.env.local`:

```env
# Database Configuration
DATABASE_URL="postgresql://keyspace_user:your_chosen_password@localhost:5432/bitcoin_keyspace"

# API Configuration
NEXT_PUBLIC_API_BASE_URL="http://localhost:3000"

# Optional: Telegram Bot (for notifications)
TELEGRAM_BOT_TOKEN="your_bot_token"
TELEGRAM_CHAT_ID="your_chat_id"

# Optional: External Balance API
BALANCE_API_URL="https://your-balance-api.com"
BALANCE_API_KEY="your_api_key"
```

### 5. Start Development Server

```bash
# From the web app directory
npm run dev
```

🎉 **Your application is now running at [http://localhost:3000](http://localhost:3000)**

## 🗄️ Database Structure

### Core Tables

The application uses several PostgreSQL tables for different purposes:

#### 1. `balance_cache` - Balance Query Cache
Stores cached balance results to improve performance:

```sql
CREATE TABLE balance_cache (
    address VARCHAR(64) PRIMARY KEY,     -- Bitcoin address
    balance DECIMAL(16,8) NOT NULL,      -- Balance in BTC (8 decimal places)
    cached_at TIMESTAMP WITH TIME ZONE,  -- When cached
    source VARCHAR(20) NOT NULL          -- Source: 'blockstream' or 'local'
);
```

#### 2. `wallets_btc` - Development Test Data
**⚠️ For Development/Testing Only** - Contains sample addresses with fake balances:

```sql
CREATE TABLE wallets_btc (
    address VARCHAR(64) PRIMARY KEY,        -- Bitcoin address
    balance BIGINT NOT NULL DEFAULT 0,      -- Balance in SATOSHIS (not BTC)
    last_updated TIMESTAMP WITH TIME ZONE   -- Last update timestamp
);
```

**Important Notes about `wallets_btc`:**
- **Development Only**: This table contains fake test data for development
- **Balance Unit**: Stored in satoshis (1 BTC = 100,000,000 satoshis)
- **Not Production Data**: These balances are not real Bitcoin balances
- **Sample Data**: Includes test addresses with simulated balances for demo purposes

**Example Test Data:**
```sql
-- Sample test entries (fake balances for development)
INSERT INTO wallets_btc (address, balance) VALUES
('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', 1500000000), -- 15 BTC in satoshis
('1PVKVy52dSyqULe5tPpbwA3tYWGYEhhQGw', 250000000);           -- 2.5 BTC in satoshis
```

#### 3. `scan_sessions` - Scanning Session Tracking
Tracks background scanning operations:

```sql
CREATE TABLE scan_sessions (
    session_id UUID PRIMARY KEY,
    mode VARCHAR(20) NOT NULL,            -- 'random', 'next', 'previous'
    start_page NUMERIC(78,0) NOT NULL,    -- BigInt support for huge numbers
    current_page NUMERIC(78,0) NOT NULL,
    pages_scanned INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    found_funds BOOLEAN DEFAULT false,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE
);
```

### Balance Checking Logic

The application uses a two-tier balance checking system:

1. **Local Development**: Queries `wallets_btc` for testing
2. **Production Ready**: Can integrate with external APIs (Blockstream, Blockchain.info)
3. **Caching**: Results stored in `balance_cache` to reduce API calls

### Data Flow Example

```
Generated Address → Check wallets_btc → Cache in balance_cache → Display in UI
                 ↘ (if not found) → External API → Cache → Display
```

## 📖 Usage Guide

### Basic Navigation

1. **Page Navigation**: Use the navigation card to move between keyspace pages
   - First/Previous/Next/Last buttons for sequential navigation
   - Current page display with total page count

2. **Advanced Navigation**: Expand the advanced navigation accordion
   - **Jump to Page**: Enter specific page numbers (supports very large numbers)
   - **Jump Pages**: Skip forward/backward by specified amounts
   - **Quick Jumps**: Use predefined shortcuts (5, 10K, 1M, etc.)
   - **Keys Per Page**: Adjust how many keys to display (10-10,000)

### Random Generation

3. **Random Page Generator**:
   - Toggle between Local/Server generation modes
   - Click "🎲 Random page" to jump to a random location
   - Use "Random key" mode to select random keys within current page

### Key Exploration

4. **View Modes**:
   - **Grid View**: Rich cards showing all address formats and balances
   - **Table View**: Compact table with expandable rows for details

5. **Key Details**:
   - Click any key to expand and see all address formats
   - View balance information for each address type
   - Copy addresses and private keys with one click

### Balance Checking

6. **Balance Monitoring**:
   - All displayed keys automatically check for balances
   - Funded addresses show 💰 indicators and green highlighting
   - Balance amounts displayed in BTC with 8 decimal precision

### Scanning Features

7. **Real-time Scanner**:
   - Configure scanning parameters in the Scanner card
   - Start background scanning for continuous monitoring
   - Receive notifications when funds are discovered

## 🏗️ Project Structure

```
keyspace-explorer-web/
├── apps/web/                    # Main Next.js application
│   ├── src/
│   │   ├── app/                 # App router pages and components
│   │   │   ├── api/             # API routes
│   │   │   ├── components/      # React components
│   │   │   ├── hooks/           # Custom React hooks
│   │   │   ├── store/           # State management
│   │   │   └── utils/           # Utility functions
│   │   └── lib/                 # Shared libraries and services
│   ├── database-setup.sql       # Database initialization
│   └── public/                  # Static assets
├── packages/                    # Shared packages
└── docs/                        # Documentation
```

### Key Components

- **`page.tsx`**: Main dashboard orchestrating all features
- **`AdvancedNavigation.tsx`**: Complex navigation controls
- **`UltraOptimizedDashboard.tsx`**: High-performance key display
- **`RandomKeyCard.tsx`**: Random generation interface
- **`ScannerCard.tsx`**: Real-time scanning controls
- **`BalanceStatus.tsx`**: Balance monitoring display

### Services

- **`KeyGenerationService.ts`**: Core key generation logic
- **`ClientKeyGenerationService.ts`**: Browser-based generation
- **`BalanceService.ts`**: Balance checking and caching
- **`TelegramService.ts`**: Notification handling
- **`ScanningEngine.ts`**: Background scanning logic

## 🔧 Configuration

### Performance Tuning

```env
# Adjust batch sizes for balance checking
BALANCE_BATCH_SIZE=500

# Configure database connection pool
DATABASE_POOL_SIZE=20

# Set scanning intervals (milliseconds)
SCAN_INTERVAL=1000
```

### Security Settings

```env
# Rate limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60000

# API timeouts
API_TIMEOUT=30000
```

## 🛠️ Development

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint
npm run type-check      # TypeScript checking

# Database
npm run db:setup        # Initialize database
npm run db:migrate      # Run migrations
npm run db:seed         # Seed test data
```

### Adding Features

1. **New Components**: Place in `src/app/components/`
2. **API Routes**: Add to `src/app/api/`
3. **Services**: Extend existing services in `src/lib/services/`
4. **Database Changes**: Update `database-setup.sql`

## 📊 API Endpoints

### Key Generation
- `POST /api/generate-page` - Generate keys for specific page
- `POST /api/generate-random-page` - Generate random page

### Balance Checking
- `POST /api/balances` - Check balances for address list

### Scanning
- `POST /api/scan/start` - Start scanning session
- `POST /api/scan/stop` - Stop scanning session
- `GET /api/scan/status` - Get scanning status

### Notifications
- `POST /api/notify-match` - Send fund discovery notification
- `POST /api/test-notification` - Test notification system

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write comprehensive tests for new features
- Update documentation for API changes
- Ensure responsive design compatibility
- Test with large number precision (BigInt)

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Bitcoin Core** - For the cryptographic foundations
- **bitcoinjs-lib** - Bitcoin JavaScript library
- **Next.js Team** - React framework
- **Material-UI** - Component library
- **PostgreSQL** - Database system

## 📞 Support

- 📧 **Email**: support@bitcoin-keyspace-explorer.com
- 🐛 **Issues**: [GitHub Issues](https://github.com/raphaelbgr/keyspace-explorer-web/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/raphaelbgr/keyspace-explorer-web/discussions)

---

**⚡ Happy Exploring! Remember: This is for education only. The universe is vast, and so is the Bitcoin keyspace.** 
