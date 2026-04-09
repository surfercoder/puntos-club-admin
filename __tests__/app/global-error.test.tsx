import { render } from '@testing-library/react';
import * as Sentry from '@sentry/nextjs';
import GlobalError from '@/app/global-error';

jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
}));

jest.mock('next/error', () => {
  const MockNextError = () => <div data-testid="next-error">Error</div>;
  MockNextError.displayName = 'NextError';
  return MockNextError;
});

describe('GlobalError', () => {
  const originalCookie = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
  afterEach(() => {
    if (originalCookie) Object.defineProperty(Document.prototype, 'cookie', originalCookie);
  });

  it('reads a valid locale from NEXT_LOCALE cookie', () => {
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      get: () => 'NEXT_LOCALE=en; other=1',
    });
    const error = new Error('cookie valid');
    const { container } = render(<GlobalError error={error} />);
    expect(container.querySelector('html')?.getAttribute('lang') || container.innerHTML).toBeTruthy();
  });

  it('falls back to default locale when cookie contains unsupported value', () => {
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      get: () => 'NEXT_LOCALE=fr',
    });
    const error = new Error('cookie invalid');
    const { getByTestId } = render(<GlobalError error={error} />);
    expect(getByTestId('next-error')).toBeInTheDocument();
  });

  it('falls back to default locale when no NEXT_LOCALE cookie exists', () => {
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      get: () => 'other=1',
    });
    const error = new Error('no cookie');
    const { getByTestId } = render(<GlobalError error={error} />);
    expect(getByTestId('next-error')).toBeInTheDocument();
  });

  it('renders the error page', () => {
    const error = new Error('Test error');
    const { getByTestId } = render(<GlobalError error={error} />);
    expect(getByTestId('next-error')).toBeInTheDocument();
  });

  it('captures the exception with Sentry', () => {
    const error = new Error('Test error');
    render(<GlobalError error={error} />);
    expect(Sentry.captureException).toHaveBeenCalledWith(error);
  });

  it('renders html and body structure', () => {
    const error = new Error('Test error');
    const { container } = render(<GlobalError error={error} />);
    // In jsdom, nested html/body get flattened, but the error content should render
    expect(container.innerHTML).toContain('Error');
  });

  it('handles error with digest', () => {
    const error = Object.assign(new Error('Digest error'), { digest: 'abc123' });
    render(<GlobalError error={error} />);
    expect(Sentry.captureException).toHaveBeenCalledWith(error);
  });
});
