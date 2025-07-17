# Bitcoin Keyspace Explorer API Documentation

## Visão Geral

A API do Bitcoin Keyspace Explorer fornece endpoints para geração de chaves privadas Bitcoin, consulta de saldos e controle de varredura automatizada. Todos os endpoints são RESTful e retornam JSON.

**Base URL:** `http://192.168.7.101:3000/api`

**Versão:** 1.0.0

## Autenticação

Esta API é pública e não requer autenticação para uso educacional.

## Rate Limiting

- **Varredura:** 10 requests por minuto
- **Consulta de Saldos:** 30 requests por minuto  
- **Geração de Páginas:** 100 requests por minuto

## Headers Padrão

```http
Content-Type: application/json
Accept: application/json
```

## Endpoints

### 1. Geração de Páginas

#### POST `/api/generate-page`

Gera uma página de 45 chaves privadas Bitcoin para um número de página específico.

**Request Body:**
```json
{
  "pageNumber": "12345678901234567890"
}
```

**Response (200):**
```json
{
  "pageNumber": "12345678901234567890",
  "keys": [
    {
      "privateKey": "5KJvsngHeMpm884wtkJNzQGaCErckhHJBGFsvd3VyK5qMZXj3hS",
      "addresses": {
        "p2pkh": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
        "p2wpkh": "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
        "p2sh": "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy",
        "p2tr": "bc1p0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9hcz7vqzk5jj0"
      },
      "balance": 0
    }
  ],
  "totalPageBalance": 0,
  "generatedAt": "2025-01-16T10:30:00.000Z",
  "balancesFetched": false
}
```

**Códigos de Erro:**
- `400` - Número de página inválido
- `429` - Rate limit excedido
- `500` - Erro interno do servidor

### 2. Consulta de Saldos

#### POST `/api/balances`

Consulta saldos para múltiplos endereços Bitcoin.

**Request Body:**
```json
{
  "addresses": [
    "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4"
  ],
  "source": "blockstream"
}
```

**Parâmetros:**
- `addresses` (array): Lista de endereços Bitcoin (máx. 225)
- `source` (string): "blockstream" ou "local" (opcional, padrão: "blockstream")

**Response (200):**
```json
{
  "balances": {
    "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa": 0.001,
    "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4": 0
  },
  "source": "blockstream",
  "cached": false,
  "timestamp": "2025-01-16T10:30:00.000Z"
}
```

**Códigos de Erro:**
- `400` - Endereços inválidos ou muito muitos endereços
- `429` - Rate limit excedido
- `503` - API externa indisponível
- `500` - Erro interno do servidor

### 3. Controle de Varredura

#### POST `/api/scan/start`

Inicia uma sessão de varredura automatizada.

**Request Body:**
```json
{
  "mode": "random",
  "startPage": "12345678901234567890"
}
```

**Parâmetros:**
- `mode` (string): "random", "next", ou "previous"
- `startPage` (string): Número da página inicial (opcional)

**Response (200):**
```json
{
  "sessionId": "scan_1234567890",
  "mode": "random",
  "startPage": "12345678901234567890",
  "currentPage": "12345678901234567890",
  "pagesScanned": 0,
  "isActive": true,
  "foundFunds": false,
  "startedAt": "2025-01-16T10:30:00.000Z"
}
```

#### POST `/api/scan/{sessionId}/stop`

Para uma sessão de varredura ativa.

**Response (200):**
```json
{
  "sessionId": "scan_1234567890",
  "isActive": false,
  "stoppedAt": "2025-01-16T10:35:00.000Z",
  "pagesScanned": 5,
  "foundFunds": false
}
```

#### GET `/api/scan/{sessionId}/status`

Obtém o status atual de uma sessão de varredura.

**Response (200):**
```json
{
  "sessionId": "scan_1234567890",
  "mode": "random",
  "currentPage": "12345678901234567900",
  "pagesScanned": 5,
  "isActive": true,
  "foundFunds": false,
  "startedAt": "2025-01-16T10:30:00.000Z",
  "lastActivity": "2025-01-16T10:32:00.000Z"
}
```

