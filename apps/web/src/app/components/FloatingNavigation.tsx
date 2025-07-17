'use client';

import React from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
} from '@mui/icons-material';
import { useThemeStore } from '../store/themeStore';
import LanguageSelector from './LanguageSelector';

interface FloatingNavigationProps {
  onToggleMenu?: () => void;
  isMenuOpen?: boolean;
}

export default function FloatingNavigation({ onToggleMenu, isMenuOpen = false }: FloatingNavigationProps) {
  const theme = useTheme();
  const { mode, toggle } = useThemeStore();

  const handleThemeToggle = () => {
    toggle();
  };

  return (
    <Box
      sx={{
        position: 'static',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        gap: 2,
        mb: 2,
        p: 2,
        background: mode === 'dark' 
          ? 'rgba(30, 30, 30, 0.95)' 
          : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: 2,
        border: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
      }}
    >
      {/* Theme Toggle */}
      <Tooltip title={mode === 'dark' ? 'Light Mode' : 'Dark Mode'} arrow>
        <IconButton
          onClick={handleThemeToggle}
          size="small"
          sx={{
            color: 'primary.main',
            '&:hover': {
              backgroundColor: 'primary.main',
              color: 'white',
            },
          }}
        >
          {mode === 'dark' ? (
            <LightModeIcon fontSize="small" />
          ) : (
            <DarkModeIcon fontSize="small" />
          )}
        </IconButton>
      </Tooltip>

      {/* Language Selector */}
      <LanguageSelector size="small" />
    </Box>
  );
} 