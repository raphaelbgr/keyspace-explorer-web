import React, { memo, useState, useEffect } from 'react';
import { Card, Typography, IconButton, Chip, Box, Button, Collapse, CircularProgress, Divider } from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Visibility as VisibilityIcon,
  AccountBalance as BalanceIcon,
  Key as KeyIcon
} from '@mui/icons-material';
import AddressModal from './AddressModal';

interface LazyKeyCardProps {
  keyData: {
    privateKey: string;
    index: number;
    totalBalance: number;
    balances: {
      p2pkh_compressed: number;
      p2pkh_uncompressed: number;
      p2wpkh: number;
      p2sh_p2wpkh: number;
      p2tr: number;
    };
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
  isLoadingAddresses?: boolean;
  areAddressesLoaded?: boolean;
}

const LazyKeyCard = memo<LazyKeyCardProps>(({ 
  keyData, 
  index, 
  isExpanded, 
  onToggleExpansion, 
  keysPerPage, 
  currentKeysPage,
  isLoadingAddresses = false,
  areAddressesLoaded = true
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isVisible) return;
    
    const timer = setTimeout(() => {
      setIsLoaded(true);
      console.log(`🔄 LazyKeyCard ${index} finished loading`);
    }, 50);

    return () => clearTimeout(timer);
  }, [isVisible, index]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
        if (entry.isIntersecting) {
          console.log(`👀 LazyKeyCard ${index} became visible`);
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [index]);

  if (!isVisible) {
    return (
      <Card 
        ref={cardRef}
        variant="outlined" 
        data-key-index={index}
        sx={{ 
          p: 2, 
          height: 180,
          background: 'rgba(255,255,255,0.02)',
          border: '1px dashed rgba(255,255,255,0.1)'
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Loading...
          </Typography>
        </Box>
      </Card>
    );
  }

  if (!isLoaded) {
    return (
      <Card 
        ref={cardRef}
        variant="outlined" 
        data-key-index={index}
        sx={{ 
          p: 2, 
          height: 180,
          background: 'rgba(255,255,255,0.02)',
          border: '1px dashed rgba(255,255,255,0.1)'
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Loading...
          </Typography>
        </Box>
      </Card>
    );
  }

  const keyNumber = (currentKeysPage - 1) * keysPerPage + keyData.index + 1;
  const hasFunds = keyData.totalBalance > 0;
  
  return (
    <>
      <Card 
        ref={cardRef}
        variant="outlined" 
        data-key-index={index}
        sx={{ 
          p: 2, 
          cursor: 'pointer',
          transition: 'all 0.1s',
          border: hasFunds ? '2px solid' : '1px solid',
          borderColor: hasFunds ? 'success.main' : 'divider',
          background: hasFunds ? 'rgba(76, 175, 80, 0.05)' : 'transparent',
          '&:hover': { transform: 'translateY(-1px)', boxShadow: 1 }
        }}
        onClick={onToggleExpansion}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Key {keyNumber}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {hasFunds && (
              <Chip 
                label="💰 BITCOIN FUNDED!" 
                color="success" 
                size="small"
                sx={{ animation: 'pulse 2s infinite' }}
              />
            )}
            <IconButton size="small">
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <KeyIcon sx={{ fontSize: '1rem', color: '#FFD700' }} />
          <Typography variant="body2" fontFamily="monospace" sx={{ wordBreak: 'break-all', fontSize: '0.75rem' }}>
            {keyData.privateKey}
          </Typography>
        </Box>
        
        {/* Bitcoin Balance Summary */}
        <Box sx={{ mb: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            🟠 Bitcoin Balance Breakdown (5 address types):
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <BalanceIcon sx={{ fontSize: '0.8rem', color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              Total: {keyData.totalBalance.toFixed(8)} BTC
            </Typography>
            {hasFunds && (
              <Chip 
                label="💰 FUNDED!" 
                color="success" 
                size="small"
                sx={{ fontSize: '0.6rem', height: 16 }}
              />
            )}
          </Box>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 0.25 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>P2PKH (Compressed):</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption" fontFamily="monospace" sx={{ fontSize: '0.65rem' }}>
                  {keyData.balances.p2pkh_compressed.toFixed(8)}
                </Typography>
                {keyData.balances.p2pkh_compressed > 0 && (
                  <Chip label="💰" size="small" color="success" sx={{ minWidth: 20, height: 14, fontSize: '0.5rem' }} />
                )}
              </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>P2PKH (Uncompressed):</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption" fontFamily="monospace" sx={{ fontSize: '0.65rem' }}>
                  {keyData.balances.p2pkh_uncompressed.toFixed(8)}
                </Typography>
                {keyData.balances.p2pkh_uncompressed > 0 && (
                  <Chip label="💰" size="small" color="success" sx={{ minWidth: 20, height: 14, fontSize: '0.5rem' }} />
                )}
              </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>P2WPKH:</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption" fontFamily="monospace" sx={{ fontSize: '0.65rem' }}>
                  {keyData.balances.p2wpkh.toFixed(8)}
                </Typography>
                {keyData.balances.p2wpkh > 0 && (
                  <Chip label="💰" size="small" color="success" sx={{ minWidth: 20, height: 14, fontSize: '0.5rem' }} />
                )}
              </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>P2SH-P2WPKH:</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption" fontFamily="monospace" sx={{ fontSize: '0.65rem' }}>
                  {keyData.balances.p2sh_p2wpkh.toFixed(8)}
                </Typography>
                {keyData.balances.p2sh_p2wpkh > 0 && (
                  <Chip label="💰" size="small" color="success" sx={{ minWidth: 20, height: 14, fontSize: '0.5rem' }} />
                )}
              </Box>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>P2TR:</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography variant="caption" fontFamily="monospace" sx={{ fontSize: '0.65rem' }}>
                  {keyData.balances.p2tr.toFixed(8)}
                </Typography>
                {keyData.balances.p2tr > 0 && (
                  <Chip label="💰" size="small" color="success" sx={{ minWidth: 20, height: 14, fontSize: '0.5rem' }} />
                )}
              </Box>
            </Box>
          </Box>
        </Box>

        <Button
          variant="outlined"
          size="small"
          startIcon={<VisibilityIcon />}
          onClick={(e) => {
            e.stopPropagation();
            setModalOpen(true);
          }}
          fullWidth
          sx={{ mb: 1 }}
        >
          View Bitcoin Addresses
        </Button>

        {/* Expanded Content - Bitcoin Addresses */}
        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            {isLoadingAddresses ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 2 }}>
                <CircularProgress size={20} />
                <Typography variant="body2" sx={{ ml: 1 }}>
                  Loading addresses...
                </Typography>
              </Box>
            ) : areAddressesLoaded ? (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="subtitle2">🟠 Bitcoin Addresses:</Typography>
                  {hasFunds && (
                    <Chip 
                      label="💰 FUNDED" 
                      size="small" 
                      color="success"
                      sx={{ fontSize: '0.6rem' }}
                    />
                  )}
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Box sx={{ 
                    p: 1, 
                    borderRadius: 1, 
                    bgcolor: keyData.balances.p2pkh_compressed > 0 ? 'success.main' : 'rgba(255,255,255,0.03)',
                    border: keyData.balances.p2pkh_compressed > 0 ? '1px solid' : '1px solid rgba(255,255,255,0.1)',
                    borderColor: keyData.balances.p2pkh_compressed > 0 ? 'success.main' : 'rgba(255,255,255,0.1)'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        P2PKH (Compressed):
                      </Typography>
                      {keyData.balances.p2pkh_compressed > 0 && (
                        <Chip 
                          label={`💰 ${keyData.balances.p2pkh_compressed.toFixed(8)} BTC`} 
                          size="small" 
                          color="success"
                          sx={{ fontSize: '0.5rem', height: 16 }}
                        />
                      )}
                    </Box>
                    <Typography 
                      variant="body2" 
                      fontFamily="monospace" 
                      sx={{ fontSize: '0.65rem', wordBreak: 'break-all', opacity: 0.8 }}
                    >
                      {keyData.addresses.p2pkh_compressed}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ 
                    p: 1, 
                    borderRadius: 1, 
                    bgcolor: keyData.balances.p2pkh_uncompressed > 0 ? 'success.main' : 'rgba(255,255,255,0.03)',
                    border: keyData.balances.p2pkh_uncompressed > 0 ? '1px solid' : '1px solid rgba(255,255,255,0.1)',
                    borderColor: keyData.balances.p2pkh_uncompressed > 0 ? 'success.main' : 'rgba(255,255,255,0.1)'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        P2PKH (Uncompressed):
                      </Typography>
                      {keyData.balances.p2pkh_uncompressed > 0 && (
                        <Chip 
                          label={`💰 ${keyData.balances.p2pkh_uncompressed.toFixed(8)} BTC`} 
                          size="small" 
                          color="success"
                          sx={{ fontSize: '0.5rem', height: 16 }}
                        />
                      )}
                    </Box>
                    <Typography 
                      variant="body2" 
                      fontFamily="monospace" 
                      sx={{ fontSize: '0.65rem', wordBreak: 'break-all', opacity: 0.8 }}
                    >
                      {keyData.addresses.p2pkh_uncompressed}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ 
                    p: 1, 
                    borderRadius: 1, 
                    bgcolor: keyData.balances.p2wpkh > 0 ? 'success.main' : 'rgba(255,255,255,0.03)',
                    border: keyData.balances.p2wpkh > 0 ? '1px solid' : '1px solid rgba(255,255,255,0.1)',
                    borderColor: keyData.balances.p2wpkh > 0 ? 'success.main' : 'rgba(255,255,255,0.1)'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        P2WPKH:
                      </Typography>
                      {keyData.balances.p2wpkh > 0 && (
                        <Chip 
                          label={`💰 ${keyData.balances.p2wpkh.toFixed(8)} BTC`} 
                          size="small" 
                          color="success"
                          sx={{ fontSize: '0.5rem', height: 16 }}
                        />
                      )}
                    </Box>
                    <Typography 
                      variant="body2" 
                      fontFamily="monospace" 
                      sx={{ fontSize: '0.65rem', wordBreak: 'break-all', opacity: 0.8 }}
                    >
                      {keyData.addresses.p2wpkh}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ 
                    p: 1, 
                    borderRadius: 1, 
                    bgcolor: keyData.balances.p2sh_p2wpkh > 0 ? 'success.main' : 'rgba(255,255,255,0.03)',
                    border: keyData.balances.p2sh_p2wpkh > 0 ? '1px solid' : '1px solid rgba(255,255,255,0.1)',
                    borderColor: keyData.balances.p2sh_p2wpkh > 0 ? 'success.main' : 'rgba(255,255,255,0.1)'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        P2SH-P2WPKH:
                      </Typography>
                      {keyData.balances.p2sh_p2wpkh > 0 && (
                        <Chip 
                          label={`💰 ${keyData.balances.p2sh_p2wpkh.toFixed(8)} BTC`} 
                          size="small" 
                          color="success"
                          sx={{ fontSize: '0.5rem', height: 16 }}
                        />
                      )}
                    </Box>
                    <Typography 
                      variant="body2" 
                      fontFamily="monospace" 
                      sx={{ fontSize: '0.65rem', wordBreak: 'break-all', opacity: 0.8 }}
                    >
                      {keyData.addresses.p2sh_p2wpkh}
                    </Typography>
                  </Box>
                  
                  <Box sx={{ 
                    p: 1, 
                    borderRadius: 1, 
                    bgcolor: keyData.balances.p2tr > 0 ? 'success.main' : 'rgba(255,255,255,0.03)',
                    border: keyData.balances.p2tr > 0 ? '1px solid' : '1px solid rgba(255,255,255,0.1)',
                    borderColor: keyData.balances.p2tr > 0 ? 'success.main' : 'rgba(255,255,255,0.1)'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        P2TR:
                      </Typography>
                      {keyData.balances.p2tr > 0 && (
                        <Chip 
                          label={`💰 ${keyData.balances.p2tr.toFixed(8)} BTC`} 
                          size="small" 
                          color="success"
                          sx={{ fontSize: '0.5rem', height: 16 }}
                        />
                      )}
                    </Box>
                    <Typography 
                      variant="body2" 
                      fontFamily="monospace" 
                      sx={{ fontSize: '0.65rem', wordBreak: 'break-all', opacity: 0.8 }}
                    >
                      {keyData.addresses.p2tr}
                    </Typography>
                  </Box>
                </Box>
              </>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Click to load addresses
                </Typography>
              </Box>
            )}
          </Box>
        </Collapse>
      </Card>

      <AddressModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        keyNumber={keyNumber}
        keyData={{
          privateKey: keyData.privateKey,
          addresses: keyData.addresses,
          balances: keyData.balances,
          totalBalance: keyData.totalBalance
        }}
      />
    </>
  );
});

LazyKeyCard.displayName = 'LazyKeyCard';

export default LazyKeyCard; 