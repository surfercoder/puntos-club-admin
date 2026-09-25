import { render, screen } from '@testing-library/react';

import LegalLayout from '@/app/legal/layout';

jest.mock('@/components/public-header', () => ({
  PublicHeader: () => <div data-testid="public-header">Header</div>,
}));

describe('LegalLayout', () => {
  it('renders the public header above the document', () => {
    render(
      <LegalLayout>
        <div data-testid="child">Documento</div>
      </LegalLayout>,
    );

    expect(screen.getByTestId('public-header')).toBeInTheDocument();
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});
