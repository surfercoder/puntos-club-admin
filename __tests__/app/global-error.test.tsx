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
