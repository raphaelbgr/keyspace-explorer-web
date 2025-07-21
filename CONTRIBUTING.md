
# Contributing to Bitcoin Keyspace Explorer

Thank you for your interest in contributing to the Bitcoin Keyspace Explorer! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites

Before contributing, ensure you have:
- Node.js 18+ installed
- PostgreSQL 14+ installed
- Git configured with your GitHub account
- A code editor (VS Code recommended)

### Development Setup

1. **Fork and Clone**
   ```bash
   git fork https://github.com/yourusername/bitcoin-keyspace-explorer.git
   git clone https://github.com/yourusername/bitcoin-keyspace-explorer.git
   cd bitcoin-keyspace-explorer
   ```

2. **Install Dependencies**
   ```bash
   npm install
   cd apps/web
   npm install
   ```

3. **Database Setup**
   ```bash
   # Create database
   createdb bitcoin_keyspace
   
   # Run migrations
   psql -d bitcoin_keyspace -f database-setup.sql
   ```

4. **Environment Configuration**
   ```bash
   cp apps/web/.env.example apps/web/.env.local
   # Edit .env.local with your database credentials
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

## 🏗️ Project Structure

```
bitcoin-keyspace-explorer/
├── apps/web/                 # Main Next.js application
│   ├── src/app/              # App router
│   │   ├── api/              # API routes
│   │   ├── components/       # React components
│   │   ├── hooks/            # Custom hooks
│   │   ├── store/            # State management
│   │   └── utils/            # Utility functions
│   └── src/lib/              # Shared libraries
├── packages/                 # Shared packages
├── docs/                     # Documentation
└── scripts/                  # Build and utility scripts
```

## 🎯 Areas for Contribution

### 🐛 Bug Fixes
- Performance improvements
- UI/UX enhancements
- Security patches
- Cross-browser compatibility

### ✨ Features
- New address format support
- Additional balance APIs
- Enhanced scanning algorithms
- Mobile app development

### 📚 Documentation
- API documentation
- Tutorial improvements
- Code comments
- Translation support

### 🧪 Testing
- Unit tests for services
- Integration tests for APIs
- E2E tests for user flows
- Performance testing

## 📝 Development Guidelines

### Code Style

We use ESLint and Prettier for code formatting:

```bash
# Run linting
npm run lint

# Fix linting issues
npm run lint:fix

# Format code
npm run format
```

### TypeScript Standards

- Use strict type checking
- Prefer interfaces over types for object shapes
- Use generics for reusable components
- Document complex types with JSDoc

```typescript
/**
 * Represents a Bitcoin address with its balance information
 */
interface AddressInfo {
  address: string;
  balance: number;
  format: 'P2PKH' | 'P2WPKH' | 'P2SH' | 'P2TR';
  compressed?: boolean;
}
```

### React/Next.js Best Practices

- Use functional components with hooks
- Implement proper error boundaries
- Optimize performance with useMemo and useCallback
- Follow Next.js App Router conventions

```tsx
// Good: Memoized component with proper typing
const KeyCard = memo<KeyCardProps>(({ 
  keyData, 
  onSelect 
}) => {
  const formattedBalance = useMemo(() => 
    formatBTC(keyData.balance), 
    [keyData.balance]
  );

  return (
    <Card onClick={() => onSelect(keyData.index)}>
      {/* Component content */}
    </Card>
  );
});
```

### Database Guidelines

- Use parameterized queries to prevent SQL injection
- Index frequently queried columns
- Keep migrations reversible
- Test with large datasets

```sql
-- Good: Parameterized query
SELECT * FROM addresses WHERE address = $1 AND balance > $2;

-- Bad: String concatenation
SELECT * FROM addresses WHERE address = '" + address + "';
```

## 🔍 Testing Standards

### Unit Tests

Write tests for utility functions and services:

```typescript
// Example test
describe('AddressValidator', () => {
  it('should validate Bitcoin addresses correctly', () => {
    expect(isValidBitcoinAddress('1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2')).toBe(true);
    expect(isValidBitcoinAddress('invalid')).toBe(false);
  });
});
```

### Integration Tests

Test API endpoints:

```typescript
describe('/api/generate-page', () => {
  it('should generate keys for valid page number', async () => {
    const response = await fetch('/api/generate-page', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pageNumber: '1', keysPerPage: 10 })
    });
    
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.keys).toHaveLength(10);
  });
});
```

## 🚢 Submission Process

### 1. Create Feature Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/bug-description
```

