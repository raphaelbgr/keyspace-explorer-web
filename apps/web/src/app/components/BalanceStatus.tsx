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
            <Tooltip title="Regenerate current page">
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
                Page Status
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">
                  {totalAddresses} addresses generated
                </Typography>
                <Typography variant="body2">
                  Complete
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={100} 
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>

            {lastChecked && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ScheduleIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  Generated: {new Date(lastChecked).toLocaleString()}
                </Typography>
              </Box>
            )}

            {isChecking && (
              <Alert 
                severity="info" 
                icon={<RefreshIcon />}
                sx={{ mt: 2 }}
              >
                Generating page data...
              </Alert>
            )}
          </Grid>
        </Grid>

        {!lastChecked && !isChecking && (
          <Alert 
            severity="info" 
            icon={<WarningIcon />}
            sx={{ mt: 2 }}
          >
            Ready to generate page data. Use the scanner or navigate to explore the keyspace.
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default BalanceStatus; 