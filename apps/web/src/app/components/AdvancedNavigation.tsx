import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  TextField,
  Tooltip,
  IconButton,
  Typography,
  Chip,
  Grid,
  Paper,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { ExpandMore, ChevronLeft, ChevronRight, Shuffle, Casino } from '@mui/icons-material';
import { useTranslation } from '../translations';
import { useNavigationStore } from '../store/navigationStore';
import Decimal from 'decimal.js';

// Configure Decimal.js for very large numbers
Decimal.set({
  precision: 80,     // Support up to 80 significant digits
  rounding: 1,       // ROUND_DOWN
  toExpNeg: -80,     // Don't use exponential notation for small numbers
  toExpPos: 80,      // Don't use exponential notation for large numbers
  minE: -80,         // Minimum exponent
  maxE: 80           // Maximum exponent
});

// Helper function to safely parse page numbers (including scientific notation)
const parsePageNumberToDecimal = (pageValue: number | string): Decimal => {
  try {
    // First try direct Decimal parsing
    const result = new Decimal(pageValue.toString());
    return result;
  } catch (error) {
    try {
      // If that fails, parse as Number first (handles scientific notation)
      const asNumber = Number(pageValue);
      if (isNaN(asNumber) || !isFinite(asNumber)) {
        return new Decimal('1'); // fallback to page 1
      }
      // Convert to string and then to Decimal to avoid precision loss
      const result = new Decimal(Math.floor(asNumber).toString());
      return result;
    } catch (secondError) {
      return new Decimal('1'); // fallback to page 1
    }
  }
};

// Helper function to format numbers in normal decimal notation (no scientific notation)
const formatPageNumber = (pageValue: number | string): string => {
  const decimal = parsePageNumberToDecimal(pageValue);
  return decimal.toFixed(0); // Always return as normal decimal string
};

interface AdvancedNavigationProps {
  currentPage: number | string;  // Accept both number and string (for scientific notation)
  totalPages: number;
  onPageChange: (page: string) => void;
  onDirectPageChange?: (page: string) => Promise<void>; // NEW: Direct API call bypass
  onRandomPage: () => void;
  keysPerPage: number;
  onKeysPerPageChange: (keysPerPage: number) => void;
}

