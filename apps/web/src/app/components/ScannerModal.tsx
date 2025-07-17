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
} from '@mui/material';
import { useScannerStore } from '../store/scannerStore';
import { useTranslation } from '../translations';

interface ScannerModalProps {
  open: boolean;
  onClose: () => void;
  onScanStart: (config: any) => void;
}

export default function ScannerModal({ open, onClose, onScanStart }: ScannerModalProps) {
  const translations = useTranslation();
  const {
    isScanning,
    currentPage,
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
    targetPage: 1,
    maxPages: 100,
    delay: 1000,
    apiSource: 'local',
  });

  const [scanStatus, setScanStatus] = useState('');
  const [error, setError] = useState('');

  // Auto-continuation logic
  const continueScanning = useCallback(async () => {
    if (!isScanning || totalBalance > 0) {
      return;
    }

    setAutoContinuing(true);
    setScanStatus(translations.scanner.autoContinuing);

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

      // Check if we should continue (total balance = 0)
      if (totalBalance === 0 && isScanning) {
        // Continue to next page
        setTimeout(() => {
          continueScanning();
        }, scanConfig.delay);
      } else {
        setAutoContinuing(false);
        setScanStatus(translations.scanner.fundsFound);
      }
    } catch (err) {
      setError(translations.scanner.error);
      setAutoContinuing(false);
    }
  }, [isScanning, totalBalance, currentPage, scanConfig, translations, setAutoContinuing, setCurrentPage, incrementPagesScanned]);

  // Start scanning with auto-continuation
  const handleStartScan = () => {
    setError('');
    setScanStatus(translations.scanner.starting);
    
    startScan(localConfig);
    onScanStart(localConfig);
    
    // Start auto-continuation after initial scan
    setTimeout(() => {
      continueScanning();
    }, localConfig.delay);
  };

  const handleStopScan = () => {
    stopScan();
    setScanStatus(translations.scanner.stopped);
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
      <DialogTitle>{translations.scanner.title}</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          {!isScanning && (
            <Box sx={{ mb: 2 }}>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>{translations.scanner.mode}</InputLabel>
                <Select
                  value={localConfig.mode}
                  onChange={(e) => setLocalConfig({
                    ...localConfig,
                    mode: e.target.value as 'sequential' | 'random' | 'targeted'
                  })}
                >
                  <MenuItem value="sequential">{translations.scanner.sequential}</MenuItem>
                  <MenuItem value="random">{translations.scanner.random}</MenuItem>
                  <MenuItem value="targeted">{translations.scanner.targeted}</MenuItem>
                </Select>
              </FormControl>

              {localConfig.mode === 'targeted' && (
                <TextField
                  fullWidth
                  label={translations.scanner.targetPage}
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
                label={translations.scanner.maxPages}
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
                label={translations.scanner.delay}
                type="number"
                value={localConfig.delay}
                onChange={(e) => setLocalConfig({
                  ...localConfig,
                  delay: parseInt(e.target.value) || 1000
                })}
                helperText={translations.scanner.delayHelp}
                sx={{ mb: 2 }}
              />
            </Box>
          )}

          {isScanning && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                {translations.scanner.status}
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  {scanStatus}
                </Typography>
                {isAutoContinuing && (
                  <Chip 
                    label={translations.scanner.autoContinuing} 
                    color="info" 
                    size="small" 
                    sx={{ mt: 1 }}
                  />
                )}
              </Box>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2">
                  {translations.scanner.currentPage}: {currentPage}
                </Typography>
                <Typography variant="body2">
                  {translations.scanner.pagesScanned}: {pagesScanned}
                </Typography>
                <Typography variant="body2">
                  {translations.scanner.totalBalance}: {totalBalance} BTC
                </Typography>
                <Typography variant="body2">
                  {translations.scanner.scanRate}: {getScanRate()} pages/sec
                </Typography>
                <Typography variant="body2">
                  {translations.scanner.duration}: {getScanDuration()}s
                </Typography>
              </Box>

              <LinearProgress 
                variant="determinate" 
                value={Math.min((pagesScanned / (scanConfig.maxPages || 100)) * 100, 100)}
                sx={{ mb: 2 }}
              />

              {totalBalance > 0 && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {translations.scanner.fundsFound} - {totalBalance} BTC on page {lastScannedPage}!
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
            {translations.scanner.start}
          </Button>
        ) : (
          <Button onClick={handleStopScan} variant="contained" color="error">
            {translations.scanner.stop}
          </Button>
        )}
        <Button onClick={handleClose}>
          {translations.common.close}
        </Button>
      </DialogActions>
    </Dialog>
  );
} 