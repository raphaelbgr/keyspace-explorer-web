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
  ToggleButton,
  Slider
} from '@mui/material';
import {
  ExpandMore,
  PlayArrow,
  Stop,
  Casino,
  ArrowForward,
  ArrowBack,
  TrendingUp,
  Timer,
  Speed,
  Visibility,
  SwapHoriz
} from '@mui/icons-material';
import { useScannerStore } from '../store/scannerStore';
import { useTranslation } from '../translations';
import Decimal from 'decimal.js';
import { clientKeyGenerationService } from '../../lib/services/ClientKeyGenerationService';

interface ScannerCardProps {
  currentPage: string;
  totalPages: number;
  onPageChange: (page: string) => void;
  onDirectPageChange?: (page: string) => Promise<void>;
  generateLocally?: boolean;
}

export default function ScannerCard({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  onDirectPageChange,
  generateLocally = false
}: ScannerCardProps) {
  const t = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [autoNavigationMode, setAutoNavigationMode] = useState<'random' | 'forward' | 'backward' | 'both-ways'>('random');
  const [scanDelay, setScanDelay] = useState(2000); // 2 seconds default
  const [maxPages, setMaxPages] = useState(100);
  const [scanPageSize, setScanPageSize] = useState(45); // Keys per page for scanning
  const [balanceApiSource, setBalanceApiSource] = useState<'local' | 'blockstream' | 'blockcypher' | 'mempool'>('local');
  const [isScanning, setIsScanning] = useState(false);
  const [pagesScanned, setPagesScanned] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [currentScanPage, setCurrentScanPage] = useState<string>(currentPage);
  const [lastFoundBalance, setLastFoundBalance] = useState<any>(null);
  
  // New state for keyspace position and performance tracking
  const [keyspacePosition, setKeyspacePosition] = useState<number>(0.0); // Percentage with high precision
  const [addressesPerSecond, setAddressesPerSecond] = useState<number>(0);
  
  const [scanStats, setScanStats] = useState({
    totalBalance: 0,
    pagesPerMinute: 0,
    elapsedTime: 0,
    totalAddressesScanned: 0
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
        const addressesPerSec = elapsed > 0 ? Math.round(scanStats.totalAddressesScanned / elapsed) : 0;
        
        setScanStats(prev => ({
          ...prev,
          elapsedTime: elapsed,
          pagesPerMinute
        }));
        
        setAddressesPerSecond(addressesPerSec);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isScanning, startTime, pagesScanned, scanStats.totalAddressesScanned]);

  // Monitor generateLocally prop changes and restart scanner if needed
  useEffect(() => {
    // If scanner is currently running and generateLocally prop changed, restart the scanner
    if (isScanning) {
      console.log(`🔄 Generation method changed to ${generateLocally ? 'client-side' : 'server-side'}, restarting scanner...`);
      // Store current scanner state
      const wasScanning = isScanning;
      const currentMode = autoNavigationMode;
      const currentDelay = scanDelay;
      const currentMaxPages = maxPages;
      
      // Stop scanner
      handleStopScan();
      
      // Restart scanner after a brief delay to ensure clean state
      setTimeout(() => {
        if (wasScanning) {
          console.log(`🚀 Restarting scanner with ${generateLocally ? 'client-side' : 'server-side'} generation`);
          handleStartScan();
        }
      }, 500);
    }
  }, [generateLocally]); // Only trigger when generateLocally changes

  // Calculate maximum valid pages based on Bitcoin's private key limit
  const calculateMaxValidPages = useCallback((): string => {
    // Maximum valid Bitcoin private key (same as in ClientKeyGenerationService)
    const MAX_PRIVATE_KEY = BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364140");
    
    // Calculate maximum page number where all keys on the page are valid
    // Formula: maxPage = floor((MAX_PRIVATE_KEY - KEYS_PER_PAGE + 1) / KEYS_PER_PAGE) + 1
    const maxPageBigInt = (MAX_PRIVATE_KEY - BigInt(scanPageSize) + BigInt(1)) / BigInt(scanPageSize) + BigInt(1);
    
    // Convert to string for consistency
    return maxPageBigInt.toString();
  }, [scanPageSize]);

  // Convert page number to keyspace position percentage (0-100 with high precision)
  const pageToKeypacePosition = useCallback((pageNumber: string): number => {
    try {
      const maxValidPages = calculateMaxValidPages();
      const pageDecimal = new Decimal(pageNumber);
      const maxPagesDecimal = new Decimal(maxValidPages);
      
      // Calculate percentage: (page - 1) / (maxPages - 1) * 100
      const positionDecimal = pageDecimal.minus(1).dividedBy(maxPagesDecimal.minus(1)).times(100);
      return positionDecimal.toNumber();
    } catch (error) {
      console.error('Error calculating keyspace position:', error);
      return 0;
    }
  }, [calculateMaxValidPages]);

  // Convert keyspace position percentage to page number
  const keyspacePositionToPage = useCallback((percentage: number): string => {
    try {
      const maxValidPages = calculateMaxValidPages();
      const maxPagesDecimal = new Decimal(maxValidPages);
      const percentageDecimal = new Decimal(percentage);
      
      // Calculate page: (percentage / 100) * (maxPages - 1) + 1
      const pageDecimal = percentageDecimal.dividedBy(100).times(maxPagesDecimal.minus(1)).plus(1);
      return pageDecimal.floor().toFixed(0);
    } catch (error) {
      console.error('Error calculating page from keyspace position:', error);
      return '1';
    }
  }, [calculateMaxValidPages]);

  // Calculate addresses per second
  const calculateAddressesPerSecond = useCallback(() => {
    if (!startTime || scanStats.elapsedTime === 0) return 0;
    
    const totalAddresses = scanStats.totalAddressesScanned;
    const seconds = scanStats.elapsedTime;
    return Math.round(totalAddresses / seconds);
  }, [startTime, scanStats.elapsedTime, scanStats.totalAddressesScanned]);

  // Generate next page based on navigation mode
  const generateNextPage = useCallback((): string => {
    const currentPageDecimal = new Decimal(currentScanPageRef.current);
    const totalPagesDecimal = new Decimal(totalPages);
    
    // Calculate the actual maximum valid pages based on Bitcoin's limits
    const maxValidPages = calculateMaxValidPages();
    const maxValidPagesDecimal = new Decimal(maxValidPages);
    
    // Use the smaller of totalPages or maxValidPages to ensure we stay within Bitcoin's limits
    const effectiveMaxPages = totalPagesDecimal.lt(maxValidPagesDecimal) ? totalPagesDecimal : maxValidPagesDecimal;

    let nextPage: string;

    switch (autoNavigationMode) {
      case 'forward':
        const forwardPage = currentPageDecimal.plus(1);
        nextPage = forwardPage.lte(effectiveMaxPages) ? forwardPage.toFixed(0) : '1';
        break;
      
      case 'backward':
        const backwardPage = currentPageDecimal.minus(1);
        nextPage = backwardPage.gte(1) ? backwardPage.toFixed(0) : effectiveMaxPages.toFixed(0);
        break;

      case 'both-ways':
        // Both-ways mode: scan range around selected keyspace position
        const centerPage = keyspacePositionToPage(keyspacePosition);
        const centerPageDecimal = new Decimal(centerPage);
        const halfRange = new Decimal(maxPages).dividedBy(2);
        
        // Calculate current scan step within the range
        const rangeStart = centerPageDecimal.minus(halfRange).gt(1) ? centerPageDecimal.minus(halfRange) : new Decimal(1);
        const rangeEnd = centerPageDecimal.plus(halfRange).lt(effectiveMaxPages) ? centerPageDecimal.plus(halfRange) : effectiveMaxPages;
        
        // Alternate between forward and backward from center
        const isForwardScan = pagesScannedRef.current % 2 === 0;
        const stepSize = Math.floor(pagesScannedRef.current / 2) + 1;
        
        if (isForwardScan) {
          const forwardTarget = centerPageDecimal.plus(stepSize);
          nextPage = forwardTarget.lte(rangeEnd) ? forwardTarget.toFixed(0) : rangeStart.toFixed(0);
        } else {
          const backwardTarget = centerPageDecimal.minus(stepSize);
          nextPage = backwardTarget.gte(rangeStart) ? backwardTarget.toFixed(0) : rangeEnd.toFixed(0);
        }
        
        console.log(`🔄 Both-ways scan: center=${centerPage}, range=[${rangeStart.toFixed(0)}-${rangeEnd.toFixed(0)}], step=${stepSize}, direction=${isForwardScan ? 'forward' : 'backward'}, next=${nextPage}`);
        break;
      
      case 'random':
      default:
        // Generate cryptographically secure random page using Decimal.js for large numbers
        try {
          const randomArray = new Uint32Array(2); // Use 2 32-bit values for better randomness
          crypto.getRandomValues(randomArray);
          
          // Create a random decimal value between 0 and 1 with high precision
          const randomHigh = new Decimal(randomArray[0]).dividedBy(0xFFFFFFFF + 1);
          const randomLow = new Decimal(randomArray[1]).dividedBy((0xFFFFFFFF + 1) * (0xFFFFFFFF + 1));
          const randomValue = randomHigh.plus(randomLow);
          
          // Multiply by effective max pages (not total pages) and floor the result
          const randomPageDecimal = randomValue.times(effectiveMaxPages).floor().plus(1);
          
          // Ensure the result is within valid range
          if (randomPageDecimal.lte(0)) {
            nextPage = '1';
          } else if (randomPageDecimal.gt(effectiveMaxPages)) {
            nextPage = effectiveMaxPages.toFixed(0);
          } else {
            nextPage = randomPageDecimal.toFixed(0);
          }
          
          console.log(`🎲 Random page generated: ${nextPage} (max valid: ${maxValidPages})`);
        } catch (error) {
          console.error('Random page generation error:', error);
          // Fallback to a safe range that definitely won't exceed Bitcoin limits
          const fallbackRandom = Math.floor(Math.random() * 1000000) + 1;
          nextPage = fallbackRandom.toString();
        }
        break;
    }

    // Update keyspace position for display (except in forward/backward modes where user controls it)
    if (autoNavigationMode === 'random') {
      const newPosition = pageToKeypacePosition(nextPage);
      setKeyspacePosition(newPosition);
    }

    return nextPage;
  }, [totalPages, autoNavigationMode, calculateMaxValidPages, keyspacePosition, keyspacePositionToPage, maxPages, pageToKeypacePosition]);

  // Check if page has any balance > 0 using real balance data
  const checkPageBalances = useCallback(async (pageData: any): Promise<{ hasBalance: boolean; totalBalance: number; balanceData: any[] }> => {
    if (!pageData || !pageData.keys) {
      return { hasBalance: false, totalBalance: 0, balanceData: [] };
    }
    
    try {
      // Extract all addresses from all keys
      const addresses: string[] = [];
      pageData.keys.forEach((key: any) => {
        if (key.addresses) {
          Object.values(key.addresses).forEach((address: any) => {
            if (typeof address === 'string') {
              addresses.push(address);
            }
          });
        }
      });
      
      if (addresses.length === 0) {
        return { hasBalance: false, totalBalance: 0, balanceData: [] };
      }
      
      console.log(`Checking balances for ${addresses.length} addresses on page ${pageData.pageNumber}`);
      
      // Call real balance API using selected source
      const response = await fetch('/api/balances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          addresses, 
          source: balanceApiSource
        }),
      });
      
      if (!response.ok) {
        console.error('Balance API call failed:', response.status, response.statusText);
        return { hasBalance: false, totalBalance: 0, balanceData: [] };
      }
      
      const balanceResponse = await response.json();
      const balances = balanceResponse.balances || [];
      
      // Calculate total balance and check if any > 0
      let totalBalance = 0;
      let hasBalance = false;
      
      balances.forEach((balanceData: any) => {
        if (balanceData.balance > 0) {
          totalBalance += balanceData.balance;
          hasBalance = true;
        }
      });
      
      console.log(`Balance check complete: ${hasBalance ? 'FOUND' : 'NO'} balance(s). Total: ${totalBalance} BTC`);
      
      return { hasBalance, totalBalance, balanceData: balances };
      
    } catch (error) {
      console.error('Error checking page balances:', error);
      return { hasBalance: false, totalBalance: 0, balanceData: [] };
    }
  }, [balanceApiSource]);

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
      
      // Validate that nextPage can be converted to BigInt safely
      if (!nextPage || nextPage === '' || isNaN(Number(nextPage))) {
        console.error('Invalid page number generated:', nextPage);
        handleStopScan();
        return;
      }
      
      // Check if the page number contains scientific notation
      if (nextPage.includes('e') || nextPage.includes('E')) {
        console.error('Page number in scientific notation, cannot convert to BigInt:', nextPage);
        handleStopScan();
        return;
      }
      
      // Additional check for extremely large numbers that might cause issues
      try {
        const testBigInt = BigInt(nextPage);
        if (testBigInt < 1n) {
          console.error('Page number must be positive:', nextPage);
          handleStopScan();
          return;
        }
        
        // Additional check: ensure the page won't generate keys beyond Bitcoin's limit
        const maxValidPages = calculateMaxValidPages();
        if (testBigInt > BigInt(maxValidPages)) {
          console.error(`Page ${nextPage} exceeds Bitcoin's valid range (max: ${maxValidPages})`);
          console.log('🔄 Scanner stopping due to page limit - this is normal for very large keysspace');
          handleStopScan();
          return;
        }
      } catch (bigIntError) {
        console.error('Cannot convert page number to BigInt:', nextPage, bigIntError);
        handleStopScan();
        return;
      }
      
      // Update both state and ref immediately for next iteration
      setCurrentScanPage(nextPage);
      currentScanPageRef.current = nextPage;
      
      // Call API directly without updating main UI
      console.log('Calling API for page:', nextPage, 'with pageSize:', scanPageSize);
      
      let pageData;
      
      if (generateLocally) {
        // Client-side generation for scanner
        console.log('🚀 Scanner using client-side generation');
        try {
          const pageBigInt = BigInt(nextPage);
          const clientPageData = await clientKeyGenerationService.generatePage(pageBigInt, scanPageSize);
          
          // Convert to the same format as API response
          pageData = {
            pageNumber: clientPageData.pageNumber.toString(),
            keys: clientPageData.keys.map(key => ({
              privateKey: key.privateKey,
              pageNumber: key.pageNumber.toString(),
              index: key.index,
              addresses: key.addresses,
              balances: key.balances,
              totalBalance: key.totalBalance,
            })),
            totalPageBalance: clientPageData.totalPageBalance,
            generatedAt: clientPageData.generatedAt.toISOString(),
            balancesFetched: clientPageData.balancesFetched,
          };
        } catch (error) {
          console.error('Client-side generation failed in scanner, falling back to server:', error);
          throw error; // Will trigger the server fallback below
        }
      } else {
        // Server-side generation (existing API call)
        console.log('🌐 Scanner using server-side generation');
        const response = await fetch('/api/generate-page', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            pageNumber: nextPage,
            keysPerPage: scanPageSize 
          }),
        });

        if (!response.ok) {
          throw new Error(`API call failed: ${response.status} ${response.statusText}`);
        }

        pageData = await response.json();
      }

      console.log('Received page data for page:', nextPage, 'keys:', pageData.keys?.length);
        
      // Track addresses scanned for performance metrics
      const addressesInThisPage = pageData.keys ? pageData.keys.length * 5 : 0; // 5 addresses per key
      setScanStats(prev => ({
        ...prev,
        totalAddressesScanned: prev.totalAddressesScanned + addressesInThisPage
      }));
      
      // Check if this page has any balance > 0 using real balance API
      const balanceResult = await checkPageBalances(pageData);
      console.log('Balance check result:', balanceResult);
      
      if (balanceResult.hasBalance) {
        console.log('Total balance found:', balanceResult.totalBalance);
        setLastFoundBalance({ page: nextPage, balance: balanceResult.totalBalance });
        setScanStats(prev => ({ ...prev, totalBalance: prev.totalBalance + balanceResult.totalBalance }));
        
        // Send notifications for found balances
        balanceResult.balanceData.forEach(async (balanceData: any) => {
          if (balanceData.balance > 0) {
            // Find the corresponding private key for this address
            const key = pageData.keys.find((k: any) => 
              k.addresses && Object.values(k.addresses).includes(balanceData.address)
            );
            
            if (key) {
              // Get the address type
              const addressType = Object.entries(key.addresses).find(
                ([_, addr]) => addr === balanceData.address
              )?.[0] || 'unknown';
              
              // Send notification
              try {
                await fetch('/api/notify-match', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    privateKey: key.privateKey,
                    address: balanceData.address,
                    balance: balanceData.balance,
                    addressType,
                    isSimulated: false
                  }),
                });
              } catch (error) {
                console.error('Failed to send notification:', error);
              }
            }
          }
        });
        
        // Stop scanning when funds are found
        handleStopScan();
        return;
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
  }, [generateNextPage, scanPageSize, checkPageBalances, handleStopScan, incrementPagesScanned, setScannerCurrentPage, maxPages, scanDelay, generateLocally]);

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
    setScanStats({ totalBalance: 0, pagesPerMinute: 0, elapsedTime: 0, totalAddressesScanned: 0 });
    
    console.log('Starting scan process in 1 second...');
    
    // Log Bitcoin limits for user information
    const maxValidPages = calculateMaxValidPages();
    console.log(`🚀 Scanner initialized:`);
    console.log(`   Mode: ${generateLocally ? 'Client-side' : 'Server-side'} generation`);
    console.log(`   Page size: ${scanPageSize} keys per page`);
    console.log(`   Valid page range: 1 to ${maxValidPages}`);
    console.log(`   Current totalPages: ${totalPages}`);
    
    // Start the scanning process
    scanningIntervalRef.current = setTimeout(() => {
      console.log('Starting performScan...');
      performScan();
    }, 1000);
  }, [currentPage, performScan, generateLocally, scanPageSize, totalPages, calculateMaxValidPages]);

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
                  icon={<TrendingUp />}
                  label={`${addressesPerSecond} addr/sec`}
                  color="success"
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
            
            {/* Generation Mode Indicator */}
            <Box sx={{ mb: 3, p: 1.5, borderRadius: 1, bgcolor: generateLocally ? 'success.main' : 'primary.main', color: 'white' }}>
              <Typography variant="body2" fontWeight="medium" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {generateLocally ? (
                  <>
                    <Speed sx={{ fontSize: '1rem' }} />
                    🚀 Scanner: Client-side Generation (Fast)
                  </>
                ) : (
                  <>
                    <Visibility sx={{ fontSize: '1rem' }} />
                    🌐 Scanner: Server-side Generation (Reliable)
                  </>
                )}
              </Typography>
            </Box>

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
                <Casino sx={{ mr: 1 }} />
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
              <ToggleButton value="both-ways">
                <SwapHoriz sx={{ mr: 1 }} />
                Both Ways
              </ToggleButton>
            </ToggleButtonGroup>

            {/* Keyspace Position Slider */}
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
              Keyspace Position
            </Typography>
            <Box sx={{ mb: 3, px: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {autoNavigationMode === 'random' 
                  ? 'Current position in Bitcoin keyspace (read-only)'
                  : autoNavigationMode === 'both-ways'
                  ? 'Center point for bidirectional scanning'
                  : 'Starting position for scanning'
                }
              </Typography>
              <Slider
                value={keyspacePosition}
                onChange={(_, value) => {
                  if (autoNavigationMode !== 'random') {
                    setKeyspacePosition(value as number);
                    // Update current scan page based on new position for forward/backward modes
                    if (autoNavigationMode === 'forward' || autoNavigationMode === 'backward') {
                      const newPage = keyspacePositionToPage(value as number);
                      setCurrentScanPage(newPage);
                      currentScanPageRef.current = newPage;
                    }
                  }
                }}
                disabled={autoNavigationMode === 'random' || isScanning}
                min={0}
                max={100}
                step={0.0001} // High precision for percentage
                valueLabelDisplay="on"
                valueLabelFormat={(value) => `${value.toFixed(4)}%`}
                sx={{
                  '& .MuiSlider-thumb': {
                    bgcolor: autoNavigationMode === 'random' ? 'info.main' : 
                             autoNavigationMode === 'both-ways' ? 'warning.main' : 'primary.main'
                  },
                  '& .MuiSlider-track': {
                    bgcolor: autoNavigationMode === 'random' ? 'info.main' : 
                             autoNavigationMode === 'both-ways' ? 'warning.main' : 'primary.main'
                  }
                }}
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                <Typography variant="caption" color="text.secondary">
                  0.0000% (Start)
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center' }}>
                  Page: {autoNavigationMode === 'both-ways' 
                    ? keyspacePositionToPage(keyspacePosition) 
                    : currentScanPage}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  100.0000% (End)
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Scan Configuration */}
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
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
              <Grid item xs={12} md={3}>
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
              <Grid item xs={12} md={3}>
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
              <Grid item xs={12} md={3}>
                <FormControl fullWidth disabled={isScanning}>
                  <InputLabel>Balance API</InputLabel>
                  <Select
                    value={balanceApiSource}
                    onChange={(e) => setBalanceApiSource(e.target.value as 'local' | 'blockstream' | 'blockcypher' | 'mempool')}
                    label="Balance API"
                  >
                    <MenuItem value="local">Local Database (Fast)</MenuItem>
                    <MenuItem value="blockstream">Blockstream (Live)</MenuItem>
                    <MenuItem value="blockcypher">BlockCypher (Live)</MenuItem>
                    <MenuItem value="mempool">Mempool.space (Live)</MenuItem>
                  </Select>
                </FormControl>
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