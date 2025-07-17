# Bitcoin Keyspace Explorer Fullstack Architecture Document

## Introduction

This document outlines the complete fullstack architecture for **Bitcoin Keyspace Explorer**, including backend systems, frontend implementation, and their integration. It serves as the single source of truth for AI-driven development, ensuring consistency across the entire technology stack.

This unified approach combines what would traditionally be separate backend and frontend architecture documents, streamlining the development process for modern fullstack applications where these concerns are increasingly intertwined.

### Starter Template or Existing Project

**N/A - Greenfield project**

This is a new educational webapp being built from scratch. No existing starter templates or codebases are being used as a foundation.

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2025-01-16 | 1.0 | Initial architecture document based on PRD requirements | Winston (Architect) |

## High Level Architecture

### Technical Summary

The Bitcoin Keyspace Explorer follows a modern React-based single-page application architecture with a Node.js backend API, deployed on Vercel with Supabase for database operations. The frontend generates Bitcoin keys dynamically using crypto-secure BigInt operations, while the backend handles API integrations with Blockstream and local PostgreSQL databases. The system implements intelligent scanning workflows that automatically continue navigation through the keyspace until funds are detected, with real-time Telegram notifications for discoveries. The architecture prioritizes educational value through clear separation of concerns and comprehensive error handling.

### Platform and Infrastructure Choice

**Platform:** Vercel + Supabase + Local PostgreSQL
**Key Services:** Vercel Edge Functions, Supabase Database, Telegram Bot API, Blockstream API
**Deployment Host and Regions:** Global edge deployment via Vercel CDN

**Rationale:** Vercel provides excellent React deployment with built-in CI/CD, while Supabase offers managed PostgreSQL with real-time capabilities. This combination ensures global performance for educational users while maintaining cost efficiency.

### Repository Structure

**Structure:** Monorepo with separated frontend/backend concerns
**Monorepo Tool:** npm workspaces
**Package Organization:** Frontend app, API functions, shared types package

### High Level Architecture Diagram

```mermaid
graph TB
    U[Users] --> CDN[Vercel CDN]
    CDN --> APP[React SPA]
    APP --> API[Vercel API Routes]
    API --> BLOCK[Blockstream API]
    API --> PG[PostgreSQL Local]
    API --> SUP[Supabase DB]
    API --> TEL[Telegram API]
    
    APP --> CRYPTO[WebCrypto BigInt]
    CRYPTO --> KEYS[Key Generation]
    KEYS --> DERIVE[Address Derivation]
    
    SUP --> CACHE[Balance Cache]
    PG --> LOCAL[Local Testing]
    
    subgraph "External APIs"
        BLOCK
        TEL
    end
    
    subgraph "Data Layer"
        SUP
        PG
        CACHE
    end
```

### Architectural Patterns

- **Jamstack Architecture:** Static site generation with serverless APIs - _Rationale:_ Optimal performance and scalability for educational content delivery
- **Component-Based UI:** Reusable React components with TypeScript - _Rationale:_ Maintainability and type safety for complex scanning interfaces
- **Repository Pattern:** Abstract data access logic - _Rationale:_ Enables testing and switching between Blockstream/local APIs
- **Event-Driven Scanning:** State machine pattern for scan workflows - _Rationale:_ Clear separation of scanning logic and UI state management
- **API Gateway Pattern:** Single entry point for all external API calls - _Rationale:_ Centralized rate limiting and error handling

## Tech Stack

### Technology Stack Table

| Category | Technology | Version | Purpose | Rationale |
|----------|------------|---------|---------|-----------|
| Frontend Language | TypeScript | 5.0+ | Type-safe React development | Strong typing for crypto operations and API contracts |
| Frontend Framework | React | 18+ | UI component library | Excellent ecosystem for educational interfaces |
| UI Component Library | Material-UI (MUI) | 5.0+ | Pre-built accessible components | Rapid development with accessibility built-in |
| State Management | Zustand | 4.0+ | Lightweight state management | Simple state management for scanning workflows |
| Backend Language | TypeScript | 5.0+ | API development | Shared types between frontend/backend |
| Backend Framework | Next.js API Routes | 14+ | Serverless API functions | Seamless integration with Vercel deployment |
| API Style | REST | N/A | HTTP API communication | Simple and well-understood for educational purposes |
| Database | PostgreSQL | 15+ | Relational data storage | ACID compliance for balance cache |
| Cache | Redis | 7.0+ | Balance query caching | Fast lookups for repeated address queries |
| File Storage | Vercel Blob | N/A | Static asset storage | Integrated with deployment platform |
| Authentication | None | N/A | Public educational tool | No user accounts required for educational use |
| Frontend Testing | Jest + RTL | Latest | Component and integration testing | Standard React testing ecosystem |
| Backend Testing | Jest + Supertest | Latest | API endpoint testing | HTTP testing for API routes |
| E2E Testing | Playwright | Latest | Full workflow testing | Cross-browser testing for scanning workflows |
| Build Tool | Vite | 5.0+ | Fast development builds | Optimal developer experience |
| Bundler | Rollup | 4.0+ | Production bundling | Tree-shaking for crypto libraries |
| IaC Tool | Vercel CLI | Latest | Deployment automation | Platform-native infrastructure management |
| CI/CD | GitHub Actions | N/A | Automated testing and deployment | Free tier suitable for open source |
| Monitoring | Vercel Analytics | N/A | Performance monitoring | Built-in platform monitoring |
| Logging | Vercel Logs | N/A | Application logging | Centralized logging with platform |
| CSS Framework | Tailwind CSS | 3.0+ | Utility-first styling | Rapid UI development with consistent design |

## Data Models

### PrivateKey Model

**Purpose:** Represents a single Bitcoin private key with all derived addresses and balances

**Key Attributes:**
- privateKey: string - Hexadecimal private key (64 characters)
- pageNumber: bigint - Page position in keyspace
- index: number - Position within page (0-44)
- addresses: DerivedAddresses - All derived address formats
- balances: AddressBalances - Balance for each address format
- totalBalance: number - Sum of all balances in BTC

#### TypeScript Interface
```typescript
interface PrivateKey {
  privateKey: string;
  pageNumber: bigint;
  index: number;
  addresses: DerivedAddresses;
  balances: AddressBalances;
  totalBalance: number;
}

interface DerivedAddresses {
  p2pkh_compressed: string;
  p2pkh_uncompressed: string;
  p2wpkh: string;
  p2sh_p2wpkh: string;
  p2tr: string;
}

interface AddressBalances {
  p2pkh_compressed: number;
  p2pkh_uncompressed: number;
  p2wpkh: number;
  p2sh_p2wpkh: number;
  p2tr: number;
}
```

#### Relationships
- Part of PageData collection (45 keys per page)
- References BalanceCache for stored balances

### PageData Model

**Purpose:** Container for a complete page of 45 private keys with metadata

