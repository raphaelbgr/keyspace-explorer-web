import React, { memo, useCallback } from 'react';
import { 
  Card, 
  CardContent, 
  Grid, 
  Button, 
  TextField, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Tooltip, 
  Box, 
  Typography, 
  LinearProgress 
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
  Key as KeyIcon,
  AccountBalance as BalanceIcon,
  Speed as SpeedIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useTranslation } from '../translations';
import LocalGenerationToggle from './LocalGenerationToggle';

interface ControlPanelProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  onGeneratePage: () => void;
  onToggleDisplayMode: () => void;
  apiSource: string;
  onApiSourceChange: (source: string) => void;
  displayMode: 'grid' | 'table';
  loading: boolean;
  lastChecked: string | null;
  hasFunds: boolean;
  // New props for local generation
  generateLocally?: boolean;
  onToggleLocalGeneration?: (enabled: boolean) => void;
}

const ControlPanel = memo<ControlPanelProps>(({
  currentPage,
  onPageChange,
  onGeneratePage,
  onToggleDisplayMode,
  apiSource,
  onApiSourceChange,
  displayMode,
  loading,
  lastChecked,
  hasFunds,
  generateLocally,
  onToggleLocalGeneration
}) => {
  const t = useTranslation();
  
  // Prevent excessive re-renders
  const handlePageChange = useCallback((page: string) => {
    if (page !== currentPage) {
      onPageChange(page);
    }
  }, [currentPage, onPageChange]);
  return (
    <Card sx={{ 
      mb: 3, 
      background: 'rgba(255,255,255,0.05)', 
      backdropFilter: 'blur(10px)' 
    }}>
      <CardContent>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={2}>
            <Tooltip title="Enter the page number to generate keys from" arrow>
              <TextField
                fullWidth
                label="Page Number"
                value={currentPage}
                onChange={(e) => onPageChange(e.target.value)}
                type="number"
                size="small"
                InputProps={{
                  startAdornment: <KeyIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Tooltip>
          </Grid>
          
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <Tooltip title="Select API source for balance checking" arrow placement="top">
                <InputLabel>API Source</InputLabel>
              </Tooltip>
              <Select
                value={apiSource}
                onChange={(e) => onApiSourceChange(e.target.value)}
                label="API Source"
              >
                <MenuItem value="local">🏠 Local</MenuItem>
                <MenuItem value="external">🌐 External</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={5}>
            <LocalGenerationToggle
              enabled={generateLocally || false}
              onToggle={onToggleLocalGeneration || (() => {})}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <Tooltip title="Toggle display mode" arrow>
              <Button
                fullWidth
                variant="outlined"
                onClick={onToggleDisplayMode}
                startIcon={<SettingsIcon />}
                size="small"
              >
                {displayMode === 'grid' ? t.table : t.grid}
              </Button>
            </Tooltip>
          </Grid>
        </Grid>

        {/* Scan Progress */}
        {lastChecked && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <SpeedIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="body2" color="text.secondary">
                Last Checked: {lastChecked}
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={hasFunds ? 100 : 0} 
              sx={{ height: 8, borderRadius: 4 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              {hasFunds ? "Funds found" : "No funds found"}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
});

ControlPanel.displayName = 'ControlPanel';

export default ControlPanel; 