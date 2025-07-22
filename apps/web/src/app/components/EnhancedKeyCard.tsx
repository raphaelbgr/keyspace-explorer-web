'use client';

import React, { memo, useState } from 'react';
import { 
  Card, 
  Typography, 
  IconButton, 
  Chip, 
  Box, 
  Button, 
  Collapse, 
  CircularProgress, 
  Divider,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Visibility as VisibilityIcon,
  AccountBalance as BalanceIcon,
  Key as KeyIcon,
  MonetizationOn as FundedIcon
} from '@mui/icons-material';
import AddressModal from './AddressModal';
import { CurrencyAddressMap, CryptoCurrency } from '../../lib/types/multi-currency';

// Currency configuration with icons and colors
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

interface EnhancedKeyCardProps {
  keyData: {
    privateKey: string;
    index: number;
    addresses: CurrencyAddressMap;
    balances?: any; // Multi-currency balances
    totalBalance?: number;
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
  multiCurrency?: boolean;
}

const EnhancedKeyCard = memo<EnhancedKeyCardProps>(({ 
  keyData, 
  index, 
  isExpanded, 
  onToggleExpansion, 
  keysPerPage, 
  currentKeysPage,
  isLoadingAddresses = false,
  areAddressesLoaded = true,
  multiCurrency = false
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [expandedCurrency, setExpandedCurrency] = useState<CryptoCurrency | null>(null);
  
  const displayIndex = (currentKeysPage - 1) * keysPerPage + index + 1;
  const isFunded = keyData.hasAnyFunds || (keyData.totalBalance ?? 0) > 0;
  const fundedCurrencies = keyData.fundedCurrencies || [];

  // Get address count for each currency
  const getAddressCount = (currency: CryptoCurrency): number => {
    const addresses = keyData.addresses[currency];
    if (!addresses) return 0;
    return Object.keys(addresses).length;
  };

  // Get total address count
  const getTotalAddressCount = (): number => {
    return Object.keys(keyData.addresses).reduce((total, currency) => {
      return total + getAddressCount(currency as CryptoCurrency);
    }, 0);
  };

  // Render currency section
  const renderCurrencySection = (currency: CryptoCurrency) => {
    const config = CURRENCY_CONFIG[currency];
    const addresses = keyData.addresses[currency];
    const isCurrencyFunded = fundedCurrencies.includes(currency);
    const addressCount = getAddressCount(currency);
    
    if (!addresses || addressCount === 0) return null;

    return (
      <Box key={currency} sx={{ mb: 1 }}>
        <Accordion 
          expanded={expandedCurrency === currency}
          onChange={(_, expanded) => setExpandedCurrency(expanded ? currency : null)}
          sx={{ 
            boxShadow: 'none',
            border: `1px solid ${isCurrencyFunded ? config.color : 'rgba(0,0,0,0.12)'}`,
            borderRadius: '8px',
            '&.Mui-expanded': {
              margin: 0,
            },
            '&::before': {
              display: 'none',
            }
          }}
        >
          <AccordionSummary 
            expandIcon={<ExpandMoreIcon />}
            sx={{ 
              minHeight: 'auto !important',
              '& .MuiAccordionSummary-content': {
                margin: '8px 0 !important',
                alignItems: 'center'
              },
              backgroundColor: isCurrencyFunded ? `${config.color}15` : 'transparent'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
              <Typography sx={{ fontSize: '1.2em' }}>{config.icon}</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold', color: config.color }}>
                {config.shortName}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                ({addressCount} addresses)
              </Typography>
              {isCurrencyFunded && (
                <Chip 
                  icon={<FundedIcon />}
                  label="FUNDED"
                  size="small"
                  sx={{ 
                    ml: 'auto',
                    backgroundColor: config.color,
                    color: 'white',
                    fontSize: '0.7rem',
                    height: 20
                  }}
                />
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 0 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {Object.entries(addresses).map(([type, address]) => (
                <Box key={type} sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  p: 1,
                  borderRadius: '4px',
                  backgroundColor: 'rgba(0,0,0,0.02)',
                  border: '1px solid rgba(0,0,0,0.06)'
                }}>
                  <Typography variant="caption" color="text.secondary" sx={{ minWidth: '80px' }}>
                    {type.replace(/_/g, ' ').toUpperCase()}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      fontFamily: 'monospace',
                      fontSize: '0.7rem',
                      color: 'text.primary',
                      wordBreak: 'break-all',
                      textAlign: 'right',
                      flex: 1,
                      ml: 1
                    }}
                  >
                    {address}
                  </Typography>
                </Box>
              ))}
            </Box>
          </AccordionDetails>
        </Accordion>
      </Box>
    );
  };

  return (
    <>
      <Card 
        sx={{ 
          mb: 2,
          transition: 'all 0.3s ease-in-out',
          border: isFunded ? '2px solid #4caf50' : '1px solid rgba(0,0,0,0.12)',
          backgroundColor: isFunded ? 'rgba(76, 175, 80, 0.05)' : 'white',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: isFunded ? '0 4px 20px rgba(76, 175, 80, 0.3)' : '0 4px 12px rgba(0,0,0,0.15)'
          }
        }}
      >
        {/* Card Header */}
        <Box sx={{ p: 2, pb: isExpanded ? 1 : 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <KeyIcon color="primary" sx={{ fontSize: '1.2rem' }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Key #{displayIndex}
              </Typography>
              {multiCurrency && (
                <Chip 
                  label={`${getTotalAddressCount()} addresses`}
                  size="small" 
                  variant="outlined"
                  sx={{ fontSize: '0.7rem' }}
                />
              )}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {isFunded && (
                <Chip 
                  icon={<FundedIcon />}
                  label={`${fundedCurrencies.length} currencies funded`}
                  size="small"
                  sx={{ 
                    backgroundColor: '#4caf50',
                    color: 'white',
                    fontSize: '0.7rem'
                  }}
                />
              )}
              
              <Button
                variant="outlined"
                size="small"
                startIcon={<VisibilityIcon />}
                onClick={() => setModalOpen(true)}
                sx={{ minWidth: 'auto', px: 1 }}
              >
                View
              </Button>
              
              <IconButton 
                onClick={onToggleExpansion}
                size="small"
                sx={{ 
                  backgroundColor: 'rgba(0,0,0,0.04)',
                  '&:hover': { backgroundColor: 'rgba(0,0,0,0.08)' }
                }}
              >
                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
          </Box>

          {/* Funded Currency Indicators */}
          {isFunded && fundedCurrencies.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
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
                      fontSize: '0.7rem',
                      height: 20
                    }}
                  />
                );
              })}
            </Box>
          )}
        </Box>

        {/* Expanded Content */}
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <Divider />
          <Box sx={{ p: 2 }}>
            {isLoadingAddresses ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={24} />
                <Typography variant="body2" sx={{ ml: 2 }}>
                  Loading addresses...
                </Typography>
              </Box>
            ) : (
              <Box>
                {multiCurrency ? (
                  // Multi-currency display
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                      Cryptocurrency Addresses ({getTotalAddressCount()} total)
                    </Typography>
                    {(Object.keys(CURRENCY_CONFIG) as CryptoCurrency[]).map(renderCurrencySection)}
                  </Box>
                ) : (
                  // Legacy Bitcoin-only display
                  <Box>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                      Bitcoin Addresses
                    </Typography>
                    {/* Legacy Bitcoin address display would go here */}
                  </Box>
                )}
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
          keyNumber={displayIndex}
          keyData={{
            privateKey: keyData.privateKey,
            addresses: keyData.addresses,
            balances: keyData.balances || {},
            totalBalance: keyData.totalBalance || 0,
            hasAnyFunds: keyData.hasAnyFunds,
            fundedCurrencies: keyData.fundedCurrencies
          }}
        />
      )}
    </>
  );
});

EnhancedKeyCard.displayName = 'EnhancedKeyCard';

export default EnhancedKeyCard; 