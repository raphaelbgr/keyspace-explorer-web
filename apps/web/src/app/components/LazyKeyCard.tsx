import React, { memo, useState, useEffect } from 'react';
import { Card, Typography, IconButton, Chip, Box, Button, Collapse, CircularProgress, Divider } from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Visibility as VisibilityIcon,
  AccountBalance as BalanceIcon,
  Key as KeyIcon
} from '@mui/icons-material';
import AddressModal from './AddressModal';
import AddressManagement from './AddressManagement';
import { CryptoCurrency } from '../../lib/types/multi-currency';

// Currency configuration for multi-currency support
const CURRENCY_CONFIG = {
  BTC: { name: 'Bitcoin', icon: '₿', color: '#f7931a', shortName: 'BTC' },
  BCH: { name: 'Bitcoin Cash', icon: '🍊', color: '#00d4aa', shortName: 'BCH' },
  DASH: { name: 'Dash', icon: '🔵', color: '#1c75bc', shortName: 'DASH' },
  DOGE: { name: 'Dogecoin', icon: '🐕', color: '#c2a633', shortName: 'DOGE' },
  ETH: { name: 'Ethereum', icon: '⚪', color: '#627eea', shortName: 'ETH' },
  LTC: { name: 'Litecoin', icon: '🥈', color: '#bfbbbb', shortName: 'LTC' },
  XRP: { name: 'Ripple', icon: '🌊', color: '#23292f', shortName: 'XRP' },
  ZEC: { name: 'Zcash', icon: '🛡️', color: '#f4b728', shortName: 'ZEC' }
};

interface LazyKeyCardProps {
  keyData: {
    privateKey: string;
    index: number;
    totalBalance: number;
    balances: {
      p2pkh_compressed: number;
      p2pkh_uncompressed: number;
      p2wpkh: number;
      p2sh_p2wpkh: number;
      p2tr: number;
    } | any; // Support multi-currency format
    addresses: {
      p2pkh_compressed: string;
      p2pkh_uncompressed: string;
      p2wpkh: string;
      p2sh_p2wpkh: string;
      p2tr: string;
    } | any; // Support multi-currency format
    fundedCurrencies?: CryptoCurrency[];
    hasAnyFunds?: boolean;
  };
  index: number;
  isExpanded: boolean;
  onToggleExpansion: () => void;
  keysPerPage: number;
  currentKeysPage: number;
  isLoadingAddresses?: boolean;
  areAddressesLoaded?: boolean;
}

