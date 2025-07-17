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
  CircularProgress
} from '@mui/material';
import { AccountBalance as BalanceIcon, ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from '@mui/icons-material';
import LazyKeyCard from './LazyKeyCard';

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
                <TableCell>Expand</TableCell>
                <TableCell>Key #</TableCell>
                <TableCell>Private Key</TableCell>
                <TableCell>Total Balance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {optimizedKeys.map((key, index) => {
                const keyNumber = index + 1 + (currentKeysPage - 1) * keysPerPage;
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
                        {key.totalBalance.toFixed(8)} BTC
                        {key.totalBalance > 0 && (
                          <Chip 
                            label="FUNDS!" 
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
                                  Loading addresses...
                                </Typography>
                              </Box>
                            ) : areAddressesLoaded ? (
                              <Box>
                                <Typography variant="h6" gutterBottom component="div">
                                  Key {keyNumber} - Full Details
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                  <Box>
                                    <Typography variant="subtitle2" color="text.secondary">
                                      Private Key:
                                    </Typography>
                                    <Typography variant="body2" fontFamily="monospace" sx={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
                                      {key.privateKey}
                                    </Typography>
                                  </Box>
                                  
                                  <Box>
                                    <Typography variant="subtitle2" color="text.secondary">
                                      All Addresses:
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
                                      <Box>
                                        <Typography variant="caption" color="text.secondary">P2PKH (Compressed):</Typography>
                                        <Typography variant="body2" fontFamily="monospace" sx={{ fontSize: '0.7rem', wordBreak: 'break-all' }}>
                                          {key.addresses.p2pkh_compressed}
                                        </Typography>
                                      </Box>
                                      
                                      <Box>
                                        <Typography variant="caption" color="text.secondary">P2PKH (Uncompressed):</Typography>
                                        <Typography variant="body2" fontFamily="monospace" sx={{ fontSize: '0.7rem', wordBreak: 'break-all' }}>
                                          {key.addresses.p2pkh_uncompressed}
                                        </Typography>
                                      </Box>
                                      
                                      <Box>
                                        <Typography variant="caption" color="text.secondary">P2WPKH:</Typography>
                                        <Typography variant="body2" fontFamily="monospace" sx={{ fontSize: '0.7rem', wordBreak: 'break-all' }}>
                                          {key.addresses.p2wpkh}
                                        </Typography>
                                      </Box>
                                      
                                      <Box>
                                        <Typography variant="caption" color="text.secondary">P2SH-P2WPKH:</Typography>
                                        <Typography variant="body2" fontFamily="monospace" sx={{ fontSize: '0.7rem', wordBreak: 'break-all' }}>
                                          {key.addresses.p2sh_p2wpkh}
                                        </Typography>
                                      </Box>
                                      
                                      <Box>
                                        <Typography variant="caption" color="text.secondary">P2TR:</Typography>
                                        <Typography variant="body2" fontFamily="monospace" sx={{ fontSize: '0.7rem', wordBreak: 'break-all' }}>
                                          {key.addresses.p2tr}
                                        </Typography>
                                      </Box>
                                    </Box>
                                  </Box>
                                </Box>
                              </Box>
                            ) : null}
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