# Contributing Guidelines - Bitcoin Keyspace Explorer

## Visão Geral

Obrigado por considerar contribuir para o Bitcoin Keyspace Explorer! Este é um projeto educacional focado em explorar o espaço de chaves Bitcoin de forma segura e responsável.

## Código de Conduta

### Nossos Padrões

Esperamos que todos os contribuidores:

- ✅ Sejam respeitosos e inclusivos
- ✅ Foquem no valor educacional do projeto
- ✅ Mantenham a segurança criptográfica
- ✅ Documentem suas mudanças adequadamente
- ✅ Testem suas contribuições

### O que NÃO é aceito

- ❌ Uso malicioso ou não educacional
- ❌ Violação de segurança criptográfica
- ❌ Spam ou conteúdo irrelevante
- ❌ Comportamento tóxico ou desrespeitoso

## Como Contribuir

### 1. Configuração do Ambiente

```bash
# Fork e clone o repositório
git clone https://github.com/your-username/bitcoin-keyspace-explorer.git
cd bitcoin-keyspace-explorer

# Instalar dependências
npm install

# Configurar ambiente
cp .env.example .env.local
```

### 2. Estrutura do Projeto

```
bitcoin-keyspace-explorer/
├── apps/web/                 # Aplicação Next.js
│   ├── src/
│   │   ├── components/       # Componentes React
│   │   ├── pages/           # Páginas Next.js
│   │   ├── lib/             # Lógica de negócio
│   │   ├── services/        # Serviços de API
│   │   └── types/           # Definições TypeScript
├── docs/                    # Documentação
├── scripts/                 # Scripts utilitários
└── tests/                   # Testes
```

### 3. Fluxo de Desenvolvimento

#### Criando uma Branch

```bash
# Criar branch a partir da main
git checkout -b feature/nome-da-feature

# Ou para correção de bug
git checkout -b fix/nome-do-bug
```

#### Convenções de Naming

- **Features:** `feature/nome-da-feature`
- **Bugs:** `fix/nome-do-bug`
- **Docs:** `docs/nome-da-documentacao`
- **Refactor:** `refactor/nome-do-refactor`

#### Desenvolvimento

```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Executar testes
npm run test

# Verificar linting
npm run lint
```

### 4. Padrões de Código

#### TypeScript

```typescript
// ✅ Bom - Tipos explícitos
interface PrivateKey {
  privateKey: string;
  addresses: {
    p2pkh: string;
    p2wpkh: string;
    p2sh: string;
    p2tr: string;
  };
  balance: number;
}

// ❌ Ruim - Tipos implícitos
const key = {
  privateKey: "abc",
  balance: 0
};
```

#### React Components

```typescript
// ✅ Bom - Componente funcional com props tipadas
interface KeyTableProps {
  keys: PrivateKey[];
  onKeyClick?: (key: PrivateKey) => void;
}

export const KeyTable: React.FC<KeyTableProps> = ({ keys, onKeyClick }) => {
  return (
    <div className="key-table">
      {keys.map((key) => (
        <KeyRow key={key.privateKey} keyData={key} onClick={onKeyClick} />
      ))}
    </div>
  );
};
```

#### API Routes

```typescript
// ✅ Bom - Validação e tratamento de erro
import { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';

const generatePageSchema = z.object({
  pageNumber: z.string().regex(/^\d+$/)
});

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    const { pageNumber } = generatePageSchema.parse(req.body);
    // ... lógica
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: 'Invalid page number' });
  }
}
```

### 5. Testes

#### Estrutura de Testes

```typescript
// tests/services/KeyGenerationService.test.ts
import { KeyGenerationService } from '../../src/lib/services/KeyGenerationService';

describe('KeyGenerationService', () => {
  let service: KeyGenerationService;

  beforeEach(() => {
    service = new KeyGenerationService();
  });

  it('should generate 45 keys per page', async () => {
    const page = await service.generatePage(BigInt(1));
    expect(page.keys).toHaveLength(45);
  });

  it('should generate valid Bitcoin addresses', async () => {
    const page = await service.generatePage(BigInt(1));
    page.keys.forEach(key => {
      expect(key.addresses.p2pkh).toMatch(/^1[a-km-zA-HJ-NP-Z1-9]{25,34}$/);
      expect(key.addresses.p2wpkh).toMatch(/^bc1[a-z0-9]{39,59}$/);
    });
  });
});
```

#### Executando Testes

```bash
# Todos os testes
npm run test

# Testes unitários apenas
npm run test:unit

# Testes E2E
npm run test:e2e

# Modo watch
npm run test:watch

# Cobertura
npm run test:coverage
```

### 6. Linting e Formatação

#### ESLint

```bash
# Verificar problemas
npm run lint

# Corrigir automaticamente
npm run lint:fix
```

#### Prettier

```bash
# Formatar código
npm run format

# Verificar formatação
npm run format:check
```

### 7. Commits

#### Convenção de Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Features
git commit -m "feat: add new scanning mode"

# Bug fixes
git commit -m "fix: resolve address validation issue"

# Documentation
git commit -m "docs: update API documentation"

# Refactoring
git commit -m "refactor: improve key generation performance"

