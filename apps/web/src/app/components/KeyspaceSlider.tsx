'use client';

import React, { useState, useCallback } from 'react';
import {
  Box,
  Slider,
  Typography,
  Paper,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { useTranslation } from '../translations';

interface KeyspaceSliderProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: string) => void;
  disabled?: boolean;
}

export default function KeyspaceSlider({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  disabled = false 
}: KeyspaceSliderProps) {
  const theme = useTheme();
  const t = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [tempValue, setTempValue] = useState(currentPage);

  // Convert totalPages to number if it's a bigint
  const totalPagesNum = typeof totalPages === 'bigint' ? Number(totalPages) : totalPages;

  // Calculate percentage position in keyspace
  const percentage = totalPagesNum > 0 ? (currentPage / totalPagesNum) * 100 : 0;

  const handleSliderChange = useCallback((event: Event, newValue: number | number[]) => {
    const value = Array.isArray(newValue) ? newValue[0] : newValue;
    setTempValue(value);
  }, []);

  const handleSliderChangeCommitted = useCallback((event: Event | React.SyntheticEvent, newValue: number | number[]) => {
    const value = Array.isArray(newValue) ? newValue[0] : newValue;
    setIsDragging(false);
    
    // Only trigger page change if the value actually changed
    if (value !== currentPage && value >= 1 && value <= totalPagesNum) {
      onPageChange(value.toString());
    }
  }, [currentPage, totalPagesNum, onPageChange]);

  const handleSliderChangeStart = useCallback(() => {
    setIsDragging(true);
  }, []);

  // Format large numbers for display
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  // Calculate keyspace position
  const keyspacePosition = currentPage * 45; // Assuming 45 keys per page
  const totalKeys = totalPagesNum * 45;

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
      </Box>

      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Page {formatNumber(currentPage)} of {formatNumber(totalPagesNum)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {percentage.toFixed(2)}% of keyspace
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Key #{formatNumber(keyspacePosition)} of {formatNumber(totalKeys)}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ px: 2 }}>
        <Tooltip 
          title={`Drag to navigate to page ${isDragging ? tempValue : currentPage}`}
          arrow
          open={!!isDragging}
        >
          <Slider
            value={isDragging ? tempValue : currentPage}
            onChange={handleSliderChange}
            onChangeCommitted={handleSliderChangeCommitted}
            onMouseDown={handleSliderChangeStart}
            onTouchStart={handleSliderChangeStart}
            min={1}
            max={Math.max(1, totalPagesNum)}
            step={1}
            disabled={disabled || totalPagesNum <= 1}
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

      {/* Quick Navigation Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
        <Typography variant="caption" color="text.secondary">
          Quick Navigation:
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {[0.1, 0.25, 0.5, 0.75, 0.9].map((percentage) => {
            const targetPage = Math.floor(totalPagesNum * percentage);
            return (
              <Tooltip key={percentage} title={`Jump to ${(percentage * 100).toFixed(0)}% of keyspace`} arrow>
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
                  onClick={() => onPageChange(targetPage.toString())}
                />
              </Tooltip>
            );
          })}
        </Box>
      </Box>
    </Paper>
  );
} 