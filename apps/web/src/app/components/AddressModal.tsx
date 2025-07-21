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
import { 
  ContentCopy as ContentCopyIcon, 
  Close as CloseIcon,
  OpenInNew as OpenInNewIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  Key as KeyIcon
} from '@mui/icons-material';
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
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const { copy } = useCopyToClipboard();

  const handleCopy = async (text: string, label: string = 'text') => {
    console.log(`Attempting to copy ${label}:`, text.substring(0, 20) + '...');
    
    let success = false;
    let verified = false;
    
    try {
      // Method 1: Try navigator.clipboard with verification
      if (navigator.clipboard && window.isSecureContext) {
        try {
          await navigator.clipboard.writeText(text);
          console.log('Navigator clipboard write completed');
          
          // VERIFY by reading back
          try {
            const clipboardContent = await navigator.clipboard.readText();
            verified = clipboardContent === text;
            console.log('Clipboard verification:', verified ? 'SUCCESS' : 'FAILED');
            if (verified) {
              success = true;
            }
          } catch (readErr) {
            console.log('Cannot read clipboard to verify, will show fallback');
            verified = false;
          }
        } catch (err) {
          console.log('Navigator clipboard failed:', err);
        }
      }
      
      // Method 2: Use execCommand only if navigator failed
      if (!success) {
        try {
          // Force focus outside modal
          if (document.body) {
            document.body.focus();
            document.body.click();
          }
          
          await new Promise(resolve => setTimeout(resolve, 100));
          
          const textArea = document.createElement('textarea');
          textArea.value = text;
          textArea.style.position = 'absolute';
          textArea.style.left = '0';
          textArea.style.top = '0';
          textArea.style.width = '2em';
          textArea.style.height = '2em';
          textArea.style.padding = '0';
          textArea.style.border = 'none';
          textArea.style.outline = 'none';
          textArea.style.boxShadow = 'none';
          textArea.style.background = 'transparent';
          textArea.style.zIndex = '99999';
          
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          textArea.setSelectionRange(0, text.length);
          
          const result = document.execCommand('copy');
          console.log('ExecCommand result:', result);
          
          document.body.removeChild(textArea);
          
          // Even if execCommand says true, try to verify
          if (result && navigator.clipboard) {
            try {
              await new Promise(resolve => setTimeout(resolve, 50));
              const clipboardContent = await navigator.clipboard.readText();
              verified = clipboardContent === text;
              console.log('ExecCommand verification:', verified ? 'SUCCESS' : 'FAILED');
            } catch (readErr) {
              console.log('Cannot verify execCommand result');
              verified = false;
            }
          } else {
            // Can't verify, assume it might have failed
            verified = false;
          }
          
          success = result && verified;
        } catch (err) {
          console.log('ExecCommand method failed:', err);
        }
      }
      
      console.log('Final copy success:', success, 'Verified:', verified);
      
      // If we couldn't verify or it failed, ALWAYS show manual fallback
      if (!success || !verified) {
        console.log('Showing manual fallback because copy was not verified');
        
        // Simple prompt fallback - always works
        setTimeout(() => {
          const userChoice = confirm(`Clipboard is blocked. Click OK to show ${label} in a popup for easy copying, or Cancel to try the overlay.`);
          
          if (userChoice) {
            // Use prompt - user can easily select all and copy
            prompt(`Copy this ${label} (Ctrl+A then Ctrl+C):`, text);
            setNotification({
              message: `${label} shown in popup for copying`,
              type: 'success'
            });
          } else {
            // Show the overlay as backup
            showManualOverlay();
          }
        }, 100);
        
        const showManualOverlay = () => {
          // Create manual copy overlay with better event handling
          const overlay = document.createElement('div');
          overlay.style.position = 'fixed';
          overlay.style.top = '0';
          overlay.style.left = '0';
          overlay.style.width = '100%';
          overlay.style.height = '100%';
          overlay.style.backgroundColor = 'rgba(0,0,0,0.9)';
          overlay.style.zIndex = '999999';
          overlay.style.display = 'flex';
          overlay.style.justifyContent = 'center';
          overlay.style.alignItems = 'center';
          overlay.style.color = 'white';
          overlay.style.fontFamily = 'monospace';
          
          const content = document.createElement('div');
          content.style.backgroundColor = '#333';
          content.style.padding = '30px';
          content.style.borderRadius = '8px';
          content.style.maxWidth = '90%';
          content.style.textAlign = 'center';
          
          const title = document.createElement('h2');
          title.textContent = `Copy ${label}`;
          title.style.marginBottom = '20px';
          title.style.color = '#fff';
          
          const instruction = document.createElement('p');
          instruction.textContent = 'Manual copy needed. Use the buttons below:';
          instruction.style.margin = '20px 0';
          instruction.style.color = '#ccc';
          instruction.style.fontSize = '16px';
          
          // Simple prompt button - most reliable
          const promptBtn = document.createElement('button');
          promptBtn.textContent = '📋 Show in Popup (Recommended)';
          promptBtn.style.backgroundColor = '#28a745';
          promptBtn.style.color = 'white';
          promptBtn.style.border = 'none';
          promptBtn.style.padding = '12px 20px';
          promptBtn.style.borderRadius = '6px';
          promptBtn.style.cursor = 'pointer';
          promptBtn.style.fontSize = '16px';
          promptBtn.style.margin = '10px';
          promptBtn.style.display = 'block';
          promptBtn.style.width = '100%';
          
          promptBtn.onclick = () => {
            prompt(`Copy this ${label} (Ctrl+A then Ctrl+C):`, text);
            document.body.removeChild(overlay);
            setNotification({
              message: `${label} shown in popup`,
              type: 'success'
            });
          };
          
          // Alert button as alternative
          const alertBtn = document.createElement('button');
          alertBtn.textContent = '📄 Show in Alert';
          alertBtn.style.backgroundColor = '#17a2b8';
          alertBtn.style.color = 'white';
          alertBtn.style.border = 'none';
          alertBtn.style.padding = '12px 20px';
          alertBtn.style.borderRadius = '6px';
          alertBtn.style.cursor = 'pointer';
          alertBtn.style.fontSize = '16px';
          alertBtn.style.margin = '10px';
          alertBtn.style.display = 'block';
          alertBtn.style.width = '100%';
          
          alertBtn.onclick = () => {
            alert(`${label}:\n\n${text}\n\nManually select and copy from above.`);
            document.body.removeChild(overlay);
            setNotification({
              message: `${label} shown in alert`,
              type: 'success'
            });
          };
          
          const closeBtn = document.createElement('button');
          closeBtn.textContent = '❌ Close';
          closeBtn.style.backgroundColor = '#dc3545';
          closeBtn.style.color = 'white';
          closeBtn.style.border = 'none';
          closeBtn.style.padding = '12px 20px';
          closeBtn.style.borderRadius = '6px';
          closeBtn.style.cursor = 'pointer';
          closeBtn.style.fontSize = '16px';
          closeBtn.style.margin = '10px';
          closeBtn.style.display = 'block';
          closeBtn.style.width = '100%';
          
          closeBtn.onclick = () => {
            document.body.removeChild(overlay);
          };
          
          content.appendChild(title);
          content.appendChild(instruction);
          content.appendChild(promptBtn);
          content.appendChild(alertBtn);
          content.appendChild(closeBtn);
          overlay.appendChild(content);
          document.body.appendChild(overlay);
        };
        
        return; // Exit early for manual copy
      }
      
      // Success notification only if verified
      setNotification({
        message: `✅ ${label} copied successfully!`,
        type: 'success'
      });
      
    } catch (error) {
      console.error('Copy error:', error);
      setNotification({
        message: `❌ Copy error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'error'
      });
    }
  };

  const handleExplore = (address: string) => {
    const explorerUrl = `https://www.blockchain.com/explorer/addresses/btc/${address}`;
    window.open(explorerUrl, '_blank', 'noopener,noreferrer');
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
    <>
      <Dialog 
        open={open} 
        onClose={onClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">Key {keyNumber} - Wallet Addresses</Typography>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
              Private Key:
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2, bgcolor: 'action.hover', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
              <KeyIcon sx={{ fontSize: '1rem', color: '#FFD700' }} />
              <Typography variant="body2" fontFamily="monospace" sx={{ fontSize: '0.8rem', wordBreak: 'break-all', flex: 1, color: 'text.primary' }}>
                {keyData.privateKey}
              </Typography>
              <Tooltip title="Copy Private Key" arrow>
                <IconButton
                  size="small"
                  onClick={() => handleCopy(keyData.privateKey, 'Private Key')}
                  color="primary"
                >
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
            Bitcoin Addresses:
          </Typography>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Address Type</TableCell>
                  <TableCell>Address</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {addressTypes.map((address) => (
                  <TableRow key={address.type} hover>
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
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Tooltip title="Copy address" arrow>
                          <IconButton
                            size="small"
                            onClick={() => handleCopy(address.value, address.label)}
                            color="primary"
                          >
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Explore on blockchain.com" arrow>
                          <IconButton
                            size="small"
                            onClick={() => handleExplore(address.value)}
                            color="secondary"
                          >
                            <OpenInNewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        
        <DialogActions>
          <Button onClick={onClose} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification Snackbar */}
      <Snackbar
        open={!!notification}
        autoHideDuration={3000}
        onClose={() => setNotification(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          severity={notification?.type}
          onClose={() => setNotification(null)}
        >
          {notification?.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default AddressModal; 