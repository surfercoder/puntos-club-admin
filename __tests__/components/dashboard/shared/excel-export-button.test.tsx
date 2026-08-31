import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { ExcelExportButton } from '@/components/dashboard/shared/excel-export-button';

describe('ExcelExportButton', () => {
  it('downloads an xlsx file with the given filename', async () => {
    const createObjectURL = jest.fn(() => 'blob:xlsx');
    const revokeObjectURL = jest.fn();
    Object.assign(URL, { createObjectURL, revokeObjectURL });
    const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    render(
      <ExcelExportButton
        filename="beneficiarios.xlsx"
        headers={['Nombre']}
        rows={[['Ana'], [1], [null]]}
        label="Exportar"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Exportar' }));

    await waitFor(() => expect(click).toHaveBeenCalled());
    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    click.mockRestore();
  });

  it('falls back to the shared export label', () => {
    render(<ExcelExportButton filename="a.xlsx" headers={[]} rows={[]} />);
    expect(screen.getByRole('button', { name: 'export' })).toBeInTheDocument();
  });
});
