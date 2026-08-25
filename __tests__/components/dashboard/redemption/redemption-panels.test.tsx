import React from 'react';
import { render, screen } from '@testing-library/react';

import { RedemptionDonut } from '@/components/dashboard/redemption/redemption-donut';
import { RedemptionFilters } from '@/components/dashboard/redemption/redemption-filters';
import { RedemptionStats } from '@/components/dashboard/redemption/redemption-stats';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

describe('RedemptionStats', () => {
  it('renders the five cards from the design', () => {
    const { container } = render(
      <RedemptionStats
        data={{ total: 128, pointsUsed: 245300, pending: 28, delivered: 95, cancelled: 5 }}
      />,
    );
    expect(container.querySelectorAll('.rounded-xl.border')).toHaveLength(5);
    expect(screen.getByText('245.300 pts')).toBeInTheDocument();
  });
});

// Largo del arco dibujado: primer valor del stroke-dasharray.
const arcLength = (arc: Element) => Number(arc.getAttribute('stroke-dasharray')?.split(' ')[0]);

describe('RedemptionDonut', () => {
  it('shows the share of each status', () => {
    const { container } = render(
      <RedemptionDonut data={{ pending: 28, delivered: 95, cancelled: 5 }} />,
    );
    expect(screen.getByText('128')).toBeInTheDocument();
    expect(screen.getByText('28 (21.9%)')).toBeInTheDocument();
    expect(screen.getByText('95 (74.2%)')).toBeInTheDocument();
    expect(screen.getByText('5 (3.9%)')).toBeInTheDocument();

    // Un arco por estado, encadenados: cada uno arranca donde terminó el anterior.
    const arcs = [...container.querySelectorAll('circle')];
    expect(arcs).toHaveLength(3);
    const lengths = arcs.map((arc) => arcLength(arc));
    const offsets = arcs.map((arc) => Number(arc.getAttribute('stroke-dashoffset')));
    expect(offsets[0]).toBeCloseTo(0);
    expect(offsets[1]).toBeCloseTo(-lengths[0]);
    expect(offsets[2]).toBeCloseTo(-(lengths[0] + lengths[1]));
    expect(lengths.reduce((a, b) => a + b, 0)).toBeCloseTo(2 * Math.PI * 53);
  });

  it('reports 0% instead of dividing by zero on an empty club', () => {
    const { container } = render(
      <RedemptionDonut data={{ pending: 0, delivered: 0, cancelled: 0 }} />,
    );
    expect(screen.getAllByText('0 (0%)')).toHaveLength(3);
    expect(
      [...container.querySelectorAll('circle')].map((arc) => arcLength(arc)),
    ).toEqual([0, 0, 0]);
  });
});

describe('RedemptionFilters', () => {
  it('keeps the current selection in every control', async () => {
    const { container } = render(
      await RedemptionFilters({
        values: {
          q: 'CAN', status: 'pending', from: '2026-07-01',
          to: '2026-08-15', beneficiary: '1', product: '2',
        },
        beneficiaries: [{ id: '1', name: 'Ana Diaz' }],
        products: [{ id: '2', name: 'Botella Térmica' }],
      }),
    );
    expect(container.querySelector('input[name="q"]')).toHaveValue('CAN');
    expect(container.querySelector('select[name="status"]')).toHaveValue('pending');
    expect(container.querySelector('input[name="from"]')).toHaveValue('2026-07-01');
    expect(container.querySelector('input[name="to"]')).toHaveValue('2026-08-15');
    expect(container.querySelector('select[name="beneficiary"]')).toHaveValue('1');
    expect(container.querySelector('select[name="product"]')).toHaveValue('2');
  });

  it('clears back to the bare route', async () => {
    render(
      await RedemptionFilters({
        values: { q: '', status: '', from: '', to: '', beneficiary: '', product: '' },
        beneficiaries: [],
        products: [],
      }),
    );
    expect(screen.getByRole('link', { name: 'clear' })).toHaveAttribute(
      'href',
      '/dashboard/redemption',
    );
  });
});
