# Bitcoin Keyspace Explorer

Uma ferramenta educacional para explorar e analisar o espaço de chaves Bitcoin, gerando endereços criptograficamente seguros e consultando saldos em tempo real.

## 🚀 Visão Geral

O Bitcoin Keyspace Explorer é um projeto educacional que demonstra:

- **Geração de Chaves:** 45 chaves privadas Bitcoin por página usando BigInt
- **Derivação de Endereços:** Todos os formatos Bitcoin (P2PKH, P2WPKH, P2SH, P2TR)
- **Consulta de Saldos:** Via API Blockstream e PostgreSQL local
- **Varredura Automatizada:** Modos random, next e previous
- **Notificações:** Telegram quando encontra fundos

## 🏠 Hospedagem Local

O projeto está configurado para rodar localmente em:

- **URL:** http://192.168.7.101:3000
- **API:** http://192.168.7.101:3000/api
- **Banco:** PostgreSQL local (192.168.7.101:5432)

## 📋 Pré-requisitos

- Node.js 18+
- PostgreSQL 15+
- Windows 11 (configurado para IP 192.168.7.101)

## 🛠️ Instalação

```bash
# Clone o repositório
git clone https://github.com/your-org/bitcoin-keyspace-explorer.git
cd bitcoin-keyspace-explorer

# Instale as dependências
npm install

# Configure o ambiente
cp .env.example .env.local
```

## ⚙️ Configuração

Edite o arquivo `.env.local`:

```bash
# API Base URL
NEXT_PUBLIC_API_BASE_URL=http://192.168.7.101:3000/api

# Database
DATABASE_URL=postgresql://postgres:tjq5uxt3@192.168.7.101:5432/cryptodb

# Telegram (opcional)
TELEGRAM_TOKEN=your_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
```

## 🚀 Deploy Rápido

### Opção 1: Script Automático (Recomendado)

```bash
# Execute o script de deploy
deploy.bat
```

### Opção 2: Deploy Manual

```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm start
```

## 📚 Documentação

- [**API Documentation**](docs/api.md) - Endpoints e exemplos
- [**Deployment Guide**](docs/deployment.md) - Setup completo
- [**Architecture**](docs/architecture.md) - Arquitetura técnica
- [**Contributing**](docs/contributing.md) - Como contribuir

## 🔧 Troubleshooting

### Erro de Turbopack no Windows

Se encontrar erros de path no Turbopack:

```javascript
// next.config.ts
const nextConfig = {
  experimental: {
    turbo: false // Desabilitar Turbopack
  }
};
```

### Erro de Validação de Endereços

O sistema filtra automaticamente endereços inválidos antes de consultar a API Blockstream.

### Firewall Windows

Configure o firewall para permitir conexões na porta 3000:

```bash
netsh advfirewall firewall add rule name="Bitcoin Explorer" dir=in action=allow protocol=TCP localport=3000
```

## 🌐 Acesso Externo

Para permitir acesso de outras máquinas na rede:

1. Configure o firewall (veja acima)
2. Acesse via IP: http://192.168.7.101:3000
3. Para acesso público futuro, configure um redirecionador de porta

## 📊 Monitoramento

- **Health Check:** http://192.168.7.101:3000/api/health
- **Logs:** Verifique o console do servidor
- **Performance:** Use o Task Manager do Windows

## 🔒 Segurança

- **Chaves Privadas:** Nunca logadas ou armazenadas
- **Validação:** Entrada rigorosamente validada
- **Rate Limiting:** 10 requests/min para varredura
- **Headers:** CSP e outras proteções configuradas

## 🤝 Contribuindo

Veja [CONTRIBUTING.md](docs/contributing.md) para detalhes sobre como contribuir.

## 📄 Licença

Este projeto é educacional e não deve ser usado para fins maliciosos.

## 🆘 Suporte

- **Issues:** [GitHub Issues](https://github.com/your-org/bitcoin-keyspace-explorer/issues)
- **Documentação:** [docs/](docs/)
- **Email:** support@bitcoin-explorer.com

---

**Status:** Em desenvolvimento  
**Versão:** 1.0.0  
**Última Atualização:** 2025-01-16 