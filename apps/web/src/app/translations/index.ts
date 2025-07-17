import { Language, useLanguageStore } from '../store/languageStore';

export interface Translations {
  // Navigation and UI
  title: string;
  subtitle: string;
  expand: string;
  collapse: string;
  
  // Key Information
  keyNumber: string;
  privateKey: string;
  privateKeyHex: string;
  allAddresses: string;
  totalBalance: string;
  balances: string;
  
  // Address Types
  p2pkhCompressed: string;
  p2pkhUncompressed: string;
  p2wpkh: string;
  p2shP2wpkh: string;
  p2tr: string;
  
  // Status and Actions
  funds: string;
  btc: string;
  processing: string;
  loadingAddresses: string;
  clickToLoadAddresses: string;
  
  // Page Navigation
  firstPage: string;
  lastPage: string;
  previousPage: string;
  nextPage: string;
  pageOf: string;
  
  // Control Panel
  generatePage: string;
  fetchBalances: string;
  startScan: string;
  stopScan: string;
  apiSource: string;
  local: string;
  blockstream: string;
  mempool: string;
  grid: string;
  table: string;
  
  // Navigation
  navigation: string;
  openMenu: string;
  closeMenu: string;
  lightMode: string;
  darkMode: string;
  language: string;
  english: string;
  portuguese: string;
  keyspaceNavigation: string;
  
  // Messages
  pageGenerated: string;
  failedToGenerate: string;
  scanStarted: string;
  scanCompleted: string;
  scanFailed: string;
  scanStopped: string;
  balancesFetched: string;
  failedToFetch: string;
  pageResults: string;
  keys: string;
  keyDetails: string;
  
  // Scanner
  scanner: {
    title: string;
    mode: string;
    sequential: string;
    random: string;
    targeted: string;
    targetPage: string;
    maxPages: string;
    delay: string;
    delayHelp: string;
    start: string;
    stop: string;
    status: string;
    currentPage: string;
    pagesScanned: string;
    totalBalance: string;
    scanRate: string;
    duration: string;
    autoContinuing: string;
    fundsFound: string;
    error: string;
    starting: string;
    stopped: string;
  };
  
  // Common
  common: {
    close: string;
  };
}

