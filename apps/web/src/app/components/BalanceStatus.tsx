import React from 'react';
import {
  Box,
  Typography,
  Chip,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  AccountBalance as BalanceIcon,
  Refresh as RefreshIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import { useTranslation } from '../translations';

interface BalanceStatusProps {
  totalBalance: number;
  totalAddresses: number;
  checkedAddresses: number;
  lastChecked: string | null;
  isChecking: boolean;
  source: string;
  onRefresh: () => void;
  hasFunds: boolean;
}

const BalanceStatus = ({
  totalBalance,
  totalAddresses,
  checkedAddresses,
  lastChecked,
  isChecking,
  source,
  onRefresh,
  hasFunds
}: BalanceStatusProps) => {
  const t = useTranslation();
  const progress = totalAddresses > 0 ? (checkedAddresses / totalAddresses) * 100 : 0;
  const hasChecked = checkedAddresses > 0;

  return (
    <Card sx={{ mb: 3, background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h3">
            {t.totalBalance}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Chip 
              label={source} 
              color="primary" 
              size="small"
            />
            <Tooltip title="Refresh balances">
              <IconButton 
                size="small" 
                onClick={onRefresh}
                disabled={isChecking}
              >
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <BalanceIcon color="primary" />
              <Box>
                <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
                  {totalBalance.toFixed(8)} {t.btc}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t.totalBalance}
                </Typography>
              </Box>
            </Box>
            
            {hasFunds && (
              <Alert 
                severity="success" 
                icon={<CheckCircleIcon />}
                sx={{ mb: 2 }}
              >
                {t.funds} 🎉
              </Alert>
            )}
          </Grid>

          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Address Check Progress
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">
                  {checkedAddresses} / {totalAddresses} addresses
                </Typography>
                <Typography variant="body2">
                  {progress.toFixed(1)}%
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={progress} 
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>

            {hasChecked && lastChecked && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ScheduleIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  Last checked: {new Date(lastChecked).toLocaleString()}
                </Typography>
              </Box>
            )}

            {isChecking && (
              <Alert 
                severity="info" 
                icon={<RefreshIcon />}
                sx={{ mt: 2 }}
              >
                Checking balances from {source}...
              </Alert>
            )}
          </Grid>
        </Grid>

        {!hasChecked && !isChecking && (
          <Alert 
            severity="warning" 
            icon={<WarningIcon />}
            sx={{ mt: 2 }}
          >
            No balances checked yet. Click "Fetch Balances" to start checking.
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default BalanceStatus; 