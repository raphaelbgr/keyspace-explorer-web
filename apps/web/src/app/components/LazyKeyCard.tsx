import React, { memo, useState, useEffect } from 'react';
import { Card, Typography, IconButton, Chip, Box, Button, Collapse, CircularProgress } from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Visibility as VisibilityIcon,
  AccountBalance as BalanceIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
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
    }, 50); // Small delay to prevent blocking

    return () => clearTimeout(timer);
  }, [isVisible]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  if (!isVisible) {
    return (
      <Card 
        ref={cardRef}
        variant="outlined" 
        sx={{ 
          p: 2, 
          height: 120,
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
        sx={{ 
          p: 2, 
          height: 120,
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

  // Calculate the absolute keyspace index (1-based)
  const keyNumber = (currentKeysPage - 1) * keysPerPage + keyData.index + 1;
  
  return (
    <>
      <Card 
        ref={cardRef}
        variant="outlined" 
        sx={{ 
          p: 2, 
          cursor: 'pointer',
          transition: 'all 0.1s',
          '&:hover': { transform: 'translateY(-1px)', boxShadow: 1 }
        }}
        onClick={onToggleExpansion}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Key {keyNumber}
          </Typography>
          <IconButton size="small">
            {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <KeyIcon sx={{ fontSize: '1rem', color: '#FFD700' }} />
          <Typography variant="body2" fontFamily="monospace" sx={{ wordBreak: 'break-all', fontSize: '0.75rem' }}>
            {keyData.privateKey}
          </Typography>
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <BalanceIcon sx={{ fontSize: '0.8rem', color: 'text.secondary' }} />
            <Typography variant="caption" color="text.secondary">
              {keyData.totalBalance.toFixed(8)} BTC
            </Typography>
          </Box>
          {keyData.totalBalance > 0 && (
            <Chip 
              label="FUNDS!" 
              color="success" 
              size="small"
              sx={{ animation: 'pulse 2s infinite' }}
            />
          )}
        </Box>

        {/* Balance Breakdown */}
        <Box sx={{ mb: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            Balance Breakdown:
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">P2PKH:</Typography>
              <Typography variant="caption" fontFamily="monospace">
                {(keyData.balances.p2pkh_compressed + keyData.balances.p2pkh_uncompressed).toFixed(8)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">P2WPKH:</Typography>
              <Typography variant="caption" fontFamily="monospace">
                {keyData.balances.p2wpkh.toFixed(8)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">P2SH:</Typography>
              <Typography variant="caption" fontFamily="monospace">
                {keyData.balances.p2sh_p2wpkh.toFixed(8)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="caption" color="text.secondary">P2TR:</Typography>
              <Typography variant="caption" fontFamily="monospace">
                {keyData.balances.p2tr.toFixed(8)}
              </Typography>
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
        >
          View Addresses
        </Button>

        {/* Expanded Content */}
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
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Addresses:</Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">P2PKH (Compressed):</Typography>
                    <Typography variant="body2" fontFamily="monospace" sx={{ fontSize: '0.7rem', wordBreak: 'break-all' }}>
                      {keyData.addresses.p2pkh_compressed}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="caption" color="text.secondary">P2PKH (Uncompressed):</Typography>
                    <Typography variant="body2" fontFamily="monospace" sx={{ fontSize: '0.7rem', wordBreak: 'break-all' }}>
                      {keyData.addresses.p2pkh_uncompressed}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="caption" color="text.secondary">P2WPKH:</Typography>
                    <Typography variant="body2" fontFamily="monospace" sx={{ fontSize: '0.7rem', wordBreak: 'break-all' }}>
                      {keyData.addresses.p2wpkh}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="caption" color="text.secondary">P2SH-P2WPKH:</Typography>
                    <Typography variant="body2" fontFamily="monospace" sx={{ fontSize: '0.7rem', wordBreak: 'break-all' }}>
                      {keyData.addresses.p2sh_p2wpkh}
                    </Typography>
                  </Box>
                  
                  <Box>
                    <Typography variant="caption" color="text.secondary">P2TR:</Typography>
                    <Typography variant="body2" fontFamily="monospace" sx={{ fontSize: '0.7rem', wordBreak: 'break-all' }}>
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
          totalBalance: keyData.totalBalance
        }}
      />
    </>
  );
});

LazyKeyCard.displayName = 'LazyKeyCard';

export default LazyKeyCard; 