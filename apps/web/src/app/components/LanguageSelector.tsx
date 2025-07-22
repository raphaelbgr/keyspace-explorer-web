'use client';

import React, { memo } from 'react';
import { 
  IconButton, 
  Tooltip, 
  Box,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography
} from '@mui/material';
import { Language as LanguageIcon } from '@mui/icons-material';
import { useLanguageStore, Language } from '../store/languageStore';
import { useTranslation } from '../translations';

// Flag icons as SVG components
const USFlag = () => (
  <svg width="24" height="16" viewBox="0 0 24 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="24" height="16" fill="#B22234"/>
    <rect width="24" height="1.23" y="1.23" fill="white"/>
    <rect width="24" height="1.23" y="3.69" fill="white"/>
    <rect width="24" height="1.23" y="6.15" fill="white"/>
    <rect width="24" height="1.23" y="8.61" fill="white"/>
    <rect width="24" height="1.23" y="11.07" fill="white"/>
    <rect width="24" height="1.23" y="13.53" fill="white"/>
    <rect width="9.6" height="8.61" fill="#3C3B6E"/>
    <g fill="white">
      <path d="M0.6 0.6h0.6v0.6H0.6zM1.8 0.6h0.6v0.6H1.8zM3 0.6h0.6v0.6H3zM4.2 0.6h0.6v0.6H4.2zM5.4 0.6h0.6v0.6H5.4zM6.6 0.6h0.6v0.6H6.6zM7.8 0.6h0.6v0.6H7.8zM0.6 1.2h0.6v0.6H0.6zM1.8 1.2h0.6v0.6H1.8zM3 1.2h0.6v0.6H3zM4.2 1.2h0.6v0.6H4.2zM5.4 1.2h0.6v0.6H5.4zM6.6 1.2h0.6v0.6H6.6zM7.8 1.2h0.6v0.6H7.8zM0.6 1.8h0.6v0.6H0.6zM1.8 1.8h0.6v0.6H1.8zM3 1.8h0.6v0.6H3zM4.2 1.8h0.6v0.6H4.2zM5.4 1.8h0.6v0.6H5.4zM6.6 1.8h0.6v0.6H6.6zM7.8 1.8h0.6v0.6H7.8zM0.6 2.4h0.6v0.6H0.6zM1.8 2.4h0.6v0.6H1.8zM3 2.4h0.6v0.6H3zM4.2 2.4h0.6v0.6H4.2zM5.4 2.4h0.6v0.6H5.4zM6.6 2.4h0.6v0.6H6.6zM7.8 2.4h0.6v0.6H7.8zM0.6 3h0.6v0.6H0.6zM1.8 3h0.6v0.6H1.8zM3 3h0.6v0.6H3zM4.2 3h0.6v0.6H4.2zM5.4 3h0.6v0.6H5.4zM6.6 3h0.6v0.6H6.6zM7.8 3h0.6v0.6H7.8zM0.6 3.6h0.6v0.6H0.6zM1.8 3.6h0.6v0.6H1.8zM3 3.6h0.6v0.6H3zM4.2 3.6h0.6v0.6H4.2zM5.4 3.6h0.6v0.6H5.4zM6.6 3.6h0.6v0.6H6.6zM7.8 3.6h0.6v0.6H7.8zM0.6 4.2h0.6v0.6H0.6zM1.8 4.2h0.6v0.6H1.8zM3 4.2h0.6v0.6H3zM4.2 4.2h0.6v0.6H4.2zM5.4 4.2h0.6v0.6H5.4zM6.6 4.2h0.6v0.6H6.6zM7.8 4.2h0.6v0.6H7.8zM0.6 4.8h0.6v0.6H0.6zM1.8 4.8h0.6v0.6H1.8zM3 4.8h0.6v0.6H3zM4.2 4.8h0.6v0.6H4.2zM5.4 4.8h0.6v0.6H5.4zM6.6 4.8h0.6v0.6H6.6zM7.8 4.8h0.6v0.6H7.8zM0.6 5.4h0.6v0.6H0.6zM1.8 5.4h0.6v0.6H1.8zM3 5.4h0.6v0.6H3zM4.2 5.4h0.6v0.6H4.2zM5.4 5.4h0.6v0.6H5.4zM6.6 5.4h0.6v0.6H6.6zM7.8 5.4h0.6v0.6H7.8zM0.6 6h0.6v0.6H0.6zM1.8 6h0.6v0.6H1.8zM3 6h0.6v0.6H3zM4.2 6h0.6v0.6H4.2zM5.4 6h0.6v0.6H5.4zM6.6 6h0.6v0.6H6.6zM7.8 6h0.6v0.6H7.8zM0.6 6.6h0.6v0.6H0.6zM1.8 6.6h0.6v0.6H1.8zM3 6.6h0.6v0.6H3zM4.2 6.6h0.6v0.6H4.2zM5.4 6.6h0.6v0.6H5.4zM6.6 6.6h0.6v0.6H6.6zM7.8 6.6h0.6v0.6H7.8zM0.6 7.2h0.6v0.6H0.6zM1.8 7.2h0.6v0.6H1.8zM3 7.2h0.6v0.6H3zM4.2 7.2h0.6v0.6H4.2zM5.4 7.2h0.6v0.6H5.4zM6.6 7.2h0.6v0.6H6.6zM7.8 7.2h0.6v0.6H7.8z"/>
    </g>
  </svg>
);

