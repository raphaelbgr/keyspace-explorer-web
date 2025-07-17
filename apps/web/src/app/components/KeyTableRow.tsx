import React, { memo } from 'react';
import { 
  TableRow, 
  TableCell, 
  Typography, 
  IconButton, 
  Chip 
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';

interface KeyTableRowProps {
  keyData: {
    privateKey: string;
    totalBalance: number;
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
  
  return (
    <TableRow>
      <TableCell>{keyNumber}</TableCell>
      <TableCell>
        <Typography variant="body2" fontFamily="monospace" sx={{ fontSize: '0.75rem' }}>
          {keyData.privateKey.substring(0, 16)}...
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
        <IconButton 
          size="small" 
          onClick={onToggleExpansion}
        >
          {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </TableCell>
    </TableRow>
  );
});

KeyTableRow.displayName = 'KeyTableRow';

export default KeyTableRow; 