**Key Attributes:**
- pageNumber: bigint - Unique page identifier
- keys: PrivateKey[] - Array of 45 private keys
- totalPageBalance: number - Sum of all key balances on page
- generatedAt: Date - Timestamp of page generation
- balancesFetched: boolean - Whether balances have been loaded

#### TypeScript Interface
```typescript
interface PageData {
  pageNumber: bigint;
  keys: PrivateKey[];
  totalPageBalance: number;
  generatedAt: Date;
  balancesFetched: boolean;
}
```

#### Relationships
- Contains 45 PrivateKey objects
- Used by ScanSession for tracking scanning progress

### ScanSession Model

**Purpose:** Tracks an active scanning session across multiple pages

**Key Attributes:**
- sessionId: string - Unique session identifier
- mode: ScanMode - Type of scanning (random, next, previous)
- startPage: bigint - Initial page number
- currentPage: bigint - Current page being processed
- pagesScanned: number - Total pages processed
- isActive: boolean - Whether scan is currently running
- foundFunds: boolean - Whether any funds have been discovered

#### TypeScript Interface
```typescript
type ScanMode = 'random' | 'next' | 'previous';

interface ScanSession {
  sessionId: string;
  mode: ScanMode;
  startPage: bigint;
  currentPage: bigint;
  pagesScanned: number;
  isActive: boolean;
  foundFunds: boolean;
  startedAt: Date;
}
```

#### Relationships
- References current PageData being processed
- Triggers TelegramNotification when funds found

### BalanceCache Model

**Purpose:** Cached balance data to reduce API calls

**Key Attributes:**
- address: string - Bitcoin address
- balance: number - Balance in BTC
- cachedAt: Date - When balance was cached
- source: string - API source (blockstream or local)

#### TypeScript Interface
```typescript
interface BalanceCache {
  address: string;
  balance: number;
  cachedAt: Date;
  source: 'blockstream' | 'local';
}
```

#### Relationships
- Referenced by PrivateKey for balance lookups
- Managed by BalanceService for cache invalidation

## API Specification

### REST API Specification

```yaml
openapi: 3.0.0
info:
  title: Bitcoin Keyspace Explorer API
  version: 1.0.0
  description: RESTful API for Bitcoin keyspace exploration and balance queries
servers:
  - url: https://bitcoin-keyspace-explorer.vercel.app/api
    description: Production API

paths:
  /generate-page:
    post:
      summary: Generate a page of 45 Bitcoin private keys
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                pageNumber:
                  type: string
                  description: BigInt page number as string
              required:
                - pageNumber
      responses:
        200:
          description: Successfully generated page
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/PageData'

  /balances:
    post:
      summary: Fetch balances for multiple addresses
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                addresses:
                  type: array
                  items:
                    type: string
                  maxItems: 225
                source:
                  type: string
                  enum: [blockstream, local]
                  default: blockstream
              required:
                - addresses
      responses:
        200:
          description: Balance data retrieved
          content:
            application/json:
              schema:
                type: object
                properties:
                  balances:
                    type: object
                    additionalProperties:
                      type: number

  /scan:
    post:
      summary: Start automated scanning session
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                mode:
                  type: string
                  enum: [random, next, previous]
                startPage:
                  type: string
                  description: BigInt page number as string
              required:
                - mode
      responses:
        200:
          description: Scan session started
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ScanSession'

  /scan/{sessionId}/stop:
    post:
      summary: Stop active scanning session
      parameters:
        - name: sessionId
          in: path
          required: true
          schema:
            type: string
      responses:
        200:
          description: Scan session stopped

  /notify/telegram:
    post:
      summary: Send Telegram notification
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                pageNumber:
                  type: string
                totalBalance:
                  type: number
                foundKeys:
                  type: array
                  items:
                    $ref: '#/components/schemas/PrivateKey'
              required:
                - pageNumber
                - totalBalance
                - foundKeys
      responses:
        200:
          description: Notification sent successfully

components:
  schemas:
    PrivateKey:
      type: object
      properties:
        privateKey:
          type: string
        pageNumber:
          type: string
        index:
          type: number
        addresses:
          $ref: '#/components/schemas/DerivedAddresses'
        balances:
          $ref: '#/components/schemas/AddressBalances'
        totalBalance:
          type: number

    DerivedAddresses:
      type: object
      properties:
        p2pkh_compressed:
          type: string
        p2pkh_uncompressed:
          type: string
        p2wpkh:
          type: string
        p2sh_p2wpkh:
          type: string
        p2tr:
          type: string

    AddressBalances:
      type: object
      properties:
        p2pkh_compressed:
          type: number
        p2pkh_uncompressed:
          type: number
        p2wpkh:
          type: number
        p2sh_p2wpkh:
          type: number
        p2tr:
          type: number

    PageData:
      type: object
      properties:
        pageNumber:
          type: string
        keys:
          type: array
          items:
            $ref: '#/components/schemas/PrivateKey'
        totalPageBalance:
          type: number
        generatedAt:
          type: string
          format: date-time
        balancesFetched:
          type: boolean

    ScanSession:
      type: object
      properties:
        sessionId:
          type: string
        mode:
          type: string
          enum: [random, next, previous]
        startPage:
          type: string
        currentPage:
          type: string
        pagesScanned:
          type: number
        isActive:
          type: boolean
        foundFunds:
          type: boolean
        startedAt:
          type: string
          format: date-time
```

## Components

### KeyGenerationService

**Responsibility:** Generate cryptographically secure Bitcoin private keys and derive all address formats

**Key Interfaces:**
- generatePageKeys(pageNumber: bigint): PrivateKey[]
- deriveAddresses(privateKey: string): DerivedAddresses
- generateSecureRandomPage(): bigint

**Dependencies:** WebCrypto API, bitcoin-js library

**Technology Stack:** Pure TypeScript with crypto-secure random generation, BigInt arithmetic for page calculations

### BalanceService

**Responsibility:** Fetch and cache Bitcoin address balances from multiple sources

**Key Interfaces:**
- fetchBalances(addresses: string[], source: 'blockstream' | 'local'): Promise<AddressBalances>
- getCachedBalance(address: string): BalanceCache | null
- invalidateCache(maxAge: number): void

**Dependencies:** KeyGenerationService, BalanceCache storage

**Technology Stack:** Axios for HTTP requests, Redis for caching, rate limiting middleware

### ScanningEngine

**Responsibility:** Orchestrate automated scanning workflows with intelligent continuation logic

**Key Interfaces:**
- startScan(mode: ScanMode, startPage?: bigint): ScanSession
- processScanIteration(session: ScanSession): Promise<ScanResult>
- stopScan(sessionId: string): void

**Dependencies:** KeyGenerationService, BalanceService, TelegramService

**Technology Stack:** State machine implementation with async/await patterns, WebSocket for real-time updates

### TelegramService

**Responsibility:** Send notifications when funds are discovered during scanning