export const translations: Record<string, Translations> = {
  en: {
    title: 'Bitcoin Keyspace Explorer',
    subtitle: 'Explore the Bitcoin keyspace and check address balances',
    expand: 'Expand',
    collapse: 'Collapse',
    
    keyNumber: 'Key #',
    privateKey: 'Private Key',
    privateKeyHex: 'Private Key (Hex)',
    allAddresses: 'All Addresses',
    totalBalance: 'Total Balance',
    balances: 'Balances',
    
    p2pkhCompressed: 'P2PKH (Compressed)',
    p2pkhUncompressed: 'P2PKH (Uncompressed)',
    p2wpkh: 'P2WPKH',
    p2shP2wpkh: 'P2SH-P2WPKH',
    p2tr: 'P2TR',
    
    funds: 'FUNDS',
    btc: 'BTC',
    processing: 'Processing...',
    loadingAddresses: 'Loading addresses...',
    clickToLoadAddresses: 'Click to load addresses',
    
    firstPage: 'First Page',
    lastPage: 'Last Page',
    previousPage: 'Previous Page',
    nextPage: 'Next Page',
    pageOf: 'Page {current} of {total}',
    
    generatePage: 'Generate Page',
    fetchBalances: 'Fetch Balances',
    startScan: 'Start Scan',
    stopScan: 'Stop Scan',
    apiSource: 'API Source',
    local: 'Local',
    blockstream: 'Blockstream',
    mempool: 'Mempool.space',
    grid: 'Grid',
    table: 'Table',
    
    // Navigation
    navigation: 'Navigation',
    openMenu: 'Open Menu',
    closeMenu: 'Close Menu',
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
    language: 'Language',
    english: 'English',
    portuguese: 'Português',
    keyspaceNavigation: 'Keyspace Navigation',
    
    pageGenerated: 'Page {page} generated successfully',
    failedToGenerate: 'Failed to generate page',
    scanStarted: 'Scan started',
    scanCompleted: 'Scan completed',
    scanFailed: 'Scan failed',
    scanStopped: 'Scan stopped',
    balancesFetched: 'Balances fetched from {source} ({count} addresses)',
    failedToFetch: 'Failed to fetch balances',
    pageResults: 'Page {page} Results',
    keys: 'keys',
    keyDetails: 'Key #{number} Details',
    
    // Scanner
    scanner: {
      title: 'Scanner',
      mode: 'Mode',
      sequential: 'Sequential',
      random: 'Random',
      targeted: 'Targeted',
      targetPage: 'Target Page',
      maxPages: 'Max Pages',
      delay: 'Delay',
      delayHelp: 'Delay between pages (ms)',
      start: 'Start',
      stop: 'Stop',
      status: 'Status',
      currentPage: 'Current Page',
      pagesScanned: 'Pages Scanned',
      totalBalance: 'Total Balance',
      scanRate: 'Scan Rate',
      duration: 'Duration',
      autoContinuing: 'Auto-continuing',
      fundsFound: 'Funds Found',
      error: 'Error',
      starting: 'Starting...',
      stopped: 'Stopped',
    },
    
    // Common
    common: {
      close: 'Close',
    },
  },
  pt: {
    title: 'Explorador de Keyspace Bitcoin',
    subtitle: 'Explore o keyspace Bitcoin e verifique saldos de endereços',
    expand: 'Expandir',
    collapse: 'Recolher',
    
    keyNumber: 'Chave #',
    privateKey: 'Chave Privada',
    privateKeyHex: 'Chave Privada (Hex)',
    allAddresses: 'Todos os Endereços',
    totalBalance: 'Saldo Total',
    balances: 'Saldos',
    
    p2pkhCompressed: 'P2PKH (Comprimido)',
    p2pkhUncompressed: 'P2PKH (Não Comprimido)',
    p2wpkh: 'P2WPKH',
    p2shP2wpkh: 'P2SH-P2WPKH',
    p2tr: 'P2TR',
    
    funds: 'FUNDOS',
    btc: 'BTC',
    processing: 'Processando...',
    loadingAddresses: 'Carregando endereços...',
    clickToLoadAddresses: 'Clique para carregar endereços',
    
    firstPage: 'Primeira Página',
    lastPage: 'Última Página',
    previousPage: 'Página Anterior',
    nextPage: 'Próxima Página',
    pageOf: 'Página {current} de {total}',
    
    generatePage: 'Gerar Página',
    fetchBalances: 'Buscar Saldos',
    startScan: 'Iniciar Verificação',
    stopScan: 'Parar Verificação',
    apiSource: 'Fonte da API',
    local: 'Local',
    blockstream: 'Blockstream',
    mempool: 'Mempool.space',
    grid: 'Grade',
    table: 'Tabela',
    
    // Navigation
    navigation: 'Navegação',
    openMenu: 'Abrir Menu',
    closeMenu: 'Fechar Menu',
    lightMode: 'Modo Claro',
    darkMode: 'Modo Escuro',
    language: 'Idioma',
    english: 'English',
    portuguese: 'Português',
    keyspaceNavigation: 'Navegação do Keyspace',
    
    pageGenerated: 'Página {page} gerada com sucesso',
    failedToGenerate: 'Falha ao gerar página',
    scanStarted: 'Verificação iniciada',
    scanCompleted: 'Verificação concluída',
    scanFailed: 'Falha na verificação',
    scanStopped: 'Verificação parada',
    balancesFetched: 'Saldos obtidos de {source} ({count} endereços)',
    failedToFetch: 'Falha ao obter saldos',
    pageResults: 'Resultados da Página {page}',
    keys: 'chaves',
    keyDetails: 'Detalhes da Chave #{number}',
    
    // Scanner
    scanner: {
      title: 'Scanner',
      mode: 'Modo',
      sequential: 'Sequencial',
      random: 'Aleatório',
      targeted: 'Alvo',
      targetPage: 'Página Alvo',
      maxPages: 'Páginas Máximas',
      delay: 'Atraso',
      delayHelp: 'Atraso entre páginas (ms)',
      start: 'Iniciar',
      stop: 'Parar',
      status: 'Status',
      currentPage: 'Página Atual',
      pagesScanned: 'Páginas Escaneadas',
      totalBalance: 'Saldo Total',
      scanRate: 'Taxa de Escaneamento',
      duration: 'Duração',
      autoContinuing: 'Continuando Automaticamente',
      fundsFound: 'Fundos Encontrados',
      error: 'Erro',
      starting: 'Iniciando...',
      stopped: 'Parado',
    },
    
    // Common
    common: {
      close: 'Fechar',
    },
  },
};

export const useTranslation = () => {
  const { language } = useLanguageStore();
  
  // Get the language-specific translations or fall back to English
  const langTranslations = translations[language] || translations.en;
  
  // Ensure we always return a complete translation object
  // This prevents undefined errors when accessing translation keys
  const result = {
    ...translations.en, // Start with English as base
    ...langTranslations, // Override with selected language
  };
  
  // Debug logging to see what's happening
  console.log('useTranslation called:', { language, hasTranslations: !!result, firstPage: result.firstPage });
  
  return result;
};

export const formatTranslation = (text: string, params: Record<string, string | number>) => {
  return text.replace(/\{(\w+)\}/g, (match, key) => {
    return params[key]?.toString() || match;
  });
}; 