const LazyKeyCard = memo<LazyKeyCardProps>(({ 
  keyData, 
  index, 
  isExpanded, 
  onToggleExpansion, 
  keysPerPage, 
  currentKeysPage,
  isLoadingAddresses = false,
  areAddressesLoaded = true
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadStarted, setLoadStarted] = useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);

  // Lazy loading on intersection
  useEffect(() => {
    if (loadStarted) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setLoadStarted(true);
          setTimeout(() => {
            setIsLoaded(true);
          }, 100 + Math.random() * 300); // Staggered loading
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [loadStarted]);

  if (!isLoaded) {
    return (
      <Card 
        ref={cardRef}
        variant="outlined" 
        data-key-index={index}
        sx={{ 
          p: 2, 
          height: 180,
          background: 'rgba(255,255,255,0.02)',
          border: '1px dashed rgba(255,255,255,0.1)'
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Loading...
          </Typography>
        </Box>
      </Card>
    );
  }

  const keyNumber = (currentKeysPage - 1) * keysPerPage + keyData.index + 1;
  const hasFunds = keyData.totalBalance > 0 || keyData.hasAnyFunds;
  
  // Detect if this is multi-currency format or legacy Bitcoin-only format
  const isMultiCurrency = keyData.addresses && typeof keyData.addresses === 'object' && 
    !(keyData.addresses as any).p2pkh_compressed && // Legacy format has direct properties
    Object.keys(keyData.addresses).some(key => typeof (keyData.addresses as any)[key] === 'object');
  
  // Extract Bitcoin addresses based on format
  const bitcoinAddresses = isMultiCurrency 
    ? (keyData.addresses as any).BTC || {}
    : keyData.addresses || {};
    
  // Extract Bitcoin balances based on format  
  const bitcoinBalances = isMultiCurrency
    ? (keyData.balances as any)?.BTC || {}
    : keyData.balances || {};
  
  // Helper function to safely extract numeric balance value
  const getNumericBalance = (balance: any): number => {
    if (typeof balance === 'number') return balance;
    if (typeof balance === 'string') return parseFloat(balance) || 0;
    if (balance && typeof balance === 'object' && balance.balance !== undefined) {
      return typeof balance.balance === 'number' ? balance.balance : parseFloat(balance.balance) || 0;
    }
    return 0;
  };
  
  // Safe balance access with defaults for undefined values
  const safeBalances = {
    p2pkh_compressed: getNumericBalance(bitcoinBalances?.p2pkh_compressed),
    p2pkh_uncompressed: getNumericBalance(bitcoinBalances?.p2pkh_uncompressed),
    p2wpkh: getNumericBalance(bitcoinBalances?.p2wpkh),
    p2sh_p2wpkh: getNumericBalance(bitcoinBalances?.p2sh_p2wpkh),
    p2tr: getNumericBalance(bitcoinBalances?.p2tr)
  };
  
  // Safe address access
  const safeAddresses = {
    p2pkh_compressed: bitcoinAddresses?.p2pkh_compressed || '',
    p2pkh_uncompressed: bitcoinAddresses?.p2pkh_uncompressed || '',
    p2wpkh: bitcoinAddresses?.p2wpkh || '',
    p2sh_p2wpkh: bitcoinAddresses?.p2sh_p2wpkh || '',
    p2tr: bitcoinAddresses?.p2tr || ''
  };

  // Multi-currency indicators
  const fundedCurrencies = keyData.fundedCurrencies || [];
  const getCurrencyFunds = (currency: CryptoCurrency) => {
    if (!isMultiCurrency) return currency === 'BTC' ? hasFunds : false;
    return fundedCurrencies.includes(currency);
  };
  
  return (
    <>
      <Card 
        ref={cardRef}
        variant="outlined" 
        data-key-index={index}
        sx={{ 
          p: 2, 
          cursor: 'pointer',
          transition: 'all 0.1s',
          border: hasFunds ? '2px solid' : '1px solid',
          borderColor: hasFunds ? 'success.main' : 'divider',
          background: hasFunds ? 'rgba(76, 175, 80, 0.05)' : 'transparent',
          '&:hover': { transform: 'translateY(-1px)', boxShadow: 1 }
        }}
        onClick={onToggleExpansion}
      >
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <KeyIcon color="primary" sx={{ fontSize: '1rem' }} />
            <Typography variant="subtitle2" color="text.secondary">
              Key {keyNumber}
            </Typography>
            {hasFunds && (
              <Chip 
                label="💰 FUNDED!" 
                color="success" 
                size="small"
                sx={{ fontSize: '0.6rem', height: 18 }}
              />
            )}
          </Box>
          <IconButton size="small">
            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        {/* Multi-Currency Funded Indicators */}
        {isMultiCurrency && fundedCurrencies.length > 0 && (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1, mb: 1 }}>
            {fundedCurrencies.map((currency) => {
              const config = CURRENCY_CONFIG[currency];
              return (
                <Chip
                  key={currency}
                  label={`${config.icon} ${config.shortName}`}
                  size="small"
                  sx={{
                    backgroundColor: config.color,
                    color: 'white',
                    fontSize: '0.65rem',
                    height: 16
                  }}
                />
              );
            })}
          </Box>
        )}

        {/* Private Key Preview */}
        <Typography variant="body2" fontFamily="monospace" sx={{ 
          wordBreak: 'break-all', 
          mb: 1, 
          fontSize: '0.7rem',
          opacity: 0.7
        }}>
          {keyData.privateKey.substring(0, 16)}...
        </Typography>

        {/* Bitcoin Balance Summary */}
        <Box sx={{ mb: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            {isMultiCurrency ? '₿ Bitcoin Balance Summary:' : '🟠 Bitcoin Balance Breakdown (5 address types):'}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <BalanceIcon sx={{ fontSize: '0.8rem', color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              Total: {(keyData.totalBalance || Object.values(safeBalances).reduce((sum, bal) => sum + bal, 0)).toFixed(8)} BTC
            </Typography>
            {hasFunds && (
              <Chip 
                label="💰 FUNDED!" 
                color="success" 
                size="small"
                sx={{ fontSize: '0.6rem', height: 16 }}
              />
            )}
          </Box>
          
          {/* Quick Balance Grid */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 0.25 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>P2PKH (Compressed):</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption" fontFamily="monospace" sx={{ fontSize: '0.65rem' }}>
                  {safeBalances.p2pkh_compressed.toFixed(8)}
                </Typography>
                {safeBalances.p2pkh_compressed > 0 && (
                  <Chip label="💰" size="small" color="success" sx={{ minWidth: 20, height: 14, fontSize: '0.5rem' }} />
                )}
              </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>P2PKH (Uncompressed):</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption" fontFamily="monospace" sx={{ fontSize: '0.65rem' }}>
                  {safeBalances.p2pkh_uncompressed.toFixed(8)}
                </Typography>
                {safeBalances.p2pkh_uncompressed > 0 && (
                  <Chip label="💰" size="small" color="success" sx={{ minWidth: 20, height: 14, fontSize: '0.5rem' }} />
                )}
              </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>P2WPKH:</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption" fontFamily="monospace" sx={{ fontSize: '0.65rem' }}>
                  {safeBalances.p2wpkh.toFixed(8)}
                </Typography>
                {safeBalances.p2wpkh > 0 && (
                  <Chip label="💰" size="small" color="success" sx={{ minWidth: 20, height: 14, fontSize: '0.5rem' }} />
                )}
              </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>P2SH-P2WPKH:</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption" fontFamily="monospace" sx={{ fontSize: '0.65rem' }}>
                  {safeBalances.p2sh_p2wpkh.toFixed(8)}
                </Typography>
                {safeBalances.p2sh_p2wpkh > 0 && (
                  <Chip label="💰" size="small" color="success" sx={{ minWidth: 20, height: 14, fontSize: '0.5rem' }} />
                )}
              </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>P2TR:</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption" fontFamily="monospace" sx={{ fontSize: '0.65rem' }}>
                  {safeBalances.p2tr.toFixed(8)}
                </Typography>
                {safeBalances.p2tr > 0 && (
                  <Chip label="💰" size="small" color="success" sx={{ minWidth: 20, height: 14, fontSize: '0.5rem' }} />
                )}
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<VisibilityIcon />}
            onClick={(e) => {
              e.stopPropagation();
              setModalOpen(true);
            }}
            sx={{ flex: 1 }}
          >
            View Details
          </Button>
        </Box>

        {/* Expanded View */}
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ mb: 1 }}>
            {areAddressesLoaded ? (
              <>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  🔗 Bitcoin Addresses with Enhanced Management:
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  {Object.entries(safeAddresses).map(([type, address]) => (
                    <Box key={type} sx={{ 
                      p: 1, 
                      borderRadius: 1, 
                      bgcolor: safeBalances[type as keyof typeof safeBalances] > 0 ? 'success.main' : 'rgba(255,255,255,0.03)',
                      border: safeBalances[type as keyof typeof safeBalances] > 0 ? '1px solid' : '1px solid rgba(255,255,255,0.1)',
                      borderColor: safeBalances[type as keyof typeof safeBalances] > 0 ? 'success.main' : 'rgba(255,255,255,0.1)'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          {type.replace(/_/g, ' ').toUpperCase()}:
                        </Typography>
                        {safeBalances[type as keyof typeof safeBalances] > 0 && (
                          <Chip 
                            label={`💰 ${safeBalances[type as keyof typeof safeBalances].toFixed(8)} BTC`} 
                            size="small" 
                            color="success"
                            sx={{ fontSize: '0.5rem', height: 16 }}
                          />
                        )}
                      </Box>
                      <AddressManagement
                        address={address}
                        currency="BTC"
                        addressType={type}
                        balance={safeBalances[type as keyof typeof safeBalances]}
                        compact={true}
                        showQR={false}
                      />
                    </Box>
                  ))}
                </Box>

                {/* Multi-Currency Sections */}
                {isMultiCurrency && (
                  <>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, mb: 1 }}>
                      🌐 Other Cryptocurrency Addresses:
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      {Object.keys(CURRENCY_CONFIG).filter(currency => currency !== 'BTC').map((currency) => {
                        const currencyKey = currency as CryptoCurrency;
                        const currencyAddresses = (keyData.addresses as any)[currencyKey];
                        const config = CURRENCY_CONFIG[currencyKey];
                        const isFunded = getCurrencyFunds(currencyKey);
                        
                        if (!currencyAddresses) return null;
                        
                        return (
                          <Box key={currency} sx={{ 
                            p: 1, 
                            borderRadius: 1, 
                            bgcolor: isFunded ? `${config.color}15` : 'rgba(255,255,255,0.03)',
                            border: '1px solid rgba(255,255,255,0.1)'
                          }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Typography sx={{ fontSize: '0.9em' }}>{config.icon}</Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                {config.name}:
                              </Typography>
                              {isFunded && (
                                <Chip label="💰 FUNDED" size="small" color="success" sx={{ fontSize: '0.5rem', height: 16 }} />
                              )}
                            </Box>
                            {Object.entries(currencyAddresses).slice(0, 1).map(([type, address]: [string, any]) => (
                              <AddressManagement
                                key={type}
                                address={address}
                                currency={currencyKey}
                                addressType={type}
                                compact={true}
                                showQR={false}
                              />
                            ))}
                            {Object.keys(currencyAddresses).length > 1 && (
                              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.6rem', fontStyle: 'italic' }}>
                                +{Object.keys(currencyAddresses).length - 1} more addresses...
                              </Typography>
                            )}
                          </Box>
                        );
                      })}
                    </Box>
                  </>
                )}
              </>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Click to load addresses
                </Typography>
              </Box>
            )}
          </Box>
        </Collapse>
      </Card>

      {/* Address Modal */}
      {modalOpen && (
        <AddressModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          keyNumber={keyNumber}
          keyData={{
            privateKey: keyData.privateKey,
            addresses: isMultiCurrency ? keyData.addresses : safeAddresses,
            balances: isMultiCurrency ? keyData.balances : safeBalances,
            totalBalance: keyData.totalBalance,
            hasAnyFunds: keyData.hasAnyFunds,
            fundedCurrencies: keyData.fundedCurrencies
          }}
        />
      )}
    </>
  );
});

LazyKeyCard.displayName = 'LazyKeyCard';

export default LazyKeyCard; 