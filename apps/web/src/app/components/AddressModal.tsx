import React, { memo, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Chip,
  Button,
  Tooltip,
  Link,
  Divider
} from '@mui/material';
import {
  Close as CloseIcon,
  ContentCopy as CopyIcon,
  OpenInNew as ExternalLinkIcon,
  Key as KeyIcon
} from '@mui/icons-material';

// Legacy Bitcoin-only structure for backward compatibility
interface LegacyKeyData {
  privateKey: string;
  addresses: {
    p2pkh_compressed: string;
    p2pkh_uncompressed: string;
    p2wpkh: string;
    p2sh_p2wpkh: string;
    p2tr: string;
  };
  balances?: {
    p2pkh_compressed: number;
    p2pkh_uncompressed: number;
    p2wpkh: number;
    p2sh_p2wpkh: number;
    p2tr: number;
  };
  totalBalance?: number;
}

// Multi-currency structure (future use)
interface MultiCurrencyKeyData {
  privateKey: string;
  addresses: any; // CurrencyAddressMap when available
  balances: any;
  totalBalance: any;
  hasAnyFunds?: boolean;
  fundedCurrencies?: string[];
}

interface AddressModalProps {
  open: boolean;
  onClose: () => void;
  keyNumber: number;
  keyData: LegacyKeyData | MultiCurrencyKeyData;
}

// Blockchain Explorer URLs for Bitcoin addresses
const BTC_EXPLORER_URL = (address: string) => `https://blockstream.info/address/${address}`;

