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
import { CryptoCurrency } from '../../lib/types/multi-currency';
import { USDCalculationService } from '../../lib/services/USDCalculationService';

// Currency configuration with blockchain explorer URLs
const CURRENCY_CONFIG = {
  BTC: { 
    name: 'Bitcoin', 
    icon: '🟠', 
    color: '#f7931a', 
    shortName: 'BTC',
    explorerUrl: (address: string) => `https://blockchain.com/btc/address/${address}`
  },
  BCH: { 
    name: 'Bitcoin Cash', 
    icon: '🍊', 
    color: '#00d4aa', 
    shortName: 'BCH',
    explorerUrl: (address: string) => `https://blockchain.com/bch/address/${address}`
  },
  DASH: { 
    name: 'Dash', 
    icon: '🔵', 
    color: '#1c75bc', 
    shortName: 'DASH',
    explorerUrl: (address: string) => `https://explorer.dash.org/insight/address/${address}`
  },
  DOGE: { 
    name: 'Dogecoin', 
    icon: '🐕', 
    color: '#c2a633', 
    shortName: 'DOGE',
    explorerUrl: (address: string) => `https://dogechain.info/address/${address}`
  },
  ETH: { 
    name: 'Ethereum', 
    icon: '⚪', 
    color: '#627eea', 
    shortName: 'ETH',
    explorerUrl: (address: string) => `https://etherscan.io/address/${address}`
  },
  LTC: { 
    name: 'Litecoin', 
    icon: '🥈', 
    color: '#bfbbbb', 
    shortName: 'LTC',
    explorerUrl: (address: string) => `https://litecoinblockexplorer.net/address/${address}`
  },
  XRP: { 
    name: 'Ripple', 
    icon: '🌊', 
    color: '#23292f', 
    shortName: 'XRP',
    explorerUrl: (address: string) => `https://livenet.xrpl.org/accounts/${address}`
  },
  ZEC: { 
    name: 'Zcash', 
    icon: '🛡️', 
    color: '#f4b728', 
    shortName: 'ZEC',
    explorerUrl: (address: string) => `https://mainnet.zcashexplorer.app/address/${address}`
  }
};

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

// Multi-currency structure
interface MultiCurrencyKeyData {
  privateKey: string;
  addresses: any; // CurrencyAddressMap when available
  balances: any;
  totalBalance: any;
  hasAnyFunds?: boolean;
  fundedCurrencies?: CryptoCurrency[];
}

interface AddressModalProps {
  open: boolean;
  onClose: () => void;
  keyNumber: number;
  keyData: LegacyKeyData | MultiCurrencyKeyData;
}