### 2. Make Changes

- Write clean, documented code
- Add tests for new functionality
- Update documentation as needed
- Follow the existing code style

### 3. Test Your Changes

```bash
# Run all tests
npm test

# Check linting
npm run lint

# Build the project
npm run build

# Test the app manually
npm run dev
```

### 4. Commit Changes

Use conventional commit messages:

```bash
git commit -m "feat: add support for Taproot addresses"
git commit -m "fix: resolve BigInt conversion error in navigation"
git commit -m "docs: update API documentation"
git commit -m "test: add unit tests for balance service"
```

### 5. Push and Create PR

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub with:
- Clear description of changes
- Link to related issues
- Screenshots for UI changes
- Test results

## 🔐 Security Considerations

### Private Key Handling

- **Never log private keys**
- **Never store private keys in databases**
- **Use secure random generation**
- **Clear sensitive data from memory**

```typescript
// Good: Secure handling
const generatePrivateKey = (): string => {
  const key = crypto.randomBytes(32).toString('hex');
  // Use key immediately, don't store
  return deriveAddresses(key);
};

// Bad: Logging sensitive data
console.log('Generated private key:', privateKey);
```

### Input Validation

Always validate and sanitize inputs:

```typescript
// Good: Proper validation
const validatePageNumber = (page: string): boolean => {
  const num = BigInt(page);
  return num >= 1n && num <= MAX_PAGE_NUMBER;
};
```

## 📊 Performance Guidelines

### Database Optimization

- Use appropriate indexes
- Batch operations when possible
- Implement connection pooling
- Monitor query performance

### Frontend Optimization

- Implement virtualization for large lists
- Use code splitting for better loading
- Optimize images and assets
- Implement proper caching

```tsx
// Good: Virtualized list for performance
const VirtualizedKeyList = ({ keys }: { keys: KeyData[] }) => {
  return (
    <FixedSizeList
      height={600}
      itemCount={keys.length}
      itemSize={120}
      itemData={keys}
    >
      {KeyRow}
    </FixedSizeList>
  );
};
```

## 🌐 Internationalization

When adding new text:

```typescript
// Add to translations
const translations = {
  en: {
    'button.generate': 'Generate Keys',
    'error.invalidPage': 'Invalid page number'
  },
  pt: {
    'button.generate': 'Gerar Chaves',
    'error.invalidPage': 'Número de página inválido'
  }
};

// Use in components
const { t } = useTranslation();
return <Button>{t('button.generate')}</Button>;
```

## 🐛 Bug Reports

When reporting bugs, include:

1. **Environment**: OS, browser, Node.js version
2. **Steps to reproduce**: Clear, numbered steps
3. **Expected behavior**: What should happen
4. **Actual behavior**: What actually happens
5. **Screenshots**: If applicable
6. **Console logs**: Error messages

## 💬 Communication

- **GitHub Issues**: For bugs and feature requests
- **GitHub Discussions**: For questions and ideas
- **Pull Requests**: For code contributions

## 📋 Checklist for Contributors

Before submitting a PR, ensure:

- [ ] Code follows project style guidelines
- [ ] Tests are written and passing
- [ ] Documentation is updated
- [ ] Security considerations are addressed
- [ ] Performance impact is considered
- [ ] Changes are backwards compatible (if applicable)
- [ ] Commit messages follow conventional format
- [ ] PR description is clear and complete

## 🎉 Recognition

Contributors will be:
- Listed in the project's contributors section
- Mentioned in release notes for significant contributions
- Invited to become maintainers for consistent contributions

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Bitcoin Developer Documentation](https://developer.bitcoin.org/)
- [Material-UI Documentation](https://mui.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

---

**Thank you for contributing to Bitcoin Keyspace Explorer! 🚀**

Every contribution, no matter how small, helps make this project better for the entire community. 