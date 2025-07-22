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
  Alert,
  Button,
  Switch,
  FormControlLabel
} from '@mui/material';
import { 
  AccountBalance as BalanceIcon, 
  ExpandMore as ExpandMoreIcon, 
  ExpandLess as ExpandLessIcon, 
  Key as KeyIcon,
  CurrencyExchange as CurrencyExchangeIcon
} from '@mui/icons-material';
import { useTranslation, formatTranslation } from '../translations';
import LazyKeyCard from './LazyKeyCard';
import Decimal from 'decimal.js';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { useCopyToClipboard } from '../utils/clipboard';
import { CryptoCurrency } from '../../lib/types/multi-currency';
import AddressManagement from './AddressManagement';
import { USDCalculationService } from '../../lib/services/USDCalculationService';

// Currency configuration for multi-currency support
const CURRENCY_CONFIG = {
  BTC: { name: 'Bitcoin', icon: '🟠', color: '#f7931a', shortName: 'BTC' },
  BCH: { name: 'Bitcoin Cash', icon: '🍊', color: '#00d4aa', shortName: 'BCH' },
  DASH: { name: 'Dash', icon: '🔵', color: '#1c75bc', shortName: 'DASH' },
  DOGE: { name: 'Dogecoin', icon: '🐕', color: '#c2a633', shortName: 'DOGE' },
  ETH: { name: 'Ethereum', icon: '⚪', color: '#627eea', shortName: 'ETH' },
  LTC: { name: 'Litecoin', icon: '🥈', color: '#bfbbbb', shortName: 'LTC' },
  XRP: { name: 'Ripple', icon: '🌊', color: '#23292f', shortName: 'XRP' },
  ZEC: { name: 'Zcash', icon: '🛡️', color: '#f4b728', shortName: 'ZEC' }
};

// All supported currencies in display order
const ALL_CURRENCIES: CryptoCurrency[] = ['BTC', 'BCH', 'DASH', 'DOGE', 'ETH', 'LTC', 'XRP', 'ZEC'];

// Utility function to truncate key numbers for table display
const truncateKeyNumber = (keyNumber: string): string => {
  if (keyNumber.length > 5) {
    return keyNumber.substring(0, 5) + '[...]';
  }
  return keyNumber;
};

// Helper function to safely get balance value for any currency
const getBalance = (key: any, currency: CryptoCurrency, addressType?: string): number => {
  // Check if it's multi-currency format
  if (key.balances && typeof key.balances === 'object') {
    // Multi-currency format: key.balances.BTC.p2pkh_compressed
    if (key.balances[currency] && typeof key.balances[currency] === 'object') {
      if (addressType) {
        const balance = key.balances[currency][addressType];
    if (balance && typeof balance === 'object' && balance.balance !== undefined) {
      return parseFloat(balance.balance);
    }
    return typeof balance === 'number' ? balance : 0;
      } else {
        // Return total for currency
        return Object.values(key.balances[currency]).reduce((sum: number, bal: any) => {
          if (typeof bal === 'number') return sum + bal;
          if (bal && typeof bal === 'object' && bal.balance !== undefined) {
            return sum + parseFloat(bal.balance);
          }
          return sum;
        }, 0);
      }
    }
    
    // Legacy format for Bitcoin: key.balances.p2pkh_compressed
    if (currency === 'BTC') {
      if (addressType && typeof key.balances[addressType] === 'number') {
    return key.balances[addressType];
      } else if (!addressType) {
        // Return total Bitcoin balance
        return Object.values(key.balances).reduce((sum: number, bal: any) => {
          return sum + (typeof bal === 'number' ? bal : 0);
        }, 0);
      }
    }
  }
  
  return 0;
};

// Helper function to get address for any currency
const getAddress = (key: any, currency: CryptoCurrency, addressType: string): string => {
  // Multi-currency format
  if (key.addresses && typeof key.addresses === 'object') {
    if (key.addresses[currency] && typeof key.addresses[currency] === 'object') {
      return key.addresses[currency][addressType] || '';
    }
    
    // Legacy format for Bitcoin
    if (currency === 'BTC' && typeof key.addresses[addressType] === 'string') {
      return key.addresses[addressType];
    }
  }
  
  return '';
};

// Helper function to check if key has multi-currency data
const isMultiCurrency = (key: any): boolean => {
  if (!key.addresses || typeof key.addresses !== 'object') return false;
  
  // Check if any top-level key is a known currency symbol with nested addresses
  const currencyKeys = Object.keys(key.addresses);
  const hasCurrencySymbols = currencyKeys.some(k => Object.keys(CURRENCY_CONFIG).includes(k));
  
  // Legacy format has direct address fields like p2pkh_compressed at top level
  const hasLegacyFormat = key.addresses.p2pkh_compressed !== undefined;
  
  return hasCurrencySymbols && !hasLegacyFormat;
};

