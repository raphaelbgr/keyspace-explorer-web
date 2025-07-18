import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Snackbar,
  Alert
} from '@mui/material';
import { ContentCopy as ContentCopyIcon, Close as CloseIcon } from '@mui/icons-material';
import { useCopyToClipboard } from '../utils/clipboard';

interface AddressModalProps {
  open: boolean;
  onClose: () => void;
  keyData: {
    privateKey: string;
    addresses: {
      p2pkh_compressed: string;
      p2pkh_uncompressed: string;
      p2wpkh: string;
      p2sh_p2wpkh: string;
      p2tr: string;
    };
    totalBalance: number;
  } | null;
  keyNumber: number;
}

const AddressModal = ({ open, onClose, keyData, keyNumber }: AddressModalProps) => {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { copy } = useCopyToClipboard();

  const handleCopy = async (text: string) => {
    const result = await copy(text);
    if (result.success) {
      setCopied(true);
      setError(null);
    } else {
      setError(result.message);
      setCopied(false);
    }
  };

  if (!keyData) return null;

  const addressTypes = [
    { label: 'P2PKH (Compressed)', value: keyData.addresses.p2pkh_compressed, type: 'p2pkh_compressed' },
    { label: 'P2PKH (Uncompressed)', value: keyData.addresses.p2pkh_uncompressed, type: 'p2pkh_uncompressed' },
    { label: 'P2WPKH', value: keyData.addresses.p2wpkh, type: 'p2wpkh' },
    { label: 'P2SH-P2WPKH', value: keyData.addresses.p2sh_p2wpkh, type: 'p2sh_p2wpkh' },
    { label: 'P2TR', value: keyData.addresses.p2tr, type: 'p2tr' },
  ];

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Key {keyNumber} - Wallet Addresses</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" fontFamily="monospace" sx={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
              {keyData.privateKey}
            </Typography>
            <Tooltip title="Copy Private Key">
              <IconButton
                size="small"
                onClick={() => handleCopy(keyData.privateKey)}
              >
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Private Key:
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" fontFamily="monospace" sx={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
              {keyData.privateKey}
            </Typography>
            <Button
              size="small"
              startIcon={<ContentCopyIcon />}
              onClick={() => handleCopy(keyData.privateKey)}
            >
              Copy
            </Button>
          </Box>
        </Box>

        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Address Type</TableCell>
                <TableCell>Address</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {addressTypes.map((address) => (
                <TableRow key={address.type}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {address.label}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace" sx={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
                      {address.value}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      startIcon={<ContentCopyIcon />}
                      onClick={() => handleCopy(address.value)}
                    >
                      Copy
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddressModal; 