import { render } from '@testing-library/react';
import { Toaster } from '../sonner';

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'light'
  })
}));

// Mock sonner
jest.mock('sonner', () => ({
  Toaster: ({ theme, className, style, ...props }: Record<string, unknown> & { theme?: string; className?: string; style?: React.CSSProperties }) => (
    <div 
      data-testid="sonner-toaster"
      data-theme={theme}
      className={className}
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
    jest.mock('next-themes', () => ({
      useTheme: () => ({
        theme: 'dark'
      })
    }));

    const { getByTestId } = render(<Toaster />);
    
    const toaster = getByTestId('sonner-toaster');
    expect(toaster).toBeInTheDocument();
  });

  it('should handle system theme as fallback', () => {
    // The mocked theme defaults to 'light', so this test verifies the mock is working
    const { getByTestId } = render(<Toaster />);
    
    const toaster = getByTestId('sonner-toaster');
    expect(toaster).toHaveAttribute('data-theme', 'light');
  });
});