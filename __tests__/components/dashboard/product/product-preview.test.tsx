import React from 'react';
import { render, screen } from '@testing-library/react';

import { ProductPreview } from '@/components/dashboard/product/product-preview';

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt, src }: any) => <img alt={alt} src={src} />,
}));

const filled = {
  name: 'Botella Térmica',
  description: 'Mantiene el frío 24 horas.',
  category: 'Bebidas',
  points: 15000,
  stock: 12,
  imageUrl: 'https://cdn/a.png',
};

describe('ProductPreview', () => {
  it('mirrors what the owner is typing', () => {
    render(<ProductPreview data={filled} />);
    expect(screen.getByText('Botella Térmica')).toBeInTheDocument();
    expect(screen.getByText('Bebidas')).toBeInTheDocument();
    expect(screen.getByText('Mantiene el frío 24 horas.')).toBeInTheDocument();
    expect(screen.getByText('15.000 pts')).toBeInTheDocument();
    expect(screen.getByAltText('Botella Térmica')).toHaveAttribute('src', 'https://cdn/a.png');
  });

  it('falls back to placeholders on an empty form', () => {
    render(
      <ProductPreview
        data={{ name: '', description: '', category: '', points: 0, stock: 0, imageUrl: null }}
      />,
    );
    expect(screen.getByText('placeholderName')).toBeInTheDocument();
    expect(screen.getByText('placeholderDescription')).toBeInTheDocument();
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('uses the placeholder name as the image alt when there is no name yet', () => {
    render(<ProductPreview data={{ ...filled, name: '' }} />);
    expect(screen.getByAltText('placeholderName')).toBeInTheDocument();
  });
});
