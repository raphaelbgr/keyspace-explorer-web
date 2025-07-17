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

interface ControlPanelProps {
  currentPage: string;
  onPageChange: (page: string) => void;
  onGeneratePage: () => void;
  onFetchBalances: () => void;
  onStartScan: () => void;
  onStopScan: () => void;
  onToggleDisplayMode: () => void;
  apiSource: string;
  onApiSourceChange: (source: string) => void;
  displayMode: 'grid' | 'table';
  loading: boolean;
  isScanning: boolean;
  pageData: any;
  scanProgress: number;
}

const ControlPanel = memo<ControlPanelProps>(({
  currentPage,
  onPageChange,
  onGeneratePage,
  onFetchBalances,
  onStartScan,
  onStopScan,
  onToggleDisplayMode,
  apiSource,
  onApiSourceChange,
  displayMode,
  loading,
  isScanning,
  pageData,
  scanProgress
}) => {
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
            <Tooltip title="Select API source for balance checking" arrow>
              <FormControl fullWidth size="small">
                <InputLabel>API Source</InputLabel>
                <Select
                  value={apiSource}
                  onChange={(e) => onApiSourceChange(e.target.value)}
                  label="API Source"
                >
                  <MenuItem value="local">Local</MenuItem>
                  <MenuItem value="blockstream">Blockstream</MenuItem>
                  <MenuItem value="mempool">Mempool.space</MenuItem>
                </Select>
              </FormControl>
            </Tooltip>
          </Grid>

          <Grid item xs={12} md={2}>
            <Tooltip title="Generate 45 keys for the specified page" arrow>
              <Button
                fullWidth
                variant="contained"
                onClick={onGeneratePage}
                disabled={loading}
                startIcon={<RefreshIcon />}
                size="small"
                sx={{ 
                  background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
                  '&:hover': { background: 'linear-gradient(45deg, #FF5252, #26A69A)' }
                }}
              >
                Generate
              </Button>
            </Tooltip>
          </Grid>

          <Grid item xs={12} md={2}>
            <Tooltip title="Fetch balances for all addresses on the current page" arrow>
              <Button
                fullWidth
                variant="outlined"
                onClick={onFetchBalances}
                disabled={loading || !pageData}
                startIcon={<BalanceIcon />}
                size="small"
              >
                Fetch Balances
              </Button>
            </Tooltip>
          </Grid>

          <Grid item xs={12} md={2}>
            <Tooltip title={isScanning ? "Stop the scanning process" : "Start scanning for funds"} arrow>
              <Button
                fullWidth
                variant={isScanning ? "outlined" : "contained"}
                color={isScanning ? "error" : "success"}
                onClick={isScanning ? onStopScan : onStartScan}
                disabled={!pageData}
                startIcon={isScanning ? <StopIcon /> : <PlayIcon />}
                size="small"
              >
                {isScanning ? 'Stop' : 'Scan'}
              </Button>
            </Tooltip>
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
                {displayMode === 'grid' ? 'Table' : 'Grid'}
              </Button>
            </Tooltip>
          </Grid>
        </Grid>

        {/* Scan Progress */}
        {isScanning && (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <SpeedIcon sx={{ mr: 1, color: 'primary.main' }} />
              <Typography variant="body2" color="text.secondary">
                Scanning Progress
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={scanProgress} 
              sx={{ height: 8, borderRadius: 4 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
              {scanProgress}% Complete
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
});

ControlPanel.displayName = 'ControlPanel';

export default ControlPanel; 