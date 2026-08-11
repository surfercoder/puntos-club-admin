import { render, screen } from '@testing-library/react';

import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

describe('Table', () => {
  const renderTable = (className?: string) =>
    render(
      <Table className={className}>
        <TableCaption className={className}>Compras</TableCaption>
        <TableHeader className={className}>
          <TableRow className={className}>
            <TableHead className={className}>Beneficiario</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className={className}>
          <TableRow data-state="selected">
            <TableCell className={className}>Carlos Schmidt</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter className={className}>
          <TableRow>
            <TableCell>Total</TableCell>
          </TableRow>
        </TableFooter>
      </Table>,
    );

  it('renders every part tagged by data-slot inside a scrollable container', () => {
    const { container } = renderTable();

    expect(container.querySelector('[data-slot="table-container"]')).toHaveClass('overflow-x-auto');
    for (const slot of [
      'table',
      'table-caption',
      'table-header',
      'table-body',
      'table-footer',
      'table-row',
      'table-head',
      'table-cell',
    ]) {
      expect(container.querySelector(`[data-slot="${slot}"]`)).toBeInTheDocument();
    }
    expect(screen.getByText('Carlos Schmidt')).toBeInTheDocument();
  });

  it('merges a custom className into every part', () => {
    const { container } = renderTable('custom');

    for (const slot of [
      'table',
      'table-caption',
      'table-header',
      'table-body',
      'table-footer',
      'table-row',
      'table-head',
      'table-cell',
    ]) {
      expect(container.querySelector(`[data-slot="${slot}"]`)).toHaveClass('custom');
    }
  });
});
