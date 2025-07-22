import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  TextField,
  Tooltip,
  Typography,
  Chip,
  Grid,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import { useTranslation } from '../translations';
import Decimal from 'decimal.js';

// Configure Decimal.js for very large numbers
Decimal.set({
  precision: 80,
  rounding: 1,
  toExpNeg: -80,
  toExpPos: 80,
  minE: -80,
  maxE: 80
});

interface AdvancedNavigationProps {
  currentPage: string;
  totalPages: number;
  onPageChange: (page: string) => void;
  onDirectPageChange?: (pageNumber: string) => Promise<void>;
  keysPerPage: number;
  onKeysPerPageChange: (keysPerPage: number) => void;
}

const AdvancedNavigation = ({
  currentPage,
  totalPages,
  onPageChange,
  onDirectPageChange,
  keysPerPage,
  onKeysPerPageChange
}: AdvancedNavigationProps) => {
  const t = useTranslation();
  const [customPage, setCustomPage] = useState('');
  const [customJump, setCustomJump] = useState('');
  const [selectedJumpDirection, setSelectedJumpDirection] = useState<'forward' | 'backward' | null>(null);

  // Quick jump presets
  const quickJumpPages = [5, 10, 50, 100, 500, 1000, 5000, 10000, 50000, 100000, 1000000, 10000000];

  const formatPageNumber = (pageValue: number | string): string => {
    try {
      const decimal = new Decimal(pageValue.toString());
      return decimal.toFixed(0);
    } catch {
      return '1';
    }
  };

  const handleCustomPageSubmit = useCallback(() => {
    if (!customPage.trim()) return;
    
    try {
      const pageDecimal = new Decimal(customPage.trim());
      const totalPagesDecimal = new Decimal(totalPages);
      
      if (pageDecimal.gte(1) && pageDecimal.lte(totalPagesDecimal)) {
        const pageString = pageDecimal.toFixed(0);
        onPageChange(pageString);
        setCustomPage('');
      }
    } catch (error) {
      console.error('Invalid page number format:', customPage, error);
    }
  }, [customPage, totalPages, onPageChange]);

  const handleCustomJump = useCallback(async (direction: 'forward' | 'backward') => {
    const jump = parseInt(customJump);
    if (jump > 0) {
      const currentPageDecimal = new Decimal(currentPage);
      const newPageDecimal = direction === 'forward' 
        ? currentPageDecimal.plus(jump) 
        : currentPageDecimal.minus(jump);
      const totalPagesDecimal = new Decimal(totalPages);
      
      if (newPageDecimal.gte(1) && newPageDecimal.lte(totalPagesDecimal)) {
        const newPageString = newPageDecimal.toFixed(0);
        
        if (onDirectPageChange) {
          try {
            await onDirectPageChange(newPageString);
          } catch (error) {
            console.error('Direct page change failed:', error);
            onPageChange(newPageString);
          }
        } else {
          onPageChange(newPageString);
        }
      }
    }
  }, [customJump, currentPage, totalPages, onPageChange, onDirectPageChange]);

  const handleQuickJump = useCallback(async (jump: number) => {
    const currentPageDecimal = new Decimal(currentPage);
    const newPageDecimal = currentPageDecimal.plus(jump);
    const totalPagesDecimal = new Decimal(totalPages);
    
    if (newPageDecimal.gte(1) && newPageDecimal.lte(totalPagesDecimal)) {
      const newPageString = newPageDecimal.toFixed(0);
      
      if (onDirectPageChange) {
        try {
          await onDirectPageChange(newPageString);
        } catch (error) {
          console.error('Direct page change failed:', error);
          onPageChange(newPageString);
        }
      } else {
        onPageChange(newPageString);
      }
    }
  }, [currentPage, totalPages, onPageChange, onDirectPageChange]);

  const handleQuickJumpBack = useCallback(async (jump: number) => {
    const currentPageDecimal = new Decimal(currentPage);
    const newPageDecimal = currentPageDecimal.minus(jump);
    const totalPagesDecimal = new Decimal(totalPages);
    
    if (newPageDecimal.gte(1) && newPageDecimal.lte(totalPagesDecimal)) {
      const newPageString = newPageDecimal.toFixed(0);
      
      if (onDirectPageChange) {
        try {
          await onDirectPageChange(newPageString);
        } catch (error) {
          console.error('Direct page change failed:', error);
          onPageChange(newPageString);
        }
      } else {
        onPageChange(newPageString);
      }
    }
  }, [currentPage, totalPages, onPageChange, onDirectPageChange]);

  return (
    <Accordion sx={{ mb: 2 }}>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6">
            🎯 Advanced Navigation
          </Typography>
          <Chip 
            label={`${keysPerPage} keys/page`}
            size="small"
            variant="outlined"
            sx={{ fontSize: '0.75rem' }}
          />
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        {/* Custom Page Input */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'stretch', flexWrap: 'wrap' }}>
              <TextField
                size="small"
                label="Jump to Page"
                placeholder="Enter page number"
                value={customPage}
                onChange={(e) => setCustomPage(e.target.value)}
                type="text"
                sx={{ 
                  flexGrow: 1,
                  minWidth: '400px',
                  maxWidth: '800px',
                  '& .MuiInputBase-root': {
                    height: '40px',
                  },
                  '& .MuiInputBase-input': {
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    letterSpacing: '0.5px'
                  }
                }}
                helperText={customPage ? 
                  `Will go to page: ${customPage}` : 
                  `Current page: ${formatPageNumber(currentPage)} of ${totalPages}`
                }
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCustomPageSubmit();
                  }
                }}
              />
              <Button
                variant="contained"
                onClick={handleCustomPageSubmit}
                disabled={!customPage.trim()}
                size="small"
                sx={{ 
                  minWidth: '80px', 
                  height: '40px',
                  alignSelf: 'flex-start'
                }}
              >
                Go
              </Button>
            </Box>
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'stretch', flexWrap: 'wrap' }}>
              <TextField
                size="small"
                label="Jump Pages"
                placeholder="Number of pages to jump"
                value={customJump}
                onChange={(e) => setCustomJump(e.target.value)}
                type="number"
                sx={{ 
                  minWidth: '150px',
                  maxWidth: '200px',
                  '& .MuiInputBase-root': {
                    height: '40px',
                  }
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && selectedJumpDirection) {
                    handleCustomJump(selectedJumpDirection);
                  }
                }}
                helperText={selectedJumpDirection && customJump ? 
                  `Press Enter to jump ${customJump} pages ${selectedJumpDirection}` : 
                  'Select direction and press Enter to jump'
                }
              />
              <Button
                variant={selectedJumpDirection === 'backward' ? 'contained' : 'outlined'}
                color={selectedJumpDirection === 'backward' ? 'primary' : 'inherit'}
                onClick={() => {
                  setSelectedJumpDirection('backward');
                  if (customJump) handleCustomJump('backward');
                }}
                disabled={!customJump || parseInt(customJump) <= 0}
                size="small"
                sx={{ 
                  minWidth: '120px', 
                  height: '40px',
                  alignSelf: 'flex-start'
                }}
              >
                Jump Backwards
              </Button>
              <Button
                variant={selectedJumpDirection === 'forward' ? 'contained' : 'outlined'}
                color={selectedJumpDirection === 'forward' ? 'primary' : 'inherit'}
                onClick={() => {
                  setSelectedJumpDirection('forward');
                  if (customJump) handleCustomJump('forward');
                }}
                disabled={!customJump || parseInt(customJump) <= 0}
                size="small"
                sx={{ 
                  minWidth: '120px', 
                  height: '40px',
                  alignSelf: 'flex-start'
                }}
              >
                Jump Forward
              </Button>
            </Box>
          </Grid>
        </Grid>

        {/* Quick Jump Buttons */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Quick Page Jumps:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ width: '100%', mb: 1 }}>
              Jump Forward:
            </Typography>
            {quickJumpPages.map((jump) => (
              <Tooltip key={`forward-${jump}`} title={`Jump forward ${jump.toLocaleString()} pages`} arrow>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleQuickJump(jump)}
                  sx={{ minWidth: 'auto', px: 1, fontSize: '0.7rem' }}
                >
                  +{jump >= 1000000 ? `${Math.floor(jump / 1000000)}M` : jump >= 1000 ? `${Math.floor(jump / 1000)}K` : jump}
                </Button>
              </Tooltip>
            ))}
          </Box>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            <Typography variant="caption" color="text.secondary" sx={{ width: '100%', mb: 1 }}>
              Jump Backward:
            </Typography>
            {quickJumpPages.map((jump) => (
              <Tooltip key={`backward-${jump}`} title={`Jump backward ${jump.toLocaleString()} pages`} arrow>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleQuickJumpBack(jump)}
                  sx={{ minWidth: 'auto', px: 1, fontSize: '0.7rem' }}
                >
                  -{jump >= 1000000 ? `${Math.floor(jump / 1000000)}M` : jump >= 1000 ? `${Math.floor(jump / 1000)}K` : jump}
                </Button>
              </Tooltip>
            ))}
          </Box>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Keys Per Page Control */}
        <Box>
          <Typography variant="subtitle2" gutterBottom>
            Keys per Page:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {[10, 25, 45, 50, 100, 250, 500, 1000, 2500, 5000, 10000].map((count) => (
              <Tooltip key={count} title={`Show ${count} keys per page`} arrow>
                <Button
                  size="small"
                  variant={keysPerPage === count ? "contained" : "outlined"}
                  onClick={() => onKeysPerPageChange(count)}
                  sx={{ minWidth: 'auto', px: 1 }}
                >
                  {count}
                </Button>
              </Tooltip>
            ))}
          </Box>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};

export default AdvancedNavigation; 