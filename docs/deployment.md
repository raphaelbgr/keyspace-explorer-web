# Bitcoin Keyspace Explorer - Deployment Guide

## Visão Geral

Este guia cobre o deployment completo do Bitcoin Keyspace Explorer, desde o ambiente de desenvolvimento até produção. O projeto é hospedado localmente na máquina Windows 11 (IP: 192.168.7.101) com PostgreSQL local e integrações com APIs externas.

## Pré-requisitos

### Software Necessário

```bash
# Verificar versões mínimas
node --version    # Node.js 18+ required
npm --version     # npm 9+ required
git --version     # Git for version control

# Opcional mas recomendado
docker --version  # Para PostgreSQL local
```

### Contas Necessárias

- **PostgreSQL Local:** Para banco de dados (já configurado em 192.168.7.101:5432)
- **Telegram:** Para notificações (opcional)
- **GitHub:** Para version control
- **DNS/Redirecionador:** Para exposição pública (configuração futura)

## Ambiente de Desenvolvimento

### 1. Setup Inicial

```bash
# Clone o repositório
git clone https://github.com/your-org/bitcoin-keyspace-explorer.git
cd bitcoin-keyspace-explorer

# Instalar dependências
npm install

# Copiar template de ambiente
cp .env.example .env.local
```

### 2. Configuração de Ambiente

Crie o arquivo `.env.local` na raiz do projeto:

```bash
# Frontend (.env.local)
NEXT_PUBLIC_API_BASE_URL=http://192.168.7.101:3000/api
NEXT_PUBLIC_ENVIRONMENT=development
NEXT_PUBLIC_ANALYTICS_ENABLED=false

# Backend/API (.env)
DATABASE_URL=postgresql://postgres:tjq5uxt3@192.168.7.101:5432/cryptodb
REDIS_URL=redis://192.168.7.101:6379
TELEGRAM_TOKEN=7688830724:AAHnBdSNgwnjNKyq62f_ZjlhQiNFHzm0SIU
TELEGRAM_CHAT_ID=27196478

# Shared
NODE_ENV=development
LOG_LEVEL=debug
RATE_LIMIT_ENABLED=true
```

### 3. Banco de Dados Local (Opcional)

```bash
# Usando Docker
docker run --name postgres-local \
  -e POSTGRES_PASSWORD=tjq5uxt3 \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_DB=cryptodb \
  -p 5432:5432 \
  -d postgres:15

# Verificar se está rodando
docker ps

# Conectar ao banco
docker exec -it postgres-local psql -U postgres -d cryptodb
```

### 4. Redis Local (Opcional)

```bash
# Usando Docker
docker run --name redis-local \
  -p 6379:6379 \
  -d redis:7-alpine

# Verificar se está rodando
docker ps
```

### 5. Comandos de Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Apenas frontend
npm run dev:web

# Apenas API
npm run dev:api

# Executar testes
npm run test          # Todos os testes
npm run test:unit     # Apenas testes unitários
npm run test:e2e      # Testes end-to-end
npm run test:watch    # Modo watch

# Linting e formatação
npm run lint          # Verificar linting
npm run lint:fix      # Corrigir problemas de linting
npm run format        # Formatar código com Prettier

# Build para produção
npm run build         # Build de todos os pacotes
npm run build:web     # Build apenas do web app
```

## Deployment Local em Produção

### 1. Configuração do Servidor Local

#### Setup Inicial

```bash
# Configurar servidor local
# O projeto já está configurado para rodar em 192.168.7.101:3000

# Verificar se o PostgreSQL está rodando
netstat -an | findstr :5432

# Verificar se a porta 3000 está disponível
netstat -an | findstr :3000
```

#### Configuração do Projeto

O projeto já está configurado para rodar localmente. Para produção, ajuste o `next.config.ts`:

```typescript
const nextConfig = {
  // Configuração para servidor local
  hostname: '192.168.7.101',
  port: 3000,
  
  // Desabilitar Turbopack no Windows
  experimental: {
    turbo: false
  },
  
  // Headers de segurança
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          }
        ]
      }
    ];
  }
};
```

### 2. Configuração do PostgreSQL Local

#### Verificar PostgreSQL

O PostgreSQL já está configurado em `192.168.7.101:5432`. Verifique se está rodando:

```bash
# Verificar se o serviço está ativo
sc query postgresql