**Key Interfaces:**
- sendFundDiscoveryNotification(pageData: PageData, foundKeys: PrivateKey[]): Promise<void>
- formatDiscoveryMessage(pageNumber: bigint, totalBalance: number): string

**Dependencies:** ScanningEngine (event listener)

**Technology Stack:** Telegram Bot API integration with retry logic and error handling

### React UI Components

**Responsibility:** Provide educational interface for keyspace exploration and scanning control

**Key Interfaces:**
- KeyspaceExplorer: Main container component
- ScanControls: Random/Next/Previous scanning interface
- KeyTable: Display 45 keys with balances
- BalanceSummary: Total balance display with real-time updates

**Dependencies:** KeyGenerationService, BalanceService, ScanningEngine

**Technology Stack:** React 18 with TypeScript, Material-UI components, Zustand state management

### Component Diagrams

```mermaid
graph TD
    UI[React UI Components] --> ScanEngine[ScanningEngine]
    UI --> KeyGen[KeyGenerationService]
    UI --> BalanceService[BalanceService]
    
    ScanEngine --> KeyGen
    ScanEngine --> BalanceService
    ScanEngine --> Telegram[TelegramService]
    
    BalanceService --> BlockstreamAPI[Blockstream API]
    BalanceService --> LocalAPI[Local PostgreSQL API]
    BalanceService --> Cache[BalanceCache]
    
    KeyGen --> WebCrypto[WebCrypto API]
    KeyGen --> BitcoinJS[bitcoin-js Library]
    
    Telegram --> TelegramAPI[Telegram Bot API]
    
    subgraph "External Services"
        BlockstreamAPI
        TelegramAPI
        LocalAPI
    end
    
    subgraph "Core Services"
        ScanEngine
        KeyGen
        BalanceService
        Telegram
    end
```

## External APIs

### Blockstream API

- **Purpose:** Retrieve real Bitcoin address balances for educational exploration
- **Documentation:** https://github.com/Blockstream/esplora/blob/master/API.md
- **Base URL(s):** https://blockstream.info/api
- **Authentication:** None (public API)
- **Rate Limits:** 1 request per second (self-imposed for educational responsibility)

**Key Endpoints Used:**
- `GET /address/{address}` - Get address balance and transaction data

**Integration Notes:** Batch multiple addresses into single requests where possible, implement exponential backoff for rate limiting

### Telegram Bot API

- **Purpose:** Send real-time notifications when funds are discovered during scanning
- **Documentation:** https://core.telegram.org/bots/api
- **Base URL(s):** https://api.telegram.org/bot{token}
- **Authentication:** Bot token (TELEGRAM_TOKEN environment variable)
- **Rate Limits:** 30 messages per second per bot

**Key Endpoints Used:**
- `POST /sendMessage` - Send text notification with discovery details

**Integration Notes:** Format messages with discovery details, handle rate limiting with queue system

### Local PostgreSQL API

- **Purpose:** Alternative balance source for testing and development without external API dependency
- **Documentation:** Internal API specification
- **Base URL(s):** http://192.168.7.101:5432 (configurable)
- **Authentication:** Username/password (PG_USER, PG_PASSWORD environment variables)
- **Rate Limits:** No external limits (local database)

**Key Endpoints Used:**
- Custom endpoint to query wallets_btc table with multiple addresses

**Integration Notes:** Maintain same response format as Blockstream API for seamless switching

## Core Workflows

### Scanning Workflow

```mermaid
sequenceDiagram
    participant User
    participant UI as React UI
    participant Scanner as ScanningEngine
    participant KeyGen as KeyGenerationService
    participant Balance as BalanceService
    participant Telegram as TelegramService
    
    User->>UI: Click "Scan Random"
    UI->>Scanner: startScan('random')
    Scanner->>KeyGen: generateSecureRandomPage()
    KeyGen-->>Scanner: pageNumber
    
    loop Scanning Loop
        Scanner->>KeyGen: generatePageKeys(pageNumber)
        KeyGen-->>Scanner: 45 PrivateKey objects
        Scanner->>Balance: fetchBalances(addresses)
        Balance-->>Scanner: balances
        Scanner->>Scanner: calculateTotalBalance()
        
        alt Total Balance > 0
            Scanner->>Telegram: sendFundDiscoveryNotification()
            Scanner->>UI: stopScan() + highlightDiscovery()
            break Exit Loop
        else Total Balance = 0
            Scanner->>KeyGen: getNextPage(mode)
            KeyGen-->>Scanner: nextPageNumber
        end
    end
```

### Balance Fetching Workflow

```mermaid
sequenceDiagram
    participant Scanner as ScanningEngine
    participant Balance as BalanceService
    participant Cache as BalanceCache
    participant API as External API
    
    Scanner->>Balance: fetchBalances(addresses, 'blockstream')
    
    loop For Each Address
        Balance->>Cache: getCachedBalance(address)
        alt Cache Hit & Fresh
            Cache-->>Balance: cachedBalance
        else Cache Miss or Stale
            Balance->>API: GET /address/{address}
            API-->>Balance: addressData
            Balance->>Cache: store(address, balance)
        end
    end
    
    Balance-->>Scanner: aggregatedBalances
```

## Database Schema

```sql
-- Balance Cache Table
CREATE TABLE balance_cache (
    address VARCHAR(64) PRIMARY KEY,
    balance DECIMAL(16,8) NOT NULL DEFAULT 0,
    cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    source VARCHAR(20) NOT NULL CHECK (source IN ('blockstream', 'local')),
    CONSTRAINT valid_balance CHECK (balance >= 0)
);

-- Index for cache expiration queries
CREATE INDEX idx_balance_cache_cached_at ON balance_cache(cached_at);
CREATE INDEX idx_balance_cache_source ON balance_cache(source);

-- Local Testing Data Table (for development)
CREATE TABLE wallets_btc (
    address VARCHAR(64) PRIMARY KEY,
    balance BIGINT NOT NULL DEFAULT 0, -- Balance in satoshis
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample test data
INSERT INTO wallets_btc (address, balance) VALUES
('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 0), -- Genesis block
('3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy', 1500000000), -- 15 BTC
('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4', 250000000); -- 2.5 BTC

-- Scan Session Tracking (optional persistence)
CREATE TABLE scan_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mode VARCHAR(20) NOT NULL CHECK (mode IN ('random', 'next', 'previous')),
    start_page NUMERIC(78,0) NOT NULL, -- BigInt support
    current_page NUMERIC(78,0) NOT NULL,
    pages_scanned INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    found_funds BOOLEAN DEFAULT false,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ended_at TIMESTAMP WITH TIME ZONE
);

-- Index for active session queries
CREATE INDEX idx_scan_sessions_active ON scan_sessions(is_active) WHERE is_active = true;
```

## Frontend Architecture

### Component Architecture

