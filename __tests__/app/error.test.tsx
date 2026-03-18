jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => (key: string) => key),
}));

import { render, screen, fireEvent } from '@testing-library/react';
import ErrorPage from '@/app/error';

describe('Error page', () => {
  it('renders error message and retry button', () => {
    const mockReset = jest.fn();
    const error = new Error('Test error');

    render(<ErrorPage error={error} reset={mockReset} />);

    expect(screen.getByText('title')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();

    const retryButton = screen.getByText('retry');
    fireEvent.click(retryButton);
    expect(mockReset).toHaveBeenCalled();
  });

  it('shows default message when error.message is empty', () => {
    const mockReset = jest.fn();
    const error = new Error('');

    render(<ErrorPage error={error} reset={mockReset} />);
    expect(screen.getByText('defaultMessage')).toBeInTheDocument();
  });
});