# Conectar ao banco
psql -h 192.168.7.101 -U postgres -d cryptodb
```

#### Configurar Banco de Dados

Execute os seguintes scripts SQL no PostgreSQL local:

```sql
-- Tabela de cache de saldos
CREATE TABLE IF NOT EXISTS balance_cache (
  address VARCHAR(255) PRIMARY KEY,
  balance DECIMAL(20,8) NOT NULL,
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  source VARCHAR(50) NOT NULL
);

-- Tabela de sessões de varredura
CREATE TABLE IF NOT EXISTS scan_sessions (
  session_id VARCHAR(255) PRIMARY KEY,
  mode VARCHAR(50) NOT NULL,
  start_page VARCHAR(100) NOT NULL,
  current_page VARCHAR(100) NOT NULL,
  pages_scanned INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  found_funds BOOLEAN DEFAULT false,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_balance_cache_cached_at ON balance_cache(cached_at);
CREATE INDEX IF NOT EXISTS idx_scan_sessions_is_active ON scan_sessions(is_active);
```

### 3. Variáveis de Ambiente em Produção

Configure as seguintes variáveis no arquivo `.env.local`:

```bash
# Database (PostgreSQL local)
DATABASE_URL=postgresql://postgres:tjq5uxt3@192.168.7.101:5432/cryptodb

# Redis (opcional)
REDIS_URL=redis://192.168.7.101:6379

# Telegram (opcional)
TELEGRAM_TOKEN=7688830724:AAHnBdSNgwnjNKyq62f_ZjlhQiNFHzm0SIU
TELEGRAM_CHAT_ID=27196478

# App
NODE_ENV=production
LOG_LEVEL=info
RATE_LIMIT_ENABLED=true

# API Base URL
NEXT_PUBLIC_API_BASE_URL=http://192.168.7.101:3000/api
```

### 4. Deploy Local

#### Script de Deploy

Crie um script `deploy.bat` para Windows:

```batch
@echo off
echo Iniciando deploy local...

REM Parar servidor se estiver rodando
taskkill /f /im node.exe 2>nul

REM Instalar dependências
npm install

REM Executar testes
npm run test

REM Build para produção
npm run build

REM Iniciar servidor
echo Iniciando servidor em http://192.168.7.101:3000
npm start

pause
```

#### Deploy Manual

```bash
# Build para produção
npm run build

# Iniciar servidor
npm start

# Ou para desenvolvimento
npm run dev
```

### 5. Configuração de Rede

#### Firewall Windows

Configure o firewall para permitir conexões na porta 3000:

```bash
# Permitir porta 3000 no firewall
netsh advfirewall firewall add rule name="Bitcoin Explorer" dir=in action=allow protocol=TCP localport=3000

# Verificar regras
netsh advfirewall firewall show rule name="Bitcoin Explorer"
```

#### Acesso Externo

Para permitir acesso de outras máquinas na rede:

```bash
# Verificar IP da máquina
ipconfig

# Testar conectividade
ping 192.168.7.101
```

#### Configuração Futura - DNS Público

Quando quiser expor publicamente:

1. Configure um redirecionador de porta (ex: ngrok, port forwarding)
2. Configure DNS público apontando para o redirecionador
3. Atualize as URLs na documentação

## Monitoramento e Logs

### 1. Monitoramento Local

Configure monitoramento básico para o servidor local:

- **Logs:** Arquivos de log em `logs/`
- **Performance:** Monitoramento via Task Manager
- **Erros:** Logs de erro estruturados

### 2. Logs Estruturados

```typescript
// Exemplo de logging estruturado
console.log(JSON.stringify({
  level: 'info',
  message: 'Scan session started',
  sessionId: 'scan_123',
  mode: 'random',
  timestamp: new Date().toISOString()
}));
```

### 3. Health Checks

A API inclui endpoint de health check:

```bash
curl http://192.168.7.101:3000/api/health
```

## Troubleshooting

### Problemas Comuns

#### 1. Erro de Turbopack no Windows

**Sintoma:** Erros de path no Turbopack
```bash
FileSystemPath("").join("../C:\Users\...") leaves the filesystem root
```

**Solução:**
```javascript
// next.config.ts
const nextConfig = {
  experimental: {
    turbo: false // Desabilitar Turbopack
  }
};
```

#### 2. Erro de Validação de Endereços

**Sintoma:** Erros 400 da API Blockstream
```bash
Error fetching balance: Request failed with status code 400
```

**Solução:**
- Implementar validação robusta de endereços
- Filtrar endereços inválidos antes da consulta
- Usar fallback para banco local

#### 3. Rate Limiting

**Sintoma:** Erros 429
```bash
Too many requests from this IP
```

**Solução:**
- Implementar retry com backoff exponencial
- Usar cache Redis para reduzir requests
- Implementar queue system

#### 4. Problemas de Banco de Dados

**Sintoma:** Erros de conexão PostgreSQL
```bash
Connection terminated unexpectedly
```

**Solução:**
- Verificar DATABASE_URL
- Configurar connection pooling
- Implementar retry logic

### Debugging

#### 1. Logs Locais

```bash
# Habilitar logs detalhados
LOG_LEVEL=debug npm run dev

# Ver logs em tempo real
tail -f .next/server.log
```

#### 2. Debug de API

```bash
# Testar endpoint específico
curl -X POST http://localhost:3000/api/generate-page \
  -H "Content-Type: application/json" \
  -d '{"pageNumber": "123"}' \
  -v
```

#### 3. Debug de Banco de Dados

```bash
# Conectar ao PostgreSQL local
psql "postgresql://postgres:tjq5uxt3@192.168.7.101:5432/cryptodb"

# Verificar tabelas
\dt

# Verificar dados
SELECT * FROM balance_cache LIMIT 10;
```

## Performance e Otimização

### 1. Otimizações de Build

```javascript
// next.config.ts
const nextConfig = {
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@mui/material', '@mui/icons-material']
  },
  compress: true,
  poweredByHeader: false
};
```

### 2. Cache Strategy

```typescript
// Implementar cache Redis
const cacheKey = `balance:${address}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);
```

