'use client';

import React, { useState, useEffect, memo, useMemo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Grid,
  Chip,
  CircularProgress,
  IconButton,
  Tooltip,
  Fade,
  Skeleton
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Refresh,
  Timeline
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { USDCalculationService } from '../../lib/services/USDCalculationService';
import { CryptoCurrency } from '../../lib/types/multi-currency';

// Crypto currency configuration matching existing system
const CRYPTO_CURRENCIES = [
  { currency: 'BTC', name: 'Bitcoin', icon: '🟠', symbol: 'BTC', color: '#f7931a' },
  { currency: 'ETH', name: 'Ethereum', icon: 'Ξ', symbol: 'ETH', color: '#627eea' },
  { currency: 'BCH', name: 'Bitcoin Cash', icon: '🍊', symbol: 'BCH', color: '#00d4aa' },
  { currency: 'XRP', name: 'Ripple', icon: '🌊', symbol: 'XRP', color: '#23292f' },
  { currency: 'LTC', name: 'Litecoin', icon: '🥈', symbol: 'LTC', color: '#bfbbbb' },
  { currency: 'DASH', name: 'Dash', icon: '🔵', symbol: 'DASH', color: '#1c75bc' },
  { currency: 'DOGE', name: 'Dogecoin', icon: '🐕', symbol: 'DOGE', color: '#c2a633' },
  { currency: 'ZEC', name: 'Zcash', icon: '🛡️', symbol: 'ZEC', color: '#f4b728' }
];

interface CryptoPriceData {
  currency: string;
  name: string;
  symbol: string;
  icon: string;
  usdPrice: number;
  change24h: number;
  color: string;
  lastUpdated: Date;
}

interface CryptoPriceDashboardProps {
  refreshInterval?: number; // default 30000ms
}

const CryptoPriceDashboard = memo<CryptoPriceDashboardProps>(({ 
  refreshInterval = 30000 
}) => {
  const theme = useTheme();
  const [priceData, setPriceData] = useState<CryptoPriceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Get USD calculation service instance
  const usdService = USDCalculationService.getInstance();

  // Mock API call for crypto prices (TODO: Replace with real API)
  const fetchCryptoPrices = async (): Promise<CryptoPriceData[]> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock realistic price data
    const priceData = CRYPTO_CURRENCIES.map(crypto => ({
      ...crypto,
      usdPrice: generateMockPrice(crypto.currency),
      change24h: (Math.random() - 0.5) * 20, // -10% to +10%
      lastUpdated: new Date()
    }));
    
    // Update USD calculation service with new prices
    const priceMap: Record<CryptoCurrency, number> = {};
    priceData.forEach(crypto => {
      priceMap[crypto.currency as CryptoCurrency] = crypto.usdPrice;
    });
    usdService.updatePrices(priceMap);
    
    return priceData;
  };

  // Generate realistic mock prices
  const generateMockPrice = (currency: string): number => {
    const basePrices: Record<string, number> = {
      BTC: 45000,
      ETH: 2800,
      BCH: 420,
      XRP: 0.65,
      LTC: 85,
      DASH: 45,
      DOGE: 0.08,
      ZEC: 35
    };
    
    const basePrice = basePrices[currency] || 1;
    // Add some realistic variation
    const variation = (Math.random() - 0.5) * 0.1; // ±5%
    return basePrice * (1 + variation);
  };

  // Load initial data
  useEffect(() => {
    const loadPrices = async () => {
      try {
        setError(null);
        const prices = await fetchCryptoPrices();
        setPriceData(prices);
        setLastUpdated(new Date());
      } catch (err) {
        setError('Failed to load crypto prices');
        console.error('Error fetching crypto prices:', err);
      } finally {
        setLoading(false);
      }
    };

    loadPrices();
  }, []);

  // Auto-refresh interval
  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(async () => {
        try {
          const prices = await fetchCryptoPrices();
          setPriceData(prices);
          setLastUpdated(new Date());
        } catch (err) {
          console.error('Auto-refresh failed:', err);
        }
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [refreshInterval]);

  // Manual refresh handler
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const prices = await fetchCryptoPrices();
      setPriceData(prices);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      setError('Failed to refresh prices');
    } finally {
      setRefreshing(false);
    }
  };

  // Format price with appropriate decimals
  const formatPrice = (price: number): string => {
    if (price >= 1000) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(price);
    } else if (price >= 1) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(price);
    } else {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 4,
        maximumFractionDigits: 6
      }).format(price);
    }
  };

  // Format time since last update
  const getTimeAgo = useMemo(() => {
    if (!lastUpdated) return '';
    
    const now = new Date();
    const diffMs = now.getTime() - lastUpdated.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    
    if (diffSecs < 60) return `Updated ${diffSecs}s ago`;
    const diffMins = Math.floor(diffSecs / 60);
    if (diffMins < 60) return `Updated ${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    return `Updated ${diffHours}h ago`;
  }, [lastUpdated]);

  if (loading) {
    return (
      <Card sx={{ 
        mb: 3, 
        background: 'rgba(255,255,255,0.05)', 
        backdropFilter: 'blur(10px)',
        borderRadius: '12px'
      }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Timeline color="primary" />
              <Typography variant="h6">Live Crypto Prices</Typography>
            </Box>
            <CircularProgress size={20} />
          </Box>
          
          <Grid container spacing={2}>
            {Array.from({ length: 8 }).map((_, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                <Card sx={{ 
                  minHeight: 120,
                  background: theme.palette.background.paper,
                  borderRadius: '12px'
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Skeleton variant="circular" width={32} height={32} />
                      <Skeleton variant="text" width={80} />
                    </Box>
                    <Skeleton variant="text" width={100} height={32} sx={{ mb: 1 }} />
                    <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 1 }} />
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card sx={{ 
        mb: 3, 
        background: 'rgba(255,255,255,0.05)', 
        backdropFilter: 'blur(10px)',
        borderRadius: '12px'
      }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Timeline color="error" />
              <Typography variant="h6" color="error">Live Crypto Prices</Typography>
            </Box>
            <Tooltip title="Retry">
              <IconButton onClick={handleRefresh} disabled={refreshing}>
                <Refresh sx={{ 
                  animation: refreshing ? 'spin 1s linear infinite' : 'none',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' }
                  }
                }} />
              </IconButton>
            </Tooltip>
          </Box>
          
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Fade in={!loading} timeout={600}>
      <Card sx={{ 
        mb: 3, 
        background: 'rgba(255,255,255,0.05)', 
        backdropFilter: 'blur(10px)',
        borderRadius: '12px'
      }}>
        <CardContent>
          {/* Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Timeline color="primary" />
              <Typography variant="h6">Live Crypto Prices</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {getTimeAgo}
              </Typography>
              <Tooltip title="Refresh prices">
                <IconButton 
                  onClick={handleRefresh} 
                  disabled={refreshing}
                  size="small"
                >
                  <Refresh sx={{ 
                    animation: refreshing ? 'spin 1s linear infinite' : 'none',
                    '@keyframes spin': {
                      '0%': { transform: 'rotate(0deg)' },
                      '100%': { transform: 'rotate(360deg)' }
                    }
                  }} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Price Cards Grid */}
          <Grid container spacing={2}>
            {priceData.map((crypto, index) => {
              const isPositive = crypto.change24h >= 0;
              const changeColor = isPositive ? '#4caf50' : '#f44336';
              const ChangeIcon = isPositive ? TrendingUp : TrendingDown;

              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={crypto.currency}>
                  <Fade in timeout={600} style={{ transitionDelay: `${index * 100}ms` }}>
                    <Card sx={{
                      minHeight: 120,
                      background: theme.palette.background.paper,
                      borderRadius: '12px',
                      transition: 'all 0.2s ease-in-out',
                      cursor: 'pointer',
                      '&:hover': {
                        transform: 'translateY(-2px) scale(1.02)',
                        boxShadow: theme.shadows[8]
                      }
                    }}>
                      <CardContent>
                        {/* Top Row: Icon + Name + Symbol */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography sx={{ fontSize: '24px' }}>
                            {crypto.icon}
                          </Typography>
                          <Box>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {crypto.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {crypto.symbol}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Middle Row: USD Price */}
                        <Typography 
                          variant="h6" 
                          fontWeight="bold" 
                          sx={{ 
                            mb: 1,
                            fontFamily: 'monospace',
                            color: crypto.color
                          }}
                        >
                          {formatPrice(crypto.usdPrice)}
                        </Typography>

                        {/* Bottom Row: 24h Change */}
                        <Chip
                          icon={<ChangeIcon sx={{ fontSize: '16px !important' }} />}
                          label={`${isPositive ? '+' : ''}${crypto.change24h.toFixed(2)}%`}
                          size="small"
                          sx={{
                            backgroundColor: `${changeColor}20`,
                            color: changeColor,
                            border: `1px solid ${changeColor}40`,
                            fontSize: '0.75rem',
                            height: 24,
                            '& .MuiChip-icon': {
                              color: changeColor
                            }
                          }}
                        />
                      </CardContent>
                    </Card>
                  </Fade>
                </Grid>
              );
            })}
          </Grid>
        </CardContent>
      </Card>
    </Fade>
  );
});

CryptoPriceDashboard.displayName = 'CryptoPriceDashboard';

export default CryptoPriceDashboard; 