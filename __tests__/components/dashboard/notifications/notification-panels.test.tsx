import React from 'react';
import { render, screen } from '@testing-library/react';

import { NotificationDetailRow } from '@/components/dashboard/notifications/notification-detail-row';
import { NotificationFilters } from '@/components/dashboard/notifications/notification-filters';
import { NotificationGuidance } from '@/components/dashboard/notifications/notification-guidance';
import { NotificationStats } from '@/components/dashboard/notifications/notification-stats';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

describe('NotificationStats', () => {
  it('renders the five cards and marks a healthy delivery rate as excellent', () => {
    const { container } = render(
      <NotificationStats
        data={{ sent: 100, delivered: 98, failed: 2, remaining: 49, monthlyLimit: 50 }}
      />,
    );
    expect(container.querySelectorAll('.rounded-xl.border')).toHaveLength(5);
    expect(screen.getByText('98%')).toBeInTheDocument();
    expect(screen.getByText('excellent')).toHaveClass('text-brand-green');
  });

  it('does not divide by zero before the first send', () => {
    render(
      <NotificationStats
        data={{ sent: 0, delivered: 0, failed: 0, remaining: null, monthlyLimit: null }}
      />,
    );
    expect(screen.getByText('0%')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.getByText('remainingNoLimit')).toBeInTheDocument();
  });

  it('calls a poor delivery rate what it is', () => {
    render(
      <NotificationStats
        data={{ sent: 100, delivered: 40, failed: 60, remaining: 0, monthlyLimit: 50 }}
      />,
    );
    expect(screen.getByText('deliveryRateSubtitle')).toBeInTheDocument();
  });
});

describe('NotificationDetailRow', () => {
  it('walks through sent, delivered and failed', async () => {
    render(await NotificationDetailRow({ data: { sent: 10, delivered: 9, failed: 1 } }));
    expect(screen.getByText('performance')).toBeInTheDocument();
    expect(screen.getByText('90%')).toBeInTheDocument();
    expect(screen.getByText('openRatePending')).toBeInTheDocument();
  });

  it('shows 0% when nothing was sent', async () => {
    render(await NotificationDetailRow({ data: { sent: 0, delivered: 0, failed: 0 } }));
    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});

describe('NotificationFilters', () => {
  it('keeps the current selection', async () => {
    const { container } = render(
      await NotificationFilters({
        values: { q: 'promo', status: 'sent', from: '2026-08-01', to: '2026-08-31' },
      }),
    );
    expect(container.querySelector('input[name="q"]')).toHaveValue('promo');
    expect(container.querySelector('select[name="status"]')).toHaveValue('sent');
    expect(container.querySelector('input[name="from"]')).toHaveValue('2026-08-01');
    expect(container.querySelector('input[name="to"]')).toHaveValue('2026-08-31');
  });

  it('clears back to the bare route', async () => {
    render(
      await NotificationFilters({ values: { q: '', status: '', from: '', to: '' } }),
    );
    expect(screen.getByRole('link', { name: 'clear' })).toHaveAttribute(
      'href',
      '/dashboard/notifications',
    );
  });
});

describe('NotificationGuidance', () => {
  it('lists the AI checks, the tips and the content policies', async () => {
    render(await NotificationGuidance());
    expect(screen.getByText('aiTitle')).toBeInTheDocument();
    expect(screen.getByText('aiChecks.safe.title')).toBeInTheDocument();
    expect(screen.getByText('tips.short')).toBeInTheDocument();
    expect(screen.getByText('policies.spam')).toBeInTheDocument();
  });
});
