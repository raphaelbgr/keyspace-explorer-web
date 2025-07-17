@echo off
echo ========================================
echo Bitcoin Keyspace Explorer - Deploy Local
echo ========================================
echo.

REM Verificar se estamos no diretório correto
if not exist "package.json" (
    echo ERRO: Execute este script na raiz do projeto
    pause
    exit /b 1
)

echo [1/6] Parando servidor se estiver rodando...
taskkill /f /im node.exe 2>nul
timeout /t 2 /nobreak >nul

echo [2/6] Instalando dependências...
call npm install
if %errorlevel% neq 0 (
    echo ERRO: Falha ao instalar dependências
    pause
    exit /b 1
)

echo [3/6] Executando testes...
call npm run test
if %errorlevel% neq 0 (
    echo AVISO: Alguns testes falharam, mas continuando...
)

echo [4/6] Build para produção...
call npm run build
if %errorlevel% neq 0 (
    echo ERRO: Falha no build
    pause
    exit /b 1
)

echo [5/6] Verificando PostgreSQL...
netstat -an | findstr :5432 >nul
if %errorlevel% neq 0 (
    echo AVISO: PostgreSQL não parece estar rodando na porta 5432
    echo Certifique-se de que o PostgreSQL está ativo
)

echo [6/6] Iniciando servidor...
echo.
echo ========================================
echo Servidor iniciado em: http://192.168.7.101:3000
echo API disponível em: http://192.168.7.101:3000/api
echo ========================================
echo.
echo Pressione Ctrl+C para parar o servidor
echo.

call npm start

pause 