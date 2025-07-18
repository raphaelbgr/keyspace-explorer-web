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
  Tooltip
} from '@mui/material';
import { AccountBalance as BalanceIcon, ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from '@mui/icons-material';
import { useTranslation, formatTranslation } from '../translations';
import LazyKeyCard from './LazyKeyCard';
import Decimal from 'decimal.js';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

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
  const t = useTranslation();

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
                // Use the actual key number from the backend data (1-based)
                const keyNumber = Decimal(currentKeysPage).minus(1).times(keysPerPage).plus(key.index).plus(1).toFixed(0);
                const globalIndex = (currentKeysPage - 1) * keysPerPage + index;
                const isExpanded = expandedKeys.has(globalIndex);
                const isLoadingAddresses = loadingAddresses.has(globalIndex);
                const areAddressesLoaded = loadedAddresses.has(globalIndex);
                
                return (
                  <React.Fragment key={index}>
                    <TableRow hover>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleToggleExpansion(index)}
                        >
                          {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </TableCell>
                      <TableCell>{keyNumber}</TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {key.privateKey}
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
                                      <Typography variant="body2" fontFamily="monospace" sx={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
                                        {key.privateKey}
                                      </Typography>
                                      <Tooltip title={t.copyToClipboard}>
                                        <IconButton size="small" onClick={(e) => {
                                          e.stopPropagation();
                                          navigator.clipboard.writeText(key.privateKey);
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
                                        </TableRow>
                                      </TableHead>
                                      <TableBody>
                                        <TableRow>
                                          <TableCell>{t.p2pkhCompressed}</TableCell>
                                          <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.7rem', wordBreak: 'break-all' }}>
                                            {key.addresses.p2pkh_compressed}
                                          </TableCell>
                                          <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                                            {key.balances.p2pkh_compressed.toFixed(8)}
                                          </TableCell>
                                        </TableRow>
                                        <TableRow>
                                          <TableCell>{t.p2pkhUncompressed}</TableCell>
                                          <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.7rem', wordBreak: 'break-all' }}>
                                            {key.addresses.p2pkh_uncompressed}
                                          </TableCell>
                                          <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                                            {key.balances.p2pkh_uncompressed.toFixed(8)}
                                          </TableCell>
                                        </TableRow>
                                        <TableRow>
                                          <TableCell>{t.p2wpkh}</TableCell>
                                          <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.7rem', wordBreak: 'break-all' }}>
                                            {key.addresses.p2wpkh}
                                          </TableCell>
                                          <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                                            {key.balances.p2wpkh.toFixed(8)}
                                          </TableCell>
                                        </TableRow>
                                        <TableRow>
                                          <TableCell>{t.p2shP2wpkh}</TableCell>
                                          <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.7rem', wordBreak: 'break-all' }}>
                                            {key.addresses.p2sh_p2wpkh}
                                          </TableCell>
                                          <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                                            {key.balances.p2sh_p2wpkh.toFixed(8)}
                                          </TableCell>
                                        </TableRow>
                                        <TableRow>
                                          <TableCell>{t.p2tr}</TableCell>
                                          <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.7rem', wordBreak: 'break-all' }}>
                                            {key.addresses.p2tr}
                                          </TableCell>
                                          <TableCell align="right" sx={{ fontFamily: 'monospace' }}>
                                            {key.balances.p2tr.toFixed(8)}
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
    </Box>
  );
});

UltraOptimizedDashboard.displayName = 'UltraOptimizedDashboard';

export default UltraOptimizedDashboard; 