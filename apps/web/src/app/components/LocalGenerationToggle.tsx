import React, { memo } from 'react';
import {
  Box,
  Typography,
  Switch,
  Tooltip,
  Chip,
  Fade
} from '@mui/material';
import {
  Speed as SpeedIcon,
  Cloud as CloudIcon,
  Computer as ComputerIcon,
  Security as SecurityIcon
} from '@mui/icons-material';

interface LocalGenerationToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  disabled?: boolean;
  loading?: boolean;
}

const LocalGenerationToggle = memo<LocalGenerationToggleProps>(({
  enabled,
  onToggle,
  disabled = false,
  loading = false
}) => {
  
  const handleToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    onToggle(event.target.checked);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        p: 1,
        borderRadius: 2,
        background: enabled 
          ? 'linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(76, 175, 80, 0.05))'
          : 'linear-gradient(135deg, rgba(158, 158, 158, 0.1), rgba(158, 158, 158, 0.05))',
        border: '1px solid',
        borderColor: enabled ? 'success.main' : 'divider',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          borderColor: enabled ? 'success.light' : 'primary.main',
          transform: 'translateY(-1px)',
          boxShadow: enabled 
            ? '0 4px 12px rgba(76, 175, 80, 0.15)'
            : '0 4px 12px rgba(0, 0, 0, 0.1)'
        }
      }}
    >
      {/* Header with Icon and Switch */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          mb: 1
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {enabled ? (
            <ComputerIcon 
              sx={{ 
                color: 'success.main',
                fontSize: '1.2rem'
              }} 
            />
          ) : (
            <CloudIcon 
              sx={{ 
                color: 'text.secondary',
                fontSize: '1.2rem'
              }} 
            />
          )}
          <Typography 
            variant="body2" 
            fontWeight="medium"
            sx={{ 
              color: enabled ? 'success.main' : 'text.secondary',
              fontSize: '0.875rem'
            }}
          >
            Generate Locally
          </Typography>
        </Box>

        <Tooltip
          title={enabled 
            ? "Switch to server-side generation" 
            : "Switch to client-side generation"
          }
          arrow
          placement="top"
        >
          <span>
            <Switch
              checked={enabled}
              onChange={handleToggle}
              disabled={disabled || loading}
              size="small"
              sx={{
                '& .MuiSwitch-track': {
                  backgroundColor: enabled ? 'success.light' : 'grey.400',
                },
                '& .MuiSwitch-thumb': {
                  backgroundColor: enabled ? 'success.main' : 'grey.600',
                  width: 16,
                  height: 16,
                }
              }}
            />
          </span>
        </Tooltip>
      </Box>

      {/* Status Indicator */}
      <Fade in timeout={300}>
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          {enabled ? (
            <Chip
              icon={<SpeedIcon sx={{ fontSize: '0.875rem' }} />}
              label="Browser Generation"
              size="small"
              variant="outlined"
              sx={{
                fontSize: '0.75rem',
                height: 24,
                borderColor: 'success.main',
                color: 'success.main',
                '& .MuiChip-icon': {
                  color: 'success.main'
                }
              }}
            />
          ) : (
            <Chip
              icon={<SecurityIcon sx={{ fontSize: '0.875rem' }} />}
              label="Server Generation"
              size="small"
              variant="outlined"
              sx={{
                fontSize: '0.75rem',
                height: 24,
                borderColor: 'text.secondary',
                color: 'text.secondary',
                '& .MuiChip-icon': {
                  color: 'text.secondary'
                }
              }}
            />
          )}
        </Box>
      </Fade>

      {/* Benefits Tooltip */}
      <Tooltip
        title={
          <Box sx={{ p: 1 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {enabled ? "🚀 Local Generation Benefits:" : "🛡️ Server Generation Benefits:"}
            </Typography>
            {enabled ? (
              <Box component="ul" sx={{ m: 0, pl: 2, fontSize: '0.75rem' }}>
                <li>⚡ Instant generation</li>
                <li>🔒 Client-side security</li>
                <li>📱 Works offline</li>
                <li>🎯 No server load</li>
              </Box>
            ) : (
              <Box component="ul" sx={{ m: 0, pl: 2, fontSize: '0.75rem' }}>
                <li>💻 Better for older devices</li>
                <li>📊 Consistent performance</li>
                <li>🌐 Server-side processing</li>
                <li>🔧 Centralized updates</li>
              </Box>
            )}
          </Box>
        }
        arrow
        placement="bottom"
        enterDelay={500}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            cursor: 'help',
            zIndex: 1
          }}
        />
      </Tooltip>
    </Box>
  );
});

LocalGenerationToggle.displayName = 'LocalGenerationToggle';

export default LocalGenerationToggle; 