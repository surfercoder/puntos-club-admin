import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

import { CsvExportButton } from '@/components/dashboard/shared/csv-export-button';

describe('CsvExportButton', () => {
  it('downloads a csv blob with the given filename', () => {
    const createObjectURL = jest.fn(() => 'blob:csv');
    const revokeObjectURL = jest.fn();
    Object.assign(URL, { createObjectURL, revokeObjectURL });
    const click = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    render(
      <CsvExportButton
        filename="beneficiarios.csv"
        headers={['Nombre']}
        rows={[['Ana']]}
        label="Exportar"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Exportar' }));

    expect(createObjectURL).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:csv');
    click.mockRestore();
  });

  it('falls back to the shared export label', () => {
    Object.assign(URL, { createObjectURL: jest.fn(() => 'blob:csv'), revokeObjectURL: jest.fn() });
    render(<CsvExportButton filename="a.csv" headers={[]} rows={[]} />);
    expect(screen.getByRole('button', { name: 'export' })).toBeInTheDocument();
  });
});
