'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
} from '@mui/material';
import { useScannerStore } from '../store/scannerStore';
import { useTranslation } from '../translations';

interface ScannerModalProps {
  open: boolean;
  onClose: () => void;
  onScanStart: (config: any) => void;
  currentPage: number;
}

export default function ScannerModal({ open, onClose, onScanStart, currentPage }: ScannerModalProps) {
  const t = useTranslation();
  const {
    isScanning,
    scanConfig,
    totalBalance,
    pagesScanned,
    lastScannedPage,
    scanStartTime,
    isAutoContinuing,
    startScan,
    stopScan,
    updateBalance,
    setCurrentPage,
    incrementPagesScanned,
    setAutoContinuing,
    resetScanner,
  } = useScannerStore();

  const [localConfig, setLocalConfig] = useState({
    mode: 'sequential' as 'sequential' | 'random' | 'targeted',
    targetPage: currentPage,
    maxPages: 100,
    delay: 1000,
    apiSource: 'local',
    startPage: currentPage,
    isSimulated: false,
  });

  const [scanStatus, setScanStatus] = useState('');
  const [error, setError] = useState('');

  // Update config when currentPage changes
  useEffect(() => {
    setLocalConfig(prev => ({
      ...prev,
      targetPage: currentPage,
      startPage: currentPage,
    }));
  }, [currentPage]);

  // Function to send notification when balance is found
  const sendNotification = async (privateKey: string, address: string, balance: number, addressType: string) => {
    try {
      const response = await fetch('/api/notify-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          privateKey,
          address,
          balance,
          addressType,
          isSimulated: localConfig.isSimulated,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Notification sent:', result);
      } else {
        console.error('Failed to send notification');
      }
    } catch (error) {
      console.error('Notification error:', error);
    }
  };

  // Auto-continuation logic
  const continueScanning = useCallback(async () => {
    if (!isScanning || totalBalance > 0) {
      return;
    }

    setAutoContinuing(true);
    setScanStatus(t.scanner.autoContinuing);

    try {
      let nextPage: number;

      switch (scanConfig.mode) {
        case 'sequential':
          nextPage = currentPage + 1;
          break;
        case 'random':
          nextPage = Math.floor(Math.random() * (scanConfig.maxPages || 1000000)) + 1;
          break;
        case 'targeted':
          nextPage = scanConfig.targetPage || 1;
          break;
        default:
          nextPage = currentPage + 1;
      }

      setCurrentPage(nextPage);
      incrementPagesScanned();

      // Simulate balance check delay
      await new Promise(resolve => setTimeout(resolve, scanConfig.delay));

      // Simulate finding a balance (for testing)
      if (localConfig.isSimulated && Math.random() < 0.1) { // 10% chance to find balance
        const simulatedBalance = Math.random() * 10; // Random balance between 0-10 BTC
        updateBalance(simulatedBalance);
        
        // Send notification for simulated balance
        await sendNotification(
          'simulated_private_key_' + nextPage,
          'simulated_address_' + nextPage,
          simulatedBalance,
          'p2pkh_compressed'
        );
        
        setAutoContinuing(false);
        setScanStatus(t.scanner.fundsFound);
        return;
      }

      // Check if we should continue (total balance = 0)
      if (totalBalance === 0 && isScanning) {
        // Continue to next page
        setTimeout(() => {
          continueScanning();
        }, scanConfig.delay);
      } else {
        setAutoContinuing(false);
        setScanStatus(t.scanner.fundsFound);
      }
    } catch (err) {
      setError(t.scanner.error);
      setAutoContinuing(false);
    }
  }, [isScanning, totalBalance, currentPage, scanConfig, t, setAutoContinuing, setCurrentPage, incrementPagesScanned, localConfig.isSimulated, updateBalance]);

  // Start scanning with auto-continuation
  const handleStartScan = () => {
    setError('');
    setScanStatus(t.scanner.starting);
    
    // Update config with current page as starting point
    const configWithStartPage = {
      ...localConfig,
      startPage: currentPage,
    };
    
    startScan(configWithStartPage);
    onScanStart(configWithStartPage);
    
    // Start auto-continuation after initial scan
    setTimeout(() => {
      continueScanning();
    }, localConfig.delay);
  };

  const handleStopScan = () => {
    stopScan();
    setScanStatus(t.scanner.stopped);
  };

  const handleClose = () => {
    if (isScanning) {
      stopScan();
    }
    resetScanner();
    onClose();
  };

  // Calculate scan duration
  const getScanDuration = () => {
    if (!scanStartTime) return 0;
    return Math.floor((Date.now() - scanStartTime.getTime()) / 1000);
  };

  // Calculate scan rate
  const getScanRate = () => {
    const duration = getScanDuration();
    if (duration === 0) return 0;
    return Math.round(pagesScanned / duration);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>{t.scanner.title}</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          {!isScanning && (
            <Box sx={{ mb: 2 }}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>{t.scanner.mode}</InputLabel>
                <Select
                  value={localConfig.mode}
                  onChange={(e) => setLocalConfig({
                    ...localConfig,
                    mode: e.target.value as 'sequential' | 'random' | 'targeted'
                  })}
                >
                  <MenuItem value="sequential">{t.scanner.sequential}</MenuItem>
                  <MenuItem value="random">{t.scanner.random}</MenuItem>
                  <MenuItem value="targeted">{t.scanner.targeted}</MenuItem>
                </Select>
              </FormControl>

              {localConfig.mode === 'targeted' && (
                <TextField
                  fullWidth
                  label={t.scanner.targetPage}
                  type="number"
                  value={localConfig.targetPage}
                  onChange={(e) => setLocalConfig({
                    ...localConfig,
                    targetPage: parseInt(e.target.value) || 1
                  })}
                  sx={{ mb: 2 }}
                />
              )}

              <TextField
                fullWidth
                label={t.scanner.maxPages}
                type="number"
                value={localConfig.maxPages}
                onChange={(e) => setLocalConfig({
                  ...localConfig,
                  maxPages: parseInt(e.target.value) || 100
                })}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label={t.scanner.delay}
                type="number"
                value={localConfig.delay}
                onChange={(e) => setLocalConfig({
                  ...localConfig,
                  delay: parseInt(e.target.value) || 1000
                })}
                helperText={t.scanner.delayHelp}
                sx={{ mb: 2 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={localConfig.isSimulated}
                    onChange={(e) => setLocalConfig({
                      ...localConfig,
                      isSimulated: e.target.checked
                    })}
                  />
                }
                label="Simulated Data (for testing)"
                sx={{ mb: 2 }}
              />

              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Starting from page: {currentPage}
              </Typography>
            </Box>
          )}

          {isScanning && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                {t.scanner.status}
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {scanStatus}
                </Typography>
                {isAutoContinuing && (
                  <Chip 
                    label={t.scanner.autoContinuing} 
                    color="info" 
                    size="small" 
                    sx={{ mt: 1 }}
                  />
                )}
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2">
                  {t.scanner.currentPage}: {currentPage}
                </Typography>
                <Typography variant="body2">
                  {t.scanner.pagesScanned}: {pagesScanned}
                </Typography>
                <Typography variant="body2">
                  {t.scanner.totalBalance}: {totalBalance} BTC
                </Typography>
                <Typography variant="body2">
                  {t.scanner.scanRate}: {getScanRate()} pages/sec
                </Typography>
                <Typography variant="body2">
                  {t.scanner.duration}: {getScanDuration()}s
                </Typography>
              </Box>

              <LinearProgress 
                variant="determinate" 
                value={Math.min((pagesScanned / (scanConfig.maxPages || 100)) * 100, 100)}
                sx={{ mb: 2 }}
              />

              {totalBalance > 0 && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {t.scanner.fundsFound} - {totalBalance} BTC on page {lastScannedPage}!
                </Alert>
              )}
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        {!isScanning ? (
          <Button onClick={handleStartScan} variant="contained" color="primary">
            {t.scanner.start}
          </Button>
        ) : (
          <Button onClick={handleStopScan} variant="contained" color="error">
            {t.scanner.stop}
          </Button>
        )}
        <Button onClick={handleClose}>
          {t.common.close}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 