'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useDebounce } from './hooks/useDebounce';
import { useThrottle } from './hooks/useThrottle';
import { 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  Box, 
  Tooltip, 
  IconButton,
  Chip,
  Alert,
  Snackbar,
  Fade,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Info as InfoIcon,
  AccountBalance as BalanceIcon,
  Speed as SpeedIcon,
  FirstPage as FirstPageIcon,
  LastPage as LastPageIcon,
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon
} from '@mui/icons-material';
import { useThemeStore } from './store/themeStore';
import { useLanguageStore } from './store/languageStore';
import { useNavigationStore } from './store/navigationStore';
import RandomKeyCard from './components/RandomKeyCard';
import { useTranslation, formatTranslation } from './translations';
import FloatingNavigation from './components/FloatingNavigation';
import ControlPanel from './components/ControlPanel';
import AdvancedNavigation from './components/AdvancedNavigation';
import KeyspaceSlider from './components/KeyspaceSlider';
import ScannerCard from './components/ScannerCard';
import UltraOptimizedDashboard from './components/UltraOptimizedDashboard';
import BalanceStatus from './components/BalanceStatus';
import { useScannerStore } from './store/scannerStore';
import { clientKeyGenerationService } from '../lib/services/ClientKeyGenerationService';
import CryptoPriceDashboard from './components/CryptoPriceDashboard';
import { CryptoCurrency } from '../lib/types/multi-currency';
import { USDCalculationService } from '../lib/services/USDCalculationService';
import { unifiedBalanceService } from '../lib/services/UnifiedBalanceService';

interface PageData {
  pageNumber: string;
  keys: Array<{
    privateKey: string;
    pageNumber: string;
    index: number;
    addresses: {
      p2pkh_compressed: string;
      p2pkh_uncompressed: string;
      p2wpkh: string;
      p2sh_p2wpkh: string;
      p2tr: string;
    } | any; // Support multi-currency format
    balances: {
      p2pkh_compressed: number;
      p2pkh_uncompressed: number;
      p2wpkh: number;
      p2sh_p2wpkh: number;
      p2tr: number;
    } | any; // Support multi-currency format
    totalBalance: number;
    fundedCurrencies?: CryptoCurrency[];
    hasAnyFunds?: boolean;
  }>;
  totalPageBalance: number;
  generatedAt: string;
  balancesFetched: boolean;
  multiCurrency?: boolean;
  currencies?: string[];
}