#### Component Organization
```
src/
├── components/
│   ├── common/
│   │   ├── LoadingSpinner.tsx
│   │   ├── ErrorBoundary.tsx
│   │   └── CopyButton.tsx
│   ├── keyspace/
│   │   ├── KeyTable.tsx
│   │   ├── KeyRow.tsx
│   │   ├── BalanceSummary.tsx
│   │   └── PageNavigation.tsx
│   ├── scanning/
│   │   ├── ScanControls.tsx
│   │   ├── ScanStatus.tsx
│   │   └── ScanResults.tsx
│   └── layout/
│       ├── Header.tsx
│       ├── Footer.tsx
│       └── Sidebar.tsx
├── hooks/
│   ├── useKeyGeneration.ts
│   ├── useScanning.ts
│   ├── useBalances.ts
│   └── useTelegramNotifications.ts
├── services/
│   ├── api.ts
│   ├── keyGeneration.ts
│   ├── scanning.ts
│   └── telegram.ts
├── stores/
│   ├── scanStore.ts
│   ├── keyStore.ts
│   └── uiStore.ts
├── types/
│   ├── keys.ts
│   ├── scanning.ts
│   └── api.ts
└── utils/
    ├── crypto.ts
    ├── bitcoin.ts
    └── formatting.ts
```

#### Component Template
```typescript
import React from 'react';
import { Card, CardContent, Typography, Box } from '@mui/material';
import { PrivateKey } from '../types/keys';

interface KeyRowProps {
  keyData: PrivateKey;
  isHighlighted?: boolean;
  onCopyKey?: (key: string) => void;
}

export const KeyRow: React.FC<KeyRowProps> = ({ 
  keyData, 
  isHighlighted = false,
  onCopyKey 
}) => {
  const handleCopyClick = () => {
    onCopyKey?.(keyData.privateKey);
  };

  return (
    <Card 
      sx={{ 
        mb: 1, 
        bgcolor: isHighlighted ? 'success.light' : 'background.paper' 
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="body2" component="span" fontFamily="monospace">
            {keyData.privateKey}
          </Typography>
          <Typography variant="h6" color="primary">
            {keyData.totalBalance.toFixed(8)} BTC
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};
```

### State Management Architecture

#### State Structure
```typescript
// stores/scanStore.ts
interface ScanState {
  currentSession: ScanSession | null;
  isScanning: boolean;
  scanMode: ScanMode;
  currentPage: bigint;
  pagesScanned: number;
  foundFunds: boolean;
  error: string | null;
}

interface ScanActions {
  startScan: (mode: ScanMode, startPage?: bigint) => Promise<void>;
  stopScan: () => void;
  updateProgress: (session: ScanSession) => void;
  setError: (error: string) => void;
  clearError: () => void;
}

// stores/keyStore.ts
interface KeyState {
  currentPageData: PageData | null;
  pageHistory: PageData[];
  isGenerating: boolean;
  error: string | null;
}

interface KeyActions {
  generatePage: (pageNumber: bigint) => Promise<void>;
  clearHistory: () => void;
  setCurrentPage: (pageData: PageData) => void;
}
```

#### State Management Patterns
- Zustand stores for each domain (scanning, keys, UI)
- Immutable state updates with proper TypeScript typing
- Async actions with error handling and loading states
- Local storage persistence for scan preferences

### Routing Architecture

#### Route Organization
```
/                           # Main keyspace explorer page
/page/:pageNumber          # Direct page navigation
/scan                      # Active scanning interface
/about                     # Educational content
/help                      # Usage instructions
```

#### Protected Route Pattern
```typescript
// No authentication required - public educational tool
// All routes are accessible without protection

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<KeyspaceExplorer />} />
        <Route path="/page/:pageNumber" element={<DirectPageView />} />
        <Route path="/scan" element={<ScanningInterface />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
};
```

### Frontend Services Layer

#### API Client Setup
```typescript
// services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use((config) => {
  console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    throw error;
  }
);

export default api;
```

#### Service Example
```typescript
// services/keyGeneration.ts
import api from './api';
import { PageData, PrivateKey } from '../types/keys';

export class KeyGenerationService {
  async generatePage(pageNumber: bigint): Promise<PageData> {
    try {
      const response = await api.post<PageData>('/generate-page', {
        pageNumber: pageNumber.toString()
      });
      
      return {
        ...response.data,
        pageNumber: BigInt(response.data.pageNumber)
      };
    } catch (error) {
      throw new Error(`Failed to generate page: ${error}`);
    }
  }

  async fetchBalances(
    addresses: string[], 
    source: 'blockstream' | 'local' = 'blockstream'
  ): Promise<Record<string, number>> {
    try {
      const response = await api.post('/balances', {
        addresses,
        source
      });
      
      return response.data.balances;
    } catch (error) {
      throw new Error(`Failed to fetch balances: ${error}`);
    }
  }
}

export const keyGenerationService = new KeyGenerationService();
```

## Backend Architecture

### Service Architecture

#### Function Organization
```
api/
├── generate-page.ts       # Page generation endpoint
├── balances.ts           # Balance fetching endpoint
├── scan/
│   ├── start.ts          # Start scanning session
│   ├── stop.ts           # Stop scanning session
│   └── status.ts         # Get scanning status
├── telegram/
│   └── notify.ts         # Send Telegram notifications
├── health.ts             # Health check endpoint
└── middleware/
    ├── rateLimit.ts      # Rate limiting middleware
    ├── cors.ts           # CORS configuration
    └── errorHandler.ts   # Global error handling
```

#### Function Template (Vercel Serverless)
```typescript
// api/generate-page.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { KeyGenerationService } from '../services/KeyGenerationService';
import { withRateLimit } from '../middleware/rateLimit';
import { handleApiError } from '../middleware/errorHandler';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { pageNumber } = req.body;
    
    if (!pageNumber) {
      return res.status(400).json({ error: 'Page number is required' });
    }

    const keyService = new KeyGenerationService();
    const pageData = await keyService.generatePage(BigInt(pageNumber));
    
    res.status(200).json(pageData);
  } catch (error) {
    handleApiError(error, res);
  }
}

export default withRateLimit(handler);
```

### Database Architecture

#### Schema Design
```sql
-- Primary balance cache table
CREATE TABLE balance_cache (
    address VARCHAR(64) PRIMARY KEY,
    balance DECIMAL(16,8) NOT NULL DEFAULT 0,
    cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    source VARCHAR(20) NOT NULL CHECK (source IN ('blockstream', 'local')),
    is_stale BOOLEAN GENERATED ALWAYS AS (
        cached_at < NOW() - INTERVAL '1 hour'
    ) STORED
);

-- Optimized indexes
CREATE INDEX CONCURRENTLY idx_balance_cache_stale 
ON balance_cache(is_stale, cached_at) 
WHERE is_stale = false;

CREATE INDEX CONCURRENTLY idx_balance_cache_source_fresh 
ON balance_cache(source, cached_at) 
WHERE cached_at > NOW() - INTERVAL '1 hour';
```