### 4. Notificações

#### POST `/api/telegram/notify`

Envia notificação via Telegram quando fundos são encontrados.

**Request Body:**
```json
{
  "pageNumber": "12345678901234567890",
  "totalBalance": 0.001,
  "foundKeys": [
    {
      "privateKey": "5KJvsngHeMpm884wtkJNzQGaCErckhHJBGFsvd3VyK5qMZXj3hS",
      "addresses": {
        "p2pkh": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
      },
      "balance": 0.001
    }
  ]
}
```

**Response (200):**
```json
{
  "success": true,
  "messageId": 12345,
  "sentAt": "2025-01-16T10:30:00.000Z"
}
```

### 5. Health Check

#### GET `/api/health`

Verifica o status da API e serviços externos.

**Response (200):**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-16T10:30:00.000Z",
  "services": {
    "blockstream": "up",
    "telegram": "up",
    "database": "up"
  },
  "version": "1.0.0"
}
```

## Códigos de Erro Padrão

### Estrutura de Erro
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Descrição do erro",
    "details": {
      "additional": "informações"
    },
    "timestamp": "2025-01-16T10:30:00.000Z",
    "requestId": "req_1234567890"
  }
}
```

### Códigos de Erro Comuns

| Código | Status | Descrição |
|--------|--------|-----------|
| `VALIDATION_ERROR` | 400 | Dados de entrada inválidos |
| `RATE_LIMIT_EXCEEDED` | 429 | Rate limit excedido |
| `EXTERNAL_API_ERROR` | 503 | API externa indisponível |
| `DATABASE_ERROR` | 500 | Erro de banco de dados |
| `INTERNAL_SERVER_ERROR` | 500 | Erro interno do servidor |

## Exemplos de Uso

### JavaScript/TypeScript

```typescript
// Exemplo de geração de página
const generatePage = async (pageNumber: string) => {
  const response = await fetch('/api/generate-page', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ pageNumber })
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};

// Exemplo de consulta de saldos
const fetchBalances = async (addresses: string[]) => {
  const response = await fetch('/api/balances', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ 
      addresses,
      source: 'blockstream'
    })
  });
  
  return response.json();
};

// Exemplo de início de varredura
const startScan = async (mode: 'random' | 'next' | 'previous') => {
  const response = await fetch('/api/scan/start', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ mode })
  });
  
  return response.json();
};
```

### cURL

```bash
# Gerar página
curl -X POST http://192.168.7.101:3000/api/generate-page \
  -H "Content-Type: application/json" \
  -d '{"pageNumber": "12345678901234567890"}'

# Consultar saldos
curl -X POST http://192.168.7.101:3000/api/balances \
  -H "Content-Type: application/json" \
  -d '{
    "addresses": ["1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"],
    "source": "blockstream"
  }'

# Iniciar varredura
curl -X POST http://192.168.7.101:3000/api/scan/start \
  -H "Content-Type: application/json" \
  -d '{"mode": "random"}'
```

## Validação de Endereços

A API valida automaticamente todos os endereços Bitcoin antes de consultar saldos:

- **P2PKH (Legacy):** Começa com "1"
- **P2SH (SegWit):** Começa com "3"  
- **P2WPKH (Native SegWit):** Começa com "bc1q"
- **P2TR (Taproot):** Começa com "bc1p"

Endereços inválidos são automaticamente filtrados e retornam saldo 0.

## Cache

A API implementa cache Redis para consultas de saldo:

- **TTL:** 1 hora
- **Chave:** `balance:{address}`
- **Fallback:** Consulta direta à API externa

## Monitoramento

A API inclui monitoramento automático:

- **Métricas:** Request rate, response time, error rate
- **Logs:** Estruturados em JSON
- **Alertas:** Para erros de API externa e rate limits

---

**Última Atualização:** 2025-01-16
**Versão da API:** 1.0.0 