import { render } from '@testing-library/react';
import { useTheme } from 'next-themes';
import React from 'react';

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: jest.fn(() => ({
    theme: 'light'
  }))
}));

import { Toaster } from '../sonner';

const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;

// Mock sonner
jest.mock('sonner', () => ({
  Toaster: ({ theme, className, style, ...props }: Record<string, unknown> & { theme?: string; className?: string; style?: React.CSSProperties }) => (
    <div 
      className={className}
      data-testid="sonner-toaster"
      data-theme={theme}
      style={style}
      {...props}
    />
  ),
}));

describe('Toaster', () => {
  it('should render toaster with light theme', () => {
    const { getByTestId } = render(<Toaster />);
    
    const toaster = getByTestId('sonner-toaster');
    expect(toaster).toBeInTheDocument();
    expect(toaster).toHaveAttribute('data-theme', 'light');
    expect(toaster).toHaveClass('toaster group');
  });

  it('should apply custom CSS variables', () => {
    const { getByTestId } = render(<Toaster />);
    
    const toaster = getByTestId('sonner-toaster');
    const styles = toaster.style;
    
    expect(styles.getPropertyValue('--normal-bg')).toBe('var(--popover)');
    expect(styles.getPropertyValue('--normal-text')).toBe('var(--popover-foreground)');
    expect(styles.getPropertyValue('--normal-border')).toBe('var(--border)');
  });

  it('should pass through additional props', () => {
    const { getByTestId } = render(
      <Toaster position="top-right" />
    );
    
    const toaster = getByTestId('sonner-toaster');
    expect(toaster).toHaveAttribute('position', 'top-right');
  });

  it('should handle dark theme', () => {
    // Mock useTheme to return dark theme
    mockUseTheme.mockReturnValueOnce({
      theme: 'dark'
    });

    const { getByTestId } = render(<Toaster />);
    
    const toaster = getByTestId('sonner-toaster');
    expect(toaster).toHaveAttribute('data-theme', 'dark');
  });

  it('should handle system theme as fallback', () => {
    // Mock useTheme to return undefined theme, which should fallback to 'system'
    mockUseTheme.mockReturnValueOnce({
      theme: undefined
    });

    const { getByTestId } = render(<Toaster />);
    
    const toaster = getByTestId('sonner-toaster');
    expect(toaster).toHaveAttribute('data-theme', 'system');
  });
});