#### Data Access Layer
```typescript
// services/BalanceRepository.ts
import { Pool } from 'pg';
import { BalanceCache } from '../types/balance';

export class BalanceRepository {
  private pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: process.env.PG_HOST,
      user: process.env.PG_USER,
      password: process.env.PG_PASSWORD,
      database: process.env.PG_DATABASE,
      port: parseInt(process.env.PG_PORT || '5432'),
      ssl: process.env.PG_SSL === 'require',
      max: 20,
      idleTimeoutMillis: 30000,
    });
  }

  async getCachedBalance(address: string): Promise<BalanceCache | null> {
    const query = `
      SELECT address, balance, cached_at, source 
      FROM balance_cache 
      WHERE address = $1 AND NOT is_stale
    `;
    
    const result = await this.pool.query(query, [address]);
    return result.rows[0] || null;
  }

  async setCachedBalance(
    address: string, 
    balance: number, 
    source: 'blockstream' | 'local'
  ): Promise<void> {
    const query = `
      INSERT INTO balance_cache (address, balance, source)
      VALUES ($1, $2, $3)
      ON CONFLICT (address) 
      DO UPDATE SET 
        balance = EXCLUDED.balance,
        cached_at = NOW(),
        source = EXCLUDED.source
    `;
    
    await this.pool.query(query, [address, balance, source]);
  }

  async getLocalBalance(address: string): Promise<number> {
    const query = `
      SELECT balance FROM wallets_btc WHERE address = $1
    `;
    
    const result = await this.pool.query(query, [address]);
    const satoshis = result.rows[0]?.balance || 0;
    return satoshis / 100_000_000; // Convert to BTC
  }

  async cleanup(): Promise<void> {
    await this.pool.end();
  }
}
```

### Authentication and Authorization

#### Auth Flow
```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    
    Note over User,API: No authentication required
    Note over User,API: Public educational tool
    
    User->>Frontend: Access application
    Frontend->>API: Make API requests
    API-->>Frontend: Return data
    Frontend-->>User: Display results
    
    Note over API: Rate limiting applied per IP
    Note over API: No user sessions or tokens
```

#### Middleware/Guards
```typescript
// middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';

export const createRateLimit = (windowMs: number, max: number) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Different limits for different endpoints
export const scanningRateLimit = createRateLimit(60 * 1000, 10); // 10 per minute
export const balanceRateLimit = createRateLimit(60 * 1000, 30); // 30 per minute
export const generalRateLimit = createRateLimit(60 * 1000, 100); // 100 per minute

// middleware/errorHandler.ts
export const handleApiError = (error: any, res: NextApiResponse) => {
  console.error('API Error:', error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Invalid request data',
      details: error.message
    });
  }
  
  if (error.code === 'EXTERNAL_API_ERROR') {
    return res.status(503).json({
      error: 'External service unavailable',
      details: 'Please try again later'
    });
  }
  
  return res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
};
```

## Unified Project Structure

```
bitcoin-keyspace-explorer/
├── .github/                      # CI/CD workflows
│   └── workflows/
│       ├── ci.yaml              # Test and build
│       ├── deploy.yaml          # Deploy to Vercel
│       └── security.yaml       # Security scans
├── apps/
│   └── web/                     # React application
│       ├── src/
│       │   ├── components/      # UI components
│       │   │   ├── common/      # Reusable components
│       │   │   ├── keyspace/    # Key display components
│       │   │   ├── scanning/    # Scan control components
│       │   │   └── layout/      # Layout components
│       │   ├── pages/           # Next.js pages
│       │   │   ├── index.tsx    # Main explorer page
│       │   │   ├── scan.tsx     # Scanning interface
│       │   │   └── api/         # API routes
│       │   │       ├── generate-page.ts
│       │   │       ├── balances.ts
│       │   │       ├── scan/
│       │   │       └── telegram/
│       │   ├── hooks/           # Custom React hooks
│       │   │   ├── useKeyGeneration.ts
│       │   │   ├── useScanning.ts
│       │   │   └── useBalances.ts
│       │   ├── services/        # API client services
│       │   │   ├── api.ts       # Base API client
│       │   │   ├── keyGeneration.ts
│       │   │   ├── scanning.ts  # Scanning service
│       │   │   └── telegram.ts  # Notification service
│       │   ├── stores/          # Zustand state stores
│       │   │   ├── scanStore.ts # Scanning state
│       │   │   ├── keyStore.ts  # Key data state
│       │   │   └── uiStore.ts   # UI state
│       │   ├── lib/             # Core business logic
│       │   │   ├── crypto/      # Cryptographic operations
│       │   │   │   ├── keyGeneration.ts
│       │   │   │   ├── addressDerivation.ts
│       │   │   │   └── randomGenerator.ts
│       │   │   ├── bitcoin/     # Bitcoin-specific logic
│       │   │   │   ├── addresses.ts
│       │   │   │   └── validation.ts
│       │   │   └── database/    # Database operations
│       │   │       ├── BalanceRepository.ts
│       │   │       └── connection.ts
│       │   ├── styles/          # Global styles
│       │   │   ├── globals.css
│       │   │   └── theme.ts     # MUI theme
│       │   ├── types/           # TypeScript definitions
│       │   │   ├── keys.ts      # Key-related types
│       │   │   ├── scanning.ts  # Scanning types
│       │   │   ├── balance.ts   # Balance types
│       │   │   └── api.ts       # API response types
│       │   ├── utils/           # Utility functions
│       │   │   ├── formatting.ts # Number/date formatting
│       │   │   ├── validation.ts # Input validation
│       │   │   └── constants.ts  # App constants
│       │   └── middleware/      # API middleware
│       │       ├── rateLimit.ts # Rate limiting
│       │       ├── cors.ts      # CORS configuration
│       │       └── errorHandler.ts # Error handling
│       ├── public/              # Static assets
│       │   ├── favicon.ico
│       │   └── images/
│       ├── tests/               # Frontend tests
│       │   ├── __mocks__/       # Test mocks
│       │   ├── components/      # Component tests
│       │   ├── hooks/           # Hook tests
│       │   ├── services/        # Service tests
│       │   └── integration/     # Integration tests
│       ├── .env.example         # Environment template
│       ├── next.config.js       # Next.js configuration
│       ├── tailwind.config.js   # Tailwind configuration
│       ├── jest.config.js       # Jest configuration
│       └── package.json
├── packages/                    # Shared packages
│   ├── shared/                  # Shared utilities
│   │   ├── src/
│   │   │   ├── types/           # Shared TypeScript types
│   │   │   │   ├── index.ts     # Re-exports
│   │   │   │   ├── bitcoin.ts   # Bitcoin types
│   │   │   │   └── common.ts    # Common types
│   │   │   ├── constants/       # Shared constants
│   │   │   │   ├── bitcoin.ts   # Bitcoin constants
│   │   │   │   └── api.ts       # API constants
│   │   │   └── utils/           # Shared utilities
│   │   │       ├── bigint.ts    # BigInt utilities
│   │   │       ├── crypto.ts    # Crypto utilities
│   │   │       └── validation.ts # Validation utilities
│   │   ├── tests/               # Shared package tests
│   │   └── package.json
│   └── config/                  # Shared configuration
│       ├── eslint/              # ESLint configurations
│       │   ├── base.js
│       │   ├── react.js
│       │   └── node.js
│       ├── typescript/          # TypeScript configurations
│       │   ├── base.json
│       │   ├── react.json
│       │   └── node.json
│       └── jest/                # Jest configurations
│           ├── base.js
│           └── react.js
├── docs/                        # Documentation
│   ├── prd.md                   # Product Requirements
│   ├── architecture.md          # This document
│   ├── api.md                   # API documentation
│   ├── deployment.md            # Deployment guide
│   └── contributing.md          # Contribution guidelines
├── scripts/                     # Build and deployment scripts
│   ├── build.sh                 # Build all packages
│   ├── test.sh                  # Run all tests
│   ├── deploy.sh               # Deploy to production
│   └── setup-local.sh          # Local development setup
├── infrastructure/              # Infrastructure as Code
│   ├── vercel.json             # Vercel configuration
│   └── docker/                 # Docker configurations (if needed)
├── .env.example                # Global environment template
├── .gitignore                  # Git ignore rules
├── package.json                # Root package.json (workspace)
├── turbo.json                  # Turborepo configuration
├── README.md                   # Project documentation
└── LICENSE                     # License file
```

