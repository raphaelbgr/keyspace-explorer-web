import React, { memo, useMemo } from 'react';
import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import KeyTableRow from './KeyTableRow';

interface VirtualizedKeyTableProps {
  keys: any[];
  keysPerPage: number;
  currentKeysPage: number;
  expandedKeys: Set<number>;
  onToggleExpansion: (keyIndex: number) => void;
}

const VirtualizedKeyTable = memo<VirtualizedKeyTableProps>(({
  keys,
  keysPerPage,
  currentKeysPage,
  expandedKeys,
  onToggleExpansion
}) => {
  // Only render visible items (first 15 for performance)
  const visibleKeys = useMemo(() => {
    return keys.slice(0, 15);
  }, [keys]);

  return (
    <Box sx={{ overflow: 'auto' }}>
      <TableContainer component={Paper} sx={{ background: 'transparent' }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Key #</TableCell>
              <TableCell>Private Key</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>Balance</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleKeys.map((key, index) => (
              <KeyTableRow
                keyData={key}
                index={index}
                isExpanded={expandedKeys.has((currentKeysPage - 1) * keysPerPage + index)}
                onToggleExpansion={() => onToggleExpansion((currentKeysPage - 1) * keysPerPage + index)}
                keysPerPage={keysPerPage}
                currentKeysPage={currentKeysPage}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
});

VirtualizedKeyTable.displayName = 'VirtualizedKeyTable';

export default VirtualizedKeyTable; 