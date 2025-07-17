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
import ThemeToggleClient from './components/ThemeToggleClient';
import ControlPanel from './components/ControlPanel';
import KeyCard from './components/KeyCard';
import KeyTableRow from './components/KeyTableRow';

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
  const [keysPerPage, setKeysPerPage] = useState(45);
  const [currentKeysPage, setCurrentKeysPage] = useState(1);
  
  // Performance optimizations
  const debouncedCurrentPage = useDebounce(currentPage, 300);
  const expandedKeysRef = useRef<Set<number>>(new Set());
  const lastRenderTime = useRef<number>(0);

  // Auto-load first page on component mount
  useEffect(() => {
    handleGeneratePage('1');
  }, []);

  const handleGeneratePage = async (pageNumber?: string) => {
    const pageToGenerate = pageNumber || currentPage;
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/generate-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageNumber: pageToGenerate }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate page');
      }

      const data = await response.json();
      setPageData(data);
      setCurrentPage(pageToGenerate);
      setNotification({ message: `Page ${pageToGenerate} generated successfully!`, type: 'success' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setNotification({ message: 'Failed to generate page', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleStartScan = async () => {
    if (!pageData) return;
    
    setIsScanning(true);
    setScanProgress(0);
    setNotification({ message: 'Scan started!', type: 'info' });
    
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

      const { balances } = await response.json();
      setNotification({ message: 'Scan completed successfully!', type: 'success' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setNotification({ message: 'Scan failed', type: 'error' });
    } finally {
      setIsScanning(false);
      setScanProgress(100);
    }
  };

  const handleStopScan = () => {
    setIsScanning(false);
    setScanProgress(0);
    setNotification({ message: 'Scan stopped', type: 'info' });
  };

  const handleFetchBalances = async () => {
    if (!pageData) return;
    
    setLoading(true);
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

      const { balances } = await response.json();
      setNotification({ message: 'Balances fetched successfully!', type: 'success' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setNotification({ message: 'Failed to fetch balances', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

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

  const displayedKeys = useMemo(() => {
    if (!pageData) return [];
    const startIndex = (currentKeysPage - 1) * keysPerPage;
    return pageData.keys.slice(startIndex, startIndex + keysPerPage);
  }, [pageData, currentKeysPage, keysPerPage]);

  const totalPages = useMemo(() => {
    return pageData ? Math.ceil(pageData.keys.length / keysPerPage) : 0;
  }, [pageData, keysPerPage]);

  const handlePageChange = useThrottle(useCallback((page: string) => {
    setCurrentPage(page);
  }, []), 100);

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
      <ThemeToggleClient />
      
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
                mb: 2,
                fontSize: { xs: '2rem', md: '3rem' }
              }}
            >
              Bitcoin Keyspace Explorer
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
              Generate, scan, and explore Bitcoin private keys and addresses
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
                    Page {pageData.pageNumber} Results
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Chip 
                      label={`${pageData.keys.length} Keys`} 
                      color="primary" 
                    />
                    <Chip 
                      label={`${pageData.totalPageBalance.toFixed(8)} BTC`} 
                      color="secondary" 
                      icon={<BalanceIcon />}
                    />
                  </Box>
                </Box>

                {displayMode === 'grid' ? (
                  // Grid Display
                  <Grid container spacing={2}>
                    {displayedKeys.map((key, index) => (
                      <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                        <KeyCard
                          keyData={key}
                          index={index}
                          isExpanded={expandedKeys.has((currentKeysPage - 1) * keysPerPage + index)}
                          onToggleExpansion={() => toggleKeyExpansion((currentKeysPage - 1) * keysPerPage + index)}
                          keysPerPage={keysPerPage}
                          currentKeysPage={currentKeysPage}
                        />
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  // Table Display
                  <Box sx={{ overflow: 'auto' }}>
                    <TableContainer component={Paper} sx={{ background: 'transparent' }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Key #</TableCell>
                            <TableCell>Private Key</TableCell>
                            <TableCell>Balance</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Actions</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {displayedKeys.map((key, index) => (
                            <KeyTableRow
                              keyData={key}
                              index={index}
                              isExpanded={expandedKeys.has((currentKeysPage - 1) * keysPerPage + index)}
                              onToggleExpansion={() => toggleKeyExpansion((currentKeysPage - 1) * keysPerPage + index)}
                              keysPerPage={keysPerPage}
                              currentKeysPage={currentKeysPage}
                            />
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}

                {/* Navigation */}
                {pageData.keys.length > keysPerPage && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 3, gap: 1 }}>
                    <Tooltip title="First Page" arrow>
                      <IconButton
                        onClick={() => setCurrentKeysPage(1)}
                        disabled={currentKeysPage === 1}
                        size="small"
                      >
                        <FirstPageIcon />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Previous Page" arrow>
                      <IconButton
                        onClick={() => setCurrentKeysPage(prev => Math.max(1, prev - 1))}
                        disabled={currentKeysPage === 1}
                        size="small"
                      >
                        <NavigateBeforeIcon />
                      </IconButton>
                    </Tooltip>
                    
                    <Typography variant="body2" sx={{ mx: 2, minWidth: '60px', textAlign: 'center' }}>
                      Page {currentKeysPage} of {totalPages}
                    </Typography>
                    
                    <Tooltip title="Next Page" arrow>
                      <IconButton
                        onClick={() => setCurrentKeysPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentKeysPage === totalPages}
                        size="small"
                      >
                        <NavigateNextIcon />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="Last Page" arrow>
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

        {/* Info Cards */}
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
            <Typography>Processing...</Typography>
          </Card>
        </Box>
      )}
    </Box>
  );
}