## Development Workflow

### Local Development Setup

#### Prerequisites
```bash
# Required software
node --version    # Node.js 18+ required
npm --version     # npm 9+ required
git --version     # Git for version control

# Optional but recommended
docker --version  # For local PostgreSQL
```

#### Initial Setup
```bash
# Clone repository
git clone https://github.com/your-org/bitcoin-keyspace-explorer.git
cd bitcoin-keyspace-explorer

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Set up local database (optional)
docker run --name postgres-local \
  -e POSTGRES_PASSWORD=tjq5uxt3 \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=cryptodb \
  -p 5432:5432 \
  -d postgres:15

# Run database migrations
npm run db:migrate

# Seed test data
npm run db:seed
```

#### Development Commands
```bash
# Start all services
npm run dev

# Start frontend only
npm run dev:web

# Start API development server
npm run dev:api

# Run tests
npm run test          # All tests
npm run test:unit     # Unit tests only
npm run test:e2e      # E2E tests only
npm run test:watch    # Watch mode

# Linting and formatting
npm run lint          # Check linting
npm run lint:fix      # Fix linting issues
npm run format        # Format code with Prettier

# Build for production
npm run build         # Build all packages
npm run build:web     # Build web app only
```

### Environment Configuration

#### Required Environment Variables
```bash
# Frontend (.env.local)
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api
NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_ANALYTICS_ENABLED=false

# Backend/API (.env)
DATABASE_URL=postgresql://postgres:tjq5uxt3@localhost:5432/cryptodb
REDIS_URL=redis://localhost:6379
TELEGRAM_TOKEN=7688830724:AAHnBdSNgwnjNKyq62f_ZjlhQiNFHzm0SIU
TELEGRAM_CHAT_ID=27196478

# Shared
NODE_ENV=development
LOG_LEVEL=debug
RATE_LIMIT_ENABLED=true
```

## Deployment Architecture

### Deployment Strategy

**Frontend Deployment:**
- **Platform:** Vercel (serverless)
- **Build Command:** npm run build
- **Output Directory:** apps/web/.next
- **CDN/Edge:** Vercel Edge Network with global distribution

**Backend Deployment:**
- **Platform:** Vercel Serverless Functions
- **Build Command:** npm run build:api
- **Deployment Method:** Git-based automatic deployment

### CI/CD Pipeline

```yaml
# .github/workflows/ci.yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_USER: test
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run unit tests
        run: npm run test:unit
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test_db
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Build application
        run: npm run build

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Run security audit
        run: npm audit --audit-level high
      
      - name: Run dependency check
        run: npx audit-ci --moderate

  deploy-staging:
    if: github.ref == 'refs/heads/develop'
    needs: [test, security]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          scope: staging

  deploy-production:
    if: github.ref == 'refs/heads/main'
    needs: [test, security]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
```

### Environments

| Environment | Frontend URL | Backend URL | Purpose |
|-------------|--------------|-------------|---------|
| Development | http://localhost:3000 | http://localhost:3000/api | Local development |
| Staging | https://staging.bitcoin-explorer.app | https://staging.bitcoin-explorer.app/api | Pre-production testing |
| Production | https://bitcoin-keyspace-explorer.app | https://bitcoin-keyspace-explorer.app/api | Live environment |

## Security and Performance

### Security Requirements

**Frontend Security:**
- CSP Headers: `default-src 'self'; script-src 'self' 'unsafe-eval'; connect-src 'self' https://blockstream.info https://api.telegram.org`
- XSS Prevention: Content sanitization, React's built-in protections
- Secure Storage: No sensitive data stored in localStorage/sessionStorage

**Backend Security:**
- Input Validation: Joi/Zod validation for all API inputs
- Rate Limiting: 10 requests per minute for scanning, 30 for balance queries
- CORS Policy: Restricted to production domains

**Authentication Security:**
- Token Storage: N/A (no authentication required)
- Session Management: N/A (stateless application)
- Password Policy: N/A (no user accounts)

### Performance Optimization

**Frontend Performance:**
- Bundle Size Target: < 2MB total bundle size
- Loading Strategy: Code splitting by route, lazy loading of scanning components
- Caching Strategy: Service worker for static assets, React Query for API caching

**Backend Performance:**
- Response Time Target: < 2s for key generation, < 5s for balance queries
- Database Optimization: Proper indexing, connection pooling, query optimization
- Caching Strategy: Redis for balance cache with 1-hour TTL

## Testing Strategy

### Testing Pyramid

```
                E2E Tests
               /        \
          Integration Tests
             /            \
        Frontend Unit  Backend Unit
```

### Test Organization

#### Frontend Tests
```
tests/
├── components/           # Component tests
│   ├── KeyTable.test.tsx
│   ├── ScanControls.test.tsx
│   └── BalanceSummary.test.tsx
├── hooks/               # Custom hook tests
│   ├── useKeyGeneration.test.ts
│   ├── useScanning.test.ts
│   └── useBalances.test.ts
├── services/            # Service layer tests
│   ├── api.test.ts
│   ├── keyGeneration.test.ts
│   └── scanning.test.ts
├── stores/              # State management tests
│   ├── scanStore.test.ts
│   └── keyStore.test.ts
└── utils/               # Utility function tests
    ├── crypto.test.ts
    ├── bitcoin.test.ts
    └── formatting.test.ts
```