const AddressModal = memo<AddressModalProps>(({ open, onClose, keyNumber, keyData }) => {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const handleCopyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  const handleCopyPrivateKey = async () => {
    try {
      await navigator.clipboard.writeText(keyData.privateKey);
      setCopiedAddress('privateKey');
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (error) {
      console.error('Failed to copy private key:', error);
    }
  };

  // Check if this is legacy Bitcoin-only data structure
  const isLegacyData = (data: any): data is LegacyKeyData => {
    return data.addresses && typeof data.addresses.p2pkh_compressed === 'string';
  };

  const renderLegacyBitcoinAddresses = (data: LegacyKeyData) => {
    const addressTypes = [
      { label: 'P2PKH (Compressed)', value: data.addresses.p2pkh_compressed, type: 'p2pkh_compressed', balance: data.balances?.p2pkh_compressed || 0 },
      { label: 'P2PKH (Uncompressed)', value: data.addresses.p2pkh_uncompressed, type: 'p2pkh_uncompressed', balance: data.balances?.p2pkh_uncompressed || 0 },
      { label: 'P2WPKH', value: data.addresses.p2wpkh, type: 'p2wpkh', balance: data.balances?.p2wpkh || 0 },
      { label: 'P2SH-P2WPKH', value: data.addresses.p2sh_p2wpkh, type: 'p2sh_p2wpkh', balance: data.balances?.p2sh_p2wpkh || 0 },
      { label: 'P2TR', value: data.addresses.p2tr, type: 'p2tr', balance: data.balances?.p2tr || 0 },
    ];

    return (
      <>
        <TableHead>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold' }}>Currency</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Address</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Balance</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {addressTypes.map((address, index) => {
            const hasBalance = address.balance > 0;
            const isFirstRow = index === 0;
            
            return (
              <TableRow 
                key={address.type}
                sx={{ 
                  bgcolor: hasBalance ? 'rgba(76, 175, 80, 0.1)' : 'transparent',
                  '&:hover': { bgcolor: hasBalance ? 'rgba(76, 175, 80, 0.2)' : 'rgba(255,255,255,0.05)' }
                }}
              >
                {/* Currency column - only show for first address */}
                <TableCell sx={{ borderRight: isFirstRow ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
                  {isFirstRow && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontSize: '1.2rem' }}>
                        🟠
                      </Typography>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          Bitcoin
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          BTC
                        </Typography>
                        {data.totalBalance && data.totalBalance > 0 && (
                          <Chip 
                            label="💰 FUNDED" 
                            size="small" 
                            color="success"
                            sx={{ ml: 0.5, fontSize: '0.6rem', height: 16 }}
                          />
                        )}
                      </Box>
                    </Box>
                  )}
                </TableCell>
                
                {/* Address Type */}
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: hasBalance ? 'bold' : 'normal' }}>
                    {address.label}
                  </Typography>
                </TableCell>
                
                {/* Address */}
                <TableCell>
                  <Typography 
                    variant="body2" 
                    fontFamily="monospace" 
                    sx={{ 
                      fontSize: '0.75rem',
                      wordBreak: 'break-all',
                      maxWidth: '300px',
                      color: hasBalance ? 'success.main' : 'text.primary'
                    }}
                  >
                    {address.value}
                  </Typography>
                </TableCell>
                
                {/* Balance */}
                <TableCell>
                  {hasBalance ? (
                    <Chip 
                      label={`💰 ${address.balance.toFixed(8)} BTC`}
                      color="success"
                      size="small"
                      sx={{ fontFamily: 'monospace' }}
                    />
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                      0.00000000 BTC
                    </Typography>
                  )}
                </TableCell>
                
                {/* Actions */}
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Copy Address">
                      <IconButton 
                        size="small" 
                        onClick={() => handleCopyAddress(address.value)}
                        color={copiedAddress === address.value ? 'success' : 'default'}
                      >
                        <CopyIcon sx={{ fontSize: '1rem' }} />
                      </IconButton>
                    </Tooltip>
                    
                    <Tooltip title="View on Explorer">
                      <IconButton 
                        size="small"
                        component={Link}
                        href={BTC_EXPLORER_URL(address.value)}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ color: 'primary.main' }}
                      >
                        <ExternalLinkIcon sx={{ fontSize: '1rem' }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </>
    );
  };

  // Calculate stats for legacy data
  const totalAddresses = isLegacyData(keyData) ? 5 : 21;
  const totalFunded = isLegacyData(keyData) ? (keyData.totalBalance && keyData.totalBalance > 0 ? 1 : 0) : 0;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { 
          height: '90vh',
          bgcolor: 'background.paper'
        }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Box>
          <Typography variant="h6">
            🔑 Key {keyNumber} - {isLegacyData(keyData) ? 'Bitcoin' : 'All Cryptocurrency'} Addresses
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {totalAddresses} addresses {isLegacyData(keyData) ? 'for Bitcoin' : 'across 8 cryptocurrencies'}
            {totalFunded > 0 && (
              <Chip 
                label={`💰 ${totalFunded} funded currency${totalFunded > 1 ? 's' : ''}`} 
                size="small" 
                color="success" 
                sx={{ ml: 1 }}
              />
            )}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pt: 1 }}>
        {/* Private Key Section */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(255, 193, 7, 0.1)', borderRadius: 1, border: '1px solid rgba(255, 193, 7, 0.3)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <KeyIcon sx={{ color: '#FFD700' }} />
            <Typography variant="subtitle2">Private Key:</Typography>
            <Button
              size="small"
              startIcon={<CopyIcon />}
              onClick={handleCopyPrivateKey}
              variant="outlined"
              color="warning"
            >
              {copiedAddress === 'privateKey' ? 'Copied!' : 'Copy'}
            </Button>
          </Box>
          <Typography 
            variant="body2" 
            fontFamily="monospace" 
            sx={{ 
              wordBreak: 'break-all', 
              bgcolor: 'rgba(0,0,0,0.2)', 
              p: 1, 
              borderRadius: 1,
              fontSize: '0.8rem'
            }}
          >
            {keyData.privateKey}
          </Typography>
        </Box>

        {/* Address Table */}
        <TableContainer component={Paper} sx={{ bgcolor: 'background.default' }}>
          <Table size="small" stickyHeader>
            {isLegacyData(keyData) && renderLegacyBitcoinAddresses(keyData)}
          </Table>
        </TableContainer>

        {/* Summary Section */}
        <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 1 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Summary:</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 1 }}>
            <Typography variant="body2">
              🔑 Total Addresses: <strong>{totalAddresses}</strong>
            </Typography>
            <Typography variant="body2">
              💰 Funded Currencies: <strong>{totalFunded}</strong>
            </Typography>
            <Typography variant="body2">
              🌐 Supported Cryptos: <strong>{isLegacyData(keyData) ? '1 (Bitcoin)' : '8'}</strong>
            </Typography>
            <Typography variant="body2">
              🔍 Explorer Links: <strong>Available</strong>
            </Typography>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
});

AddressModal.displayName = 'AddressModal';

export default AddressModal; 