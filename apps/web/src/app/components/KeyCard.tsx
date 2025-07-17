import React, { memo } from 'react';
import { 
  Card, 
  Typography, 
  IconButton, 
  Chip, 
  Collapse, 
  Box 
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';

interface KeyCardProps {
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

const KeyCard = memo<KeyCardProps>(({ 
  keyData, 
  index, 
  isExpanded, 
  onToggleExpansion, 
  keysPerPage, 
  currentKeysPage 
}) => {
  const keyNumber = index + 1 + (currentKeysPage - 1) * keysPerPage;
  
  return (
    <Card 
      variant="outlined" 
      sx={{ 
        p: 2, 
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: 2 }
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
      
      <Typography variant="body2" fontFamily="monospace" sx={{ wordBreak: 'break-all', mb: 1, fontSize: '0.75rem' }}>
        {keyData.privateKey.substring(0, 12)}...
      </Typography>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          {keyData.totalBalance.toFixed(8)} BTC
        </Typography>
        {keyData.totalBalance > 0 && (
          <Chip 
            label="FUNDS!" 
            color="success" 
            size="small"
            sx={{ animation: 'pulse 2s infinite' }}
          />
        )}
      </Box>

      <Collapse in={isExpanded}>
        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
            Addresses:
          </Typography>
          {Object.entries(keyData.addresses).map(([type, address]) => (
            <Typography key={type} variant="caption" fontFamily="monospace" display="block" sx={{ fontSize: '0.7rem', wordBreak: 'break-all' }}>
              {type}: {(address as string).substring(0, 16)}...
            </Typography>
          ))}
        </Box>
      </Collapse>
    </Card>
  );
});

KeyCard.displayName = 'KeyCard';

export default KeyCard; 