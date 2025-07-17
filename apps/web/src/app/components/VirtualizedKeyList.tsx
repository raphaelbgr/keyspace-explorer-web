import React, { memo, useMemo } from 'react';
import { Box, Grid } from '@mui/material';
import KeyCard from './KeyCard';

interface VirtualizedKeyListProps {
  keys: any[];
  keysPerPage: number;
  currentKeysPage: number;
  expandedKeys: Set<number>;
  onToggleExpansion: (keyIndex: number) => void;
  displayMode: 'grid' | 'table';
}

const VirtualizedKeyList = memo<VirtualizedKeyListProps>(({
  keys,
  keysPerPage,
  currentKeysPage,
  expandedKeys,
  onToggleExpansion,
  displayMode
}) => {
  // Only render visible items (first 20 for performance)
  const visibleKeys = useMemo(() => {
    return keys.slice(0, 20);
  }, [keys]);

  if (displayMode === 'grid') {
    return (
      <Grid container spacing={2}>
        {visibleKeys.map((key, index) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
            <KeyCard
              keyData={key}
              index={index}
              isExpanded={expandedKeys.has((currentKeysPage - 1) * keysPerPage + index)}
              onToggleExpansion={() => onToggleExpansion((currentKeysPage - 1) * keysPerPage + index)}
              keysPerPage={keysPerPage}
              currentKeysPage={currentKeysPage}
            />
          </Grid>
        ))}
      </Grid>
    );
  }

  return null;
});

VirtualizedKeyList.displayName = 'VirtualizedKeyList';

export default VirtualizedKeyList; 