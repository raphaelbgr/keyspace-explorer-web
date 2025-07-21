import React, { memo, useState } from 'react';
import { 
  TableRow, 
  TableCell, 
  Typography, 
  IconButton, 
  Chip,
  Tooltip,
  Box,
  Snackbar,
  Alert
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ContentCopy as ContentCopyIcon,
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material';
import { useCopyToClipboard } from '../utils/clipboard';

interface KeyTableRowProps {
  keyData: {
    privateKey: string;
    totalBalance: number;
    addresses: {
      p2pkh_compressed: string;
      p2pkh_uncompressed: string;
      p2wpkh: string;
      p2sh_p2wpkh: string;
      p2tr: string;
    };
  };
  index: number;
  isExpanded: boolean;
  onToggleExpansion: () => void;
  keysPerPage: number;
  currentKeysPage: number;
}

const KeyTableRow = memo<KeyTableRowProps>(({ 
  keyData, 
  index, 
  isExpanded, 
  onToggleExpansion, 
  keysPerPage, 
  currentKeysPage 
}) => {
  const keyNumber = index + 1 + (currentKeysPage - 1) * keysPerPage;
  const { copy } = useCopyToClipboard();
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Use the primary Bitcoin address (compressed P2PKH)
  const primaryAddress = keyData.addresses?.p2pkh_compressed || '';
  
  const handleCopyAddress = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row expansion
    if (primaryAddress) {
      const result = await copy(primaryAddress);
      setNotification({
        message: result.message,
        type: result.success ? 'success' : 'error'
      });
    }
  };
  
  const handleExploreAddress = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row expansion
    if (primaryAddress) {
      const explorerUrl = `https://www.blockchain.com/explorer/addresses/btc/${primaryAddress}`;
      window.open(explorerUrl, '_blank', 'noopener,noreferrer');
    }
  };
  
  return (
    <>
      <TableRow>
        <TableCell>{keyNumber}</TableCell>
        <TableCell>
          <Typography variant="body2" fontFamily="monospace" sx={{ fontSize: '0.75rem' }}>
            {keyData.privateKey.substring(0, 16)}...
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2" fontFamily="monospace" sx={{ fontSize: '0.7rem' }}>
            {primaryAddress ? `${primaryAddress.substring(0, 12)}...` : 'Loading...'}
          </Typography>
        </TableCell>
        <TableCell>{keyData.totalBalance.toFixed(8)} BTC</TableCell>
        <TableCell>
          {keyData.totalBalance > 0 ? (
            <Chip label="FUNDS!" color="success" size="small" />
          ) : (
            <Chip label="Empty" color="default" size="small" />
          )}
        </TableCell>
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Tooltip title="Copy address" arrow>
              <IconButton 
                size="small" 
                onClick={handleCopyAddress}
                disabled={!primaryAddress}
              >
                <ContentCopyIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Explore on blockchain.com" arrow>
              <IconButton 
                size="small" 
                onClick={handleExploreAddress}
                disabled={!primaryAddress}
              >
                <OpenInNewIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Expand details" arrow>
              <IconButton 
                size="small" 
                onClick={onToggleExpansion}
              >
                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Tooltip>
          </Box>
        </TableCell>
      </TableRow>
      
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

KeyTableRow.displayName = 'KeyTableRow';

export default KeyTableRow; 