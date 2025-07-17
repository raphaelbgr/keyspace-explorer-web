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
  },
};

export const useTranslation = () => {
  const { language } = useLanguageStore();
  return translations[language];
};

export const formatTranslation = (text: string, params: Record<string, string | number>) => {
  return text.replace(/\{(\w+)\}/g, (match, key) => {
    return params[key]?.toString() || match;
  });
}; 