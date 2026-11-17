// jest.setup.js mocks 'sonner' down to its toast helpers; this suite needs the Toaster too.
jest.mock('sonner', () => ({
  Toaster: jest.fn(() => <div data-testid="sonner-root" />),
  toast: { success: jest.fn(), error: jest.fn(), info: jest.fn(), warning: jest.fn() },
}));

import { render, screen } from '@testing-library/react';
import { Toaster as Sonner } from 'sonner';

import { Toaster } from '@/components/ui/sonner';

const lastProps = () => (Sonner as unknown as jest.Mock).mock.calls.at(-1)[0];

describe('Toaster', () => {
  it('always renders the light theme', () => {
    render(<Toaster />);
    expect(screen.getByTestId('sonner-root')).toBeInTheDocument();
    expect(lastProps().theme).toBe('light');
  });

  it('supplies an icon per toast severity and forwards extra props', () => {
    render(<Toaster position="top-center" />);

    const props = lastProps();
    expect(Object.keys(props.icons)).toEqual(['success', 'info', 'warning', 'error', 'loading']);
    expect(props.position).toBe('top-center');
    expect(props.style).toMatchObject({ '--normal-bg': 'var(--popover)' });
  });
});
