'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Typography,
  Box,
  LinearProgress,
  Chip,
  Alert,
  Switch,
  FormControlLabel,
  Grid,
  Divider,
  IconButton,
  Tooltip,
  ToggleButtonGroup,
  ToggleButton
} from '@mui/material';
import {
  ExpandMore,
  PlayArrow,
  Stop,
  Shuffle,
  ArrowForward,
  ArrowBack,
  TrendingUp,
  Timer,
  Speed,
  Visibility
} from '@mui/icons-material';
import { useScannerStore } from '../store/scannerStore';
import { useTranslation } from '../translations';
import Decimal from 'decimal.js';

interface ScannerCardProps {
  currentPage: string;
  totalPages: number;
  onPageChange: (page: string) => void;
  onDirectPageChange?: (page: string) => Promise<void>;
}

export default function ScannerCard({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  onDirectPageChange 
}: ScannerCardProps) {
  const t = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [autoNavigationMode, setAutoNavigationMode] = useState<'random' | 'forward' | 'backward'>('random');
  const [scanDelay, setScanDelay] = useState(2000); // 2 seconds default
  const [maxPages, setMaxPages] = useState(100);
  const [scanPageSize, setScanPageSize] = useState(45); // Keys per page for scanning
  const [isScanning, setIsScanning] = useState(false);
  const [pagesScanned, setPagesScanned] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [currentScanPage, setCurrentScanPage] = useState<string>(currentPage);
  const [lastFoundBalance, setLastFoundBalance] = useState<any>(null);
  const [scanStats, setScanStats] = useState({
    totalBalance: 0,
    pagesPerMinute: 0,
    elapsedTime: 0
  });

  // Use refs to track current values in closures
  const pagesScannedRef = useRef(0);
  const isScanningRef = useRef(false);
  const scanningIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentScanPageRef = useRef<string>(currentPage);

  // Enhanced scanner store integration
  const {
    updateBalance,
    setCurrentPage: setScannerCurrentPage,
    incrementPagesScanned,
  } = useScannerStore();

  // Update refs when state changes
  useEffect(() => {
    pagesScannedRef.current = pagesScanned;
  }, [pagesScanned]);

  useEffect(() => {
    isScanningRef.current = isScanning;
  }, [isScanning]);

  useEffect(() => {
    currentScanPageRef.current = currentScanPage;
  }, [currentScanPage]);

  // Calculate scanning statistics
  useEffect(() => {
    if (isScanning && startTime) {
      const interval = setInterval(() => {
        const now = new Date();
        const elapsed = (now.getTime() - startTime.getTime()) / 1000; // seconds
        const pagesPerMinute = elapsed > 0 ? (pagesScanned / elapsed) * 60 : 0;
        
        setScanStats(prev => ({
          ...prev,
          elapsedTime: elapsed,
          pagesPerMinute
        }));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isScanning, startTime, pagesScanned]);

  // Generate next page based on navigation mode
  const generateNextPage = useCallback((): string => {
    const currentPageDecimal = new Decimal(currentScanPageRef.current);
    const totalPagesDecimal = new Decimal(totalPages);

    switch (autoNavigationMode) {
      case 'forward':
        const nextPage = currentPageDecimal.plus(1);
        return nextPage.lte(totalPagesDecimal) ? nextPage.toFixed(0) : '1';
      
      case 'backward':
        const prevPage = currentPageDecimal.minus(1);
        return prevPage.gte(1) ? prevPage.toFixed(0) : totalPagesDecimal.toFixed(0);
      
      case 'random':
      default:
        // Generate cryptographically secure random page
        const randomArray = new Uint32Array(1);
        crypto.getRandomValues(randomArray);
        const randomValue = randomArray[0] / (0xFFFFFFFF + 1); // 0 to 1
        const randomPage = Math.floor(randomValue * totalPages) + 1;
        return randomPage.toString();
    }
  }, [totalPages, autoNavigationMode]);

  // Check if page has any balance > 0
  const hasBalance = useCallback((pageData: any): boolean => {
    if (!pageData || !pageData.keys) return false;
    
    return pageData.keys.some((key: any) => {
      if (!key.addresses) return false;
      
      return Object.values(key.addresses).some((address: any) => {
        return address && typeof address === 'object' && address.balance > 0;
      });
    });
  }, []);

  // Stop scanning
  const handleStopScan = useCallback(() => {
    console.log('Stopping scanner');
    setIsScanning(false);
    isScanningRef.current = false;
    setStartTime(null);
    
    // Clear any pending timeouts
    if (scanningIntervalRef.current) {
      clearTimeout(scanningIntervalRef.current);
      scanningIntervalRef.current = null;
    }
  }, []);

  // Auto-navigation scan function
  const performScan = useCallback(async () => {
    console.log('performScan called, isScanningRef.current:', isScanningRef.current);
    
    if (!isScanningRef.current) {
      console.log('Not scanning, returning');
      return;
    }

    try {
      const nextPage = generateNextPage();
      console.log('Generated next page:', nextPage, 'from current scan page:', currentScanPageRef.current);
      
      // Update both state and ref immediately for next iteration
      setCurrentScanPage(nextPage);
      currentScanPageRef.current = nextPage;
      
      // Call API directly without updating main UI
      console.log('Calling API for page:', nextPage, 'with pageSize:', scanPageSize);
      const response = await fetch('/api/generate-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          pageNumber: nextPage,
          keysPerPage: scanPageSize 
        }),
      });

      if (response.ok) {
        const pageData = await response.json();
        console.log('Received page data for page:', nextPage, 'keys:', pageData.keys?.length);
        
        // Check if this page has any balance > 0
        const foundBalance = hasBalance(pageData);
        console.log('Found balance on page:', foundBalance);
        
        if (foundBalance) {
          // Calculate total balance
          const totalBalance = pageData.keys.reduce((total: number, key: any) => {
            if (key.addresses) {
              return total + Object.values(key.addresses).reduce((keyTotal: number, address: any) => {
                return keyTotal + (address?.balance || 0);
              }, 0);
            }
            return total;
          }, 0);

          console.log('Total balance found:', totalBalance);
          setLastFoundBalance({ page: nextPage, balance: totalBalance });
          setScanStats(prev => ({ ...prev, totalBalance: prev.totalBalance + totalBalance }));
          
          // Stop scanning when funds are found
          handleStopScan();
          return;
        }
      } else {
        console.error('API call failed:', response.status, response.statusText);
      }

      // Increment pages scanned
      const newPagesScanned = pagesScannedRef.current + 1;
      setPagesScanned(newPagesScanned);
      pagesScannedRef.current = newPagesScanned;
      incrementPagesScanned();
      setScannerCurrentPage(parseInt(nextPage));

      console.log('Pages scanned:', newPagesScanned, 'max:', maxPages);

      // Check if we should continue scanning
      if (isScanningRef.current && newPagesScanned < maxPages) {
        // Schedule next scan
        scanningIntervalRef.current = setTimeout(() => {
          performScan();
        }, scanDelay);
      } else if (newPagesScanned >= maxPages) {
        console.log('Max pages reached, stopping');
        handleStopScan();
      }

    } catch (error) {
      console.error('Scan error:', error);
      handleStopScan();
    }
  }, [generateNextPage, scanPageSize, hasBalance, handleStopScan, incrementPagesScanned, setScannerCurrentPage, maxPages, scanDelay]);

  // Start scanning
  const handleStartScan = useCallback(() => {
    console.log('handleStartScan called');
    
    // Reset state
    setIsScanning(true);
    isScanningRef.current = true;
    setStartTime(new Date());
    setPagesScanned(0);
    pagesScannedRef.current = 0;
    setCurrentScanPage(currentPage);
    currentScanPageRef.current = currentPage;
    setLastFoundBalance(null);
    setScanStats({ totalBalance: 0, pagesPerMinute: 0, elapsedTime: 0 });
    
    console.log('Starting scan process in 1 second...');
    // Start the scanning process
    scanningIntervalRef.current = setTimeout(() => {
      console.log('Starting performScan...');
      performScan();
    }, 1000);
  }, [currentPage, performScan]);

  // Format time duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card sx={{ mb: 2, border: isScanning ? '2px solid' : '1px solid', 
                borderColor: isScanning ? 'primary.main' : 'divider',
                boxShadow: isScanning ? 4 : 1 }}>
      <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)}>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Visibility color={isScanning ? 'primary' : 'action'} />
              <Typography variant="h6">
                Keyspace Scanner
              </Typography>
            </Box>
            
            {isScanning && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                <Chip 
                  icon={<Speed />}
                  label={`${scanStats.pagesPerMinute.toFixed(1)} pages/min`}
                  color="primary"
                  size="small"
                />
                <Chip 
                  icon={<Timer />}
                  label={formatDuration(scanStats.elapsedTime)}
                  color="primary"
                  size="small"
                />
                <Chip 
                  label={`${pagesScanned} pages scanned`}
                  color="primary" 
                  size="small"
                />
              </Box>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {!isScanning ? (
                <Tooltip title="Start Scanner">
                  <IconButton 
                    color="primary" 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStartScan();
                    }}
                  >
                    <PlayArrow />
                  </IconButton>
                </Tooltip>
              ) : (
                <Tooltip title="Stop Scanner">
                  <IconButton 
                    color="error"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStopScan();
                    }}
                  >
                    <Stop />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
        </AccordionSummary>

        <AccordionDetails>
          <Box sx={{ p: 2 }}>
            {/* Auto-Navigation Mode Selection */}
            <Typography variant="subtitle1" gutterBottom>
              Auto-Navigation Mode
            </Typography>
            <ToggleButtonGroup
              value={autoNavigationMode}
              exclusive
              onChange={(_, newMode) => newMode && setAutoNavigationMode(newMode)}
              sx={{ mb: 3 }}
            >
              <ToggleButton value="random">
                <Shuffle sx={{ mr: 1 }} />
                Random
              </ToggleButton>
              <ToggleButton value="forward">
                <ArrowForward sx={{ mr: 1 }} />
                Forward
              </ToggleButton>
              <ToggleButton value="backward">
                <ArrowBack sx={{ mr: 1 }} />
                Backward
              </ToggleButton>
            </ToggleButtonGroup>

            <Divider sx={{ my: 2 }} />

            {/* Scan Configuration */}
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Keys per Page"
                  type="number"
                  value={scanPageSize}
                  onChange={(e) => setScanPageSize(parseInt(e.target.value) || 45)}
                  helperText="Number of keys to scan per page"
                  disabled={isScanning}
                  inputProps={{ min: 1, max: 10000 }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Scan Delay (ms)"
                  type="number"
                  value={scanDelay}
                  onChange={(e) => setScanDelay(parseInt(e.target.value) || 2000)}
                  helperText="Delay between page scans"
                  disabled={isScanning}
                  inputProps={{ min: 100, max: 60000 }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Max Pages to Scan"
                  type="number"
                  value={maxPages}
                  onChange={(e) => setMaxPages(parseInt(e.target.value) || 100)}
                  helperText="Maximum pages before auto-stop"
                  disabled={isScanning}
                  inputProps={{ min: 1, max: 100000 }}
                />
              </Grid>
            </Grid>

            {/* Current Scanning Status */}
            {isScanning && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Currently Scanning
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Typography variant="body2">
                    Page: {currentScanPage}
                  </Typography>
                  <Typography variant="body2">
                    Mode: {autoNavigationMode}
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={(pagesScanned / maxPages) * 100}
                  sx={{ mb: 1 }}
                />
                <Typography variant="caption" color="text.secondary">
                  Progress: {pagesScanned} / {maxPages} pages
                </Typography>
              </Box>
            )}

            {/* Found Balance Alert */}
            {lastFoundBalance && (
              <Alert severity="success" sx={{ mt: 2 }}>
                <Typography variant="subtitle2">
                  🎉 Balance Found!
                </Typography>
                <Typography variant="body2">
                  Page {lastFoundBalance.page}: {lastFoundBalance.balance} BTC
                </Typography>
              </Alert>
            )}

            {/* Scanning Statistics */}
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Session Statistics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color="primary">
                      {pagesScanned}
                    </Typography>
                    <Typography variant="caption">
                      Pages Scanned
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color="primary">
                      {formatDuration(scanStats.elapsedTime)}
                    </Typography>
                    <Typography variant="caption">
                      Time Elapsed
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color="primary">
                      {scanStats.pagesPerMinute.toFixed(1)}
                    </Typography>
                    <Typography variant="caption">
                      Pages/Minute
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" color="primary">
                      {scanStats.totalBalance.toFixed(8)}
                    </Typography>
                    <Typography variant="caption">
                      Total BTC Found
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </AccordionDetails>
      </Accordion>
    </Card>
  );
} 