# Tests
git commit -m "test: add unit tests for BalanceService"
```

#### Tipos de Commit

- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação (espaços, ponto e vírgula, etc.)
- `refactor:` Refatoração de código
- `test:` Adicionar ou corrigir testes
- `chore:` Mudanças em build, config, etc.

### 8. Pull Request

#### Criando um PR

1. **Fork** o repositório
2. **Clone** seu fork
3. **Crie** uma branch para sua feature
4. **Desenvolva** sua funcionalidade
5. **Teste** suas mudanças
6. **Commit** seguindo as convenções
7. **Push** para seu fork
8. **Crie** um Pull Request

#### Template de PR

```markdown
## Descrição

Breve descrição das mudanças implementadas.

## Tipo de Mudança

- [ ] Bug fix
- [ ] Nova feature
- [ ] Breaking change
- [ ] Documentação

## Checklist

- [ ] Código segue os padrões do projeto
- [ ] Testes foram adicionados/atualizados
- [ ] Documentação foi atualizada
- [ ] Linting passou sem erros
- [ ] Build passou sem erros

## Testes

Descreva como testar suas mudanças:

1. Execute `npm run test`
2. Teste manualmente a funcionalidade
3. Verifique se não há regressões

## Screenshots (se aplicável)

Adicione screenshots se a mudança afeta a UI.
```

### 9. Review Process

#### Como Revisar

1. **Código:**
   - Segue padrões do projeto?
   - Está bem documentado?
   - Tem testes adequados?

2. **Funcionalidade:**
   - Resolve o problema?
   - Não introduz bugs?
   - Mantém segurança?

3. **Performance:**
   - Não degrada performance?
   - Usa recursos eficientemente?

#### Feedback

- Seja construtivo e específico
- Sugira melhorias quando possível
- Aprecie o trabalho do contribuidor

## Áreas de Contribuição

### 1. Frontend

- **Componentes React:** Melhorar UI/UX
- **Hooks Customizados:** Reutilizar lógica
- **Testes:** Aumentar cobertura
- **Acessibilidade:** Melhorar a11y

### 2. Backend

- **API Routes:** Novos endpoints
- **Serviços:** Melhorar lógica de negócio
- **Validação:** Robustez de entrada
- **Performance:** Otimizações

### 3. Infraestrutura

- **Deploy:** Melhorar pipeline
- **Monitoramento:** Métricas e alertas
- **Segurança:** Headers, rate limiting
- **Cache:** Estratégias de cache

### 4. Documentação

- **API Docs:** Completar documentação
- **Guias:** Tutoriais e exemplos
- **Arquitetura:** Diagramas e decisões
- **Troubleshooting:** Soluções comuns

### 5. Testes

- **Unit Tests:** Cobertura de código
- **Integration Tests:** Fluxos completos
- **E2E Tests:** Cenários de usuário
- **Performance Tests:** Benchmarks

## Segurança

### Diretrizes Importantes

1. **Nunca** logue chaves privadas
2. **Sempre** valide entrada do usuário
3. **Use** bibliotecas criptográficas confiáveis
4. **Teste** cenários de segurança
5. **Documente** vulnerabilidades encontradas

### Reportando Vulnerabilidades

Se encontrar uma vulnerabilidade de segurança:

1. **NÃO** abra um issue público
2. **Email:** security@bitcoin-explorer.com
3. **Descreva** detalhadamente o problema
4. **Aguarde** resposta da equipe

## Recursos Úteis

### Documentação

- [Next.js Docs](https://nextjs.org/docs)
- [React Docs](https://react.dev)
- [TypeScript Docs](https://www.typescriptlang.org/docs)
- [Bitcoin Core](https://bitcoin.org/en/developer-documentation)

### Ferramentas

- **VS Code Extensions:**
  - ESLint
  - Prettier
  - TypeScript
  - GitLens

- **Browser Extensions:**
  - React Developer Tools
  - Redux DevTools

### Comunidade

- **Discord:** [Link do servidor]
- **GitHub Discussions:** [Link]
- **Stack Overflow:** Tag `bitcoin-keyspace-explorer`

## Reconhecimento

### Contribuidores

Todos os contribuidores são listados em [CONTRIBUTORS.md](CONTRIBUTORS.md).

### Badges

Contribuidores ativos recebem badges especiais:

- 🥇 **Gold:** 50+ commits
- 🥈 **Silver:** 20+ commits  
- 🥉 **Bronze:** 5+ commits

## Perguntas Frequentes

### Q: Posso contribuir mesmo sendo iniciante?

**A:** Sim! Projetos educacionais são perfeitos para iniciantes. Comece com:
- Documentação
- Testes
- Correções de bugs simples
- Melhorias de UI

### Q: Como escolher uma issue para trabalhar?

**A:** Procure por:
- Labels `good first issue`
- Issues marcadas como `help wanted`
- Bugs com reprodução clara
- Features bem documentadas

### Q: E se minha PR for rejeitada?

**A:** Não desanime! Isso é normal:
- Leia o feedback cuidadosamente
- Faça as correções sugeridas
- Peça esclarecimentos se necessário
- Resubmeta quando estiver pronto

### Q: Posso sugerir novas features?

**A:** Sim! Mas certifique-se de:
- Verificar se já existe issue similar
- Explicar o valor educacional
- Considerar a complexidade
- Propor uma implementação

---

**Obrigado por contribuir para o Bitcoin Keyspace Explorer!** 🚀

**Última Atualização:** 2025-01-16
**Versão:** 1.0.0 