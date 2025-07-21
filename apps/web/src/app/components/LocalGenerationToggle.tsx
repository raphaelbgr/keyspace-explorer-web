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
        width: '100%',
        p: 1.5,
        borderRadius: 2,
        background: enabled
          ? 'linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(76, 175, 80, 0.05))'
          : 'linear-gradient(135deg, rgba(158, 158, 158, 0.1), rgba(158, 158, 158, 0.05))',
        border: '1px solid',
        borderColor: enabled ? 'success.main' : 'divider',
        transition: 'all 0.3s ease-in-out',
        gap: 1,
        '&:hover': {
          borderColor: enabled ? 'success.light' : 'primary.main',
          transform: 'translateY(-1px)',
          boxShadow: enabled
            ? '0 4px 12px rgba(76, 175, 80, 0.15)'
            : '0 4px 12px rgba(0, 0, 0, 0.1)'
        }
      }}
    >
      {/* Top Row: Icon + Label + Switch + Status */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {enabled ? (
            <ComputerIcon sx={{ color: 'success.main', fontSize: '1.1rem' }} />
          ) : (
            <CloudIcon sx={{ color: 'text.secondary', fontSize: '1.1rem' }} />
          )}
          <Typography variant="body2" fontWeight="medium" sx={{ color: enabled ? 'success.main' : 'text.secondary', fontSize: '0.875rem' }}>
            Generate Locally
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {/* Status Chip */}
          {enabled ? (
            <Chip icon={<SpeedIcon sx={{ fontSize: '0.8rem' }} />} label="Browser" size="small" variant="outlined"
              sx={{ fontSize: '0.7rem', height: 22, borderColor: 'success.main', color: 'success.main', '& .MuiChip-icon': { color: 'success.main' } }}
            />
          ) : (
            <Chip icon={<SecurityIcon sx={{ fontSize: '0.8rem' }} />} label="Server" size="small" variant="outlined"
              sx={{ fontSize: '0.7rem', height: 22, borderColor: 'text.secondary', color: 'text.secondary', '& .MuiChip-icon': { color: 'text.secondary' } }}
            />
          )}

          {/* Switch */}
          <Tooltip title={enabled ? "Switch to server-side generation" : "Switch to client-side generation"} arrow placement="top">
            <span>
              <Switch
                checked={enabled}
                onChange={handleToggle}
                disabled={disabled || loading}
                size="small"
                sx={{
                  '& .MuiSwitch-track': { backgroundColor: enabled ? 'success.light' : 'grey.400' },
                  '& .MuiSwitch-thumb': { backgroundColor: enabled ? 'success.main' : 'grey.600', width: 16, height: 16 }
                }}
              />
            </span>
          </Tooltip>
        </Box>
      </Box>

      {/* Bottom Row: Benefits (Left Aligned) */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
        <Typography variant="caption" sx={{ fontSize: '0.75rem', fontWeight: 'bold', color: enabled ? 'success.main' : 'text.secondary', mb: 0.3 }}>
          {enabled ? "🚀 Local Generation Benefits:" : "🛡️ Server Generation Benefits:"}
        </Typography>
        <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary', lineHeight: 1.3 }}>
          {enabled 
            ? "⚡ Instant generation • 🔒 Client-side security • 📱 Works offline • 🎯 No server load"
            : "💻 Better for older devices • 📊 Consistent performance • 🌐 Server-side processing • 🔧 Centralized updates"
          }
        </Typography>
      </Box>
    </Box>
  );
});

LocalGenerationToggle.displayName = 'LocalGenerationToggle';

export default LocalGenerationToggle; 