const BrazilFlag = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="16" viewBox="0 0 720 504">
    <rect width="720" height="504" fill="#009b3a"/>
    <polygon points="360,72 648,252 360,432 72,252" fill="#ffdf00"/>
    <circle cx="360" cy="252" r="100" fill="#002776"/>
    <path d="M 270 252 a 90 20 0 0 1 180 0 a 90 20 0 0 1 -180 0" fill="white" transform="rotate(-15 360 252)"/>
    <text x="360" y="258" fontSize="24" fontWeight="bold" textAnchor="middle" fill="white" transform="rotate(-15 360 252)" fontFamily="sans-serif">
      ORDEM E PROGRESSO
    </text>
  </svg>
);

interface LanguageSelectorProps {
  size?: 'small' | 'medium' | 'large';
}

const LanguageSelector = memo<LanguageSelectorProps>(({ size = 'medium' }) => {
  const { language, setLanguage } = useLanguageStore();
  const t = useTranslation();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    handleClose();
  };

  const getCurrentFlag = () => {
    return language === 'en' ? <USFlag /> : <BrazilFlag />;
  };

  const buttonSize = size === 'small' ? 'small' : size === 'large' ? 'large' : 'medium';

  return (
    <>
      <Tooltip title={t.language} arrow>
        <IconButton
          onClick={handleClick}
          size={buttonSize}
          sx={{
            borderRadius: '8px',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'scale(1.05)',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            },
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getCurrentFlag()}
            <LanguageIcon sx={{ fontSize: size === 'small' ? 16 : size === 'large' ? 24 : 20 }} />
          </Box>
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            minWidth: '200px',
          },
        }}
      >
        <MenuItem 
          onClick={() => handleLanguageChange('en')}
          selected={language === 'en'}
          sx={{
            '&.Mui-selected': {
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
            },
          }}
        >
          <ListItemIcon>
            <USFlag />
          </ListItemIcon>
          <ListItemText>
            <Typography variant="body2" fontWeight={language === 'en' ? 600 : 400}>
              {t.english}
            </Typography>
          </ListItemText>
        </MenuItem>

        <MenuItem 
          onClick={() => handleLanguageChange('pt')}
          selected={language === 'pt'}
          sx={{
            '&.Mui-selected': {
              backgroundColor: 'primary.main',
              color: 'primary.contrastText',
              '&:hover': {
                backgroundColor: 'primary.dark',
              },
            },
          }}
        >
          <ListItemIcon>
            <BrazilFlag />
          </ListItemIcon>
          <ListItemText>
            <Typography variant="body2" fontWeight={language === 'pt' ? 600 : 400}>
              {t.portuguese}
            </Typography>
          </ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
});

LanguageSelector.displayName = 'LanguageSelector';

export default LanguageSelector; 