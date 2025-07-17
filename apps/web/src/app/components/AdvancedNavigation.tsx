import React, { useState, useCallback } from 'react';
import {
  Box,
  Button,
  TextField,
  Tooltip,
  IconButton,
  Typography,
  Chip,
  Grid,
  Paper,
  Divider
} from '@mui/material';
import {
  FirstPage as FirstPageIcon,
  LastPage as LastPageIcon,
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
  Casino as RandomIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { useTranslation } from '../translations';

interface AdvancedNavigationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: string) => void;
  onRandomPage: () => void;
  keysPerPage: number;
  onKeysPerPageChange: (keysPerPage: number) => void;
}

const AdvancedNavigation = ({
  currentPage,
  totalPages,
  onPageChange,
  onRandomPage,
  keysPerPage,
  onKeysPerPageChange
}: AdvancedNavigationProps) => {
  const [customPage, setCustomPage] = useState('');
  const [customJump, setCustomJump] = useState('');
  const t = useTranslation();

  const quickJumpPages = [5, 10, 35, 50, 75, 100, 250, 500, 1000, 2500, 5000, 10000, 50000, 100000, 250000, 500000, 1000000];

  const handleCustomPageSubmit = useCallback(() => {
    const page = parseInt(customPage);
    if (page > 0 && page <= totalPages) {
      onPageChange(page.toString());
      setCustomPage('');
    }
  }, [customPage, totalPages, onPageChange]);

  const handleCustomJump = useCallback((direction: 'forward' | 'backward') => {
    const jump = parseInt(customJump);
    if (jump > 0) {
      const newPage = direction === 'forward' ? currentPage + jump : currentPage - jump;
      if (newPage > 0 && newPage <= totalPages) {
        onPageChange(newPage.toString());
      }
    }
    setCustomJump('');
  }, [customJump, currentPage, totalPages, onPageChange]);

  const handleQuickJump = useCallback((jump: number) => {
    const newPage = currentPage + jump;
    if (newPage > 0 && newPage <= totalPages) {
      onPageChange(newPage.toString());
    }
  }, [currentPage, totalPages, onPageChange]);

  const handleQuickJumpBack = useCallback((jump: number) => {
    const newPage = currentPage - jump;
    if (newPage > 0 && newPage <= totalPages) {
      onPageChange(newPage.toString());
    }
  }, [currentPage, totalPages, onPageChange]);

  return (
    <Paper sx={{ p: 2, mb: 2, background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
      <Typography variant="h6" gutterBottom>
        Advanced Navigation
      </Typography>
      
      {/* Basic Navigation */}
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 3, gap: 1 }}>
        <Tooltip title={t.firstPage} arrow>
          <IconButton
            onClick={() => onPageChange('1')}
            disabled={currentPage === 1}
            size="small"
          >
            <FirstPageIcon />
          </IconButton>
        </Tooltip>
        
        <Tooltip title={t.previousPage} arrow>
          <IconButton
            onClick={() => onPageChange((currentPage - 1).toString())}
            disabled={currentPage === 1}
            size="small"
          >
            <NavigateBeforeIcon />
          </IconButton>
        </Tooltip>
        
        <Chip 
          label={`Page ${currentPage} of ${totalPages}`} 
          color="primary" 
          variant="outlined"
        />
        
        <Tooltip title={t.nextPage} arrow>
          <IconButton
            onClick={() => onPageChange((currentPage + 1).toString())}
            disabled={currentPage === totalPages}
            size="small"
          >
            <NavigateNextIcon />
          </IconButton>
        </Tooltip>
        
        <Tooltip title={t.lastPage} arrow>
          <IconButton
            onClick={() => onPageChange(totalPages.toString())}
            disabled={currentPage === totalPages}
            size="small"
          >
            <LastPageIcon />
          </IconButton>
        </Tooltip>
        
        <Tooltip title="Go to Random Page" arrow>
          <IconButton
            onClick={onRandomPage}
            color="secondary"
            size="small"
          >
            <RandomIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {/* Custom Page Input */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              size="small"
              label="Go to Page"
              value={customPage}
              onChange={(e) => setCustomPage(e.target.value)}
              type="number"
              sx={{ flexGrow: 1 }}
            />
            <Button
              variant="contained"
              onClick={handleCustomPageSubmit}
              disabled={!customPage || parseInt(customPage) <= 0 || parseInt(customPage) > totalPages}
              size="small"
            >
              Go
            </Button>
          </Box>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <TextField
              size="small"
              label="Jump Pages"
              value={customJump}
              onChange={(e) => setCustomJump(e.target.value)}
              type="number"
              sx={{ flexGrow: 1 }}
            />
            <Tooltip title="Jump Backward" arrow>
              <IconButton
                onClick={() => handleCustomJump('backward')}
                disabled={!customJump || parseInt(customJump) <= 0}
                size="small"
              >
                <RemoveIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Jump Forward" arrow>
              <IconButton
                onClick={() => handleCustomJump('forward')}
                disabled={!customJump || parseInt(customJump) <= 0}
                size="small"
              >
                <AddIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Grid>
      </Grid>

      {/* Quick Jump Buttons */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Quick Jump Forward:
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {quickJumpPages.map((jump) => (
            <Tooltip key={jump} title={`Jump +${jump} pages`} arrow>
              <Button
                size="small"
                variant="outlined"
                onClick={() => handleQuickJump(jump)}
                disabled={currentPage + jump > totalPages}
                sx={{ minWidth: 'auto', px: 1 }}
              >
                +{jump}
              </Button>
            </Tooltip>
          ))}
        </Box>
      </Box>

      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Quick Jump Backward:
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {quickJumpPages.map((jump) => (
            <Tooltip key={jump} title={`Jump -${jump} pages`} arrow>
              <Button
                size="small"
                variant="outlined"
                onClick={() => handleQuickJumpBack(jump)}
                disabled={currentPage - jump < 1}
                sx={{ minWidth: 'auto', px: 1 }}
              >
                -{jump}
              </Button>
            </Tooltip>
          ))}
        </Box>
      </Box>

      {/* Keys Per Page Control */}
      <Box>
        <Typography variant="subtitle2" gutterBottom>
          Keys per Page:
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
          {[10, 25, 45, 50, 100, 250, 500].map((count) => (
            <Tooltip key={count} title={`Show ${count} keys per page`} arrow>
              <Button
                size="small"
                variant={keysPerPage === count ? "contained" : "outlined"}
                onClick={() => onKeysPerPageChange(count)}
                sx={{ minWidth: 'auto', px: 1 }}
              >
                {count}
              </Button>
            </Tooltip>
          ))}
        </Box>
      </Box>
    </Paper>
  );
};

export default AdvancedNavigation; 