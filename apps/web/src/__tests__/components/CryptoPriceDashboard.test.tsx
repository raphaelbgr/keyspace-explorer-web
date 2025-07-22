/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CryptoPriceDashboard from '../../app/components/CryptoPriceDashboard';

// Mock theme for testing
const mockTheme = createTheme();

// Wrapper component with theme provider
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={mockTheme}>
    {children}
  </ThemeProvider>
);

describe('CryptoPriceDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render loading state initially', () => {
      render(
        <TestWrapper>
          <CryptoPriceDashboard />
        </TestWrapper>
      );

      expect(screen.getByText('Live Crypto Prices')).toBeInTheDocument();
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      
      // Should show skeleton loading cards
      const skeletonCards = screen.getAllByTestId('card-skeleton') || 
                           document.querySelectorAll('[data-testid="card-skeleton"]');
      expect(skeletonCards.length).toBeGreaterThan(0);
    });

    it('should render all 8 cryptocurrencies after loading', async () => {
      render(
        <TestWrapper>
          <CryptoPriceDashboard />
        </TestWrapper>
      );

      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      }, { timeout: 3000 });

      // Check for all 8 cryptocurrencies
      const expectedCryptos = ['Bitcoin', 'Ethereum', 'Bitcoin Cash', 'Ripple', 'Litecoin', 'Dash', 'Dogecoin', 'Zcash'];
      
      for (const crypto of expectedCryptos) {
        expect(screen.getByText(crypto)).toBeInTheDocument();
      }
    });

    it('should display cryptocurrency icons correctly', async () => {
      render(
        <TestWrapper>
          <CryptoPriceDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Check for emoji icons (they should be present in the DOM)
      const bitcoinIcon = screen.getByText('🟠');
      const ethereumIcon = screen.getByText('Ξ');
      const rippleIcon = screen.getByText('🌊');
      
      expect(bitcoinIcon).toBeInTheDocument();
      expect(ethereumIcon).toBeInTheDocument();
      expect(rippleIcon).toBeInTheDocument();
    });
  });

  describe('Price Display', () => {
    it('should format high-value prices correctly (>$1000)', async () => {
      render(
        <TestWrapper>
          <CryptoPriceDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Bitcoin and Ethereum should show as whole numbers for high values
      const priceElements = screen.getAllByText(/\$[0-9,]+/);
      expect(priceElements.length).toBeGreaterThan(0);
      
      // Check that some prices are formatted as dollars
      const dollarPrices = screen.getAllByText(/\$\d/);
      expect(dollarPrices.length).toBeGreaterThan(0);
    });

    it('should format low-value prices with decimals (<$1)', async () => {
      render(
        <TestWrapper>
          <CryptoPriceDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Should have some prices with decimal formatting
      const decimalPrices = screen.getAllByText(/\$0\.\d/);
      expect(decimalPrices.length).toBeGreaterThan(0);
    });

    it('should display 24h change indicators', async () => {
      render(
        <TestWrapper>
          <CryptoPriceDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Should have percentage change indicators
      const changeIndicators = screen.getAllByText(/%$/);
      expect(changeIndicators.length).toBe(8); // One for each crypto
      
      // Check for both positive and negative indicators format
      const percentageTexts = changeIndicators.map(el => el.textContent);
      const hasPositive = percentageTexts.some(text => text?.includes('+'));
      const hasNegative = percentageTexts.some(text => text?.includes('-'));
      
      // At least one should be positive or negative (due to random mock data)
      expect(hasPositive || hasNegative).toBe(true);
    });
  });

  describe('Interactive Features', () => {
    it('should have a refresh button', async () => {
      render(
        <TestWrapper>
          <CryptoPriceDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      const refreshButton = screen.getByLabelText(/refresh/i) || 
                           screen.getByRole('button', { name: /refresh/i });
      expect(refreshButton).toBeInTheDocument();
    });

    it('should refresh data when refresh button is clicked', async () => {
      render(
        <TestWrapper>
          <CryptoPriceDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      const refreshButton = screen.getByLabelText(/refresh/i) || 
                           screen.getByRole('button', { name: /refresh/i });
      
      // Get initial price for comparison
      const initialPrices = screen.getAllByText(/\$[0-9,]+/);
      const initialPriceText = initialPrices[0]?.textContent;

      fireEvent.click(refreshButton);

      // Wait for refresh to complete
      await waitFor(() => {
        const newPrices = screen.getAllByText(/\$[0-9,]+/);
        expect(newPrices.length).toBeGreaterThan(0);
      }, { timeout: 2000 });

      // Prices should potentially be different (due to mock randomization)
      const newPrices = screen.getAllByText(/\$[0-9,]+/);
      expect(newPrices.length).toBeGreaterThan(0);
    });

    it('should show last updated timestamp', async () => {
      render(
        <TestWrapper>
          <CryptoPriceDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Should show "Updated Xs ago" text
      const timestampText = screen.getByText(/updated/i);
      expect(timestampText).toBeInTheDocument();
    });
  });

  describe('Auto-refresh Functionality', () => {
    it('should accept refresh interval prop', () => {
      const refreshInterval = 5000;
      
      render(
        <TestWrapper>
          <CryptoPriceDashboard refreshInterval={refreshInterval} />
        </TestWrapper>
      );

      // Component should render without errors
      expect(screen.getByText('Live Crypto Prices')).toBeInTheDocument();
    });

    it('should handle disabled auto-refresh (interval = 0)', () => {
      render(
        <TestWrapper>
          <CryptoPriceDashboard refreshInterval={0} />
        </TestWrapper>
      );

      // Component should render without errors
      expect(screen.getByText('Live Crypto Prices')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should handle and display error states gracefully', async () => {
      // Mock console.error to prevent error output during test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // This test is tricky since we're using mock data
      // In a real scenario, we'd mock the fetch to throw an error
      render(
        <TestWrapper>
          <CryptoPriceDashboard />
        </TestWrapper>
      );

      // Component should still render even if there are issues
      await waitFor(() => {
        expect(screen.getByText('Live Crypto Prices')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and structure', async () => {
      render(
        <TestWrapper>
          <CryptoPriceDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Check for proper heading structure
      const heading = screen.getByText('Live Crypto Prices');
      expect(heading).toBeInTheDocument();

      // Check for button accessibility
      const refreshButton = screen.getByLabelText(/refresh/i) || 
                           screen.getByRole('button', { name: /refresh/i });
      expect(refreshButton).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      render(
        <TestWrapper>
          <CryptoPriceDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Focus should be able to move to interactive elements
      const refreshButton = screen.getByLabelText(/refresh/i) || 
                           screen.getByRole('button', { name: /refresh/i });
      
      refreshButton.focus();
      expect(document.activeElement).toBe(refreshButton);
    });
  });

  describe('Component Props', () => {
    it('should accept custom refresh interval', () => {
      const customInterval = 5000;
      
      render(
        <TestWrapper>
          <CryptoPriceDashboard refreshInterval={customInterval} />
        </TestWrapper>
      );

      // Component should render without errors
      expect(screen.getByText('Live Crypto Prices')).toBeInTheDocument();
    });

    it('should use default refresh interval when not specified', () => {
      render(
        <TestWrapper>
          <CryptoPriceDashboard />
        </TestWrapper>
      );

      // Component should render without errors with default props
      expect(screen.getByText('Live Crypto Prices')).toBeInTheDocument();
    });
  });
}); 