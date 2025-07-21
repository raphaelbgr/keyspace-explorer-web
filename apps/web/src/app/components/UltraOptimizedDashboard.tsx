import React, { memo, useMemo, useCallback, useRef, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Collapse,
  CircularProgress,
  Tooltip,
  Snackbar,
  Alert
} from '@mui/material';
import { AccountBalance as BalanceIcon, ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon, Key as KeyIcon } from '@mui/icons-material';
import { useTranslation, formatTranslation } from '../translations';
import LazyKeyCard from './LazyKeyCard';
import Decimal from 'decimal.js';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useCopyToClipboard } from '../utils/clipboard';

// Utility function to truncate key numbers for table display
const truncateKeyNumber = (keyNumber: string): string => {
  if (keyNumber.length > 5) {
    return keyNumber.substring(0, 5) + '[...]';
  }
  return keyNumber;
};

interface UltraOptimizedDashboardProps {
  pageData: any;
  displayedKeys: any[];
  keysPerPage: number;
  currentKeysPage: number;
  expandedKeys: Set<number>;
  onToggleExpansion: (keyIndex: number) => void;
  displayMode: 'grid' | 'table';
}

const UltraOptimizedDashboard = memo<UltraOptimizedDashboardProps>(({
  pageData,
  displayedKeys,
  keysPerPage,
  currentKeysPage,
  expandedKeys,
  onToggleExpansion,
  displayMode
}) => {
  const [loadingAddresses, setLoadingAddresses] = useState<Set<number>>(new Set());
  const [loadedAddresses, setLoadedAddresses] = useState<Set<number>>(new Set());
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const { copy } = useCopyToClipboard();
  const t = useTranslation();

  // Handle copying to clipboard with user feedback
  const handleCopy = async (text: string) => {
    const result = await copy(text);
    setNotification({
      message: result.message,
      type: result.success ? 'success' : 'error'
    });
  };

  // Show all displayed keys without artificial limiting
  const optimizedKeys = useMemo(() => {
    return displayedKeys;
  }, [displayedKeys]);

  const handleToggleExpansion = useCallback((keyIndex: number) => {
    const globalIndex = (currentKeysPage - 1) * keysPerPage + keyIndex;
    
    // If expanding and addresses not loaded yet, trigger lazy loading
    if (!expandedKeys.has(globalIndex) && !loadedAddresses.has(globalIndex)) {
      setLoadingAddresses(prev => new Set(prev).add(globalIndex));
      
      // Simulate loading delay
      setTimeout(() => {
        setLoadedAddresses(prev => new Set(prev).add(globalIndex));
        setLoadingAddresses(prev => {
          const newSet = new Set(prev);
          newSet.delete(globalIndex);
          return newSet;
        });
      }, 300);
    }
    
    onToggleExpansion(globalIndex);
  }, [expandedKeys, loadedAddresses, currentKeysPage, keysPerPage, onToggleExpansion]);

  return (
    <Box>
      {displayMode === 'grid' ? (
        <Grid container spacing={1}>
          {optimizedKeys.map((key, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
              <LazyKeyCard
                keyData={key}
                index={index}
                isExpanded={expandedKeys.has((currentKeysPage - 1) * keysPerPage + index)}
                onToggleExpansion={() => handleToggleExpansion(index)}
                keysPerPage={keysPerPage}
                currentKeysPage={currentKeysPage}
                isLoadingAddresses={loadingAddresses.has((currentKeysPage - 1) * keysPerPage + index)}
                areAddressesLoaded={loadedAddresses.has((currentKeysPage - 1) * keysPerPage + index)}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t.expand}</TableCell>
                <TableCell>{t.keyNumber}</TableCell>
                <TableCell>{t.privateKeyHex}</TableCell>
                <TableCell>{t.totalBalance}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {optimizedKeys.map((key, index) => {
                // Calculate absolute key number in Bitcoin keyspace (not relative to UI pagination)
                const keyspacePageNumber = pageData?.pageNumber || '1';
                const keysPerKeyspacePage = pageData?.keys?.length || 45; // Use actual keys per page from backend
                const keyNumber = Decimal(keyspacePageNumber).minus(1).times(keysPerKeyspacePage).plus(key.index).plus(1).toFixed(0);
                const globalIndex = (currentKeysPage - 1) * keysPerPage + index;
                const isExpanded = expandedKeys.has(globalIndex);
                const isLoadingAddresses = loadingAddresses.has(globalIndex);
                const areAddressesLoaded = loadedAddresses.has(globalIndex);
                
                return (
                  <React.Fragment key={index}>
                    <TableRow hover data-key-index={index}>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleToggleExpansion(index)}
                        >
                          {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </TableCell>
                      <TableCell>{truncateKeyNumber(keyNumber)}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <KeyIcon sx={{ fontSize: '1rem', color: '#FFD700' }} />
                          <Typography variant="body2" fontFamily="monospace" sx={{ fontSize: '0.75rem' }}>
                            {key.privateKey}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {key.totalBalance.toFixed(8)} {t.btc}
                        {key.totalBalance > 0 && (
                          <Chip 
                            label={t.funds} 
                            color="success" 
                            size="small"
                            sx={{ ml: 1 }}
                          />
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={4}>
                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                          <Box sx={{ margin: 1 }}>
                            {isLoadingAddresses ? (
                              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                <CircularProgress size={24} />
                                <Typography variant="body2" sx={{ ml: 2 }}>
                                  {t.loadingAddresses}
                                </Typography>
                              </Box>
                            ) : areAddressesLoaded ? (
                              <Box>
                                <Typography variant="h6" gutterBottom component="div">
                                  {formatTranslation(t.keyDetails, { number: keyNumber })}
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                  <Box>
                                    <Typography variant="subtitle2" color="text.secondary">
                                      {t.privateKey}:
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <KeyIcon sx={{ fontSize: '1rem', color: '#FFD700' }} />
                                      <Typography variant="body2" fontFamily="monospace" sx={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
                                        {key.privateKey}
                                      </Typography>
                                      <Tooltip title="Copy Private Key">
                                        <IconButton size="small" onClick={(e) => {
                                          e.stopPropagation();
                                          handleCopy(key.privateKey);
                                        }}>
                                          <ContentCopyIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                    </Box>
                                  </Box>
                                  
                                  <Box>
                                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                                      {t.allAddresses}:
                                    </Typography>
                                    <Table size="small">
                                      <TableHead>
                                        <TableRow>
                                          <TableCell>Address Type</TableCell>
                                          <TableCell>Address</TableCell>
                                          <TableCell align="right">Balance (BTC)</TableCell>
                                          <TableCell>Actions</TableCell>
                                        </TableRow>
                                      </TableHead>
                                      <TableBody>
                                        <TableRow
                                          sx={{
                                            bgcolor: key.balances.p2pkh_compressed > 0 ? 'success.main' : 'transparent',
                                            border: key.balances.p2pkh_compressed > 0 ? '2px solid' : 'none',
                                            borderColor: 'success.light',
                                            '&:hover': {
                                              bgcolor: key.balances.p2pkh_compressed > 0 ? 'success.dark' : 'action.hover',
                                            }
                                          }}
                                        >
                                          <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                              <Typography variant="body2" fontWeight="medium">
                                                {t.p2pkhCompressed}
                                              </Typography>
                                              {key.balances.p2pkh_compressed > 0 && (
                                                <Chip 
                                                  label="💰 FUNDED!" 
                                                  size="small" 
                                                  color="success" 
                                                  sx={{ 
                                                    fontWeight: 'bold',
                                                    animation: 'pulse 2s infinite'
                                                  }} 
                                                />
                                              )}
                                            </Box>
                                          </TableCell>
                                          <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.7rem', wordBreak: 'break-all' }}>
                                            {key.addresses.p2pkh_compressed}
                                          </TableCell>
                                          <TableCell align="right">
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                                              <Typography variant="body2" fontFamily="monospace" fontWeight={key.balances.p2pkh_compressed > 0 ? 'bold' : 'normal'}>
                                                {key.balances.p2pkh_compressed.toFixed(8)}
                                              </Typography>
                                              {key.balances.p2pkh_compressed > 0 && (
                                                <Chip 
                                                  label="💰" 
                                                  size="small" 
                                                  color="success" 
                                                  sx={{ minWidth: 24, height: 20 }}
                                                />
                                              )}
                                            </Box>
                                          </TableCell>
                                          <TableCell>
                                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                              <Tooltip title="Copy address" arrow>
                                                <IconButton
                                                  size="small"
                                                  onClick={() => handleCopy(key.addresses.p2pkh_compressed)}
                                                >
                                                  <ContentCopyIcon fontSize="small" />
                                                </IconButton>
                                              </Tooltip>
                                              <Tooltip title="Explore on blockchain.com" arrow>
                                                <IconButton
                                                  size="small"
                                                  onClick={() => window.open(`https://www.blockchain.com/explorer/addresses/btc/${key.addresses.p2pkh_compressed}`, '_blank', 'noopener,noreferrer')}
                                                >
                                                  <OpenInNewIcon fontSize="small" />
                                                </IconButton>
                                              </Tooltip>
                                            </Box>
                                          </TableCell>
                                        </TableRow>
                                        <TableRow
                                          sx={{
                                            bgcolor: key.balances.p2pkh_uncompressed > 0 ? 'success.main' : 'transparent',
                                            border: key.balances.p2pkh_uncompressed > 0 ? '2px solid' : 'none',
                                            borderColor: 'success.light',
                                            '&:hover': {
                                              bgcolor: key.balances.p2pkh_uncompressed > 0 ? 'success.dark' : 'action.hover',
                                            }
                                          }}
                                        >
                                          <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                              <Typography variant="body2" fontWeight="medium">
                                                {t.p2pkhUncompressed}
                                              </Typography>
                                              {key.balances.p2pkh_uncompressed > 0 && (
                                                <Chip 
                                                  label="💰 FUNDED!" 
                                                  size="small" 
                                                  color="success" 
                                                  sx={{ 
                                                    fontWeight: 'bold',
                                                    animation: 'pulse 2s infinite'
                                                  }} 
                                                />
                                              )}
                                            </Box>
                                          </TableCell>
                                          <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.7rem', wordBreak: 'break-all' }}>
                                            {key.addresses.p2pkh_uncompressed}
                                          </TableCell>
                                          <TableCell align="right">
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                                              <Typography variant="body2" fontFamily="monospace" fontWeight={key.balances.p2pkh_uncompressed > 0 ? 'bold' : 'normal'}>
                                                {key.balances.p2pkh_uncompressed.toFixed(8)}
                                              </Typography>
                                              {key.balances.p2pkh_uncompressed > 0 && (
                                                <Chip 
                                                  label="💰" 
                                                  size="small" 
                                                  color="success" 
                                                  sx={{ minWidth: 24, height: 20 }}
                                                />
                                              )}
                                            </Box>
                                          </TableCell>
                                          <TableCell>
                                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                              <Tooltip title="Copy address" arrow>
                                                <IconButton
                                                  size="small"
                                                  onClick={() => handleCopy(key.addresses.p2pkh_uncompressed)}
                                                >
                                                  <ContentCopyIcon fontSize="small" />
                                                </IconButton>
                                              </Tooltip>
                                              <Tooltip title="Explore on blockchain.com" arrow>
                                                <IconButton
                                                  size="small"
                                                  onClick={() => window.open(`https://www.blockchain.com/explorer/addresses/btc/${key.addresses.p2pkh_uncompressed}`, '_blank', 'noopener,noreferrer')}
                                                >
                                                  <OpenInNewIcon fontSize="small" />
                                                </IconButton>
                                              </Tooltip>
                                            </Box>
                                          </TableCell>
                                        </TableRow>
                                        <TableRow
                                          sx={{
                                            bgcolor: key.balances.p2wpkh > 0 ? 'success.main' : 'transparent',
                                            border: key.balances.p2wpkh > 0 ? '2px solid' : 'none',
                                            borderColor: 'success.light',
                                            '&:hover': {
                                              bgcolor: key.balances.p2wpkh > 0 ? 'success.dark' : 'action.hover',
                                            }
                                          }}
                                        >
                                          <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                              <Typography variant="body2" fontWeight="medium">
                                                {t.p2wpkh}
                                              </Typography>
                                              {key.balances.p2wpkh > 0 && (
                                                <Chip 
                                                  label="💰 FUNDED!" 
                                                  size="small" 
                                                  color="success" 
                                                  sx={{ 
                                                    fontWeight: 'bold',
                                                    animation: 'pulse 2s infinite'
                                                  }} 
                                                />
                                              )}
                                            </Box>
                                          </TableCell>
                                          <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.7rem', wordBreak: 'break-all' }}>
                                            {key.addresses.p2wpkh}
                                          </TableCell>
                                          <TableCell align="right">
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                                              <Typography variant="body2" fontFamily="monospace" fontWeight={key.balances.p2wpkh > 0 ? 'bold' : 'normal'}>
                                                {key.balances.p2wpkh.toFixed(8)}
                                              </Typography>
                                              {key.balances.p2wpkh > 0 && (
                                                <Chip 
                                                  label="💰" 
                                                  size="small" 
                                                  color="success" 
                                                  sx={{ minWidth: 24, height: 20 }}
                                                />
                                              )}
                                            </Box>
                                          </TableCell>
                                          <TableCell>
                                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                              <Tooltip title="Copy address" arrow>
                                                <IconButton
                                                  size="small"
                                                  onClick={() => handleCopy(key.addresses.p2wpkh)}
                                                >
                                                  <ContentCopyIcon fontSize="small" />
                                                </IconButton>
                                              </Tooltip>
                                              <Tooltip title="Explore on blockchain.com" arrow>
                                                <IconButton
                                                  size="small"
                                                  onClick={() => window.open(`https://www.blockchain.com/explorer/addresses/btc/${key.addresses.p2wpkh}`, '_blank', 'noopener,noreferrer')}
                                                >
                                                  <OpenInNewIcon fontSize="small" />
                                                </IconButton>
                                              </Tooltip>
                                            </Box>
                                          </TableCell>
                                        </TableRow>
                                        <TableRow
                                          sx={{
                                            bgcolor: key.balances.p2sh_p2wpkh > 0 ? 'success.main' : 'transparent',
                                            border: key.balances.p2sh_p2wpkh > 0 ? '2px solid' : 'none',
                                            borderColor: 'success.light',
                                            '&:hover': {
                                              bgcolor: key.balances.p2sh_p2wpkh > 0 ? 'success.dark' : 'action.hover',
                                            }
                                          }}
                                        >
                                          <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                              <Typography variant="body2" fontWeight="medium">
                                                {t.p2shP2wpkh}
                                              </Typography>
                                              {key.balances.p2sh_p2wpkh > 0 && (
                                                <Chip 
                                                  label="💰 FUNDED!" 
                                                  size="small" 
                                                  color="success" 
                                                  sx={{ 
                                                    fontWeight: 'bold',
                                                    animation: 'pulse 2s infinite'
                                                  }} 
                                                />
                                              )}
                                            </Box>
                                          </TableCell>
                                          <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.7rem', wordBreak: 'break-all' }}>
                                            {key.addresses.p2sh_p2wpkh}
                                          </TableCell>
                                          <TableCell align="right">
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                                              <Typography variant="body2" fontFamily="monospace" fontWeight={key.balances.p2sh_p2wpkh > 0 ? 'bold' : 'normal'}>
                                                {key.balances.p2sh_p2wpkh.toFixed(8)}
                                              </Typography>
                                              {key.balances.p2sh_p2wpkh > 0 && (
                                                <Chip 
                                                  label="💰" 
                                                  size="small" 
                                                  color="success" 
                                                  sx={{ minWidth: 24, height: 20 }}
                                                />
                                              )}
                                            </Box>
                                          </TableCell>
                                          <TableCell>
                                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                              <Tooltip title="Copy address" arrow>
                                                <IconButton
                                                  size="small"
                                                  onClick={() => handleCopy(key.addresses.p2sh_p2wpkh)}
                                                >
                                                  <ContentCopyIcon fontSize="small" />
                                                </IconButton>
                                              </Tooltip>
                                              <Tooltip title="Explore on blockchain.com" arrow>
                                                <IconButton
                                                  size="small"
                                                  onClick={() => window.open(`https://www.blockchain.com/explorer/addresses/btc/${key.addresses.p2sh_p2wpkh}`, '_blank', 'noopener,noreferrer')}
                                                >
                                                  <OpenInNewIcon fontSize="small" />
                                                </IconButton>
                                              </Tooltip>
                                            </Box>
                                          </TableCell>
                                        </TableRow>
                                        <TableRow
                                          sx={{
                                            bgcolor: key.balances.p2tr > 0 ? 'success.main' : 'transparent',
                                            border: key.balances.p2tr > 0 ? '2px solid' : 'none',
                                            borderColor: 'success.light',
                                            '&:hover': {
                                              bgcolor: key.balances.p2tr > 0 ? 'success.dark' : 'action.hover',
                                            }
                                          }}
                                        >
                                          <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                              <Typography variant="body2" fontWeight="medium">
                                                {t.p2tr}
                                              </Typography>
                                              {key.balances.p2tr > 0 && (
                                                <Chip 
                                                  label="💰 FUNDED!" 
                                                  size="small" 
                                                  color="success" 
                                                  sx={{ 
                                                    fontWeight: 'bold',
                                                    animation: 'pulse 2s infinite'
                                                  }} 
                                                />
                                              )}
                                            </Box>
                                          </TableCell>
                                          <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.7rem', wordBreak: 'break-all' }}>
                                            {key.addresses.p2tr}
                                          </TableCell>
                                          <TableCell align="right">
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                                              <Typography variant="body2" fontFamily="monospace" fontWeight={key.balances.p2tr > 0 ? 'bold' : 'normal'}>
                                                {key.balances.p2tr.toFixed(8)}
                                              </Typography>
                                              {key.balances.p2tr > 0 && (
                                                <Chip 
                                                  label="💰" 
                                                  size="small" 
                                                  color="success" 
                                                  sx={{ minWidth: 24, height: 20 }}
                                                />
                                              )}
                                            </Box>
                                          </TableCell>
                                          <TableCell>
                                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                                              <Tooltip title="Copy address" arrow>
                                                <IconButton
                                                  size="small"
                                                  onClick={() => handleCopy(key.addresses.p2tr)}
                                                >
                                                  <ContentCopyIcon fontSize="small" />
                                                </IconButton>
                                              </Tooltip>
                                              <Tooltip title="Explore on blockchain.com" arrow>
                                                <IconButton
                                                  size="small"
                                                  onClick={() => window.open(`https://www.blockchain.com/explorer/addresses/btc/${key.addresses.p2tr}`, '_blank', 'noopener,noreferrer')}
                                                >
                                                  <OpenInNewIcon fontSize="small" />
                                                </IconButton>
                                              </Tooltip>
                                            </Box>
                                          </TableCell>
                                        </TableRow>
                                      </TableBody>
                                    </Table>
                                  </Box>
                                </Box>
                              </Box>
                            ) : (
                              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                  {t.clickToLoadAddresses}
                                </Typography>
                              </Box>
                            )}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Notification Snackbar */}
      <Snackbar
        open={!!notification}
        autoHideDuration={3000}
        onClose={() => setNotification(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity={notification?.type}
          onClose={() => setNotification(null)} 
        >
          {notification?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
});

UltraOptimizedDashboard.displayName = 'UltraOptimizedDashboard';

export default UltraOptimizedDashboard; 