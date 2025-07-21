import React, { memo, useMemo } from 'react';
import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import KeyTableRow from './KeyTableRow';

interface VirtualizedKeyTableProps {
  visibleKeys: any[];
  expandedKeys: Set<number>;
  onToggleExpansion: (keyIndex: number) => void;
  keysPerPage: number;
  currentKeysPage: number;
  pageData?: any; // Add pageData for absolute key number calculation
}

const VirtualizedKeyTable = memo<VirtualizedKeyTableProps>(({
  visibleKeys,
  expandedKeys,
  onToggleExpansion,
  keysPerPage,
  currentKeysPage,
  pageData
}) => {
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
                key={index}
                keyData={key}
                index={index}
                isExpanded={expandedKeys.has((currentKeysPage - 1) * keysPerPage + index)}
                onToggleExpansion={() => onToggleExpansion((currentKeysPage - 1) * keysPerPage + index)}
                keysPerPage={keysPerPage}
                currentKeysPage={currentKeysPage}
                pageData={pageData}
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