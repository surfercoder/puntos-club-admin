import { render, screen } from '@testing-library/react';

jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => {
    const t = (key: string) => key;
    t.rich = (key: string) => key;
    t.raw = () => ({});
    return t;
  }),
  useLocale: jest.fn(() => 'es'),
}));

jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() } }));

jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn(() => ({
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'http://example.com/image.jpg' } })),
        remove: jest.fn(),
      })),
    },
  })),
}));

jest.mock('next/image', () => {
  return function MockImage({ alt, ...props }: { alt: string; [key: string]: unknown }) {
    return <img alt={alt} {...props} />;
  };
});

import ProductImageUpload from '@/components/dashboard/product/product-image-upload';

describe('ProductImageUpload', () => {
  const mockOnImagesChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with no images message when empty', () => {
    render(<ProductImageUpload onImagesChange={mockOnImagesChange} />);

    expect(screen.getByText('noImages')).toBeInTheDocument();
  });

  it('renders upload button when no images', () => {
    render(<ProductImageUpload onImagesChange={mockOnImagesChange} />);

    expect(screen.getByText('uploadButton')).toBeInTheDocument();
  });

  it('renders format and size hints', () => {
    render(<ProductImageUpload onImagesChange={mockOnImagesChange} />);

    expect(screen.getByText('formats')).toBeInTheDocument();
    expect(screen.getByText('maxSize')).toBeInTheDocument();
  });

  it('renders with initial images', () => {
    const initialImages = ['http://example.com/img1.jpg', 'http://example.com/img2.jpg'];

    render(
      <ProductImageUpload
        initialImages={initialImages}
        onImagesChange={mockOnImagesChange}
      />
    );

    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(2);
  });

  it('renders image count when images exist', () => {
    const initialImages = ['http://example.com/img1.jpg'];

    render(
      <ProductImageUpload
        initialImages={initialImages}
        onImagesChange={mockOnImagesChange}
      />
    );

    expect(screen.getByText('imageCount')).toBeInTheDocument();
  });

  it('hides upload area when 3 images exist', () => {
    const initialImages = [
      'http://example.com/img1.jpg',
      'http://example.com/img2.jpg',
      'http://example.com/img3.jpg',
    ];

    render(
      <ProductImageUpload
        initialImages={initialImages}
        onImagesChange={mockOnImagesChange}
      />
    );

    expect(screen.queryByText('uploadButton')).not.toBeInTheDocument();
  });

  it('renders file input for image upload', () => {
    render(<ProductImageUpload onImagesChange={mockOnImagesChange} />);

    const fileInput = document.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute('accept', 'image/jpeg,image/jpg,image/png,image/webp,image/gif');
  });
});