export default function Dashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { mode } = useThemeStore();
  const t = useTranslation();
  
  // Navigation store
  const {
    currentPage: navCurrentPage,
    totalPages: navTotalPages,
    keysPerPage: navKeysPerPage,
    setCurrentPage: setNavCurrentPage,
    setKeysPerPage: setNavKeysPerPage,
    calculateTotalPages,
    generateRandomPage,
  } = useNavigationStore();
  
  const [currentPage, setCurrentPage] = useState<string>('1');
  const [isScanning, setIsScanning] = useState(false);
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  
  // Get USD calculation service
  const usdService = USDCalculationService.getInstance();
  

  
  const [apiSource, setApiSource] = useState<string>('local');
  const [expandedKeys, setExpandedKeys] = useState<Set<number>>(new Set());
  const [displayMode, setDisplayMode] = useState<'grid' | 'table'>('table');
  const [keysPerPage, setKeysPerPage] = useState(45);
  const [currentKeysPage, setCurrentKeysPage] = useState(1);
  const [generateLocally, setGenerateLocally] = useState(true);

  
  // Performance optimizations
  const debouncedCurrentPage = useDebounce(currentPage, 300);
  const expandedKeysRef = useRef<Set<number>>(new Set());
  const lastRenderTime = useRef<number>(0);
  const renderCount = useRef<number>(0);

  // Auto-load first page on component mount and initialize navigation
  useEffect(() => {
    handleGeneratePage('1');
    // Calculate total pages based on maximum Bitcoin private key
    calculateTotalPages(BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364140"));
  }, [calculateTotalPages]);

  // Check browser compatibility for local generation
  useEffect(() => {
    const checkBrowserCompatibility = async () => {
      const browserInfo = await clientKeyGenerationService.getBrowserInfo();
      
      if (!browserInfo.supported) {
        setNotification({
          message: '⚠️ Local generation not supported in this browser. Server generation will be used.',
          type: 'error'
        });
        setGenerateLocally(false);
      } else if (browserInfo.performance === 'low') {
        setNotification({
          message: `⚠️ Local generation may be slow: ${browserInfo.warnings.join(', ')}`,
          type: 'info'
        });
      } else if (browserInfo.warnings.length > 0) {
        console.warn('Browser compatibility warnings:', browserInfo.warnings);
      }
    };

    checkBrowserCompatibility();
  }, []);

  const toggleKeyExpansion = useThrottle(useCallback((keyIndex: number) => {
    const now = performance.now();
    if (now - lastRenderTime.current < 16) return; // 60fps limit
    
    setExpandedKeys(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(keyIndex)) {
        newExpanded.delete(keyIndex);
      } else {
        newExpanded.add(keyIndex);
      }
      expandedKeysRef.current = newExpanded;
      lastRenderTime.current = now;
      return newExpanded;
    });
  }, []), 16);

  // Helper function to safely convert to BigInt (handles scientific notation)
  const safeToBigInt = (value: string | number): bigint => {
    try {
      // If it's a number in scientific notation, convert to string first
      const str = typeof value === 'number' ? value.toFixed(0) : value;
      
      // Remove scientific notation by parsing as number first if needed
      if (str.includes('e') || str.includes('E')) {
        const num = parseFloat(str);
        if (!isFinite(num) || num < 0) {
          throw new Error('Invalid number');
        }
        // Convert to integer string representation
        const intStr = Math.floor(num).toString();
        return BigInt(intStr);
      }
      
      // Direct conversion for normal strings
      return BigInt(str);
    } catch (error) {
      console.error('Failed to convert to BigInt:', value, error);
      return BigInt(1); // Fallback to page 1
    }
  };

  const handleGeneratePage = async (pageNumber?: string) => {
    const pageToGenerate = pageNumber || currentPage;
    setLoading(true);
    setError(null);
    
    try {
      let data;
      
      // Check if multi-currency is needed based on user preference
      // For now, local generation supports Bitcoin only, server supports all currencies
      
      if (generateLocally) {
        // Client-side generation with multi-currency support
        console.log('🚀 Using client-side generation (Multi-currency)');
        const pageBigInt = safeToBigInt(pageToGenerate);
        
        // Generate base Bitcoin keys first
        const baseData = await clientKeyGenerationService.generatePage(pageBigInt, navKeysPerPage);
        
        // Import multi-currency service for client-side use
        const { multiCurrencyKeyGenerationService } = await import('../lib/services/MultiCurrencyKeyGenerationService');
        
        // Generate multi-currency addresses for each key
        const multiCurrencyKeys = await Promise.all(
          baseData.keys.map(async (baseKey) => {
            try {
              const allAddresses = await multiCurrencyKeyGenerationService.generateMultiCurrencyAddresses(baseKey.privateKey);
              
              return {
                privateKey: baseKey.privateKey,
                pageNumber: baseKey.pageNumber.toString(),
                index: baseKey.index,
                addresses: allAddresses, // Multi-currency format
                balances: {},
                totalBalance: 0,
              };
            } catch (error) {
              console.error('Error generating multi-currency addresses for key:', baseKey.index, error);
              // Fallback to Bitcoin-only
              return {
                privateKey: baseKey.privateKey,
                pageNumber: baseKey.pageNumber.toString(),
                index: baseKey.index,
                addresses: baseKey.addresses,
                balances: baseKey.balances,
                totalBalance: baseKey.totalBalance,
              };
            }
          })
        );
        
        // Convert to the same format as API response
        const serializedData = {
          pageNumber: baseData.pageNumber.toString(),
          keys: multiCurrencyKeys,
          totalPageBalance: baseData.totalPageBalance,
          generatedAt: baseData.generatedAt.toISOString(),
          balancesFetched: baseData.balancesFetched,
          multiCurrency: true,
          currencies: ['BTC', 'BCH', 'DASH', 'DOGE', 'ETH', 'LTC', 'XRP', 'ZEC'],
          metadata: {
            supportedCurrencies: ['BTC', 'BCH', 'DASH', 'DOGE', 'ETH', 'LTC', 'XRP', 'ZEC'],
            totalAddressCount: multiCurrencyKeys.length * 21, // 21 addresses per key for all currencies
            generationTime: 0,
            generatedLocally: true
          }
        };
        data = serializedData;
      } else {
        // Server-side generation with multi-currency support
        console.log('🌐 Using server-side generation (Multi-currency)');
        const response = await fetch('/api/generate-page', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            pageNumber: pageToGenerate,
            keysPerPage: navKeysPerPage,
            multiCurrency: true,  // Legacy flag for backward compatibility
            currencies: ['BTC', 'BCH', 'DASH', 'DOGE', 'ETH', 'LTC', 'XRP', 'ZEC']  // Explicitly request all currencies
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate page');
        }

        data = await response.json();
      }

      setPageData(data);
      setCurrentPage(pageToGenerate);
      
      // Check balances after page generation
      if (data && data.keys && data.keys.length > 0) {
        console.log('🔍 Starting balance check for generated page');
        
        try {
          // Use UnifiedBalanceService for balance checking
          const balanceResponse = await unifiedBalanceService.checkBalancesForPrivateKeys(data, {
            forceLocal: apiSource === 'local'
          });
          
          if (balanceResponse.success && balanceResponse.balances) {
            const allBalances = balanceResponse.balances;
            console.log(`✅ Unified balance check successful - ${Object.keys(allBalances).length} addresses checked`);
            
            // Update page data with balances - unified service handles both multi-currency and legacy formats
            const updatedData = { ...data };
            
            if (data.multiCurrency) {
              console.log('📊 Processing multi-currency format');
              updatedData.keys = updatedData.keys.map((key: any) => {
                const keyBalances: any = {};
                let hasAnyFunds = false;
                const fundedCurrencies: string[] = [];
                
                // For each currency and address type, check if we have balance data
                Object.entries(key.addresses).forEach(([currency, addresses]: [string, any]) => {
                  keyBalances[currency] = {};
                  let currencyHasFunds = false;
                  
                  Object.entries(addresses).forEach(([addrType, address]: [string, any]) => {
                    // Check if this address has balance data and the currency is present
                    if (allBalances[address] && allBalances[address][currency]) {
                      keyBalances[currency][addrType] = allBalances[address][currency];
                      const balance = parseFloat(allBalances[address][currency].balance || '0');
                      if (balance > 0) {
                        hasAnyFunds = true;
                        currencyHasFunds = true;
                      }
                    } else {
                      // Only set zero balance if the address format should support this currency
                      keyBalances[currency][addrType] = { balance: "0", source: "local" };
                    }
                  });
                  
                  if (currencyHasFunds) {
                    fundedCurrencies.push(currency);
                  }
                });
                
                return {
                  ...key,
                  balances: keyBalances,
                  hasAnyFunds,
                  fundedCurrencies,
                  totalBalance: 0 // Will be calculated by existing helper functions
                };
              });
            } else {
              console.log('₿ Processing legacy Bitcoin-only format');
              updatedData.keys = updatedData.keys.map((key: any) => {
                const keyBalances: any = { BTC: {} };
                
                Object.entries(key.addresses).forEach(([addrType, address]: [string, any]) => {
                  if (allBalances[address] && allBalances[address].BTC) {
                    keyBalances.BTC[addrType] = allBalances[address].BTC;
                  } else {
                    keyBalances.BTC[addrType] = { balance: "0", source: "local" };
                  }
                });
                
                return {
                  ...key,
                  balances: keyBalances
                };
              });
            }
            
            setPageData(updatedData);
          } else {
            console.warn('⚠️ Balance check failed or returned no data');
          }
        } catch (balanceError) {
          console.error('Error checking balances:', balanceError);
          // Don't fail the page generation if balance check fails
        }
      }
      
      setNotification({ 
        message: formatTranslation(t.pageGenerated, { page: pageToGenerate }) + 
                (generateLocally ? ' ⚡ (Client-side)' : ' 🌐 (Server-side)'), 
        type: 'success' 
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setNotification({ 
        message: t.failedToGenerate + (generateLocally ? ' (Client-side)' : ' (Server-side)'), 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  // NEW: Direct page change that bypasses slider state
  const handleDirectPageChange = async (pageNumber: string) => {
    setLoading(true);
    setError(null);
    
    try {
      let data;
      
      if (generateLocally) {
        // Client-side generation with multi-currency support
        console.log('🚀 Using client-side direct generation (Multi-currency)');
        const pageBigInt = safeToBigInt(pageNumber);
        
        // Generate base Bitcoin keys first
        const baseData = await clientKeyGenerationService.generatePage(pageBigInt, navKeysPerPage);
        
        // Import multi-currency service for client-side use
        const { multiCurrencyKeyGenerationService } = await import('../lib/services/MultiCurrencyKeyGenerationService');
        
        // Generate multi-currency addresses for each key
        const multiCurrencyKeys = await Promise.all(
          baseData.keys.map(async (baseKey) => {
            try {
              const allAddresses = await multiCurrencyKeyGenerationService.generateMultiCurrencyAddresses(baseKey.privateKey);
              
              return {
                privateKey: baseKey.privateKey,
                pageNumber: baseKey.pageNumber.toString(),
                index: baseKey.index,
                addresses: allAddresses, // Multi-currency format
                balances: {},
                totalBalance: 0,
              };
            } catch (error) {
              console.error('Error generating multi-currency addresses for key:', baseKey.index, error);
              // Fallback to Bitcoin-only
              return {
                privateKey: baseKey.privateKey,
                pageNumber: baseKey.pageNumber.toString(),
                index: baseKey.index,
                addresses: baseKey.addresses,
                balances: baseKey.balances,
                totalBalance: baseKey.totalBalance,
              };
            }
          })
        );
        
        // Convert to the same format as API response
        const serializedData = {
          pageNumber: baseData.pageNumber.toString(),
          keys: multiCurrencyKeys,
          totalPageBalance: baseData.totalPageBalance,
          generatedAt: baseData.generatedAt.toISOString(),
          balancesFetched: baseData.balancesFetched,
          multiCurrency: true,
          currencies: ['BTC', 'BCH', 'DASH', 'DOGE', 'ETH', 'LTC', 'XRP', 'ZEC'],
          metadata: {
            supportedCurrencies: ['BTC', 'BCH', 'DASH', 'DOGE', 'ETH', 'LTC', 'XRP', 'ZEC'],
            totalAddressCount: multiCurrencyKeys.length * 21, // 21 addresses per key for all currencies
            generationTime: 0,
            generatedLocally: true
          }
        };
        data = serializedData;
      } else {
        // Server-side generation with multi-currency support
        console.log('🌐 Using server-side direct generation (Multi-currency)');
        const requestBody = { 
          pageNumber: pageNumber,  // Send as string to preserve precision
          keysPerPage: navKeysPerPage,
          multiCurrency: true,  // Legacy flag for backward compatibility
          currencies: ['BTC', 'BCH', 'DASH', 'DOGE', 'ETH', 'LTC', 'XRP', 'ZEC']  // Explicitly request all currencies
        };
        
        const response = await fetch('/api/generate-page', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error('Failed to generate page');
        }

        data = await response.json();
      }
      
      // Update primary state directly
      setPageData(data);
      setCurrentPage(pageNumber);
      setCurrentKeysPage(1); // Reset to first page of keys
      
      // Check balances after page generation
      if (data) {
        console.log('🔍 Starting balance check for page data:', { 
          multiCurrency: data.multiCurrency, 
          keysCount: data.keys?.length,
          hasKeys: !!data.keys 
        });
        
        try {
          // Use UnifiedBalanceService for balance checking
          const balanceResponse = await unifiedBalanceService.checkBalancesForPrivateKeys(data);
          
          if (balanceResponse.success && balanceResponse.balances) {
            const allBalances = balanceResponse.balances;
            console.log('✅ Unified balance check successful (handleDirectPageChange)');
            
            // Update page data with balances - unified service handles both multi-currency and legacy formats
            const updatedData = { ...data };
            
            if (data.multiCurrency) {
              console.log('📊 Processing multi-currency format');
              updatedData.keys = updatedData.keys.map((key: any) => {
                const keyBalances: any = {};
                let hasAnyFunds = false;
                const fundedCurrencies: string[] = [];
                
                // For each currency and address type, check if we have balance data
                Object.entries(key.addresses).forEach(([currency, addresses]: [string, any]) => {
                  keyBalances[currency] = {};
                  let currencyHasFunds = false;
                  
                  Object.entries(addresses).forEach(([addrType, address]: [string, any]) => {
                    // Check if this address has balance data and the currency is present
                    if (allBalances[address] && allBalances[address][currency]) {
                      keyBalances[currency][addrType] = allBalances[address][currency];
                      const balance = parseFloat(allBalances[address][currency].balance || '0');
                      if (balance > 0) {
                        hasAnyFunds = true;
                        currencyHasFunds = true;
                      }
                    } else {
                      // Only set zero balance if the address format should support this currency
                      keyBalances[currency][addrType] = { balance: "0", source: "local" };
                    }
                  });
                  
                  if (currencyHasFunds) {
                    fundedCurrencies.push(currency);
                  }
                });
                
                return {
                  ...key,
                  balances: keyBalances,
                  hasAnyFunds,
                  fundedCurrencies,
                  totalBalance: 0 // Will be calculated by existing helper functions
                };
              });
            } else {
              console.log('₿ Processing legacy Bitcoin-only format');
              updatedData.keys = updatedData.keys.map((key: any) => {
                const keyBalances: any = { BTC: {} };
                
                Object.entries(key.addresses).forEach(([addrType, address]: [string, any]) => {
                  if (allBalances[address] && allBalances[address].BTC) {
                    keyBalances.BTC[addrType] = allBalances[address].BTC;
                  } else {
                    keyBalances.BTC[addrType] = { balance: "0", source: "local" };
                  }
                });
                
                return {
                  ...key,
                  balances: keyBalances
                };
              });
            }
            
            setPageData(updatedData);
            console.log('💰 Balance data updated in page state');
          } else {
            console.warn('⚠️ Balance check failed or returned no data');
          }
        } catch (balanceError) {
          console.error('💥 Balance check error:', balanceError);
        }
      } else {
        console.warn('⚠️ No page data available for balance check');
      }
      
      // Only update navigation store if number is within safe range
      try {
        const pageNum = parseFloat(pageNumber);
        if (pageNum <= Number.MAX_SAFE_INTEGER && pageNum >= 1) {
          setNavCurrentPage(Math.floor(pageNum));
        } else {
          // Don't update navCurrentPage for extremely large numbers
          // The AdvancedNavigation component gets currentPage directly as a prop
        }
      } catch {
        // Could not parse page number for navigation store
      }
      
      setNotification({ 
        message: formatTranslation(t.pageGenerated, { page: pageNumber }) + 
                (generateLocally ? ' ⚡ (Client-side)' : ' 🌐 (Server-side)'), 
        type: 'success' 
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setNotification({ message: t.failedToGenerate, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRandomPage = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      // Generate random page using navigation store
      const randomPage = generateRandomPage();
      const randomPageStr = randomPage.toString();
      console.log(`🎲 Generated random page: ${randomPageStr} (mode: ${generateLocally ? 'local' : 'server'})`);
      
      let data;

      if (generateLocally) {
        // Client-side generation with multi-currency support
        console.log('🖥️ Using local generation for random page (Multi-currency)');
        const pageBigInt = safeToBigInt(randomPageStr);
        
        // Generate base Bitcoin keys first
        const baseData = await clientKeyGenerationService.generatePage(pageBigInt, navKeysPerPage);
        
        // Import multi-currency service for client-side use
        const { multiCurrencyKeyGenerationService } = await import('../lib/services/MultiCurrencyKeyGenerationService');
        
        // Generate multi-currency addresses for each key
        const multiCurrencyKeys = await Promise.all(
          baseData.keys.map(async (baseKey) => {
            try {
              const allAddresses = await multiCurrencyKeyGenerationService.generateMultiCurrencyAddresses(baseKey.privateKey);
              
              return {
                privateKey: baseKey.privateKey,
                pageNumber: baseKey.pageNumber.toString(),
                index: baseKey.index,
                addresses: allAddresses, // Multi-currency format
                balances: {},
                totalBalance: 0,
              };
            } catch (error) {
              console.error('Error generating multi-currency addresses for key:', baseKey.index, error);
              // Fallback to Bitcoin-only
              return {
                privateKey: baseKey.privateKey,
                pageNumber: baseKey.pageNumber.toString(),
                index: baseKey.index,
                addresses: baseKey.addresses,
                balances: baseKey.balances,
                totalBalance: baseKey.totalBalance,
              };
            }
          })
        );
        
        // Convert to the same format as API response
        const serializedData = {
          pageNumber: baseData.pageNumber.toString(),
          keys: multiCurrencyKeys,
          totalPageBalance: baseData.totalPageBalance,
          generatedAt: baseData.generatedAt.toISOString(),
          balancesFetched: baseData.balancesFetched,
          multiCurrency: true,
          currencies: ['BTC', 'BCH', 'DASH', 'DOGE', 'ETH', 'LTC', 'XRP', 'ZEC'],
          metadata: {
            supportedCurrencies: ['BTC', 'BCH', 'DASH', 'DOGE', 'ETH', 'LTC', 'XRP', 'ZEC'],
            totalAddressCount: multiCurrencyKeys.length * 21, // 21 addresses per key for all currencies
            generationTime: 0,
            generatedLocally: true
          }
        };
        data = serializedData;
      } else {
        // Server generation with multi-currency support
        console.log('🌐 Using server generation for random page (Multi-currency)');
        const response = await fetch('/api/generate-page', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            pageNumber: randomPageStr,
            keysPerPage: navKeysPerPage,
            multiCurrency: true,  // Legacy flag for backward compatibility
            currencies: ['BTC', 'BCH', 'DASH', 'DOGE', 'ETH', 'LTC', 'XRP', 'ZEC']  // Explicitly request all currencies
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
          throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        data = await response.json();
      }

      // Update state and check balances
      setPageData(data);
      setCurrentPage(data.pageNumber);
      setCurrentKeysPage(1); // Reset to first page of keys
      
      // Convert randomPage to number for navigation store (handle large numbers gracefully)
      try {
        const pageNum = parseFloat(randomPageStr);
        if (pageNum <= Number.MAX_SAFE_INTEGER && pageNum >= 1) {
          setNavCurrentPage(Math.floor(pageNum));
        }
      } catch {
        // Could not parse page number for navigation store
      }
      
      // Check balances after page generation
      if (data) {
        console.log('🔍 Starting balance check for page data:', { 
          multiCurrency: data.multiCurrency, 
          keysCount: data.keys?.length,
          hasKeys: !!data.keys 
        });
        
        try {
          // Use UnifiedBalanceService for balance checking
          const balanceResponse = await unifiedBalanceService.checkBalancesForPrivateKeys(data);
          
          if (balanceResponse.success && balanceResponse.balances) {
            const allBalances = balanceResponse.balances;
            console.log('✅ Unified balance check successful (handleRandomPage)');
            
            // Update page data with balances - unified service handles both multi-currency and legacy formats
            const updatedData = { ...data };
            
            if (data.multiCurrency) {
              console.log('📊 Processing multi-currency format');
              updatedData.keys = updatedData.keys.map((key: any) => {
                const keyBalances: any = {};
                let hasAnyFunds = false;
                const fundedCurrencies: string[] = [];
                
                // For each currency and address type, check if we have balance data
                Object.entries(key.addresses).forEach(([currency, addresses]: [string, any]) => {
                  keyBalances[currency] = {};
                  let currencyHasFunds = false;
                  
                  Object.entries(addresses).forEach(([addrType, address]: [string, any]) => {
                    // Check if this address has balance data and the currency is present
                    if (allBalances[address] && allBalances[address][currency]) {
                      keyBalances[currency][addrType] = allBalances[address][currency];
                      const balance = parseFloat(allBalances[address][currency].balance || '0');
                      if (balance > 0) {
                        hasAnyFunds = true;
                        currencyHasFunds = true;
                      }
                    } else {
                      keyBalances[currency][addrType] = { balance: "0", source: "local" };
                    }
                  });
                  
                  if (currencyHasFunds) {
                    fundedCurrencies.push(currency);
                  }
                });
                
                return {
                  ...key,
                  balances: keyBalances,
                  hasAnyFunds,
                  fundedCurrencies,
                  totalBalance: 0 // Will be calculated by existing helper functions
                };
              });
            } else {
              console.log('₿ Processing legacy Bitcoin-only format');
              updatedData.keys = updatedData.keys.map((key: any) => {
                const keyBalances: any = { BTC: {} };
                
                Object.entries(key.addresses).forEach(([addrType, address]: [string, any]) => {
                  if (allBalances[address] && allBalances[address].BTC) {
                    keyBalances.BTC[addrType] = allBalances[address].BTC;
                  } else {
                    keyBalances.BTC[addrType] = { balance: "0", source: "local" };
                  }
                });
                
                return {
                  ...key,
                  balances: keyBalances
                };
              });
            }
            
            setPageData(updatedData);
          } else {
            console.warn('⚠️ Balance check failed or returned no data');
          }
        } catch (balanceError) {
          console.warn('Failed to fetch balances:', balanceError);
        }
      }
      
      setNotification({ 
        message: `🎲 Random page ${data.pageNumber} generated successfully ${generateLocally ? '(Local)' : '(Server)'}`, 
        type: 'success' 
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Random page generation failed:', errorMessage);
      setError(errorMessage);
      setNotification({ message: '❌ Failed to generate random page', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRandomKeyInPage = (keyIndex: number) => {
    // Scroll to the random key and highlight it
    if (pageData && pageData.keys && pageData.keys[keyIndex]) {
      // Expand the key to show details
      setExpandedKeys(new Set([keyIndex]));
      
      // Scroll to the key (implement smooth scrolling)
      setTimeout(() => {
        const keyElement = document.querySelector(`[data-key-index="${keyIndex}"]`);
        if (keyElement) {
          keyElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
          
          // Add a temporary highlight effect
          keyElement.classList.add('highlight-flash');
          setTimeout(() => {
            keyElement.classList.remove('highlight-flash');
          }, 2000);
        }
      }, 100);
      
      setNotification({ 
        message: `Random key #${keyIndex + 1} selected in current page`, 
        type: 'info' 
      });
    }
  };

  const handleScannerStart = async (config: any) => {
    console.log('Scanner start called with config:', config);
    if (!pageData) {
      console.log('No page data available');
      return;
    }

    try {
      // Implementation for scanner start logic can be added here
      console.log('Starting scanner with config:', config);
    } catch (error) {
      console.error('Scanner start error:', error);
    }
  };

  // Placeholder scanner functions for ControlPanel compatibility
  const handleStartScan = () => {
    console.log('Scanner functionality moved to ScannerCard component');
  };

  const handleStopScan = () => {
    console.log('Scanner functionality moved to ScannerCard component');
  };



  const displayedKeys = useMemo(() => {
    if (!pageData) return [];
    const startIndex = (currentKeysPage - 1) * keysPerPage;
    return pageData.keys.slice(startIndex, startIndex + keysPerPage);
  }, [pageData, currentKeysPage, keysPerPage]);

    // Convert BigInt to number for UI components that expect number
  const totalPagesForUI = useMemo(() => {
    // For very large numbers, try to parse as BigInt first, then convert to number
    try {
      // Use the utility method to get BigInt value
      const pageBigInt = navTotalPages ? BigInt(navTotalPages) : BigInt(1);
      // Use BigInt for very large numbers, Number for smaller ones
      if (pageBigInt > BigInt(Number.MAX_SAFE_INTEGER)) {
        // Only warn occasionally to avoid console spam
        if (Math.random() < 0.01) {
          console.warn(`Total pages (${pageBigInt.toString()}) exceeds MAX_SAFE_INTEGER, UI may show approximation`);
        }
        return Number.MAX_SAFE_INTEGER;
      }
      return Number(pageBigInt);
    } catch (error) {
      console.error('Error converting totalPages to number:', error);
      return 1;
    }
  }, [navTotalPages]);

  const handlePageChange = useThrottle(useCallback((page: string) => {
    // Handle large page numbers as strings to avoid precision loss
    let pageNumber: number;
    
    // For very large numbers, try to parse as BigInt first, then convert to number
    if (page.length > 15) {
      try {
        const pageBigInt = safeToBigInt(page);
        // Use BigInt for very large numbers, Number for smaller ones
        if (pageBigInt > BigInt(Number.MAX_SAFE_INTEGER)) {
          // For very large page numbers, work with string representation
          pageNumber = Number.MAX_SAFE_INTEGER;
          // Only log this occasionally to avoid console spam
          if (Math.random() < 0.01) { // Log ~1% of the time
            console.log(`Large page number detected: ${page}. Using string-based operations.`);
          }
        } else {
          pageNumber = Number(pageBigInt);
        }
      } catch {
        // Fallback to parseInt for smaller numbers
        pageNumber = parseInt(page);
      }
    } else {
      pageNumber = parseInt(page);
    }
    
    if (isNaN(pageNumber) || pageNumber < 1) return;
    
    setCurrentPage(page);
    setNavCurrentPage(pageNumber);
    setCurrentKeysPage(1); // Reset to first page of keys when changing main page
    // Automatically generate the new page - always send as string to preserve precision
    handleGeneratePage(page);
  }, [setNavCurrentPage, handleGeneratePage]), 100);

  const handleKeysPerPageChange = useCallback((newKeysPerPage: number) => {
    // Calculate the current position in the keyspace using BigInt for precision
    let currentPosition: number;
    
    // Handle large page numbers properly
    if (currentPage.length > 15) {
      try {
        const currentPageBigInt = safeToBigInt(currentPage);
        currentPosition = Number((currentPageBigInt - BigInt(1)) * BigInt(keysPerPage));
      } catch {
        // Fallback for smaller numbers
        currentPosition = (parseInt(currentPage) - 1) * keysPerPage;
      }
    } else {
      currentPosition = (parseInt(currentPage) - 1) * keysPerPage;
    }
    
    // Calculate the new page number that maintains the same position
    const newPageNumber = Math.floor(currentPosition / newKeysPerPage) + 1;
    
    setKeysPerPage(newKeysPerPage);
    setNavKeysPerPage(newKeysPerPage);
    setCurrentKeysPage(1); // Reset to first page when changing keys per page
    
    // Update the current page to maintain position
    setCurrentPage(newPageNumber.toString());
    setNavCurrentPage(newPageNumber);
    
    // Regenerate the page with the new keys per page
    handleGeneratePage(newPageNumber.toString());
  }, [setNavKeysPerPage, handleGeneratePage, currentPage, keysPerPage, setNavCurrentPage]);

  const handleApiSourceChange = useCallback((source: string) => {
    setApiSource(source);
  }, []);

  const handleToggleDisplayMode = useThrottle(useCallback(() => {
    setDisplayMode(prev => prev === 'grid' ? 'table' : 'grid');
  }, []), 100);

  // Detect if current page data is multi-currency format
  const isMultiCurrency = useMemo(() => {
    if (!pageData || !pageData.keys || pageData.keys.length === 0) return false;
    
    // Check if any key has the multi-currency address structure
    const firstKey = pageData.keys[0];
    if (!firstKey.addresses) return false;
    
    // Multi-currency format has nested objects like { BTC: { p2pkh_compressed: "..." }, ETH: { standard: "..." } }
    // Legacy format has direct properties like { p2pkh_compressed: "..." }
    const addressesObj = firstKey.addresses as any;
    const isMultiCurrencyFormat = typeof addressesObj === 'object' && 
      !addressesObj.p2pkh_compressed && // Legacy format has direct properties
      Object.keys(addressesObj).some(key => 
        typeof addressesObj[key] === 'object' && addressesObj[key] !== null
      );
    
    return isMultiCurrencyFormat || pageData.multiCurrency === true;
  }, [pageData]);

  // Extract currencies from multi-currency data
  const activeCurrencies = useMemo(() => {
    if (!isMultiCurrency || !pageData?.keys) return ['BTC'];
    
    const currencies = new Set<string>();
    pageData.keys.forEach((key) => {
      if (key.addresses && typeof key.addresses === 'object') {
        const addressesObj = key.addresses as any;
        Object.keys(addressesObj).forEach(currency => {
          if (typeof addressesObj[currency] === 'object' && addressesObj[currency] !== null) {
            currencies.add(currency);
          }
        });
      }
    });
    
    return Array.from(currencies).length > 0 ? Array.from(currencies) : ['BTC'];
  }, [isMultiCurrency, pageData]);

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        background: mode === 'dark' 
          ? 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #2d2d2d 100%)' 
          : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
        transition: 'all 0.3s ease-in-out'
      }}
    >
      <FloatingNavigation />
      
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        {/* Header */}
        <Fade in timeout={800}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography 
              variant="h3" 
              component="h1" 
              sx={{ 
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontSize: { xs: '2rem', md: '3rem' }
              }}
            >
              {isMultiCurrency ? 'Multi-Currency Keyspace Explorer' : t.title}
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
              {isMultiCurrency ? `Exploring ${activeCurrencies.length} cryptocurrencies simultaneously` : t.subtitle}
            </Typography>
          </Box>
        </Fade>

        {/* Control Panel */}
        <ControlPanel
          currentPage={currentPage}
          onPageChange={handlePageChange}
          onGeneratePage={() => handleGeneratePage()}
          onToggleDisplayMode={handleToggleDisplayMode}
          apiSource={apiSource}
          onApiSourceChange={handleApiSourceChange}
          displayMode={displayMode}
          loading={loading}
          lastChecked={pageData?.generatedAt || null}
          hasFunds={pageData?.totalPageBalance ? pageData.totalPageBalance > 0 : false}
          generateLocally={generateLocally}
          onToggleLocalGeneration={setGenerateLocally}
        />

        {/* Crypto Price Dashboard - Live cryptocurrency prices */}
        {isMultiCurrency && (
          <CryptoPriceDashboard
            refreshInterval={30000}
            defaultCollapsed={true}
          />
        )}





        {/* Scanner Card */}
        <ScannerCard
          currentPage={currentPage}
          totalPages={Number(navTotalPages)}
          onPageChange={handlePageChange}
          onDirectPageChange={handleDirectPageChange}
          generateLocally={generateLocally}
        />

        {/* Random Key Card */}
        {/* <RandomKeyCard
          currentPage={currentPage}
          onRandomPage={handleRandomPage}
          onRandomKeyInPage={handleRandomKeyInPage}
          keysPerPage={keysPerPage}
          generateLocally={generateLocally}
          disabled={loading}
        /> */}

        {/* Advanced Navigation */}
        <AdvancedNavigation
          currentPage={currentPage}
          totalPages={Number(navTotalPages)}
          onPageChange={handlePageChange}
          onDirectPageChange={handleDirectPageChange}
          keysPerPage={navKeysPerPage}
          onKeysPerPageChange={handleKeysPerPageChange}
        />

        {/* Keyspace Slider */}
        <KeyspaceSlider
          currentPage={currentPage}
          totalPages={Number(navTotalPages)}
          onPageChange={handlePageChange}
          disabled={loading}
        />

        {/* Simple Page Navigation Card */}
        <Card sx={{ mb: 2, p: 2 }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
              📄 Page Navigation
            </Typography>
          </Box>
          
          {/* Page Info */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 'medium' }}>
              Page {Number(currentPage).toLocaleString()} of {Number(navTotalPages).toLocaleString()}
            </Typography>
          </Box>
          
          {/* Navigation Buttons - Centered at Bottom */}
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0.5 }}>
            <Tooltip title="First Page" arrow>
              <IconButton
                size="small"
                onClick={() => handlePageChange('1')}
                disabled={currentPage === '1'}
                sx={{ 
                  border: '1px solid',
                  borderColor: 'primary.main',
                  '&:disabled': { borderColor: 'action.disabled' }
                }}
              >
                <FirstPageIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Previous Page" arrow>
              <IconButton
                size="small"
                onClick={() => {
                  try {
                    // Use BigInt arithmetic for reliable large number handling
                    const currentPageBigInt = safeToBigInt(currentPage);
                    if (currentPageBigInt > BigInt(1)) {
                      const previousPage = currentPageBigInt - BigInt(1);
                      handlePageChange(previousPage.toString());
                    }
                  } catch (error) {
                    console.error('Previous page calculation error:', error);
                    // Fallback to string-based parsing
                    const currentPageNum = parseFloat(currentPage);
                    if (currentPageNum > 1) {
                      handlePageChange(Math.max(1, currentPageNum - 1).toString());
                    }
                  }
                }}
                disabled={currentPage === '1'}
                sx={{ 
                  border: '1px solid',
                  borderColor: 'primary.main',
                  '&:disabled': { borderColor: 'action.disabled' }
                }}
              >
                <NavigateBeforeIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Typography variant="body2" color="text.secondary" sx={{ mx: 1, minWidth: '20px', textAlign: 'center' }}>
              |
            </Typography>
            
            <Tooltip title="Random Page (1 to Max Bitcoin Keyspace)" arrow>
              <IconButton
                size="small"
                onClick={() => {
                  try {
                    // Calculate max possible pages in Bitcoin keyspace
                    // Bitcoin private key space is 2^256, divided by keysPerPage
                    const maxBitcoinKeys = BigInt('115792089237316195423570985008687907852837564279074904382605163141518161494336'); // 2^256
                    const maxPages = maxBitcoinKeys / BigInt(navKeysPerPage);
                    
                                                              // Generate a secure random page number
                     handleRandomPage();
                     return; // handleRandomPage already calls handlePageChange
                   } catch (error) {
                     console.error('Random page generation error:', error);
                     // Fallback to a simple random within reasonable bounds
                     handleRandomPage();
                  }
                }}
                sx={{ 
                  border: '1px solid',
                  borderColor: 'secondary.main',
                  '&:hover': { borderColor: 'secondary.dark' }
                }}
              >
                <Typography sx={{ fontSize: '1rem' }}>🎲</Typography>
              </IconButton>
            </Tooltip>
            
            <Typography variant="body2" color="text.secondary" sx={{ mx: 1, minWidth: '20px', textAlign: 'center' }}>
              |
            </Typography>
            
            <Tooltip title="Next Page" arrow>
              <IconButton
                size="small"
                onClick={() => {
                  try {
                    // Use BigInt arithmetic for reliable large number handling
                    const currentPageBigInt = safeToBigInt(currentPage);
                    const nextPage = currentPageBigInt + BigInt(1);
                    handlePageChange(nextPage.toString());
                  } catch (error) {
                    console.error('Next page calculation error:', error);
                    // Fallback to string-based parsing
                    const currentPageNum = parseFloat(currentPage);
                    handlePageChange((currentPageNum + 1).toString());
                  }
                }}
                sx={{ 
                  border: '1px solid',
                  borderColor: 'primary.main'
                }}
              >
                <NavigateNextIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Last Page (Max Bitcoin Keyspace)" arrow>
              <IconButton
                size="small"
                onClick={() => {
                  try {
                    // Calculate max possible pages in Bitcoin keyspace
                    const maxBitcoinKeys = BigInt('115792089237316195423570985008687907852837564279074904382605163141518161494336'); // 2^256
                    const maxPages = maxBitcoinKeys / BigInt(navKeysPerPage);
                    handlePageChange(maxPages.toString());
                  } catch (error) {
                    console.error('Last page calculation error:', error);
                    // Fallback to a large but safe number
                    handlePageChange('999999999999999999999999999999999999999999999999999999999999999999999999999');
                  }
                }}
                sx={{ 
                  border: '1px solid',
                  borderColor: 'primary.main'
                }}
              >
                <LastPageIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Page Data Display */}
        {pageData && (
          <Card sx={{ 
            background: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)', 
            backdropFilter: 'blur(10px)' 
          }}>
              <CardContent>


                <UltraOptimizedDashboard
                  pageData={pageData}
                  displayedKeys={displayedKeys}
                  keysPerPage={keysPerPage}
                  currentKeysPage={currentKeysPage}
                  expandedKeys={expandedKeys}
                  onToggleExpansion={toggleKeyExpansion}
                  displayMode={displayMode}
                />

                {/* Navigation */}
                {pageData.keys.length > keysPerPage && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 3, gap: 1 }}>
                    <Tooltip title={t.firstPage} arrow>
                      <IconButton
                        onClick={() => setCurrentKeysPage(1)}
                        disabled={currentKeysPage === 1}
                        size="small"
                      >
                        <FirstPageIcon />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title={t.previousPage} arrow>
                      <IconButton
                        onClick={() => setCurrentKeysPage(prev => Math.max(1, prev - 1))}
                        disabled={currentKeysPage === 1}
                        size="small"
                      >
                        <NavigateBeforeIcon />
                      </IconButton>
                    </Tooltip>
                    
                    <Typography variant="body2" sx={{ mx: 2, minWidth: '60px', textAlign: 'center' }}>
                      {formatTranslation(t.pageOf, { current: currentKeysPage, total: totalPagesForUI })}
                    </Typography>
                    
                    <Tooltip title={t.nextPage} arrow>
                      <IconButton
                        onClick={() => setCurrentKeysPage(prev => Math.min(totalPagesForUI, prev + 1))}
                        disabled={currentKeysPage === totalPagesForUI}
                        size="small"
                      >
                        <NavigateNextIcon />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title={t.lastPage} arrow>
                      <IconButton
                        onClick={() => setCurrentKeysPage(totalPagesForUI)}
                        disabled={currentKeysPage === totalPagesForUI}
                        size="small"
                      >
                        <LastPageIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}
              </CardContent>
            </Card>
        )}

        {/* Info Cards - Disabled for performance */}
        {false && (
          <Grid container spacing={3} sx={{ mt: 3 }}>
            <Grid item xs={12} md={4}>
              <Tooltip title="Learn more about Bitcoin address types and formats" arrow>
                <Card sx={{ 
                  background: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)', 
                  backdropFilter: 'blur(10px)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-4px)' }
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <InfoIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6">Address Types</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      P2PKH, P2SH, P2WPKH, P2TR - Each key generates multiple address formats for comprehensive scanning.
                    </Typography>
                  </CardContent>
                </Card>
              </Tooltip>
            </Grid>

            <Grid item xs={12} md={4}>
              <Tooltip title="Real-time balance checking via multiple APIs" arrow>
                <Card sx={{ 
                  background: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)', 
                  backdropFilter: 'blur(10px)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-4px)' }
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <BalanceIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6">Balance Checking</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Verify address balances in real-time using multiple APIs with rate limiting and error handling.
                    </Typography>
                  </CardContent>
                </Card>
              </Tooltip>
            </Grid>

            <Grid item xs={12} md={4}>
              <Tooltip title="Automated scanning with notifications" arrow>
                <Card sx={{ 
                  background: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)', 
                  backdropFilter: 'blur(10px)',
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'translateY(-4px)' }
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <SpeedIcon sx={{ mr: 1, color: 'primary.main' }} />
                      <Typography variant="h6">Automated Scanning</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Continuous scanning with automatic notifications when funds are discovered via Telegram integration.
                    </Typography>
                  </CardContent>
                </Card>
              </Tooltip>
            </Grid>
          </Grid>
        )}
      </Box>

      {/* Notifications */}
      <Snackbar
        open={!!notification}
        autoHideDuration={6000}
        onClose={() => setNotification(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setNotification(null)} 
          severity={notification?.type} 
          sx={{ width: '100%' }}
        >
          {notification?.message}
        </Alert>
      </Snackbar>

      {/* Loading Overlay */}
      {loading && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <Card sx={{ p: 3, textAlign: 'center' }}>
            <LinearProgress sx={{ mb: 2 }} />
            <Typography>{t.processing}</Typography>
          </Card>
        </Box>
      )}
    </Box>
  );
}
