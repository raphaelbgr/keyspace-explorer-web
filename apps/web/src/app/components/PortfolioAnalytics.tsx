'use client';

import React, { memo, useMemo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Chip,
  LinearProgress,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as BalanceIcon,
  PieChart as DonutIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import { CryptoCurrency } from '../../lib/types/multi-currency';

// Currency configuration with enhanced display info
const CURRENCY_DISPLAY_CONFIG = {
  BTC: {
    icon: '🟠',
    name: 'Bitcoin',
    precision: 8,
    symbol: 'BTC',
    color: '#f7931a',
    shortName: 'BTC'
  },
  BCH: {
    icon: '🍊',
    name: 'Bitcoin Cash',
    precision: 8,
    symbol: 'BCH',
    color: '#00d4aa',
    shortName: 'BCH'
  },
  DASH: {
    icon: '🔵',
    name: 'Dash',
    precision: 8,
    symbol: 'DASH',
    color: '#1c75bc',
    shortName: 'DASH'
  },
  DOGE: {
    icon: '🐕',
    name: 'Dogecoin',
    precision: 8,
    symbol: 'DOGE',
    color: '#c2a633',
    shortName: 'DOGE'
  },
  ETH: {
    icon: 'Ξ',
    name: 'Ethereum',
    precision: 18,
    symbol: 'ETH',
    color: '#627eea',
    shortName: 'ETH'
  },
  LTC: {
    icon: '🥈',
    name: 'Litecoin',
    precision: 8,
    symbol: 'LTC',
    color: '#bfbbbb',
    shortName: 'LTC'
  },
  XRP: {
    icon: '🌊',
    name: 'Ripple',
    precision: 6,
    symbol: 'XRP',
    color: '#23292f',
    shortName: 'XRP'
  },
  ZEC: {
    icon: '🛡️',
    name: 'Zcash',
    precision: 8,
    symbol: 'ZEC',
    color: '#f4b728',
    shortName: 'ZEC'
  }
};

interface PortfolioAnalyticsProps {
  keys: Array<{
    addresses: any;
    balances?: any;
    totalBalance?: number;
    fundedCurrencies?: CryptoCurrency[];
    hasAnyFunds?: boolean;
  }>;
  currencies: CryptoCurrency[];
  compact?: boolean;
}

interface CurrencyStats {
  currency: CryptoCurrency;
  totalBalance: number;
  fundedAddresses: number;
  totalAddresses: number;
  fundedKeys: number;
  percentage: number;
}

interface PortfolioMetrics {
  totalValue: Record<CryptoCurrency, number>;
  fundingDistribution: CurrencyStats[];
  diversityScore: number;
  topFundedCurrency: CryptoCurrency | null;
  emptyWallets: CryptoCurrency[];
  totalFundedKeys: number;
  totalKeys: number;
  overallFundingRate: number;
}

const PortfolioAnalytics = memo<PortfolioAnalyticsProps>(({
  keys,
  currencies,
  compact = false
}) => {
  // Calculate comprehensive portfolio metrics
  const portfolioMetrics = useMemo((): PortfolioMetrics => {
    const totalValue: Record<CryptoCurrency, number> = {} as Record<CryptoCurrency, number>;
    const currencyStats: Record<CryptoCurrency, CurrencyStats> = {} as Record<CryptoCurrency, CurrencyStats>;
    
    // Initialize stats for all currencies
    currencies.forEach(currency => {
      totalValue[currency] = 0;
      currencyStats[currency] = {
        currency,
        totalBalance: 0,
        fundedAddresses: 0,
        totalAddresses: 0,
        fundedKeys: 0,
        percentage: 0
      };
    });

    let totalFundedKeys = 0;
    
    // Process each key
    keys.forEach(key => {
      const hasAnyFunds = key.hasAnyFunds || (key.totalBalance ?? 0) > 0;
      const fundedCurrencies = key.fundedCurrencies || [];
      
      if (hasAnyFunds) {
        totalFundedKeys++;
      }

      currencies.forEach(currency => {
        const currencyAddresses = key.addresses?.[currency];
        const currencyBalances = key.balances?.[currency];
        
        if (currencyAddresses) {
          const addressCount = Object.keys(currencyAddresses).length;
          currencyStats[currency].totalAddresses += addressCount;
          
          // Check if this currency is funded for this key
          if (fundedCurrencies.includes(currency)) {
            currencyStats[currency].fundedKeys++;
            
            // Calculate total balance for this currency
            if (currencyBalances) {
              const addresses = Object.keys(currencyAddresses);
              addresses.forEach(addressType => {
                const balance = currencyBalances[addressType];
                const numericBalance = getNumericBalance(balance);
                currencyStats[currency].totalBalance += numericBalance;
                totalValue[currency] += numericBalance;
                
                if (numericBalance > 0) {
                  currencyStats[currency].fundedAddresses++;
                }
              });
            }
          }
        }
      });
    });

    // Calculate percentages and identify top currency
    const totalBalanceAllCurrencies = Object.values(totalValue).reduce((sum, val) => sum + val, 0);
    let topFundedCurrency: CryptoCurrency | null = null;
    let maxBalance = 0;

    const fundingDistribution = currencies.map(currency => {
      const stats = currencyStats[currency];
      stats.percentage = totalBalanceAllCurrencies > 0 
        ? (stats.totalBalance / totalBalanceAllCurrencies) * 100 
        : 0;
      
      if (stats.totalBalance > maxBalance) {
        maxBalance = stats.totalBalance;
        topFundedCurrency = currency;
      }
      
      return stats;
    }).sort((a, b) => b.totalBalance - a.totalBalance);

    // Calculate diversity score (0-100, higher = more diverse)
    const nonZeroBalances = fundingDistribution.filter(stat => stat.totalBalance > 0);
    const diversityScore = nonZeroBalances.length > 1 
      ? Math.min(100, nonZeroBalances.length * 15) 
      : nonZeroBalances.length > 0 ? 25 : 0;

    // Identify empty wallets
    const emptyWallets = currencies.filter(currency => totalValue[currency] === 0);
    
    return {
      totalValue,
      fundingDistribution,
      diversityScore,
      topFundedCurrency,
      emptyWallets,
      totalFundedKeys,
      totalKeys: keys.length,
      overallFundingRate: keys.length > 0 ? (totalFundedKeys / keys.length) * 100 : 0
    };
  }, [keys, currencies]);

  // Helper function to safely extract numeric balance value
  const getNumericBalance = (balance: any): number => {
    if (typeof balance === 'number') return balance;
    if (typeof balance === 'string') return parseFloat(balance) || 0;
    if (balance && typeof balance === 'object' && balance.balance !== undefined) {
      return typeof balance.balance === 'number' ? balance.balance : parseFloat(balance.balance) || 0;
    }
    return 0;
  };

  // Format balance with appropriate precision
  const formatBalance = (value: number, currency: CryptoCurrency): string => {
    const precision = CURRENCY_DISPLAY_CONFIG[currency].precision;
    const minPrecision = Math.min(precision, 8); // Cap display precision at 8
    return value.toFixed(minPrecision);
  };

  if (compact) {
    return (
      <Card sx={{ mb: 2, background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
        <CardContent sx={{ py: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <AnalyticsIcon color="primary" />
            <Typography variant="h6">Portfolio Summary</Typography>
            <Chip 
              label={`${portfolioMetrics.totalFundedKeys}/${portfolioMetrics.totalKeys} funded`}
              size="small"
              color={portfolioMetrics.totalFundedKeys > 0 ? "success" : "default"}
            />
          </Box>
          
          <Grid container spacing={2}>
            {portfolioMetrics.fundingDistribution.slice(0, 4).map((stat) => {
              const config = CURRENCY_DISPLAY_CONFIG[stat.currency];
              return (
                <Grid item xs={3} key={stat.currency}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography sx={{ fontSize: '1.2em' }}>{config.icon}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {stat.fundedKeys > 0 ? `${stat.fundedKeys} funded` : 'Empty'}
                    </Typography>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 3, background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <AnalyticsIcon color="primary" />
          <Typography variant="h6">Portfolio Analytics</Typography>
          <Chip 
            label={`${portfolioMetrics.overallFundingRate.toFixed(1)}% funded`}
            size="small"
            color={portfolioMetrics.totalFundedKeys > 0 ? "success" : "default"}
          />
        </Box>

        {/* Overview Stats */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, bgcolor: 'rgba(76, 175, 80, 0.1)' }}>
              <Typography variant="h4" color="success.main">
                {portfolioMetrics.totalFundedKeys}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Funded Keys
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, bgcolor: 'rgba(33, 150, 243, 0.1)' }}>
              <Typography variant="h4" color="primary.main">
                {currencies.length - portfolioMetrics.emptyWallets.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Active Currencies
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, bgcolor: 'rgba(255, 152, 0, 0.1)' }}>
              <Typography variant="h4" color="warning.main">
                {portfolioMetrics.diversityScore}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Diversity Score
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ textAlign: 'center', p: 2, borderRadius: 2, bgcolor: 'rgba(156, 39, 176, 0.1)' }}>
              <Typography variant="h4" color="secondary.main">
                {portfolioMetrics.fundingDistribution.reduce((sum, stat) => sum + stat.fundedAddresses, 0)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Funded Addresses
              </Typography>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 2 }} />

        {/* Currency Distribution */}
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <DonutIcon />
              <Typography variant="subtitle1">Funding Distribution by Currency</Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <TableContainer component={Paper} sx={{ bgcolor: 'transparent' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Currency</TableCell>
                    <TableCell align="center">Funded Keys</TableCell>
                    <TableCell align="center">Funded Addresses</TableCell>
                    <TableCell align="right">Total Balance</TableCell>
                    <TableCell align="center">Distribution</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {portfolioMetrics.fundingDistribution.map((stat) => {
                    const config = CURRENCY_DISPLAY_CONFIG[stat.currency];
                    const isFunded = stat.totalBalance > 0;
                    
                    return (
                      <TableRow 
                        key={stat.currency}
                        sx={{ 
                          bgcolor: isFunded ? `${config.color}15` : 'transparent',
                          '&:hover': { bgcolor: isFunded ? `${config.color}25` : 'action.hover' }
                        }}
                      >
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography sx={{ fontSize: '1.2em' }}>{config.icon}</Typography>
                            <Box>
                              <Typography variant="body2" fontWeight="bold" sx={{ color: config.color }}>
                                {config.shortName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {config.name}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={`${stat.fundedKeys}/${portfolioMetrics.totalKeys}`}
                            size="small"
                            color={stat.fundedKeys > 0 ? "success" : "default"}
                          />
                        </TableCell>
                        <TableCell align="center">
                          {stat.fundedAddresses}/{stat.totalAddresses}
                        </TableCell>
                        <TableCell align="right">
                          <Typography 
                            variant="body2" 
                            fontFamily="monospace"
                            fontWeight={isFunded ? "bold" : "normal"}
                            color={isFunded ? config.color : "text.secondary"}
                          >
                            {formatBalance(stat.totalBalance, stat.currency)} {config.symbol}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={stat.percentage}
                              sx={{
                                width: 60,
                                height: 8,
                                borderRadius: 4,
                                bgcolor: 'rgba(0,0,0,0.1)',
                                '& .MuiLinearProgress-bar': {
                                  bgcolor: config.color,
                                  borderRadius: 4
                                }
                              }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              {stat.percentage.toFixed(1)}%
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </AccordionDetails>
        </Accordion>

        {/* Summary Insights */}
        {portfolioMetrics.totalFundedKeys > 0 && (
          <Box sx={{ mt: 2, p: 2, borderRadius: 2, bgcolor: 'rgba(76, 175, 80, 0.1)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <TrendingUpIcon color="success" />
              <Typography variant="subtitle2" color="success.main">
                Portfolio Insights
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {portfolioMetrics.topFundedCurrency && (
                <>
                  <strong>{CURRENCY_DISPLAY_CONFIG[portfolioMetrics.topFundedCurrency].name}</strong> is your top funded currency. 
                </>
              )}
              {portfolioMetrics.diversityScore > 50 && (
                <> Your portfolio shows good diversification across multiple currencies.</>
              )}
              {portfolioMetrics.emptyWallets.length > 0 && (
                <> {portfolioMetrics.emptyWallets.length} currencies have no funds yet.</>
              )}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
});

PortfolioAnalytics.displayName = 'PortfolioAnalytics';

export default PortfolioAnalytics; 