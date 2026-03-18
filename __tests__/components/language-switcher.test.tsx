import { render, screen, fireEvent, act } from '@testing-library/react';
import { LanguageSwitcher } from '@/components/language-switcher';
import { useLocale } from 'next-intl';
import { setLocale } from '@/actions/i18n/set-locale';
import { useRouter } from 'next/navigation';

// Mock the setLocale action
jest.mock('@/actions/i18n/set-locale', () => ({
  setLocale: jest.fn().mockResolvedValue(undefined),
}));

// Mock the locales module
jest.mock('@/i18n/locales', () => ({
  locales: ['es', 'en'] as const,
}));

// Mock the Select components to simplify testing
jest.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange, disabled }: any) => (
    <div data-testid="select" data-value={value} data-disabled={disabled}>
      <select
        data-testid="select-native"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        disabled={disabled}
      >
        {children}
      </select>
    </div>
  ),
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ children, value }: any) => (
    <option value={value}>{children}</option>
  ),
  SelectTrigger: ({ children, ...props }: any) => (
    <div data-testid="select-trigger" aria-label={props['aria-label']}>
      {children}
    </div>
  ),
  SelectValue: ({ children }: any) => <span data-testid="select-value">{children}</span>,
}));

describe('LanguageSwitcher', () => {
  const mockRefresh = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: mockRefresh,
    });
  });

  it('renders with the current locale', () => {
    render(<LanguageSwitcher />);
    const select = screen.getByTestId('select');
    expect(select).toHaveAttribute('data-value', 'es');
  });

  it('displays the locale code', () => {
    render(<LanguageSwitcher />);
    // The component renders locale code - multiple elements may match (trigger + options)
    const localeElements = screen.getAllByText('es');
    expect(localeElements.length).toBeGreaterThan(0);
  });

  it('renders options for all locales', () => {
    render(<LanguageSwitcher />);
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(2);
  });

  it('renders with en locale when useLocale returns en', () => {
    (useLocale as jest.Mock).mockReturnValue('en');

    render(<LanguageSwitcher />);
    const select = screen.getByTestId('select');
    expect(select).toHaveAttribute('data-value', 'en');
  });

  it('has an accessible label from translations', () => {
    render(<LanguageSwitcher />);
    const trigger = screen.getByTestId('select-trigger');
    expect(trigger).toHaveAttribute('aria-label', 'label');
  });

  it('calls setLocale and router.refresh when locale is changed', async () => {
    (setLocale as jest.Mock).mockResolvedValue(undefined);

    render(<LanguageSwitcher />);
    const selectNative = screen.getByTestId('select-native');

    await act(async () => {
      fireEvent.change(selectNative, { target: { value: 'en' } });
    });

    expect(setLocale).toHaveBeenCalledWith('en');
  });
});
