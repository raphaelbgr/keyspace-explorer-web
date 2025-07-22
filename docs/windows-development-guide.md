# Windows Development Guide

## Command Compatibility

### ❌ Don't Use (Linux/macOS syntax):
```bash
# Multiple commands with && (doesn't work in PowerShell)
cd apps/web && npm run dev

# Multi-line curl with \ (doesn't work in Windows)
curl -X POST http://localhost:3001/api/balances \
  -H "Content-Type: application/json" \
  -d '{"addresses": ["1A1zP1e..."]}'
```

### ✅ Use Instead (Windows PowerShell):

#### **Sequential Commands:**
```powershell
# PowerShell: Use ; or separate commands
cd apps\web; npm run dev

# Or run separately:
cd apps\web
npm run dev
```

#### **API Testing:**
```powershell
# Single-line PowerShell API calls
$body = @{ addresses = @("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"); currencies = @("BTC") } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3002/api/balances" -Method POST -ContentType "application/json" -Body $body

# Or using curl in single line (if available):
curl -X POST "http://localhost:3002/api/balances" -H "Content-Type: application/json" -d "{\"addresses\":[\"1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa\"],\"currencies\":[\"BTC\"]}"

# GET requests:
Invoke-RestMethod -Uri "http://localhost:3002/api/balances" -Method GET
# Or: curl "http://localhost:3002/api/balances"
```

#### **Database Commands:**
```powershell
# PostgreSQL commands (single line):
psql -h 192.168.7.101 -U postgres -d cryptodb -f "apps\web\database-migration-fixed.sql"
```

#### **File Operations:**
```powershell
# Check files:
Get-ChildItem src\lib\services\
dir src\lib\services\

# Remove directories:
Remove-Item .next -Recurse -Force

# Read file content:
Get-Content database-migration-fixed.sql
```

## Port Detection

The development server auto-detects available ports:
- **First try:** `http://localhost:3000`
- **If busy:** `http://localhost:3001` 
- **If busy:** `http://localhost:3002`
- etc.

Check your terminal output for the actual port:
```
▲ Next.js 14.0.4
- Local:        http://localhost:3002  ← Use this URL
```

## Testing Multi-Currency API

### **Current Server Port: 3002**

```powershell
# Test cache metrics (GET)
Invoke-RestMethod -Uri "http://localhost:3002/api/balances" -Method GET

# Test balance checking (POST) - Bitcoin only
$body = @{ addresses = @("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4"); currencies = @("BTC") } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3002/api/balances" -Method POST -ContentType "application/json" -Body $body

# Test multi-currency (BTC + ETH)
$body = @{ addresses = @("1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"); currencies = @("BTC", "ETH") } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3002/api/balances" -Method POST -ContentType "application/json" -Body $body
```

## Common Issues & Solutions

### **Issue: External API 404 Errors**
```
External API call failed for BTC: Error: API request failed: 404 Not Found
```
**Solution:** This is expected - we're using placeholder external APIs. The local database will still work.

### **Issue: Database ON CONFLICT Error**
```
não há nenhuma restrição de unicidade ou de exclusão que corresponda à especificação ON CONFLICT
```
**Solution:** Run the constraint fix:
```powershell
psql -h 192.168.7.101 -U postgres -d cryptodb -f "apps\web\database-fix-constraints.sql"
```

### **Issue: JSON Parse Errors**
```
SyntaxError: Unexpected end of JSON input
```
**Solution:** Ensure proper JSON formatting in PowerShell requests (use the examples above).

## File Paths

Always use Windows-style paths in commands:
- ✅ `apps\web\src\components\`
- ❌ `apps/web/src/components/`

## Development Workflow

```powershell
# 1. Navigate to project
cd C:\Users\rbgnr\git\bitcoin-keyspace-explorer

# 2. Go to web app
cd apps\web

# 3. Start development server
npm run dev

# 4. Test API (in new terminal)
Invoke-RestMethod -Uri "http://localhost:3002/api/balances" -Method GET
``` 