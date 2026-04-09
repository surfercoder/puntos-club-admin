import type * as ReactNS from 'react';
import { render, screen } from '@testing-library/react';

jest.mock('next-intl', () => ({
  useTranslations: jest.fn(() => {
    const t = (key: string, params?: Record<string, unknown>) => {
      if (params) return `${key}`;
      return key;
    };
    t.rich = (key: string) => key;
    t.raw = () => ({});
    return t;
  }),
  useLocale: jest.fn(() => 'es'),
}));

jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn(), info: jest.fn() } }));

jest.mock('qrcode.react', () => ({
  QRCodeSVG: (props: { value: string; size: number }) => (
    <svg data-testid="qr-code" data-value={props.value}>QR</svg>
  ),
}));

jest.mock('next/image', () => {
  const React = jest.requireActual('react') as typeof ReactNS;
  return function MockImage({ alt, ...props }: { alt: string; [key: string]: unknown }) {
    return React.createElement('img', { alt, ...props });
  };
});

import { OrgQRDisplay } from '@/components/dashboard/qr/org-qr-display';

describe('OrgQRDisplay', () => {
  const defaultProps = {
    organizationId: 1,
    organizationName: 'Test Organization',
    logoUrl: null,
  };

  it('renders the QR code', () => {
    render(<OrgQRDisplay {...defaultProps} />);

    expect(screen.getByTestId('qr-code')).toBeInTheDocument();
  });

  it('renders the organization name', () => {
    render(<OrgQRDisplay {...defaultProps} />);

    expect(screen.getByText('Test Organization')).toBeInTheDocument();
  });

  it('renders the organization ID', () => {
    render(<OrgQRDisplay {...defaultProps} />);

    expect(screen.getByText('ID: 1')).toBeInTheDocument();
  });

  it('renders download, print, and share buttons', () => {
    render(<OrgQRDisplay {...defaultProps} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThanOrEqual(3);
  });

  it('renders the title', () => {
    render(<OrgQRDisplay {...defaultProps} />);

    expect(screen.getByText('title')).toBeInTheDocument();
  });

  it('renders how it works section', () => {
    render(<OrgQRDisplay {...defaultProps} />);

    expect(screen.getByText('howItWorks')).toBeInTheDocument();
  });

  it('renders steps', () => {
    render(<OrgQRDisplay {...defaultProps} />);

    expect(screen.getByText('step1Title')).toBeInTheDocument();
    expect(screen.getByText('step2Title')).toBeInTheDocument();
    expect(screen.getByText('step3Title')).toBeInTheDocument();
  });

  it('renders tips section', () => {
    render(<OrgQRDisplay {...defaultProps} />);

    expect(screen.getByText('tipsTitle')).toBeInTheDocument();
  });

  it('renders logo when logoUrl is provided', () => {
    render(<OrgQRDisplay {...defaultProps} logoUrl="http://example.com/logo.png" />);

    const logo = screen.getByAltText('Test Organization');
    expect(logo).toBeInTheDocument();
  });

  it('does not render logo when logoUrl is null', () => {
    render(<OrgQRDisplay {...defaultProps} />);

    expect(screen.queryByAltText('Test Organization')).not.toBeInTheDocument();
  });

  it('encodes correct QR data', () => {
    render(<OrgQRDisplay {...defaultProps} />);

    const qrCode = screen.getByTestId('qr-code');
    const qrData = JSON.parse(qrCode.getAttribute('data-value') || '{}');
    expect(qrData.type).toBe('organization');
    expect(qrData.id).toBe(1);
    expect(qrData.name).toBe('Test Organization');
  });
});
