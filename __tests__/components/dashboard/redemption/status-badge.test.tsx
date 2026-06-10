import { render } from '@testing-library/react';

jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => (key: string) => `t:${key}`),
}));

import { RedemptionStatusBadge } from '@/components/dashboard/redemption/status-badge';

describe('RedemptionStatusBadge', () => {
  it('renders pending status', () => {
    const { container } = render(<RedemptionStatusBadge status="pending" />);
    expect(container.textContent).toBe('t:pending');
    expect(container.querySelector('span')?.className).toContain('amber');
  });

  it('renders delivered status', () => {
    const { container } = render(<RedemptionStatusBadge status="delivered" />);
    expect(container.textContent).toBe('t:delivered');
    expect(container.querySelector('span')?.className).toContain('emerald');
  });

  it('renders cancelled status', () => {
    const { container } = render(<RedemptionStatusBadge status="cancelled" />);
    expect(container.textContent).toBe('t:cancelled');
    expect(container.querySelector('span')?.className).toContain('gray');
  });

  it('falls back to delivered when status is null', () => {
    const { container } = render(<RedemptionStatusBadge status={null} />);
    expect(container.textContent).toBe('t:delivered');
  });

  it('falls back to delivered when status is undefined', () => {
    const { container } = render(<RedemptionStatusBadge status={undefined} />);
    expect(container.textContent).toBe('t:delivered');
  });
});
