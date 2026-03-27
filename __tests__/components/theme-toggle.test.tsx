import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from '@/components/theme-toggle';
import { useTheme } from 'next-themes';

jest.mock('next-themes', () => ({
  useTheme: jest.fn(() => ({ setTheme: jest.fn(), resolvedTheme: 'light' })),
}));

jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

jest.mock('lucide-react', () => ({
  Moon: () => <span data-testid="moon-icon" />,
  Sun: () => <span data-testid="sun-icon" />,
}));

const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;

describe('ThemeToggle', () => {
  it('renders toggle button with aria-label', () => {
    render(<ThemeToggle />);
    expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument();
  });

  it('calls setTheme("dark") when current theme is light', () => {
    const mockSetTheme = jest.fn();
    mockUseTheme.mockReturnValue({
      setTheme: mockSetTheme,
      resolvedTheme: 'light',
      theme: 'light',
      themes: ['light', 'dark'],
      systemTheme: 'light',
      forcedTheme: undefined,
    });

    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole('button', { name: /toggle theme/i }));
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('calls setTheme("light") when current theme is dark', () => {
    const mockSetTheme = jest.fn();
    mockUseTheme.mockReturnValue({
      setTheme: mockSetTheme,
      resolvedTheme: 'dark',
      theme: 'dark',
      themes: ['light', 'dark'],
      systemTheme: 'dark',
      forcedTheme: undefined,
    });

    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole('button', { name: /toggle theme/i }));
    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });
});
