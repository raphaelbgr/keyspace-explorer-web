'use client';

import React, { memo, useState } from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Typography,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip
} from '@mui/material';
import {
  ContentCopy as CopyIcon,
  OpenInNew as ExplorerIcon,
  QrCode as QrCodeIcon,
  MoreVert as MoreIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon
} from '@mui/icons-material';
import { CryptoCurrency } from '../../lib/types/multi-currency';
import { useCopyToClipboard } from '../utils/clipboard';

// Blockchain explorer configurations
const EXPLORER_CONFIGS = {
  BTC: {
    name: 'Blockstream',
    baseUrl: 'https://blockstream.info/address/',
    color: '#f7931a'
  },
  BCH: {
    name: 'Bitcoin.com',
    baseUrl: 'https://explorer.bitcoin.com/bch/address/',
    color: '#00d4aa'
  },
  DASH: {
    name: 'Dash Explorer',
    baseUrl: 'https://insight.dash.org/insight/address/',
    color: '#1c75bc'
  },
  DOGE: {
    name: 'Dogechain',
    baseUrl: 'https://dogechain.info/address/',
    color: '#c2a633'
  },
  ETH: {
    name: 'Etherscan',
    baseUrl: 'https://etherscan.io/address/',
    color: '#627eea'
  },
  LTC: {
    name: 'Blockchair',
    baseUrl: 'https://blockchair.com/litecoin/address/',
    color: '#bfbbbb'
  },
  XRP: {
    name: 'XRPL Explorer',
    baseUrl: 'https://livenet.xrpl.org/accounts/',
    color: '#23292f'
  },
  ZEC: {
    name: 'Zcash Explorer',
    baseUrl: 'https://explorer.zcha.in/accounts/',
    color: '#f4b728'
  }
};

interface AddressManagementProps {
  address: string;
  currency: CryptoCurrency;
  addressType?: string;
  balance?: number;
  compact?: boolean;
  showExplorer?: boolean;
  showQR?: boolean;
  showCopy?: boolean;
}