### 3. Bundle Optimization

```bash
# Analisar bundle size
npm run build
npx @next/bundle-analyzer .next/static
```

## Segurança

### 1. Headers de Segurança

```javascript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      }
    ];
  }
};
```

### 2. Rate Limiting

```typescript
// middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';

export const scanningRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // máximo 10 requests
  message: 'Too many scan requests'
});
```

### 3. Input Validation

```typescript
// Validar entrada de usuário
import { z } from 'zod';

const pageNumberSchema = z.object({
  pageNumber: z.string().regex(/^\d+$/)
});
```

## Backup e Recuperação

### 1. Backup do Banco de Dados

```bash
# Backup manual do PostgreSQL local
pg_dump "postgresql://postgres:tjq5uxt3@192.168.7.101:5432/cryptodb" > backup.sql

# Restaurar backup
psql "postgresql://postgres:tjq5uxt3@192.168.7.101:5432/cryptodb" < backup.sql
```

### 2. Backup de Configuração

```bash
# Backup das variáveis de ambiente
cp .env.local .env.local.backup

# Backup de configuração
cp next.config.ts next.config.ts.backup
```

## Rollback Strategy

### 1. Rollback Local

```bash
# Parar servidor atual
taskkill /f /im node.exe

# Restaurar configuração anterior
cp next.config.ts.backup next.config.ts
cp .env.local.backup .env.local

# Reiniciar servidor
npm start
```

### 2. Rollback de Banco de Dados

```sql
-- Restaurar dados de backup
TRUNCATE balance_cache;
\copy balance_cache FROM 'backup.csv' CSV HEADER;
```

## Monitoramento Contínuo

### 1. Métricas Importantes

- **Uptime:** > 99.9%
- **Response Time:** < 2s para geração, < 5s para consultas
- **Error Rate:** < 1%
- **API Success Rate:** > 95%

### 2. Alertas

Configure alertas para:
- Uptime < 99%
- Response time > 5s
- Error rate > 5%
- API failures > 10%

### 3. Logs Centralizados

Considere usar:
- **Sentry:** Para error tracking
- **LogRocket:** Para session replay
- **Vercel Analytics:** Para performance

---

**Última Atualização:** 2025-01-16
**Versão do Guia:** 1.0.0 