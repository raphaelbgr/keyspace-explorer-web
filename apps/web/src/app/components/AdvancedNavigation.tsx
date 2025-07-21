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
  AccordionDetails,
  Select,
  MenuItem,
  Card
} from '@mui/material';
import { ExpandMore, ChevronLeft, ChevronRight, Casino } from '@mui/icons-material';
import CasinoIcon from '@mui/icons-material/Casino'; // Added missing import
import { secureRandomKeyInPage, diceRollAnimation } from '../utils/secureRandom';
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
  onRandomKeyInPage?: (keyIndex: number) => void; // NEW: Random key within current page
  keysPerPage: number;
  onKeysPerPageChange: (keysPerPage: number) => void;
}

const AdvancedNavigation = ({
  currentPage,
  totalPages,
  onPageChange,
  onDirectPageChange, // NEW: Direct API call function
  onRandomPage,
  onRandomKeyInPage,
  keysPerPage,
  onKeysPerPageChange
}: AdvancedNavigationProps) => {
  const t = useTranslation();
  const { getLastPageNumber } = useNavigationStore();
  const [customPage, setCustomPage] = useState('');
  const [customJump, setCustomJump] = useState('');
  const [selectedJumpDirection, setSelectedJumpDirection] = useState<'forward' | 'backward' | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [diceRolling, setDiceRolling] = useState(false);
  const [randomMode, setRandomMode] = useState<'page' | 'key'>('page');

  // Enhanced dice roll function with animation
  const handleDiceRoll = async () => {
    setDiceRolling(true);
    
    try {
      if (randomMode === 'page') {
        // Animate dice roll for pages
        const rollAnimation = diceRollAnimation(1, 6, 3);
        for (let i = 0; i < rollAnimation.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 150));
        }
        
        // Execute random page navigation
        onRandomPage();
      } else if (randomMode === 'key' && onRandomKeyInPage) {
        // Random key within current page
        const randomKeyIndex = secureRandomKeyInPage(keysPerPage);
        
        // Animate dice roll for keys
        const rollAnimation = diceRollAnimation(0, keysPerPage - 1, 3);
        for (let i = 0; i < rollAnimation.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 150));
        }
        
        onRandomKeyInPage(randomKeyIndex);
      }
    } catch (error) {
      console.error('Dice roll error:', error);
    } finally {
      setDiceRolling(false);
    }
  };
  
  // Ensure t is defined with fallbacks
  const translations = t || {
    firstPage: 'First Page',
    lastPage: 'Last Page',
    previousPage: 'Previous Page',
    nextPage: 'Next Page'
  };
  
  const quickJumpPages = [10, 50, 100, 500, 1000, 5000, 10000, 50000, 100000];

  const handleCustomPageSubmit = useCallback(() => {
    if (!customPage.trim()) return;
    
    try {
      // Use Decimal.js for large number handling
      const pageDecimal = new Decimal(customPage.trim());
      const totalPagesDecimal = new Decimal(totalPages);
      
      // Validate range
      if (pageDecimal.gte(1) && pageDecimal.lte(totalPagesDecimal)) {
        const pageString = pageDecimal.toFixed(0);
        onPageChange(pageString);
        setCustomPage('');
      } else {
        // Show validation error
        console.warn(`Page number ${customPage} is out of range. Valid range: 1 to ${totalPages}`);
      }
    } catch (error) {
      console.error('Invalid page number format:', customPage, error);
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

  const handleJumpDirectionSelect = useCallback((direction: 'forward' | 'backward') => {
    setSelectedJumpDirection(direction);
  }, []);

  const handleJumpEnterKey = useCallback(async () => {
    if (selectedJumpDirection && customJump) {
      await handleCustomJump(selectedJumpDirection);
    }
  }, [selectedJumpDirection, customJump, handleCustomJump]);

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
        {/* Reorganized Navigation - Page Display First */}
        
        {/* Current Page Display - Always stays in same place */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          <Chip 
            label={`Page ${formatPageNumber(currentPage)} of ${totalPages}`} 
            color="primary" 
            variant="outlined"
            sx={{ fontSize: '0.9rem', px: 2, py: 0.5 }}
          />
        </Box>

        {/* Navigation Buttons Row - Stable positioning */}
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2, gap: 1 }}>
          <Tooltip title={translations.firstPage} arrow>
            <span>
              <IconButton
                onClick={() => onPageChange('1')}
                disabled={currentPage === 1}
                size="small"
                color="primary"
              >
                <ChevronLeft />
              </IconButton>
            </span>
          </Tooltip>
          
          <Tooltip title={translations.previousPage} arrow>
            <span>
              <IconButton
                onClick={() => {
                  const currentPageDecimal = parsePageNumberToDecimal(currentPage);
                  const newPage = currentPageDecimal.minus(1);
                  onPageChange(newPage.toFixed(0));
                }}
                disabled={parsePageNumberToDecimal(currentPage).lte(1)}
                size="small"
                color="primary"
              >
                <ChevronLeft />
              </IconButton>
            </span>
          </Tooltip>
          
          <Typography variant="body2" color="text.secondary" sx={{ mx: 2 }}>
            Navigate
          </Typography>
          
          <Tooltip title={translations.nextPage} arrow>
            <span>
              <IconButton
                onClick={() => {
                  const currentPageDecimal = parsePageNumberToDecimal(currentPage);
                  const newPage = currentPageDecimal.plus(1);
                  onPageChange(newPage.toFixed(0));
                }}
                disabled={parsePageNumberToDecimal(currentPage).gte(totalPages)}
                size="small"
                color="primary"
              >
                <ChevronRight />
              </IconButton>
            </span>
          </Tooltip>
          
          <Tooltip title={translations.lastPage} arrow>
            <span>
              <IconButton
                onClick={() => onPageChange(getLastPageNumber())}
                disabled={currentPage === totalPages}
                size="small"
                color="primary"
              >
                <ChevronRight />
              </IconButton>
            </span>
          </Tooltip>
        </Box>

        {/* Random Controls Row - Always in same spot */}
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 3, gap: 1 }}>
          <Select
            size="small"
            value={randomMode}
            onChange={(e: any) => setRandomMode(e.target.value as 'page' | 'key')}
            sx={{ minWidth: 80 }}
          >
            <MenuItem value="page">Page</MenuItem>
            <MenuItem value="key">Key</MenuItem>
          </Select>
          <Tooltip title={`Random ${randomMode === 'page' ? 'Page' : 'Key in Current Page'}`} arrow>
            <IconButton
              onClick={handleDiceRoll}
              color="secondary"
              size="small"
              disabled={diceRolling}
              sx={{
                animation: diceRolling ? 'spin 0.3s linear infinite' : 'none',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' },
                },
              }}
            >
              <Casino />
            </IconButton>
          </Tooltip>
          <Typography variant="caption" color="text.secondary">
            🎲 Random {randomMode}
          </Typography>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Custom Page Input */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                size="small"
                label="Go to Page"
                placeholder="Enter page number (e.g., 1234567890123456789)"
                value={customPage}
                onChange={(e) => setCustomPage(e.target.value)}
                type="text"
                multiline={false}
                sx={{ 
                  flexGrow: 1,
                  minWidth: '400px', // Much wider to support huge numbers
                  maxWidth: '800px',
                  '& .MuiInputBase-input': {
                    fontSize: '14px',
                    padding: '10px 14px',
                    fontFamily: 'monospace', // Better for numbers
                    letterSpacing: '0.5px'
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '14px'
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
                  height: '40px'
                }}
              >
                Go
              </Button>
            </Box>
          </Grid>
          
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
              <TextField
                size="small"
                label="Jump Pages"
                placeholder="Number of pages to jump"
                value={customJump}
                onChange={(e) => setCustomJump(e.target.value)}
                type="number"
                sx={{ 
                  flexGrow: 1, 
                  minWidth: '150px',
                  maxWidth: '200px'
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleJumpEnterKey();
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
                onClick={() => handleJumpDirectionSelect('backward')}
                disabled={!customJump || parseInt(customJump) <= 0}
                size="small"
                sx={{ minWidth: '120px' }}
              >
                Jump Backwards
              </Button>
              <Button
                variant={selectedJumpDirection === 'forward' ? 'contained' : 'outlined'}
                color={selectedJumpDirection === 'forward' ? 'primary' : 'inherit'}
                onClick={() => handleJumpDirectionSelect('forward')}
                disabled={!customJump || parseInt(customJump) <= 0}
                size="small"
                sx={{ minWidth: '120px' }}
              >
                Jump Forward
              </Button>
            </Box>
          </Grid>
        </Grid>

        {/* Random Key Selector */}
        <Card sx={{ p: 2, mb: 2, bgcolor: 'action.hover', border: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CasinoIcon color="primary" />
            Random Key Selector
          </Typography>
          <Select
            size="small"
            value={randomMode}
            onChange={(e: any) => setRandomMode(e.target.value as 'page' | 'key')}
            sx={{ minWidth: 80 }}
          >
            <MenuItem value="page">Page</MenuItem>
            <MenuItem value="key">Key</MenuItem>
          </Select>
          <Tooltip title={`Random ${randomMode === 'page' ? 'Page' : 'Key in Current Page'}`} arrow>
            <IconButton
              onClick={handleDiceRoll}
              color="secondary"
              size="small"
              disabled={diceRolling}
              sx={{
                animation: diceRolling ? 'spin 0.3s linear infinite' : 'none',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' },
                },
              }}
            >
              <Casino />
            </IconButton>
          </Tooltip>
          <Typography variant="caption" color="text.secondary">
            🎲 Random {randomMode}
          </Typography>
        </Card>

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