// Helper function to get available currencies for a key
const getAvailableCurrencies = (key: any): CryptoCurrency[] => {
  if (!isMultiCurrency(key)) return ['BTC'];
  
  return Object.keys(key.addresses).filter(k => 
    typeof key.addresses[k] === 'object' && 
    Object.keys(CURRENCY_CONFIG).includes(k)
  ) as CryptoCurrency[];
};

// Helper function to get total balance across all currencies
const getTotalBalance = (key: any): number => {
  const availableCurrencies = getAvailableCurrencies(key);
  return availableCurrencies.reduce((total, currency) => {
    return total + getBalance(key, currency);
  }, 0);
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
  const [expandedCurrencies, setExpandedCurrencies] = useState<Map<number, Set<CryptoCurrency>>>(new Map());
  const [showAllCurrencies, setShowAllCurrencies] = useState(false);
  const { copy } = useCopyToClipboard();
  const t = useTranslation();
  
  // Get USD calculation service
  const usdService = USDCalculationService.getInstance();

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

  // Check if any key has multi-currency data
  const hasMultiCurrencyData = useMemo(() => {
    return optimizedKeys.some(key => isMultiCurrency(key));
  }, [optimizedKeys]);

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

  // Handle currency expansion for individual keys
  const toggleCurrencyExpansion = useCallback((keyIndex: number, currency: CryptoCurrency) => {
    setExpandedCurrencies(prev => {
      const newMap = new Map(prev);
      const keyExpanded = newMap.get(keyIndex) || new Set();
      const newKeyExpanded = new Set(keyExpanded);
      
      if (newKeyExpanded.has(currency)) {
        newKeyExpanded.delete(currency);
      } else {
        newKeyExpanded.add(currency);
      }
      
      newMap.set(keyIndex, newKeyExpanded);
      return newMap;
    });
  }, []);

  // Handle "Expand All Currencies" toggle
  const handleExpandAllCurrencies = useCallback(() => {
    setShowAllCurrencies(prev => {
      const newValue = !prev;
      if (newValue) {
        // Expand all currencies for all keys
        const newMap = new Map<number, Set<CryptoCurrency>>();
        optimizedKeys.forEach((key, index) => {
          const availableCurrencies = getAvailableCurrencies(key);
          newMap.set(index, new Set(availableCurrencies));
        });
        setExpandedCurrencies(newMap);
      } else {
        // Collapse all currencies
        setExpandedCurrencies(new Map());
      }
      return newValue;
    });
  }, [optimizedKeys]);

  // Render multi-currency address table
  const renderMultiCurrencyAddresses = (key: any, keyNumber: string, keyIndex: number) => {
    const availableCurrencies = getAvailableCurrencies(key);
    const keyExpandedCurrencies = expandedCurrencies.get(keyIndex) || new Set();
    
    return (
      <Box>
        <Typography variant="h6" gutterBottom component="div">
          {formatTranslation(t.keyDetails, { number: keyNumber })}
        </Typography>

        {/* Multi-Currency Controls */}
        {hasMultiCurrencyData && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Button
              variant={showAllCurrencies ? "contained" : "outlined"}
              size="small"
              startIcon={<CurrencyExchangeIcon />}
              onClick={handleExpandAllCurrencies}
              sx={{ fontSize: '0.7rem' }}
            >
              {showAllCurrencies ? 'Collapse All' : 'Expand All'} Currencies ({availableCurrencies.length})
            </Button>
            <Typography variant="caption" color="text.secondary">
              {showAllCurrencies 
                ? `All ${availableCurrencies.length} cryptocurrencies expanded`
                : `Click to expand all ${availableCurrencies.length} supported cryptocurrencies`
              }
            </Typography>
          </Box>
        )}
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* Private Key Section */}
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
          
          {/* Currency Sections */}
          {availableCurrencies.map((currency) => {
            const config = CURRENCY_CONFIG[currency];
            const currencyAddresses = isMultiCurrency(key) ? key.addresses[currency] : (currency === 'BTC' ? key.addresses : {});
            
            if (!currencyAddresses || typeof currencyAddresses !== 'object') return null;
            
            const addressEntries = Object.entries(currencyAddresses);
            const currencyBalance = getBalance(key, currency);
            const currencyHasFunds = currencyBalance > 0;
            const isCurrencyExpanded = keyExpandedCurrencies.has(currency) || showAllCurrencies;
            
            return (
              <Box key={currency} sx={{ 
                p: 2, 
                border: '1px solid rgba(255,255,255,0.1)', 
                borderRadius: 1,
                bgcolor: currencyHasFunds ? `${config.color}10` : 'rgba(255,255,255,0.02)'
              }}>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    mb: isCurrencyExpanded ? 2 : 0
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCurrencyExpansion(keyIndex, currency);
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ fontSize: '1.2rem' }}>{config.icon}</Typography>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {config.name} ({config.shortName})
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography 
                          variant="subtitle1" 
                          fontWeight="bold"
                          sx={{ 
                            fontSize: '1rem',
                            color: currencyHasFunds ? 'success.main' : 'text.primary'
                          }}
                        >
                          {usdService.formatCryptoBalance(usdService.convertFromAtomicUnits(currencyBalance, currency), currency)} {config.shortName}
                        </Typography>
                        {currencyHasFunds && currencyBalance > 0 && (
                          <Typography 
                            variant="subtitle1" 
                            fontWeight="bold"
                            sx={{ 
                              fontSize: '1rem',
                              color: 'text.secondary'
                            }}
                          >
                            {usdService.formatUSDValue(usdService.calculateUSDValueFromAtomic(currencyBalance, currency))}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {addressEntries.length} addresses
                    </Typography>
                  </Box>
                  <IconButton size="small">
                    {isCurrencyExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Box>
                
                <Collapse in={isCurrencyExpanded} timeout="auto" unmountOnExit>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {addressEntries.map(([addressType, address]) => {
                      const balance = getBalance(key, currency, addressType);
                      const hasBalance = balance > 0;
                      
                      return (
                        <Box key={addressType} sx={{
                          p: 1,
                          borderRadius: 1,
                          bgcolor: hasBalance ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255,255,255,0.03)',
                          border: hasBalance ? '1px solid rgba(76, 175, 80, 0.3)' : '1px solid rgba(255,255,255,0.05)'
                        }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', minWidth: 120 }}>
                              {addressType.replace(/_/g, ' ').toUpperCase()}:
                            </Typography>
                            {hasBalance && (
                              <Chip 
                                label={`💰 ${usdService.formatCryptoBalance(usdService.convertFromAtomicUnits(balance, currency), currency)} ${config.shortName}`} 
                                size="small" 
                                color="success"
                                sx={{ fontSize: '0.5rem', height: 16 }}
                              />
                            )}
                          </Box>
                          <AddressManagement
                            address={address as string}
                            currency={currency}
                            addressType={addressType}
                            balance={balance}
                            compact={true}
                            showQR={false}
                            showExplorer={true}
                            showCopy={true}
                          />
                        </Box>
                      );
                    })}
                  </Box>
                </Collapse>
              </Box>
            );
          })}
        </Box>
      </Box>
    );
  };

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
        <Box>
          {/* Multi-Currency Table Controls */}
          {hasMultiCurrencyData && (
            <Box sx={{ mb: 2, p: 2, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CurrencyExchangeIcon color="primary" />
                  <Typography variant="subtitle2" color="primary.main">
                    Multi-Currency Table Mode
                  </Typography>
                  <Chip 
                    label={`${ALL_CURRENCIES.length} Cryptocurrencies`} 
                    size="small" 
                    color="primary" 
                    sx={{ fontSize: '0.6rem' }}
                  />
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={showAllCurrencies}
                      onChange={handleExpandAllCurrencies}
                      size="small"
                    />
                  }
                  label={
                    <Typography variant="caption">
                      Expand All Currencies
                    </Typography>
                  }
                />
              </Box>
            </Box>
          )}

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t.expand}</TableCell>
                <TableCell>{t.keyNumber}</TableCell>
                <TableCell>{t.privateKeyHex}</TableCell>
                  <TableCell align="center">{t.totalBalance}</TableCell>
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
                  const totalBalance = getTotalBalance(key);
                  const availableCurrencies = getAvailableCurrencies(key);
                
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
                        
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            {hasMultiCurrencyData ? (
                              // For multi-currency, show USD total
                              (() => {
                                const usdTotal = availableCurrencies.reduce((total, currency) => {
                                  const currencyBalance = getBalance(key, currency);
                                  return total + usdService.calculateUSDValueFromAtomic(currencyBalance, currency);
                                }, 0);
                                return (
                                  <>
                                    <Typography variant="body2" fontWeight="bold">
                                      {usdService.formatUSDValue(usdTotal)}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      USD Total
                                    </Typography>
                                  </>
                                );
                              })()
                            ) : (
                              // For Bitcoin-only, show BTC total
                              (() => {
                                const btcTotal = usdService.convertFromAtomicUnits(totalBalance, 'BTC');
                                return (
                                  <>
                                    <Typography variant="body2" fontWeight="bold">
                                      {usdService.formatCryptoBalance(btcTotal, 'BTC')}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      BTC
                                    </Typography>
                                  </>
                                );
                              })()
                            )}
                            {totalBalance > 0 && (
                          <Chip 
                                label="💰" 
                            color="success" 
                            size="small"
                                sx={{ mt: 0.5, height: 16, fontSize: '0.6rem' }}
                          />
                        )}
                          </Box>
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
                                renderMultiCurrencyAddresses(key, keyNumber, index)
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
        </Box>
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