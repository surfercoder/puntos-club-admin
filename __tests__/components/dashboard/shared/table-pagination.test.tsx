import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

import { TablePagination } from '@/components/dashboard/shared/table-pagination';

const replace = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace }),
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, value, onValueChange }: any) => (
    <div>
      <span data-testid="per-page">{value}</span>
      <button data-testid="set-per-page" onClick={() => onValueChange('25')} />
      {children}
    </div>
  ),
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children }: any) => <div>{children}</div>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: () => <span />,
}));

describe('TablePagination', () => {
  // La URL la lee el handler desde window.location, así que la seteamos acá.
  beforeEach(() => {
    replace.mockClear();
    window.history.replaceState({}, '', '/dashboard/beneficiary?q=ana');
  });

  it('disables the backwards controls on the first page', () => {
    render(<TablePagination total={45} page={1} perPage={10} />);
    expect(screen.getByLabelText('first')).toBeDisabled();
    expect(screen.getByLabelText('previous')).toBeDisabled();
    expect(screen.getByLabelText('next')).toBeEnabled();
    expect(screen.getByLabelText('last')).toBeEnabled();
  });

  it('disables the forward controls on the last page', () => {
    render(<TablePagination total={45} page={5} perPage={10} />);
    expect(screen.getByLabelText('next')).toBeDisabled();
    expect(screen.getByLabelText('last')).toBeDisabled();
  });

  it('keeps existing query params when navigating', () => {
    render(<TablePagination total={45} page={2} perPage={10} />);
    fireEvent.click(screen.getByLabelText('next'));
    expect(replace).toHaveBeenCalledWith('/dashboard/beneficiary?q=ana&page=3');
    fireEvent.click(screen.getByLabelText('first'));
    expect(replace).toHaveBeenCalledWith('/dashboard/beneficiary?q=ana&page=1');
    fireEvent.click(screen.getByLabelText('last'));
    expect(replace).toHaveBeenCalledWith('/dashboard/beneficiary?q=ana&page=5');
    fireEvent.click(screen.getByLabelText('previous'));
    expect(replace).toHaveBeenCalledWith('/dashboard/beneficiary?q=ana&page=1');
  });

  it('resets to the first page when the page size changes', () => {
    render(<TablePagination total={45} page={3} perPage={10} />);
    fireEvent.click(screen.getByTestId('set-per-page'));
    expect(replace).toHaveBeenCalledWith('/dashboard/beneficiary?q=ana&perPage=25&page=1');
  });

  it('treats an empty table as a single page', () => {
    render(<TablePagination total={0} page={1} perPage={10} />);
    expect(screen.getByLabelText('next')).toBeDisabled();
  });
});