#### Backend Tests
```
tests/
├── api/                 # API endpoint tests
│   ├── generate-page.test.ts
│   ├── balances.test.ts
│   └── scan.test.ts
├── services/            # Business logic tests
│   ├── KeyGenerationService.test.ts
│   ├── BalanceService.test.ts
│   └── ScanningEngine.test.ts
├── lib/                 # Core library tests
│   ├── crypto/
│   ├── bitcoin/
│   └── database/
└── middleware/          # Middleware tests
    ├── rateLimit.test.ts
    └── errorHandler.test.ts
```

#### E2E Tests
```
e2e/
├── specs/
│   ├── keyspace-exploration.spec.ts
│   ├── scanning-workflows.spec.ts
│   ├── balance-fetching.spec.ts
│   └── error-handling.spec.ts
├── fixtures/
│   ├── test-keys.json
│   └── mock-balances.json
└── support/
    ├── commands.ts
    └── helpers.ts
```

### Test Examples

#### Frontend Component Test
```typescript
// tests/components/ScanControls.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ScanControls } from '../../src/components/scanning/ScanControls';
import { useScanStore } from '../../src/stores/scanStore';

jest.mock('../../src/stores/scanStore');

describe('ScanControls', () => {
  const mockStartScan = jest.fn();
  const mockStopScan = jest.fn();

  beforeEach(() => {
    (useScanStore as jest.Mock).mockReturnValue({
      isScanning: false,
      startScan: mockStartScan,
      stopScan: mockStopScan,
      error: null,
    });
  });

  it('should start random scan when Random button clicked', async () => {
    render(<ScanControls />);
    
    const randomButton = screen.getByRole('button', { name: /scan random/i });
    fireEvent.click(randomButton);
    
    await waitFor(() => {
      expect(mockStartScan).toHaveBeenCalledWith('random');
    });
  });

  it('should disable controls during scanning', () => {
    (useScanStore as jest.Mock).mockReturnValue({
      isScanning: true,
      startScan: mockStartScan,
      stopScan: mockStopScan,
      error: null,
    });

    render(<ScanControls />);
    
    const randomButton = screen.getByRole('button', { name: /scan random/i });
    expect(randomButton).toBeDisabled();
  });
});
```

#### Backend API Test
```typescript
// tests/api/generate-page.test.ts
import request from 'supertest';
import { createTestApp } from '../helpers/testApp';
import { KeyGenerationService } from '../../src/lib/crypto/keyGeneration';

jest.mock('../../src/lib/crypto/keyGeneration');

describe('/api/generate-page', () => {
  const app = createTestApp();
  const mockKeyService = KeyGenerationService as jest.MockedClass<typeof KeyGenerationService>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate 45 keys for valid page number', async () => {
    const mockPageData = {
      pageNumber: '123456789',
      keys: Array(45).fill(null).map((_, index) => ({
        privateKey: `mock-key-${index}`,
        pageNumber: '123456789',
        index,
        addresses: {
          p2pkh_compressed: `1MockAddress${index}`,
          p2pkh_uncompressed: `1MockAddr${index}`,
          p2wpkh: `bc1qmock${index}`,
          p2sh_p2wpkh: `3MockSH${index}`,
          p2tr: `bc1pmock${index}`,
        },
        balances: {
          p2pkh_compressed: 0,
          p2pkh_uncompressed: 0,
          p2wpkh: 0,
          p2sh_p2wpkh: 0,
          p2tr: 0,
        },
        totalBalance: 0,
      })),
      totalPageBalance: 0,
      generatedAt: new Date(),
      balancesFetched: false,
    };

    mockKeyService.prototype.generatePage.mockResolvedValue(mockPageData);

    const response = await request(app)
      .post('/api/generate-page')
      .send({ pageNumber: '123456789' })
      .expect(200);

    expect(response.body).toEqual(mockPageData);
    expect(response.body.keys).toHaveLength(45);
  });

  it('should return 400 for missing page number', async () => {
    const response = await request(app)
      .post('/api/generate-page')
      .send({})
      .expect(400);

    expect(response.body.error).toBe('Page number is required');
  });

  it('should handle rate limiting', async () => {
    // Make requests up to rate limit
    const promises = Array(11).fill(null).map(() =>
      request(app)
        .post('/api/generate-page')
        .send({ pageNumber: '1' })
    );

    const responses = await Promise.all(promises);
    const rateLimitedResponse = responses[10];
    
    expect(rateLimitedResponse.status).toBe(429);
    expect(rateLimitedResponse.body.error).toContain('Too many requests');
  });
});
```

#### E2E Test
```typescript
// e2e/specs/scanning-workflows.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Scanning Workflows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should complete random scan workflow', async ({ page }) => {
    // Start random scan
    await page.click('[data-testid="scan-random-button"]');
    
    // Verify scanning status
    await expect(page.locator('[data-testid="scan-status"]')).toHaveText('Scanning...');
    
    // Wait for scan to process at least one page
    await page.waitForSelector('[data-testid="pages-scanned"]:not(:empty)');
    
    // Stop scan
    await page.click('[data-testid="stop-scan-button"]');
    
    // Verify stopped status
    await expect(page.locator('[data-testid="scan-status"]')).toHaveText('Stopped');
  });

  test('should display balance summary during scan', async ({ page }) => {
    await page.click('[data-testid="scan-random-button"]');
    
    // Wait for page to load
    await page.waitForSelector('[data-testid="balance-summary"]');
    
    // Verify balance display format
    const balanceText = await page.locator('[data-testid="total-balance"]').textContent();
    expect(balanceText).toMatch(/\d+\.\d{8} BTC/);
  });

  test('should switch between API sources', async ({ page }) => {
    // Switch to local API
    await page.click('[data-testid="api-toggle"]');
    await expect(page.locator('[data-testid="api-status"]')).toHaveText('Local');
    
    // Generate a page
    await page.fill('[data-testid="page-input"]', '1');
    await page.click('[data-testid="navigate-button"]');
    
    // Verify local API is used
    await page.waitForResponse(response => 
      response.url().includes('/api/balances') && 
      response.request().postDataJSON()?.source === 'local'
    );
  });
});
```

## Coding Standards

### Critical Fullstack Rules

- **Type Sharing:** Always define shared types in packages/shared and import from there
- **BigInt Handling:** Use proper BigInt conversion and string serialization for page numbers
- **Error Boundaries:** Wrap scanning components in error boundaries to prevent UI crashes
- **Rate Limiting:** Respect API rate limits with proper queuing and backoff strategies
- **State Immutability:** Never mutate Zustand state directly - use proper state update patterns
- **Key Security:** Never log or persist private keys - generate on-demand only
- **API Consistency:** Maintain consistent error response format across all endpoints
- **Cache Management:** Implement proper TTL and invalidation for balance cache
- **Memory Management:** Clear large objects and arrays when switching pages to prevent leaks

### Naming Conventions