const AdvancedNavigation = ({
  currentPage,
  totalPages,
  onPageChange,
  onDirectPageChange, // NEW: Direct API call function
  onRandomPage,
  keysPerPage,
  onKeysPerPageChange
}: AdvancedNavigationProps) => {
  const t = useTranslation();
  const { getLastPageNumber } = useNavigationStore();
  const [customPage, setCustomPage] = useState('');
  const [customJump, setCustomJump] = useState('');
  const [expanded, setExpanded] = useState(false);
  
  // Ensure t is defined with fallbacks
  const translations = t || {
    firstPage: 'First Page',
    lastPage: 'Last Page',
    previousPage: 'Previous Page',
    nextPage: 'Next Page'
  };
  
  const quickJumpPages = [10, 50, 100, 500, 1000, 5000, 10000, 50000, 100000];

  const handleCustomPageSubmit = useCallback(() => {
    const page = parseInt(customPage);
    if (page > 0 && page <= totalPages) {
      onPageChange(page.toString());
      setCustomPage('');
    }
  }, [customPage, totalPages, onPageChange]);

  const handleCustomJump = useCallback(async (direction: 'forward' | 'backward') => {
    const jump = parseInt(customJump);
    if (jump > 0) {
      const currentPageDecimal = parsePageNumberToDecimal(currentPage);
      const newPageDecimal = direction === 'forward' 
        ? currentPageDecimal.plus(jump) 
        : currentPageDecimal.minus(jump);
      const totalPagesDecimal = new Decimal(totalPages);
      
      if (newPageDecimal.gte(1) && newPageDecimal.lte(totalPagesDecimal)) {
        const newPageString = newPageDecimal.toFixed(0);
        
        // Use direct API call if available, otherwise fall back to onPageChange
        if (onDirectPageChange) {
          try {
            await onDirectPageChange(newPageString);
          } catch (error) {
            console.error('Direct page change failed:', error);
            // Fallback to regular page change
            onPageChange(newPageString);
          }
        } else {
          onPageChange(newPageString);
        }
      }
    }
    // Don't clear the input - keep the last value
  }, [customJump, currentPage, totalPages, onPageChange, onDirectPageChange]);

  const handleQuickJump = useCallback(async (jump: number) => {
    const currentPageDecimal = parsePageNumberToDecimal(currentPage);
    const newPageDecimal = currentPageDecimal.plus(jump);
    const totalPagesDecimal = new Decimal(totalPages);
    
    // Use Decimal comparison to avoid precision issues with large numbers
    if (newPageDecimal.gte(1) && newPageDecimal.lte(totalPagesDecimal)) {
      const newPageString = newPageDecimal.toFixed(0);
      
      // Use direct API call if available, otherwise fall back to onPageChange
      if (onDirectPageChange) {
        try {
          await onDirectPageChange(newPageString);
        } catch (error) {
          console.error('Direct page change failed:', error);
          // Fallback to regular page change
          onPageChange(newPageString);
        }
      } else {
        onPageChange(newPageString);
      }
    }
  }, [currentPage, totalPages, onPageChange, onDirectPageChange]);

  const handleQuickJumpBack = useCallback(async (jump: number) => {
    const currentPageDecimal = parsePageNumberToDecimal(currentPage);
    const newPageDecimal = currentPageDecimal.minus(jump);
    const totalPagesDecimal = new Decimal(totalPages);
    
    // Use Decimal comparison to avoid precision issues with large numbers
    if (newPageDecimal.gte(1) && newPageDecimal.lte(totalPagesDecimal)) {
      const newPageString = newPageDecimal.toFixed(0);
      
      // Use direct API call if available, otherwise fall back to onPageChange
      if (onDirectPageChange) {
        try {
          await onDirectPageChange(newPageString);
        } catch (error) {
          console.error('Direct page change failed:', error);
          // Fallback to regular page change
          onPageChange(newPageString);
        }
      } else {
        onPageChange(newPageString);
      }
    }
  }, [currentPage, totalPages, onPageChange, onDirectPageChange]);

  return (
    <Accordion expanded={expanded} onChange={() => setExpanded(e => !e)} sx={{ mb: 2 }}>
      <AccordionSummary expandIcon={<ExpandMore />}>
        <Typography variant="h6">Advanced Navigation</Typography>
      </AccordionSummary>
      <AccordionDetails>
        {/* Basic Navigation */}
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 3, gap: 1 }}>
          <Tooltip title={translations.firstPage} arrow>
            <IconButton
              onClick={() => onPageChange('1')}
              disabled={currentPage === 1}
              size="small"
            >
              <ChevronLeft />
            </IconButton>
          </Tooltip>
          
          <Tooltip title={translations.previousPage} arrow>
            <IconButton
              onClick={() => {
                const currentPageDecimal = parsePageNumberToDecimal(currentPage);
                const newPage = currentPageDecimal.minus(1);
                onPageChange(newPage.toFixed(0));
              }}
              disabled={parsePageNumberToDecimal(currentPage).lte(1)}
              size="small"
            >
              <ChevronLeft />
            </IconButton>
          </Tooltip>
          
          <Chip 
            label={`Page ${formatPageNumber(currentPage)} of ${totalPages}`} 
            color="primary" 
            variant="outlined"
          />
          
          <Tooltip title={translations.nextPage} arrow>
            <IconButton
              onClick={() => {
                const currentPageDecimal = parsePageNumberToDecimal(currentPage);
                const newPage = currentPageDecimal.plus(1);
                onPageChange(newPage.toFixed(0));
              }}
              disabled={parsePageNumberToDecimal(currentPage).gte(totalPages)}
              size="small"
            >
              <ChevronRight />
            </IconButton>
          </Tooltip>
          
          <Tooltip title={translations.lastPage} arrow>
            <IconButton
              onClick={() => onPageChange(getLastPageNumber())}
              disabled={currentPage === totalPages}
              size="small"
            >
              <ChevronRight />
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Go to Random Page" arrow>
            <IconButton
              onClick={onRandomPage}
              color="secondary"
              size="small"
            >
              <Shuffle />
            </IconButton>
          </Tooltip>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Custom Page Input */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                size="small"
                label="Go to Page"
                value={customPage}
                onChange={(e) => setCustomPage(e.target.value)}
                type="number"
                sx={{ 
                  flexGrow: 1,
                  minWidth: '200px',
                  '& .MuiInputBase-input': {
                    fontSize: '14px',
                    padding: '8px 12px',
                  }
                }}
              />
              <Button
                variant="contained"
                onClick={handleCustomPageSubmit}
                disabled={!customPage || parseInt(customPage) <= 0 || parseInt(customPage) > totalPages}
                size="small"
              >
                Go
              </Button>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                size="small"
                label="Jump Pages"
                value={customJump}
                onChange={(e) => setCustomJump(e.target.value)}
                type="number"
                sx={{ flexGrow: 1 }}
              />
              <Tooltip title="Jump Backward" arrow>
                <IconButton
                  onClick={() => handleCustomJump('backward')}
                  disabled={!customJump || parseInt(customJump) <= 0}
                  size="small"
                >
                  <ChevronLeft />
                </IconButton>
              </Tooltip>
              <Tooltip title="Jump Forward" arrow>
                <IconButton
                  onClick={() => handleCustomJump('forward')}
                  disabled={!customJump || parseInt(customJump) <= 0}
                  size="small"
                >
                  <ChevronRight />
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>
        </Grid>

        {/* Quick Jump Buttons */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Quick Jump Forward:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {quickJumpPages.map((jump) => (
              <Tooltip key={jump} title={`Jump +${jump} pages`} arrow>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleQuickJump(jump)}
                  disabled={parsePageNumberToDecimal(currentPage).plus(jump).gte(totalPages)}
                  sx={{ minWidth: 'auto', px: 1 }}
                >
                  +{jump}
                </Button>
              </Tooltip>
            ))}
          </Box>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Quick Jump Backward:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {quickJumpPages.map((jump) => (
              <Tooltip key={jump} title={`Jump -${jump} pages`} arrow>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleQuickJumpBack(jump)}
                  disabled={parsePageNumberToDecimal(currentPage).minus(jump).lte(1)}
                  sx={{ minWidth: 'auto', px: 1 }}
                >
                  -{jump}
                </Button>
              </Tooltip>
            ))}
          </Box>
        </Box>

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