const AddressModal = memo<AddressModalProps>(({ open, onClose, keyNumber, keyData }) => {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  
  // Get USD calculation service
  const usdService = USDCalculationService.getInstance();

  const handleCopyAddress = async (address: string) => {
    try {
      // Check if clipboard API is available
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(address);
        setCopiedAddress(address);
        setTimeout(() => setCopiedAddress(null), 2000);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = address;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
          setCopiedAddress(address);
          setTimeout(() => setCopiedAddress(null), 2000);
        } catch (fallbackError) {
          console.error('Fallback copy failed:', fallbackError);
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (error) {
      console.error('Failed to copy address:', error);
    }
  };

  const handleCopyPrivateKey = async () => {
    try {
      // Check if clipboard API is available
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(keyData.privateKey);
        setCopiedAddress('privateKey');
        setTimeout(() => setCopiedAddress(null), 2000);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = keyData.privateKey;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
          document.execCommand('copy');
          setCopiedAddress('privateKey');
          setTimeout(() => setCopiedAddress(null), 2000);
        } catch (fallbackError) {
          console.error('Fallback copy failed:', fallbackError);
        } finally {
          document.body.removeChild(textArea);
        }
      }
    } catch (error) {
      console.error('Failed to copy private key:', error);
    }
  };

  // Check if this is legacy Bitcoin-only data structure
  const isLegacyData = (data: any): data is LegacyKeyData => {
    return data.addresses && typeof data.addresses.p2pkh_compressed === 'string';
  };

  // Check if this is multi-currency data
  const isMultiCurrencyData = (data: any): boolean => {
    if (!data.addresses || typeof data.addresses !== 'object') return false;
    
    // Check if any top-level key is a known currency symbol with nested addresses
    const currencyKeys = Object.keys(data.addresses);
    const hasCurrencySymbols = currencyKeys.some(key => Object.keys(CURRENCY_CONFIG).includes(key));
    
    // Legacy format has direct address fields like p2pkh_compressed at top level
    const hasLegacyFormat = data.addresses.p2pkh_compressed !== undefined;
    
    return hasCurrencySymbols && !hasLegacyFormat;
  };

  // Helper function to get balance for currency/address type
  const getBalance = (currency: CryptoCurrency, addressType: string): number => {
    if (isLegacyData(keyData)) {
      return currency === 'BTC' ? (keyData.balances?.[addressType as keyof typeof keyData.balances] || 0) : 0;
    }
    
    const currencyBalances = (keyData as MultiCurrencyKeyData).balances?.[currency];
    if (!currencyBalances) return 0;
    
    if (typeof currencyBalances[addressType] === 'number') {
      return currencyBalances[addressType];
    }
    
    if (typeof currencyBalances[addressType] === 'object' && currencyBalances[addressType]?.balance !== undefined) {
      return parseFloat(currencyBalances[addressType].balance) || 0;
    }
    
    return 0;
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
                        {CURRENCY_CONFIG.BTC.icon}
                      </Typography>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {CURRENCY_CONFIG.BTC.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {CURRENCY_CONFIG.BTC.shortName}
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
                        href={CURRENCY_CONFIG.BTC.explorerUrl(address.value)}
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

  const renderMultiCurrencyAddresses = (data: MultiCurrencyKeyData) => {
    const currencies = Object.keys(data.addresses).filter(key => 
      typeof data.addresses[key] === 'object' && 
      Object.keys(CURRENCY_CONFIG).includes(key)
    ) as CryptoCurrency[];

    let rowIndex = 0;

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
          {currencies.map((currency) => {
            const config = CURRENCY_CONFIG[currency];
            const currencyAddresses = data.addresses[currency];
            const isFunded = data.fundedCurrencies?.includes(currency) || false;
            
            if (!currencyAddresses) return null;
            
            const addressEntries = Object.entries(currencyAddresses);
            
                         return addressEntries.map(([addressType, address], index) => {
               const isFirstRowForCurrency = index === 0;
               const balance = getBalance(currency, addressType);
               const hasBalance = balance > 0;
               const addressStr = typeof address === 'string' ? address : String(address);
               rowIndex++;
               
               return (
                 <TableRow 
                   key={`${currency}-${addressType}`}
                   sx={{ 
                     bgcolor: hasBalance ? `${config.color}20` : 'transparent',
                     '&:hover': { bgcolor: hasBalance ? `${config.color}30` : 'rgba(255,255,255,0.05)' }
                   }}
                 >
                   {/* Currency column - only show for first address of currency */}
                   <TableCell sx={{ borderRight: isFirstRowForCurrency ? '1px solid rgba(255,255,255,0.1)' : 'none' }}>
                     {isFirstRowForCurrency && (
                       <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                         <Typography variant="body2" sx={{ fontSize: '1.2rem' }}>
                           {config.icon}
                         </Typography>
                         <Box>
                           <Typography variant="body2" fontWeight="bold">
                             {config.name}
                           </Typography>
                           <Typography variant="caption" color="text.secondary">
                             {config.shortName}
                           </Typography>
                           {isFunded && (
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
                       {addressType.replace(/_/g, ' ').toUpperCase()}
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
                       {addressStr}
                     </Typography>
                   </TableCell>
                   
                   {/* Balance */}
                   <TableCell>
                     {hasBalance ? (
                       <Chip 
                         label={`💰 ${balance.toFixed(8)} ${config.shortName}`}
                         color="success"
                         size="small"
                         sx={{ fontFamily: 'monospace' }}
                       />
                     ) : (
                       <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                         0.00000000 {config.shortName}
                       </Typography>
                     )}
                   </TableCell>
                   
                   {/* Actions */}
                   <TableCell>
                     <Box sx={{ display: 'flex', gap: 0.5 }}>
                       <Tooltip title="Copy Address">
                         <IconButton 
                           size="small" 
                           onClick={() => handleCopyAddress(addressStr)}
                           color={copiedAddress === addressStr ? 'success' : 'default'}
                         >
                           <CopyIcon sx={{ fontSize: '1rem' }} />
                         </IconButton>
                       </Tooltip>
                       
                       <Tooltip title="View on Explorer">
                         <IconButton 
                           size="small"
                           component={Link}
                           href={config.explorerUrl(addressStr)}
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
             });
          })}
        </TableBody>
      </>
    );
  };

  // Calculate stats
  const isMultiCurrency = isMultiCurrencyData(keyData);
  const isLegacy = isLegacyData(keyData);
  
  let totalAddresses = 0;
  let totalFunded = 0;
  let supportedCurrencies = 0;

  if (isLegacy) {
    totalAddresses = 5;
    supportedCurrencies = 1;
    totalFunded = (keyData.totalBalance && keyData.totalBalance > 0) ? 1 : 0;
  } else if (isMultiCurrency) {
    const currencies = Object.keys(keyData.addresses).filter(key => 
      typeof keyData.addresses[key] === 'object' && 
      Object.keys(CURRENCY_CONFIG).includes(key)
    );
    supportedCurrencies = currencies.length;
    totalAddresses = currencies.reduce((total, currency) => {
      return total + Object.keys(keyData.addresses[currency]).length;
    }, 0);
    totalFunded = (keyData as MultiCurrencyKeyData).fundedCurrencies?.length || 0;
  }

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
            🔑 Key {keyNumber} - {isMultiCurrency ? 'Multi-Currency' : 'Bitcoin'} Addresses
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {totalAddresses} addresses across {supportedCurrencies} cryptocurrenc{supportedCurrencies === 1 ? 'y' : 'ies'}
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
            {isLegacy && renderLegacyBitcoinAddresses(keyData)}
            {isMultiCurrency && renderMultiCurrencyAddresses(keyData as MultiCurrencyKeyData)}
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
              🌐 Supported Cryptos: <strong>{supportedCurrencies}</strong>
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