'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Slider,
  Typography,
  Paper,
  Tooltip,
  useTheme,
  TextField,
  InputAdornment,
  IconButton
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  ArrowForward as ArrowForwardIcon
} from '@mui/icons-material';
import { useTranslation } from '../translations';
import Decimal from 'decimal.js';

// Helper function to safely parse page numbers (including scientific notation)
const parsePageNumberToDecimal = (pageStr: string): Decimal => {
  try {
    // First try direct Decimal parsing
    return new Decimal(pageStr);
  } catch {
    try {
      // If that fails, parse as Number first (handles scientific notation)
      const asNumber = Number(pageStr);
      if (isNaN(asNumber) || !isFinite(asNumber)) {
        return new Decimal('1'); // fallback to page 1
      }
      // Convert to string and then to Decimal to avoid precision loss
      return new Decimal(Math.floor(asNumber).toString());
    } catch {
      return new Decimal('1'); // fallback to page 1
    }
  }
};

interface KeyspaceSliderProps {
  currentPage: string; // Always treat as string for BigInt safety
  totalPages: number | bigint | string;
  onPageChange: (page: string) => void;
  disabled?: boolean;
}

// Use a reasonable slider range with logarithmic scaling for the huge keyspace
// This prevents precision issues while still allowing navigation
const SLIDER_MAX = 1000000; // 1 million steps for smooth sliding

