import React from 'react';
import { render, screen } from '@testing-library/react';

import { BeneficiaryFilters } from '@/components/dashboard/beneficiary/beneficiary-filters';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

describe('BeneficiaryFilters', () => {
  it('submits over GET so the filters live in the URL', async () => {
    const { container } = render(
      await BeneficiaryFilters({
        values: { q: 'ana', status: 'active', points: 'with', from: '2026-08-01' },
      }),
    );
    expect(container.querySelector('form')).toHaveAttribute('method', 'GET');
    expect(container.querySelector('input[name="q"]')).toHaveValue('ana');
    expect(container.querySelector('select[name="status"]')).toHaveValue('active');
    expect(container.querySelector('select[name="points"]')).toHaveValue('with');
    expect(container.querySelector('input[name="from"]')).toHaveValue('2026-08-01');
  });

  // El owner no ve email ni documento, así que el placeholder aclara que la
  // búsqueda es sólo por nombre.
  it('announces a names-only search for owners', async () => {
    const { container } = render(
      await BeneficiaryFilters({
        values: { q: '', status: '', points: '', from: '' },
        namesOnly: true,
      }),
    );
    expect(container.querySelector('input[name="q"]')).toHaveAttribute(
      'placeholder',
      'searchPlaceholderName',
    );
  });

  it('clears every filter by linking back to the bare route', async () => {
    render(
      await BeneficiaryFilters({ values: { q: '', status: '', points: '', from: '' } }),
    );
    expect(screen.getByRole('link', { name: 'clear' })).toHaveAttribute(
      'href',
      '/dashboard/beneficiary',
    );
  });
});