| Element | Frontend | Backend | Example |
|---------|----------|---------|---------|
| Components | PascalCase | - | `ScanControls.tsx` |
| Hooks | camelCase with 'use' | - | `useKeyGeneration.ts` |
| API Routes | - | kebab-case | `/api/generate-page` |
| Database Tables | - | snake_case | `balance_cache` |
| Environment Variables | SCREAMING_SNAKE_CASE | SCREAMING_SNAKE_CASE | `TELEGRAM_TOKEN` |
| TypeScript Interfaces | PascalCase | PascalCase | `PrivateKey`, `ScanSession` |
| Service Classes | PascalCase with 'Service' | PascalCase with 'Service' | `KeyGenerationService` |

## Error Handling Strategy

### Error Flow

```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Service
    participant External
    
    Client->>API: Request
    API->>Service: Process
    Service->>External: Call external API
    External-->>Service: Error response
    Service->>Service: Wrap error with context
    Service-->>API: Throw formatted error
    API->>API: Log error details
    API->>API: Format user-friendly response
    API-->>Client: Standardized error
    Client->>Client: Display error to user
    Client->>Client: Trigger retry logic
```

### Error Response Format

```typescript
interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
    requestId: string;
  };
}

// Example error responses
{
  "error": {
    "code": "INVALID_PAGE_NUMBER",
    "message": "Page number must be a valid BigInt string",
    "details": { "provided": "invalid", "expected": "string representation of BigInt" },
    "timestamp": "2025-01-16T10:30:00Z",
    "requestId": "req_123456789"
  }
}

{
  "error": {
    "code": "EXTERNAL_API_LIMIT",
    "message": "Blockstream API rate limit exceeded",
    "details": { "retryAfter": 60, "source": "blockstream" },
    "timestamp": "2025-01-16T10:30:00Z",
    "requestId": "req_123456790"
  }
}
```

### Frontend Error Handling

```typescript
// hooks/useErrorHandler.ts
import { useCallback } from 'react';
import { useUiStore } from '../stores/uiStore';

export const useErrorHandler = () => {
  const { showNotification } = useUiStore();

  const handleError = useCallback((error: any, context?: string) => {
    console.error(`Error in ${context}:`, error);

    let userMessage = 'An unexpected error occurred';
    let canRetry = false;

    if (error.response?.data?.error) {
      const apiError = error.response.data.error;
      
      switch (apiError.code) {
        case 'EXTERNAL_API_LIMIT':
          userMessage = 'API rate limit reached. Please wait a moment and try again.';
          canRetry = true;
          break;
        case 'INVALID_PAGE_NUMBER':
          userMessage = 'Please enter a valid page number.';
          break;
        case 'NETWORK_ERROR':
          userMessage = 'Network connection error. Please check your internet connection.';
          canRetry = true;
          break;
        default:
          userMessage = apiError.message || userMessage;
      }
    }

    showNotification({
      type: 'error',
      message: userMessage,
      canRetry,
      context
    });

    return { userMessage, canRetry, originalError: error };
  }, [showNotification]);

  return { handleError };
};
```

### Backend Error Handling

```typescript
// middleware/errorHandler.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { v4 as uuidv4 } from 'uuid';

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, any>;

  constructor(
    code: string,
    message: string,
    statusCode: number = 500,
    details?: Record<string, any>
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.name = 'AppError';
  }
}

export const handleApiError = (
  error: any,
  res: NextApiResponse,
  context?: string
) => {
  const requestId = uuidv4();
  const timestamp = new Date().toISOString();

  // Log error for debugging
  console.error(`[${requestId}] Error in ${context}:`, {
    error: error.message,
    stack: error.stack,
    code: error.code,
    statusCode: error.statusCode,
  });

  // Handle known error types
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        timestamp,
        requestId,
      },
    });
  }

  // Handle validation errors
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: { validation: error.details },
        timestamp,
        requestId,
      },
    });
  }

  // Handle external API errors
  if (error.response?.status) {
    const statusCode = error.response.status >= 500 ? 503 : 400;
    return res.status(statusCode).json({
      error: {
        code: 'EXTERNAL_API_ERROR',
        message: 'External service error',
        details: {
          service: error.config?.baseURL,
          status: error.response.status,
        },
        timestamp,
        requestId,
      },
    });
  }

  // Handle database errors
  if (error.code?.startsWith('23')) { // PostgreSQL error codes
    return res.status(500).json({
      error: {
        code: 'DATABASE_ERROR',
        message: 'Database operation failed',
        details: process.env.NODE_ENV === 'development' ? { dbCode: error.code } : undefined,
        timestamp,
        requestId,
      },
    });
  }

  // Default server error
  return res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: process.env.NODE_ENV === 'development' 
        ? error.message 
        : 'Internal server error',
      timestamp,
      requestId,
    },
  });
};

// Usage in API routes
export const withErrorHandler = (handler: Function) => {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    try {
      await handler(req, res);
    } catch (error) {
      handleApiError(error, res, handler.name);
    }
  };
};
```

## Monitoring and Observability

### Monitoring Stack

- **Frontend Monitoring:** Vercel Analytics + Sentry for error tracking
- **Backend Monitoring:** Vercel Functions metrics + custom logging
- **Error Tracking:** Sentry for both frontend and backend error aggregation
- **Performance Monitoring:** Web Vitals tracking, API response time monitoring

### Key Metrics

**Frontend Metrics:**
- Core Web Vitals (LCP, FID, CLS)
- JavaScript errors and crash rates
- API response times from client perspective
- User interaction patterns (page navigation, scan sessions)
- Bundle size and loading performance

**Backend Metrics:**
- Request rate per endpoint
- Error rate by endpoint and error type
- Response time percentiles (P50, P95, P99)
- Database query performance
- External API success rates and latencies
- Rate limiting trigger frequency

**Business Metrics:**
- Daily/monthly active users
- Scan session duration and completion rates
- Page generation volume
- API source usage (Blockstream vs local)
- Educational content engagement

## Checklist Results Report

### Pre-Checklist Document Output

The complete architecture document is now ready. This comprehensive fullstack architecture covers:

✅ **Technical Foundation:** React + TypeScript frontend with Next.js API routes
✅ **Cryptographic Security:** BigInt-based key generation with WebCrypto
✅ **Scalable Infrastructure:** Vercel deployment with global CDN
✅ **Multiple Data Sources:** Blockstream API + local PostgreSQL integration
✅ **Intelligent Scanning:** Automated workflows with Telegram notifications
✅ **Performance Optimization:** Caching, rate limiting, and error handling
✅ **Comprehensive Testing:** Unit, integration, and E2E testing strategies
✅ **Security Measures:** Rate limiting, input validation, secure headers
✅ **Monitoring & Observability:** Error tracking and performance monitoring
✅ **Educational Focus:** Clear separation of concerns for learning purposes

The architecture successfully addresses all PRD requirements while maintaining educational value and technical excellence. Ready for development team handoff.

---

**Architecture Document Complete**
**Status:** Ready for development
**Next Step:** Execute architect checklist for final validation 