export default function KeyspaceSlider({ 
  currentPage, // string, can be BigInt
  totalPages, 
  onPageChange, 
  disabled = false 
}: KeyspaceSliderProps) {
  const theme = useTheme();
  const t = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [sliderValue, setSliderValue] = useState(0);
  const [inputValue, setInputValue] = useState(currentPage);

  // Always treat totalPages as Decimal for precision
  const totalPagesDecimal = new Decimal(totalPages.toString());
  const currentPageDecimal = parsePageNumberToDecimal(currentPage);

  // Convert currentPage to slider position [0, SLIDER_MAX] using logarithmic scaling
  const getSliderValueFromPage = useCallback((pageStr: string) => {
    try {
      const page = new Decimal(pageStr);
      // Clamp page to [1, totalPages]
      const clamped = Decimal.max(1, Decimal.min(page, totalPagesDecimal));
      
      // Use logarithmic scaling: position = log(page) / log(totalPages) * SLIDER_MAX
      if (clamped.lte(1)) return 0;
      
      const logPage = Decimal.ln(clamped);
      const logTotal = Decimal.ln(totalPagesDecimal);
      const position = logPage.dividedBy(logTotal).times(SLIDER_MAX);
      
      return Math.min(SLIDER_MAX, Math.max(0, position.toNumber()));
    } catch {
      return 0;
    }
  }, [totalPagesDecimal]);

  // Convert slider value [0, SLIDER_MAX] to page string using logarithmic scaling
  const getPageFromSliderValue = useCallback((sliderVal: number) => {
    try {
      // Clamp slider value
      const clampedSlider = Math.min(SLIDER_MAX, Math.max(0, sliderVal));
      
      if (clampedSlider === 0) return '1';
      
      // Reverse logarithmic scaling: page = totalPages^(sliderVal/SLIDER_MAX)
      const ratio = new Decimal(clampedSlider).dividedBy(SLIDER_MAX);
      const logTotal = Decimal.ln(totalPagesDecimal);
      const logPage = ratio.times(logTotal);
      const page = Decimal.exp(logPage);
      
      const clamped = Decimal.max(1, Decimal.min(page, totalPagesDecimal));
      return clamped.toFixed(0);
    } catch (error) {
      console.warn('Error in getPageFromSliderValue:', error);
      return '1';
    }
  }, [totalPagesDecimal]);

  // Update slider value when currentPage changes
  useEffect(() => {
    if (!isDragging) {
      setSliderValue(getSliderValueFromPage(currentPage));
      setInputValue(currentPage);
    }
  }, [currentPage, isDragging, getSliderValueFromPage]);

  const handleSliderChange = useCallback((event: Event, newValue: number | number[]) => {
    const value = Array.isArray(newValue) ? newValue[0] : newValue;
    // Add safety bounds to prevent astronomical numbers
    const clampedValue = Math.min(SLIDER_MAX, Math.max(0, value));
    setSliderValue(clampedValue);
  }, []);

  const handleSliderChangeCommitted = useCallback((event: Event | React.SyntheticEvent, newValue: number | number[]) => {
    const value = Array.isArray(newValue) ? newValue[0] : newValue;
    setIsDragging(false);
    
    // Add safety bounds to prevent astronomical numbers
    const clampedValue = Math.min(SLIDER_MAX, Math.max(0, value));
    const pageStr = getPageFromSliderValue(clampedValue);
    
    // Additional validation to ensure page is reasonable
    try {
      const pageNum = new Decimal(pageStr);
      if (pageNum.gte(1) && pageNum.lte(totalPagesDecimal) && pageStr !== currentPage) {
        onPageChange(pageStr);
      }
    } catch (error) {
      console.warn('Invalid page generated from slider:', pageStr, error);
      // Don't change page if invalid
    }
  }, [currentPage, onPageChange, getPageFromSliderValue, totalPagesDecimal]);

  const handleSliderChangeStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  // Numeric input for direct page entry
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value.replace(/[^0-9]/g, ''));
  };
  const handleInputSubmit = () => {
    if (!inputValue) return;
    try {
      const page = new Decimal(inputValue);
      if (page.gte(1) && page.lte(totalPagesDecimal)) {
        onPageChange(page.toFixed(0));
      }
    } catch {}
  };

  // Format large numbers for display
  const formatNumber = (num: string | number | bigint): string => {
    let numValue: number;
    try {
      numValue = typeof num === 'string' ? Number(BigInt(num)) : Number(num);
    } catch {
      numValue = 0;
    }
    if (numValue >= 1e15) {
      return `${(numValue / 1e15).toFixed(1)}Q`;
    } else if (numValue >= 1e12) {
      return `${(numValue / 1e12).toFixed(1)}T`;
    } else if (numValue >= 1e9) {
      return `${(numValue / 1e9).toFixed(1)}B`;
    } else if (numValue >= 1e6) {
      return `${(numValue / 1e6).toFixed(1)}M`;
    } else if (numValue >= 1e3) {
      return `${(numValue / 1e3).toFixed(1)}K`;
    }
    return numValue.toString();
  };

  // Calculate keyspace position
  const keyspacePosition = (() => {
    try {
      return parsePageNumberToDecimal(currentPage).times(45).toFixed(0);
    } catch {
      return '0';
    }
  })();
  const totalKeys = (() => {
    try {
      return totalPagesDecimal.times(45).toFixed(0);
    } catch {
      return '0';
    }
  })();

  // Calculate percentage for display (use log scale for meaningful representation)
  const percentage = (() => {
    try {
      // For such massive numbers, use logarithmic percentage to show meaningful progress
      if (currentPageDecimal.lte(1)) return 0;
      
      const logCurrent = Decimal.ln(currentPageDecimal);
      const logTotal = Decimal.ln(totalPagesDecimal);
      const logPercentage = logCurrent.dividedBy(logTotal).times(100);
      
      return logPercentage.toNumber();
    } catch {
      return 0;
    }
  })();

  return (
    <Paper 
      sx={{ 
        p: 2, 
        mb: 2, 
        background: 'rgba(255,255,255,0.05)', 
        backdropFilter: 'blur(10px)',
        border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, gap: 1 }}>
        <TimelineIcon color="primary" />
        <Typography variant="h6" component="h3">
          {t.keyspaceNavigation || 'Keyspace Navigation'}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
          (Direct page navigation, full precision)
        </Typography>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Page {formatNumber(currentPage)} of {formatNumber(totalPagesDecimal.toFixed(0))}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {percentage.toFixed(6)}% of keyspace
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Key #{formatNumber(keyspacePosition)} of {formatNumber(totalKeys)}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ px: 2, mb: 2 }}>
        <Tooltip 
          title={`Drag to navigate to page ${isDragging ? formatNumber(getPageFromSliderValue(sliderValue)) : formatNumber(currentPage)}`}
          arrow
          open={!!isDragging}
        >
          <Slider
            value={sliderValue}
            onChange={handleSliderChange}
            onChangeCommitted={handleSliderChangeCommitted}
            onMouseDown={handleSliderChangeStart}
            onTouchStart={handleSliderChangeStart}
            min={0}
            max={Number(SLIDER_MAX)}
            step={1}
            disabled={disabled || totalPagesDecimal.lte(1)}
            sx={{
              '& .MuiSlider-track': {
                background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
              },
              '& .MuiSlider-thumb': {
                width: 20,
                height: 20,
                backgroundColor: theme.palette.primary.main,
                '&:hover, &.Mui-focusVisible': {
                  boxShadow: `0 0 0 8px ${theme.palette.primary.main}20`,
                },
              },
              '& .MuiSlider-rail': {
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
              },
            }}
          />
        </Tooltip>
      </Box>

      {/* Direct page input */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <TextField
          label="Go to page"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={e => { if (e.key === 'Enter') handleInputSubmit(); }}
          size="small"
          sx={{ width: 180 }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={handleInputSubmit} size="small">
                  <ArrowForwardIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
        <Typography variant="caption" color="text.secondary">
          (1 - {formatNumber(totalPagesDecimal.toFixed(0))})
        </Typography>
      </Box>

      {/* Quick Navigation Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
        <Typography variant="caption" color="text.secondary">
          Quick Navigation:
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {[0.1, 0.25, 0.5, 0.75, 0.9].map((percentage) => {
            // CRITICAL FIX: Use current slider state, not stale currentPage prop
            // Get the actual current page from most recent state (accounts for all interaction types)
            const actualCurrentPage = isDragging 
              ? getPageFromSliderValue(sliderValue)  // Use slider state during dragging
              : (inputValue !== currentPage ? inputValue : currentPage);  // Use input if changed, else prop
              
            const currentPageDecimal = parsePageNumberToDecimal(actualCurrentPage);
            const remainingPages = totalPagesDecimal.minus(currentPageDecimal);
            const relativeJump = remainingPages.times(percentage);
            const targetPageDecimal = currentPageDecimal.plus(relativeJump);
            
            // Apply boundary validation - clamp to maximum page
            const clampedTarget = Decimal.min(targetPageDecimal, totalPagesDecimal);
            const targetPage = clampedTarget.toFixed(0);
            
            // Format target page for tooltip display
            const targetPageFormatted = formatNumber(targetPage);
            
            return (
              <Tooltip 
                key={percentage} 
                title={`Jump ${(percentage * 100).toFixed(0)}% forward to page ${targetPageFormatted}`} 
                arrow
              >
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    backgroundColor: theme.palette.primary.main,
                    cursor: 'pointer',
                    opacity: 0.7,
                    '&:hover': {
                      opacity: 1,
                      transform: 'scale(1.2)',
                    },
                  }}
                  onClick={() => onPageChange(targetPage)}
                />
              </Tooltip>
            );
          })}
        </Box>
      </Box>
    </Paper>
  );
}