const AddressManagement = memo<AddressManagementProps>(({
  address,
  currency,
  addressType,
  balance,
  compact = false,
  showExplorer = true,
  showQR = false,
  showCopy = true
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const { copy } = useCopyToClipboard();

  const explorerConfig = EXPLORER_CONFIGS[currency];
  const isValidAddress = address && address.length > 10; // Basic validation

  // Handle copy to clipboard
  const handleCopy = async (text: string, label: string) => {
    const result = await copy(text);
    setNotification({
      message: result.success ? `${label} copied!` : result.message,
      type: result.success ? 'success' : 'error'
    });
    setAnchorEl(null);
  };

  // Handle blockchain explorer
  const handleExplorer = () => {
    if (isValidAddress && explorerConfig) {
      const url = `${explorerConfig.baseUrl}${address}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
    setAnchorEl(null);
  };

  // Handle QR code dialog
  const handleQR = () => {
    setQrDialogOpen(true);
    setAnchorEl(null);
  };

  // Truncate address for display
  const truncateAddress = (addr: string, chars = 6) => {
    if (!addr || addr.length <= chars * 2) return addr;
    return `${addr.slice(0, chars)}...${addr.slice(-chars)}`;
  };

  // Generate QR code URL (using qr-server.com for simplicity)
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(address)}`;

  const openMenu = Boolean(anchorEl);

  if (compact) {
    return (
      <>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {/* Address Text */}
          <Typography
            variant="caption"
            fontFamily="monospace"
            sx={{
              fontSize: '0.7rem',
              color: isValidAddress ? 'text.primary' : 'error.main',
              wordBreak: 'break-all',
              flex: 1
            }}
          >
            {truncateAddress(address, 8)}
          </Typography>

          {/* Quick Copy Button */}
          {showCopy && isValidAddress && (
            <Tooltip title="Copy address">
              <IconButton
                size="small"
                onClick={() => handleCopy(address, 'Address')}
                sx={{ p: 0.25 }}
              >
                <CopyIcon sx={{ fontSize: '0.9rem' }} />
              </IconButton>
            </Tooltip>
          )}

          {/* Explorer Link */}
          {showExplorer && isValidAddress && explorerConfig && (
            <Tooltip title={`View on ${explorerConfig.name}`}>
              <IconButton
                size="small"
                onClick={handleExplorer}
                sx={{ p: 0.25 }}
              >
                <ExplorerIcon sx={{ fontSize: '0.9rem', color: explorerConfig.color }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>

        {/* Notification */}
        <Snackbar
          open={!!notification}
          autoHideDuration={3000}
          onClose={() => setNotification(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity={notification?.type} onClose={() => setNotification(null)}>
            {notification?.message}
          </Alert>
        </Snackbar>
      </>
    );
  }

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
        {/* Address Type Chip */}
        {addressType && (
          <Chip
            label={addressType.replace(/_/g, ' ').toUpperCase()}
            size="small"
            variant="outlined"
            sx={{ fontSize: '0.7rem', minWidth: 'auto' }}
          />
        )}

        {/* Address Text */}
        <Typography
          variant="body2"
          fontFamily="monospace"
          sx={{
            fontSize: '0.8rem',
            color: isValidAddress ? 'text.primary' : 'error.main',
            wordBreak: 'break-all',
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5
          }}
        >
          {address || 'Invalid Address'}
          {!isValidAddress && <ErrorIcon sx={{ fontSize: '1rem', color: 'error.main' }} />}
        </Typography>

        {/* Balance Display */}
        {balance !== undefined && balance > 0 && (
          <Chip
            label={`${balance.toFixed(8)} ${currency}`}
            size="small"
            color="success"
            sx={{ fontSize: '0.7rem' }}
          />
        )}

        {/* Action Menu */}
        {isValidAddress && (
          <Tooltip title="Address actions">
            <IconButton
              size="small"
              onClick={(e) => setAnchorEl(e.currentTarget)}
              sx={{ ml: 'auto' }}
            >
              <MoreIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={openMenu}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {showCopy && (
          <MenuItem onClick={() => handleCopy(address, 'Address')}>
            <ListItemIcon>
              <CopyIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Copy Address" />
          </MenuItem>
        )}

        {addressType && (
          <MenuItem onClick={() => handleCopy(`${addressType}: ${address}`, 'Address with type')}>
            <ListItemIcon>
              <CopyIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Copy with Type" />
          </MenuItem>
        )}

        {showExplorer && explorerConfig && (
          <MenuItem onClick={handleExplorer}>
            <ListItemIcon>
              <ExplorerIcon fontSize="small" sx={{ color: explorerConfig.color }} />
            </ListItemIcon>
            <ListItemText 
              primary={`View on ${explorerConfig.name}`}
              secondary="Blockchain Explorer"
            />
          </MenuItem>
        )}

        {showQR && (
          <MenuItem onClick={handleQR}>
            <ListItemIcon>
              <QrCodeIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Show QR Code" />
          </MenuItem>
        )}
      </Menu>

      {/* QR Code Dialog */}
      <Dialog
        open={qrDialogOpen}
        onClose={() => setQrDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          QR Code for {currency} Address
          {addressType && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {addressType.replace(/_/g, ' ').toUpperCase()}
            </Typography>
          )}
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', pb: 2 }}>
          <Box sx={{ mb: 2 }}>
            <img
              src={qrCodeUrl}
              alt="QR Code"
              style={{ maxWidth: '100%', height: 'auto' }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </Box>
          <Typography
            variant="body2"
            fontFamily="monospace"
            sx={{
              wordBreak: 'break-all',
              bgcolor: 'rgba(0,0,0,0.05)',
              p: 1,
              borderRadius: 1
            }}
          >
            {address}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleCopy(address, 'Address')}>
            Copy Address
          </Button>
          <Button onClick={() => setQrDialogOpen(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification */}
      <Snackbar
        open={!!notification}
        autoHideDuration={3000}
        onClose={() => setNotification(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={notification?.type} onClose={() => setNotification(null)}>
          {notification?.message}
        </Alert>
      </Snackbar>
    </>
  );
});

AddressManagement.displayName = 'AddressManagement';

export default AddressManagement; 