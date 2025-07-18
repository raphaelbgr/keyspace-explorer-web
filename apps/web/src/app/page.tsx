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
import { useTranslation, formatTranslation } from './translations';
import FloatingNavigation from './components/FloatingNavigation';
import ControlPanel from './components/ControlPanel';
import AdvancedNavigation from './components/AdvancedNavigation';
import KeyspaceSlider from './components/KeyspaceSlider';
import ScannerModal from './components/ScannerModal';
import UltraOptimizedDashboard from './components/UltraOptimizedDashboard';
import BalanceStatus from './components/BalanceStatus';
import { useScannerStore } from './store/scannerStore';

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
    };
    balances: {
      p2pkh_compressed: number;
      p2pkh_uncompressed: number;
      p2wpkh: number;
      p2sh_p2wpkh: number;
      p2tr: number;
    };
    totalBalance: number;
  }>;
  totalPageBalance: number;
  generatedAt: string;
  balancesFetched: boolean;
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
  const [apiSource, setApiSource] = useState<string>('local');
  const [expandedKeys, setExpandedKeys] = useState<Set<number>>(new Set());
  const [displayMode, setDisplayMode] = useState<'grid' | 'table'>('table');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [keysPerPage, setKeysPerPage] = useState(45);
  const [currentKeysPage, setCurrentKeysPage] = useState(1);
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const [checkedAddresses, setCheckedAddresses] = useState(0);
  
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

  const handleGeneratePage = async (pageNumber?: string) => {
    const pageToGenerate = pageNumber || currentPage;
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/generate-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          pageNumber: pageToGenerate,
          keysPerPage: navKeysPerPage 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate page');
      }

      const data = await response.json();
      setPageData(data);
      setCurrentPage(pageToGenerate);
      setNotification({ message: formatTranslation(t.pageGenerated, { page: pageToGenerate }), type: 'success' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setNotification({ message: t.failedToGenerate, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // NEW: Direct page change that bypasses slider state
  const handleDirectPageChange = async (pageNumber: string) => {
    console.log('handleDirectPageChange called with pageNumber:', pageNumber);
    console.log('pageNumber type:', typeof pageNumber);
    
    setLoading(true);
    setError(null);
    
    try {
      // Call API directly first (API can handle string page numbers)
      const requestBody = { 
        pageNumber: pageNumber,  // Send as string to preserve precision
        keysPerPage: navKeysPerPage 
      };
      
      console.log('Sending API request with body:', JSON.stringify(requestBody));
      
      const response = await fetch('/api/generate-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error('Failed to generate page');
      }

      const data = await response.json();
      
      // Update primary state directly
      setPageData(data);
      setCurrentPage(pageNumber);
      setCurrentKeysPage(1); // Reset to first page of keys
      
      // Only update navigation store if number is within safe range
      try {
        const pageNum = parseFloat(pageNumber);
        if (pageNum <= Number.MAX_SAFE_INTEGER && pageNum >= 1) {
          setNavCurrentPage(Math.floor(pageNum));
        } else {
          console.log('Page number too large for navigation store, skipping navCurrentPage update');
          // Don't update navCurrentPage for extremely large numbers
          // The AdvancedNavigation component gets currentPage directly as a prop
        }
      } catch {
        console.log('Could not parse page number for navigation store');
      }
      
      setNotification({ message: formatTranslation(t.pageGenerated, { page: pageNumber }), type: 'success' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setNotification({ message: t.failedToGenerate, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleRandomPage = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Generate random page using navigation store
      const randomPage = generateRandomPage();
      const response = await fetch('/api/generate-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageNumber: randomPage.toString() }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate random page');
      }

      const data = await response.json();
      setPageData(data);
      setCurrentPage(data.pageNumber);
      setNavCurrentPage(randomPage);
      setNotification({ message: `Random page ${data.pageNumber} generated successfully`, type: 'success' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setNotification({ message: 'Failed to generate random page', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleStartScan = async () => {
    setScannerOpen(true);
  };

  const handleScannerStart = async (config: any) => {
    console.log('Scanner start called with config:', config);
    if (!pageData) {
      console.log('No page data available');
      return;
    }
    
    setIsScanning(true);
    setScanProgress(0);
    setNotification({ message: t.scanStarted, type: 'info' });
    
    try {
      // Use the scanner store to manage scanning state
      const { startScan } = useScannerStore.getState();
      console.log('Starting scan with store');
      startScan(config);
      
      // Start the scanning process
      const addresses = pageData.keys.flatMap(key => Object.values(key.addresses));
      console.log('Checking addresses:', addresses.length);
      
      const response = await fetch('/api/balances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addresses, source: config.apiSource || apiSource }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch balances');
      }

      const { balances } = await response.json();
      console.log('Balances received:', balances.length);
      
      // Update scanner store with results
      const { updateBalance } = useScannerStore.getState();
      const totalBalance = balances.reduce((sum: number, b: any) => sum + b.balance, 0);
      console.log('Total balance:', totalBalance);
      updateBalance(totalBalance);
      
      setNotification({ message: t.scanCompleted, type: 'success' });
    } catch (err) {
      console.error('Scanner error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setNotification({ message: t.scanFailed, type: 'error' });
    } finally {
      setIsScanning(false);
      setScanProgress(100);
    }
  };

  const handleStopScan = () => {
    // Use scanner store to stop scanning
    const { stopScan } = useScannerStore.getState();
    stopScan();
    
    setIsScanning(false);
    setScanProgress(0);
    setNotification({ message: t.scanStopped, type: 'info' });
  };

  const handleFetchBalances = async () => {
    if (!pageData) return;
    
    setLoading(true);
    setCheckedAddresses(0);
    try {
      const addresses = pageData.keys.flatMap(key => Object.values(key.addresses));
      const response = await fetch('/api/balances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addresses, source: apiSource }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch balances');
      }

      const { balances, source, totalAddresses, checkedAt } = await response.json();
      
      // Update page data with real balances
      const updatedKeys = pageData.keys.map(key => {
        const keyBalances = {
          p2pkh_compressed: 0,
          p2pkh_uncompressed: 0,
          p2wpkh: 0,
          p2sh_p2wpkh: 0,
          p2tr: 0,
        };
        
        // Find balances for this key's addresses
        Object.entries(key.addresses).forEach(([type, address]) => {
          const balanceData = balances.find((b: { address: string; balance: number }) => b.address === address);
          if (balanceData) {
            keyBalances[type as keyof typeof keyBalances] = balanceData.balance;
          }
        });
        
        const totalBalance = Object.values(keyBalances).reduce((sum, balance) => sum + balance, 0);
        
        // Check for balances and notify if found
        Object.entries(key.addresses).forEach(async ([type, address]) => {
          const balanceData = balances.find((b: { address: string; balance: number }) => b.address === address);
          if (balanceData && balanceData.balance > 0) {
            // Send notification asynchronously
            fetch('/api/notify-match', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                privateKey: key.privateKey,
                address: address,
                balance: balanceData.balance,
                addressType: type
              }),
            }).catch(error => {
              console.error('Failed to send notification:', error);
            });
          }
        });
        
        return {
          ...key,
          balances: keyBalances,
          totalBalance,
        };
      });
      
      const totalPageBalance = updatedKeys.reduce((sum, key) => sum + key.totalBalance, 0);
      
      setPageData({
        ...pageData,
        keys: updatedKeys,
        totalPageBalance,
        balancesFetched: true,
      });
      
      setLastChecked(checkedAt);
      setCheckedAddresses(totalAddresses);
      
      setNotification({ 
        message: formatTranslation(t.balancesFetched, { source, count: totalAddresses }), 
        type: 'success' 
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setNotification({ message: t.failedToFetch, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const displayedKeys = useMemo(() => {
    if (!pageData) return [];
    const startIndex = (currentKeysPage - 1) * keysPerPage;
    return pageData.keys.slice(startIndex, startIndex + keysPerPage);
  }, [pageData, currentKeysPage, keysPerPage]);

  const totalPages = useMemo(() => {
    // Convert BigInt to number for UI components that expect number
    return typeof navTotalPages === 'bigint' ? Number(navTotalPages) : navTotalPages;
  }, [navTotalPages]);

  const handlePageChange = useThrottle(useCallback((page: string) => {
    // Handle large page numbers as strings to avoid precision loss
    let pageNumber: number;
    
    // For very large numbers, try to parse as BigInt first, then convert to number
    if (page.length > 15) {
      try {
        const pageBigInt = BigInt(page);
        pageNumber = Number(pageBigInt);
        // Check if the conversion lost precision
        if (pageBigInt !== BigInt(pageNumber)) {
          console.warn('Page number precision lost during conversion');
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
        const currentPageBigInt = BigInt(currentPage);
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
              {t.title}
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
              {t.subtitle}
            </Typography>
          </Box>
        </Fade>

        {/* Control Panel */}
        <ControlPanel
          currentPage={currentPage}
          onPageChange={handlePageChange}
          onGeneratePage={() => handleGeneratePage()}
          onFetchBalances={handleFetchBalances}
          onStartScan={handleStartScan}
          onStopScan={handleStopScan}
          onToggleDisplayMode={handleToggleDisplayMode}
          apiSource={apiSource}
          onApiSourceChange={handleApiSourceChange}
          displayMode={displayMode}
          loading={loading}
          isScanning={isScanning}
          pageData={pageData}
          scanProgress={scanProgress}
        />

        {/* Keyspace Slider */}
        <KeyspaceSlider
          currentPage={navCurrentPage}
          totalPages={navTotalPages}
          onPageChange={handlePageChange}
          disabled={loading}
        />

        {/* Advanced Navigation */}
        <AdvancedNavigation
          currentPage={currentPage}
          totalPages={navTotalPages}
          onPageChange={handlePageChange}
          onDirectPageChange={handleDirectPageChange}
          onRandomPage={handleRandomPage}
          keysPerPage={navKeysPerPage}
          onKeysPerPageChange={handleKeysPerPageChange}
        />

        {/* Scanner Modal */}
        <ScannerModal
          open={scannerOpen}
          onClose={() => setScannerOpen(false)}
          onScanStart={handleScannerStart}
          currentPage={parseInt(currentPage)}
        />

        {/* Balance Status */}
        {pageData && (
          <BalanceStatus
            totalBalance={pageData.totalPageBalance}
            totalAddresses={pageData.keys.length * 5} // 5 addresses per key
            checkedAddresses={checkedAddresses}
            lastChecked={lastChecked}
            isChecking={loading}
            source={apiSource}
            onRefresh={handleFetchBalances}
            hasFunds={pageData.totalPageBalance > 0}
          />
        )}

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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                  <Typography variant="h5" component="h2">
                    {formatTranslation(t.pageResults, { page: pageData.pageNumber })}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Chip 
                      label={`${pageData.keys.length} ${t.keys}`} 
                      color="primary" 
                    />
                    <Chip 
                      label={`${pageData.totalPageBalance.toFixed(8)} ${t.btc}`} 
                      color="secondary" 
                      icon={<BalanceIcon />}
                    />
                  </Box>
                </Box>

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
                      {formatTranslation(t.pageOf, { current: currentKeysPage, total: totalPages })}
                    </Typography>
                    
                    <Tooltip title={t.nextPage} arrow>
                      <IconButton
                        onClick={() => setCurrentKeysPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentKeysPage === totalPages}
                        size="small"
                      >
                        <NavigateNextIcon />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title={t.lastPage} arrow>
                      <IconButton
                        onClick={() => setCurrentKeysPage(totalPages)}
                        disabled={currentKeysPage === totalPages}
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
