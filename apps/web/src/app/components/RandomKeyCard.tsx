'use client';

import React, { useState, memo } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Select,
  MenuItem,
  Button,
  Tooltip,
  Chip
} from '@mui/material';
import {
  Casino as CasinoIcon,
  Speed as SpeedIcon,
  Computer as ComputerIcon,
  Cloud as CloudIcon
} from '@mui/icons-material';
import { secureRandomKeyInPage, diceRollAnimation } from '../utils/secureRandom';
import { clientKeyGenerationService } from '../../lib/services/ClientKeyGenerationService';

interface RandomKeyCardProps {
  currentPage: string;
  onRandomPage?: () => void;
  onRandomKeyInPage?: (keyIndex: number) => void;
  keysPerPage?: number;
  generateLocally?: boolean;
  disabled?: boolean;
}

const RandomKeyCard = memo<RandomKeyCardProps>(({
  currentPage,
  onRandomPage,
  onRandomKeyInPage,
  keysPerPage = 45,
  generateLocally = false,
  disabled = false
}) => {
  const [diceRolling, setDiceRolling] = useState(false);
  const [randomMode, setRandomMode] = useState<'page' | 'key'>('page');

  // Enhanced dice roll function with local generation support
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
        if (onRandomPage) {
          onRandomPage();
        }
      } else if (randomMode === 'key') {
        // Step 1: First generate a random page (like page mode)
        console.log('🎲 Random key mode: Step 1 - Generating random page first...');
        
        // Animate dice roll for page selection
        const rollAnimation = diceRollAnimation(1, 6, 2);
        for (let i = 0; i < rollAnimation.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Step 2: Navigate to random page first and wait for completion
        if (onRandomPage) {
          try {
            await onRandomPage();
            console.log('🎲 Random key mode: Random page loaded successfully');
            
            // Step 3: Wait longer for UI to fully render, then select random key
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const randomKeyIndex = secureRandomKeyInPage(keysPerPage);
            console.log(`🎲 Random key mode: Step 2 - Selecting key #${randomKeyIndex + 1} from the new random page`);
            
            if (onRandomKeyInPage) {
              onRandomKeyInPage(randomKeyIndex);
            }
          } catch (error) {
            console.error('Random page generation failed in key mode:', error);
            // Fallback: just select a random key from current page
            const randomKeyIndex = secureRandomKeyInPage(keysPerPage);
            if (onRandomKeyInPage) {
              onRandomKeyInPage(randomKeyIndex);
            }
          }
        } else {
          // Fallback if onRandomPage is not available
          const randomKeyIndex = secureRandomKeyInPage(keysPerPage);
          if (onRandomKeyInPage) {
            onRandomKeyInPage(randomKeyIndex);
          }
        }
      }
    } catch (error) {
      console.error('Dice roll error:', error);
    } finally {
      setDiceRolling(false);
    }
  };

  const formatNumber = (num: string | number): string => {
    const numValue = typeof num === 'string' ? Number(num) : num;
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
    return numValue.toLocaleString();
  };

  return (
    <Card 
      sx={{ 
        mb: 2,
        background: 'linear-gradient(135deg, rgba(255, 193, 7, 0.1), rgba(255, 152, 0, 0.05))',
        border: '1px solid',
        borderColor: 'warning.main',
        '&:hover': {
          borderColor: 'warning.light',
          transform: 'translateY(-1px)',
          boxShadow: '0 4px 12px rgba(255, 193, 7, 0.15)'
        },
        transition: 'all 0.3s ease-in-out'
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CasinoIcon color="warning" sx={{ fontSize: '1.3rem' }} />
            <Typography variant="h6" sx={{ color: 'warning.main', fontWeight: 'bold' }}>
              🎲 Random Key Selector
            </Typography>
            {generateLocally && (
              <Chip
                icon={<ComputerIcon sx={{ fontSize: '0.8rem' }} />}
                label="LOCAL"
                size="small"
                variant="outlined"
                sx={{
                  fontSize: '0.7rem',
                  height: 22,
                  borderColor: 'success.main',
                  color: 'success.main',
                  '& .MuiChip-icon': { color: 'success.main' }
                }}
              />
            )}
          </Box>
          
          <Typography variant="caption" color="text.secondary">
            Current Page: {formatNumber(currentPage)}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" color="text.secondary">Mode:</Typography>
            <Select
              size="small"
              value={randomMode}
              onChange={(e: any) => setRandomMode(e.target.value as 'page' | 'key')}
              sx={{ minWidth: 100 }}
              disabled={disabled}
            >
              <MenuItem value="page">🗺️ Page</MenuItem>
              <MenuItem value="key">🔑 Key</MenuItem>
            </Select>
          </Box>
          
          <Tooltip 
            title={
              randomMode === 'page' 
                ? `Navigate to a random page in the keyspace${generateLocally ? ' (Local Generation)' : ''}`
                : `Navigate to a random page and select a random key from it${generateLocally ? ' (Local Generation)' : ''}`
            } 
            arrow
          >
            <Button
              variant="contained"
              color="warning"
              onClick={handleDiceRoll}
              disabled={
                disabled || 
                diceRolling || 
                (!onRandomPage && randomMode === 'page') || 
                (!onRandomKeyInPage && randomMode === 'key')
              }
              startIcon={<CasinoIcon />}
              sx={{
                animation: diceRolling ? 'spin 0.3s linear infinite' : 'none',
                '@keyframes spin': {
                  '0%': { transform: 'rotate(0deg)' },
                  '100%': { transform: 'rotate(360deg)' },
                },
                minWidth: '140px'
              }}
            >
              🎲 Random {randomMode}
            </Button>
          </Tooltip>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
            {generateLocally ? (
              <ComputerIcon sx={{ color: 'success.main', fontSize: '1rem' }} />
            ) : (
              <CloudIcon sx={{ color: 'text.secondary', fontSize: '1rem' }} />
            )}
            <Typography variant="caption" color="text.secondary">
              {randomMode === 'page' 
                ? `Navigate to a random page using ${generateLocally ? 'local' : 'server'} generation`
                : `Navigate to random page + select random key using ${generateLocally ? 'local' : 'server'} generation`
              }
            </Typography>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
});

RandomKeyCard.displayName = 'RandomKeyCard';

export default RandomKeyCard; 